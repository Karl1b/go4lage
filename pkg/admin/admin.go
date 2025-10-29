package admin

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	cache "github.com/karl1b/go4lage/pkg/cache"

	"github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"
)

/* Here are the endpoints for the admin dashboard. */

// Tells the dashboard if the superuser tfa is needed

func (app *App) EditUserGroups(w http.ResponseWriter, r *http.Request) {
	defer cache.NullGroupsAndPermissions()

	userid := r.Header.Get("Id")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err.Error(),
		})

		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)

		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Name    string `json:"name"`
		Checked bool   `json:"checked"`
	}

	var reqBody []RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)

		return
	}

	for _, g := range reqBody {

		if g.Checked {

			_, err = app.Queries.InsertUserGroupsByName(context.Background(), db.InsertUserGroupsByNameParams{
				UserID: pgtype.UUID{Bytes: useriduuid, Valid: true},

				Name: g.Name,
			})
			if err != nil {

				continue
			}
		} else {
			err = app.Queries.DeleteUserGroupsByName(context.Background(), db.DeleteUserGroupsByNameParams{
				UserID: pgtype.UUID{Bytes: useriduuid, Valid: true},
				Name:   g.Name,
			})
			if err != nil {

				continue
			}
		}
	}

	utils.RespondWithJSON(w, struct{}{})
}

func (app *App) EditUserPermissions(w http.ResponseWriter, r *http.Request) {
	defer cache.NullGroupsAndPermissions()
	userid := r.Header.Get("Id")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err.Error(),
		})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Name    string `json:"name"`
		Checked bool   `json:"checked"`
	}

	var reqBody []RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, p := range reqBody {

		if p.Checked {
			_, err = app.Queries.InsertUserPermissionByName(context.Background(), db.InsertUserPermissionByNameParams{
				UserID: pgtype.UUID{Bytes: useriduuid, Valid: true},
				Name:   p.Name,
			})
			if err != nil {

				continue
			}

		} else {
			err = app.Queries.DeleteUserPermissionByName(context.Background(), db.DeleteUserPermissionByNameParams{
				UserID: pgtype.UUID{Bytes: useriduuid, Valid: true},
				Name:   p.Name,
			})
			if err != nil {
				continue
			}
		}
	}

	utils.RespondWithJSON(w, struct{}{})

}

func (app *App) GetGroups(w http.ResponseWriter, _ *http.Request) {

	groups, err := app.Queries.GetGroups(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error getting all groups",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, groups)
}

func (app *App) GetGroupById(w http.ResponseWriter, r *http.Request) {

	groupId := r.Header.Get("Id")
	groupiduuid, err := uuid.Parse(groupId)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err.Error(),
		})
		return
	}

	groups, err := app.Queries.GetGroupById(context.Background(), pgtype.UUID{Bytes: groupiduuid, Valid: true})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error getting all groups",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, groups)
}

func (app *App) GetPermissionById(w http.ResponseWriter, r *http.Request) {

	permissionId := r.Header.Get("Id")
	permissioniduuid, err := uuid.Parse(permissionId)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err.Error(),
		})
		return
	}

	permission, err := app.Queries.GetPermissionById(context.Background(), pgtype.UUID{Bytes: permissioniduuid, Valid: true})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error getting permission by Id",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, permission)
}

func (app *App) GetPermissions(w http.ResponseWriter, _ *http.Request) {

	permissions, err := app.Queries.GetPermissions(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error getting all permissions",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, permissions)
}

func (app *App) GetPermissionsForGroup(w http.ResponseWriter, r *http.Request) {

	groupId := r.Header.Get("Id")
	groupiduuid, err := uuid.Parse(groupId)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err.Error(),
		})
		return
	}

	type Response struct {
		Name    string `json:"name"`
		Checked bool   `json:"checked"`
	}
	var response []Response

	permissions, err := app.Queries.GetPermissions(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not get permissions",
			Error:  err.Error(),
		})
		return
	}

	permissionsForGroup, err := app.Queries.GetPermissionsByGroupId(context.Background(), pgtype.UUID{Bytes: groupiduuid, Valid: true})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not get permissions from db",
			Error:  err.Error(),
		})
		return
	}

	groupPermissionsMap := make(map[string]bool)
	for _, g := range permissionsForGroup {
		groupPermissionsMap[g.Name] = true
	}

	for _, g := range permissions {
		_, hasPermission := groupPermissionsMap[g.Name]
		response = append(response, Response{
			Name:    g.Name,
			Checked: hasPermission,
		})
	}

	utils.RespondWithJSON(w, response)
}

func (app *App) GetUserGroups(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("Id")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err.Error(),
		})
		return
	}

	type Response struct {
		Name     string `json:"name"`
		Hasgroup bool   `json:"hasgroup"`
	}

	var response []Response

	groups, err := app.Queries.GetGroups(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not get groups",
			Error:  err.Error(),
		})
		return
	}

	groupsForUser, err := app.Queries.GetGroupsByUserId(context.Background(), pgtype.UUID{Bytes: useriduuid, Valid: true})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not get groups from db",
			Error:  err.Error(),
		})
		return
	}

	userGroupsMap := make(map[string]bool)
	for _, g := range groupsForUser {
		userGroupsMap[g.Name] = true
	}

	for _, g := range groups {
		_, hasGroup := userGroupsMap[g.Name]
		response = append(response, Response{
			Name:     g.Name,
			Hasgroup: hasGroup,
		})
	}

	utils.RespondWithJSON(w, response)

}

func (app *App) GetUserPermissions(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("Id")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not get permissions from db",
			Error:  err.Error(),
		})
		return
	}

	type Response struct {
		Name          string `json:"name"`
		Haspermission bool   `json:"haspermission"`
	}

	var response []Response

	permissions, err := app.Queries.GetPermissions(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not get permissions",
			Error:  err.Error(),
		})
		return
	}

	permissionsForUser, err := app.Queries.GetPermissionsByUserId(context.Background(), pgtype.UUID{Bytes: useriduuid, Valid: true})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not get permissions from db",
			Error:  err.Error(),
		})
		return
	}

	userPermissionsMap := make(map[string]bool)
	for _, g := range permissionsForUser {
		userPermissionsMap[g.Name] = true
	}

	for _, g := range permissions {
		_, hasPermission := userPermissionsMap[g.Name]
		response = append(response, Response{
			Name:          g.Name,
			Haspermission: hasPermission,
		})
	}

	utils.RespondWithJSON(w, response)
}
