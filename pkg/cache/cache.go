package cache

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/karl1b/go4lage/pkg/sql/db"
)

type go4Cache[K comparable, T any] struct {
	mu    sync.RWMutex
	items map[K]T
}

func NewGo4Cache[K comparable, T any]() *go4Cache[K, T] {
	return &go4Cache[K, T]{
		items: make(map[K]T),
	}
}

func (c *go4Cache[K, T]) Set(key K, value T) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = value
}

func (c *go4Cache[K, T]) Get(key K) (T, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, exists := c.items[key]
	return val, exists
}

func (c *go4Cache[K, T]) Del(key K) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, exists := c.items[key]; exists {
		delete(c.items, key)
		return true
	}
	return false
}

func (c *go4Cache[K, T]) Flush() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[K]T)
}

var Go4users *go4Cache[string, interface{}]
var Go4permissions *go4Cache[[16]byte, []string]
var Go4groups *go4Cache[[16]byte, []string]

func init() {
	Go4users = NewGo4Cache[string, interface{}]()
	Go4groups = NewGo4Cache[[16]byte, []string]()
	Go4permissions = NewGo4Cache[[16]byte, []string]()
}

/*
Those are the cache functions.
1) Those functions below are the only functions that update the global cache by reading from db if needed.
2) Other functions do not update the cache. Instead they delete the entry or null the complete cache.
*/

// This does empty groups and permissions
// Seldomly called it is okay to have this like this
func NullGroupsAndPermissions() {
	Go4permissions.Flush()
	Go4groups.Flush()
}

func GetUserByToken(token string, queries *db.Queries) (result db.User, err error) {

	if token == "" {
		return db.User{}, errors.New("token may not be blank")
	}

	getFromDB := func(token string, queries *db.Queries) (db.User, error) {
		user, err := queries.SelectUserByToken(context.Background(), pgtype.Text{String: token, Valid: true})
		if err != nil {
			return db.User{}, err // Handle error properly
		}
		Go4users.Set(token, user)

		return user, nil
	}

	defer func() {
		if r := recover(); r != nil {
			result, err = getFromDB(token, queries)
		}
	}()

	cached_result, cacheFound := Go4users.Get(token)

	if cacheFound {
		fmt.Println("Found before check")
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

func GetPermissionsByUser(id pgtype.UUID, queries *db.Queries) (result []string, err error) {

	getFromDB := func(id pgtype.UUID, queries *db.Queries) ([]string, error) {
		perms, err := queries.GetPermissionsByUserId(context.Background(), id)
		if err != nil {
			return nil, err
		}
		var permissions []string
		for _, perm := range perms {
			permissions = append(permissions, perm.Name)
		}
		Go4permissions.Set(id.Bytes, permissions)
		return permissions, nil
	}

	defer func() {
		if r := recover(); r != nil {
			result, err = getFromDB(id, queries)
		}
	}()

	cachedResult, found := Go4permissions.Get(id.Bytes)
	if found {
		return cachedResult, nil
	}
	result, err = getFromDB(id, queries)
	return result, err
}

func GetGroupsByUser(id pgtype.UUID, queries *db.Queries) (result []string, err error) {

	getFromDB := func(id pgtype.UUID, queries *db.Queries) ([]string, error) {
		groups, err := queries.GetGroupsByUserId(context.Background(), id)
		if err != nil {
			return nil, err
		}
		var groupNames []string
		for _, group := range groups {
			groupNames = append(groupNames, group.Name)
		}
		Go4groups.Set(id.Bytes, groupNames)
		return groupNames, nil
	}

	defer func() {
		if r := recover(); r != nil {
			result, err = getFromDB(id, queries)
		}
	}()

	cachedResult, found := Go4groups.Get(id.Bytes)
	if found {
		return cachedResult, nil

	}
	result, err = getFromDB(id, queries)
	return result, err
}
