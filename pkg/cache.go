package go4lage

import (
	"context"
	"database/sql"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	db "github.com/karl1b/go4lage/pkg/sql/db"
	"github.com/patrickmn/go-cache"
)

/*
This is the global cache. This will reduce db calls significantly.
It is wrapped so that other cache libs can easily be tested.
*/
type go4Cache struct {
	c cache.Cache
}

var go4users go4Cache
var go4groups go4Cache
var go4permissions go4Cache

func init() {
	go4users.c = *cache.New(cache.NoExpiration, cache.NoExpiration)
	go4groups.c = *cache.New(cache.NoExpiration, cache.NoExpiration)
	go4permissions.c = *cache.New(cache.NoExpiration, cache.NoExpiration)
}

func (c *go4Cache) Set(address string, item interface{}) {
	c.c.SetDefault(address, item)
}

func (c *go4Cache) Get(address string) (interface{}, bool) {
	result, found := c.c.Get(address)
	return result, found
}
func (c *go4Cache) Del(address string) {
	c.c.Delete(address)
}
func (c *go4Cache) Flush() {
	c.c.Flush()
}

func nullGroupsAndPermissions() { // This does empty groups and permissions.
	go4permissions.Flush()
	go4groups.Flush()
}

/*
The throttlecache is there to prevent a login force attack.
*/
type Throttlecache struct {
	mu        sync.Mutex
	breaktime map[string]int64
}

var loginthrottler Throttlecache

func init() {
	loginthrottler = Throttlecache{
		breaktime: make(map[string]int64),
	}
}

func (t *Throttlecache) check(ip string) error {
	defer t.mu.Unlock()
	t.mu.Lock()
	unixTimeNow := time.Now().Unix()
	if nextAllowedTime, exists := t.breaktime[ip]; exists && unixTimeNow < nextAllowedTime {
		t.breaktime[ip] = t.breaktime[ip] + int64(Settings.LoginThrottleTimeS) // the next login attempt is allowed in 1 sec.
		return errors.New("too many requests")
	}
	if nextAllowedTime, exists := t.breaktime[ip]; exists && unixTimeNow >= nextAllowedTime {
		delete(t.breaktime, ip) // If a user was okay its breaktime will be deleted. Very small performance gain.
		return nil
	}
	t.breaktime[ip] = unixTimeNow + int64(Settings.LoginThrottleTimeS)
	return nil
}

/*
Those are the cache functions.
1) Those functions below are the only functions that update the global cache by reading from db if needed.
2) Other functions do not update the cache. Instead they delete the entry or null the complete cache.
*/
func getUserByToken(token string, queries *db.Queries) (result db.User, err error) {
	if token == "" {
		return db.User{}, errors.New("token may not be blank")
	}

	getFromDB := func(token string, queries *db.Queries) (db.User, error) {
		user, err := queries.SelectUserByToken(context.Background(), sql.NullString{String: token, Valid: true})
		if err != nil {
			return db.User{}, err // Handle error properly
		}
		go4users.Set(token, user)
		return user, nil
	}

	defer func() {
		if r := recover(); r != nil {
			result, err = getFromDB(token, queries)
		}
	}()

	cached_result, found := go4users.Get(token)

	if found {
		result, ok := cached_result.(db.User)
		if ok {
			return result, err
		}
		result, err = getFromDB(token, queries)
		return result, err
	}

	result, err = getFromDB(token, queries)
	return result, err
}

func getPermissionsByUser(id uuid.UUID, queries *db.Queries) (result []string, err error) {

	getFromDB := func(id uuid.UUID, queries *db.Queries) ([]string, error) {
		perms, err := queries.GetPermissionsByUserId(context.Background(), id)
		if err != nil {
			return nil, err
		}
		var permissions []string
		for _, perm := range perms {
			permissions = append(permissions, perm.Name)
		}
		go4permissions.Set(id.String(), permissions)
		return permissions, nil
	}

	defer func() {
		if r := recover(); r != nil {
			result, err = getFromDB(id, queries)
		}
	}()

	cachedResult, found := go4permissions.Get(id.String())
	if found {
		result, ok := cachedResult.([]string)
		if ok {
			return result, nil
		}
	}
	result, err = getFromDB(id, queries)
	return result, err
}

func getGroupsByUser(id uuid.UUID, queries *db.Queries) (result []string, err error) {

	getFromDB := func(id uuid.UUID, queries *db.Queries) ([]string, error) {
		groups, err := queries.GetGroupsByUserId(context.Background(), id)
		if err != nil {
			return nil, err
		}
		var groupNames []string
		for _, group := range groups {
			groupNames = append(groupNames, group.Name)
		}
		go4groups.Set(id.String(), groupNames)
		return groupNames, nil
	}

	defer func() {
		if r := recover(); r != nil {
			result, err = getFromDB(id, queries)
		}
	}()

	cachedResult, found := go4groups.Get(id.String())
	if found {
		result, ok := cachedResult.([]string)
		if ok {
			return result, nil
		}
	}
	result, err = getFromDB(id, queries)
	return result, err
}
