package go4lage

import (
	"context"
	"database/sql"
	"errors"
	"sync"

	"github.com/google/uuid"
	"github.com/karl1b/go4lage/pkg/sql/db"
)

type go4Cache[T any] struct {
	mu    sync.RWMutex
	items map[string]T
}

func NewGo4Cache[T any]() *go4Cache[T] {
	return &go4Cache[T]{
		items: make(map[string]T),
	}
}

func (c *go4Cache[T]) Set(key string, value T) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = value
}

func (c *go4Cache[T]) Get(key string) (T, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, exists := c.items[key]
	return val, exists
}

func (c *go4Cache[T]) Del(key string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, exists := c.items[key]; exists {
		delete(c.items, key)
		return true
	}
	return false
}

func (c *go4Cache[T]) Flush() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[string]T)
}

var go4users *go4Cache[interface{}]
var go4permissions *go4Cache[[]string]
var go4groups *go4Cache[[]string]

func init() {
	go4users = NewGo4Cache[interface{}]()
	go4groups = NewGo4Cache[[]string]()
	go4permissions = NewGo4Cache[[]string]()
}

// This does empty groups and permissions
// Seldomly called it is okay to have this like this
func nullGroupsAndPermissions() {
	go4permissions.Flush()
	go4groups.Flush()
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
		return cachedResult, nil
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
		return cachedResult, nil

	}
	result, err = getFromDB(id, queries)
	return result, err
}
