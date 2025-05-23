package admin

import (
	"context"
	"log"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"
)

type Responseuser struct {
	Username     string `json:"username"`
	Email        string `json:"email"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Created_at   int64  `json:"created_at"`
	Last_login   int64  `json:"last_login"`
	Is_superuser bool   `json:"is_superuser"`
	Is_active    bool   `json:"is_active"`
	ID           string `json:"id"`
	Groups       string `json:"groups"`
	Permissions  string `json:"permissions"`
}

// There can be a lot of users. Thus the Response is cached
type allUsersCacheT struct {
	mu    sync.RWMutex
	itemA []Responseuser
	itemM map[[16]byte]Responseuser
}

var allUserCache *allUsersCacheT

func init() {
	allUserCache = NewAlluserCache()

	conn, cleanup := utils.SetUp()
	defer cleanup()
	queries := db.New(conn)

	app := &App{
		Queries: queries,
	}
	// Init cache
	allUserCache.SetAllUsermap(app)

}

func NewAlluserCache() *allUsersCacheT {
	return &allUsersCacheT{
		itemM: make(map[[16]byte]Responseuser),
		itemA: make([]Responseuser, 0),
	}
}

func (aum *allUsersCacheT) Get(key [16]byte) (val Responseuser, exists bool) {
	aum.mu.RLock()
	defer aum.mu.RUnlock()
	val, exists = aum.itemM[key]
	return val, exists
}

func (aum *allUsersCacheT) GetAll() []Responseuser {
	aum.mu.RLock()
	defer aum.mu.RUnlock()
	return aum.itemA

}

// Also sets groups
func (aum *allUsersCacheT) SetOrCreate(user Responseuser, app App) {
	aum.mu.Lock()
	defer aum.mu.Unlock()
	uuid, _ := uuid.Parse(user.ID)

	groups, _ := app.Queries.GetGroupsByUserId(context.Background(), pgtype.UUID{
		Bytes: uuid,
		Valid: true,
	})
	var groupNames []string
	for _, g := range groups {
		groupNames = append(groupNames, g.Name)
	}
	user.Groups = strings.Join(groupNames, "|")

	userpermissions, _ := app.Queries.GetPurePermissionsByUserId(context.Background(), pgtype.UUID{Bytes: uuid, Valid: true})
	var permNames []string
	for _, up := range userpermissions {
		permNames = append(permNames, up.Name)

	}
	user.Permissions = strings.Join(permNames, "|")

	aum.itemM[uuid] = user
	found := false
	for i, existUser := range aum.itemA {
		if existUser.ID == user.ID {
			aum.itemA[i] = user
			found = true
			break
		}
	}
	if !found {
		aum.itemA = append(aum.itemA, user)
	}
}

func (aum *allUsersCacheT) Del(key [16]byte) {
	aum.mu.Lock()
	defer aum.mu.Unlock()

	delete(aum.itemM, key)

	lkey, _ := uuid.FromBytes(key[:])

	for i, u := range aum.itemA {

		if u.ID == lkey.String() {
			lastIndex := len(aum.itemA) - 1
			aum.itemA[i] = aum.itemA[lastIndex]
			aum.itemA = aum.itemA[:lastIndex]
			break
		}
	}
}

func (aum *allUsersCacheT) SetAllUsermap(app *App) *utils.ErrorResponse {
	var allUsers []db.User
	var err error
	var Responseusers []Responseuser
	allUsers, err = app.Queries.SelectAllUsers(context.Background())
	if err != nil {
		return &utils.ErrorResponse{
			Detail: "Error getting all users",
			Error:  err.Error(),
		}

	}

	allusermap := make(map[[16]byte]Responseuser)

	for _, user := range allUsers {

		usergroups, err := app.Queries.GetGroupsByUserId(context.Background(), user.ID)
		if err != nil {
			return &utils.ErrorResponse{
				Detail: "Error getting groups for user",
				Error:  err.Error(),
			}

		}

		var groupNames []string
		for _, usergroup := range usergroups {
			groupNames = append(groupNames, usergroup.Name)
		}
		groupstring := strings.Join(groupNames, "|")

		userpermissions, err := app.Queries.GetPurePermissionsByUserId(context.Background(), user.ID)
		if err != nil {
			return &utils.ErrorResponse{
				Detail: "Error getting permissions for user",
				Error:  err.Error(),
			}

		}
		var permNames []string
		for _, up := range userpermissions {
			permNames = append(permNames, up.Name)

		}
		permissionstring := strings.Join(permNames, "|")

		stringid, err := uuid.FromBytes(user.ID.Bytes[:])
		if err != nil {
			log.Printf("Error parsing stringid, err:%v\n", err)
		}

		thisUser := Responseuser{
			Username:     user.Username,
			Email:        user.Email,
			FirstName:    user.FirstName.String,
			LastName:     user.LastName.String,
			Created_at:   user.UserCreatedAt.Time.UnixMilli(),
			Last_login:   user.LastLogin.Time.UnixMilli(),
			Is_active:    user.IsActive.Bool,
			Is_superuser: user.IsSuperuser.Bool,
			ID:           stringid.String(),
			Groups:       groupstring,
			Permissions:  permissionstring,
		}

		Responseusers = append(Responseusers, Responseuser{
			Username:     user.Username,
			Email:        user.Email,
			FirstName:    user.FirstName.String,
			LastName:     user.LastName.String,
			Created_at:   user.UserCreatedAt.Time.UnixMilli(),
			Last_login:   user.LastLogin.Time.UnixMilli(),
			Is_active:    user.IsActive.Bool,
			Is_superuser: user.IsSuperuser.Bool,
			ID:           stringid.String(),

			Groups:      groupstring,
			Permissions: permissionstring,
		})

		allusermap[user.ID.Bytes] = thisUser

	}

	allUserCache.mu.Lock()
	allUserCache.itemM = allusermap
	allUserCache.itemA = Responseusers
	allUserCache.mu.Unlock()
	return nil
}
