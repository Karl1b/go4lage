package go4lage

import (
	"context"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	db "github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"
	"github.com/pquerna/otp/totp"
)

/* Here are the endpoints for the admin dashboard. */

func (app *App) dashboardinfo(w http.ResponseWriter, r *http.Request) {
	type Response struct {
		Tfa bool `json:"tfa"`
	}
	var Answer Response

	Answer.Tfa = Settings.Superuser2FA

	utils.RespondWithJSON(w, 200, Answer)
}

func (app *App) login(w http.ResponseWriter, r *http.Request) {
	err := loginthrottler.check(r.RemoteAddr) // Auth throttle
	if err != nil {

		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Auththrottle",
			Error:  err,
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
		Email        string `json:"email"`
		Password     string `json:"password"`
		Twofactorkey string `json:"twofakey"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	type Response struct {
		Token string `json:"token"`
		Email string `json:"email"`
	}
	var Answer Response

	user, err := app.Queries.SelectUserByEmail(context.Background(), reqBody.Email)
	if err != nil {
		fmt.Println(err)
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{Detail: "Error getting Token"})
		return
	}

	err = utils.CompareHashAndPassword(user.Password, reqBody.Password)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error comparing password",
			Error:  err,
		})
		return
	}

	if !user.IsActive.Bool && !user.IsSuperuser.Bool {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{Detail: "User is not active!"})
		return
	}

	Answer.Token = user.Token.String
	Answer.Email = user.Email

	if Settings.Superuser2FA && user.IsSuperuser.Bool {
		valid := totp.Validate(reqBody.Twofactorkey, user.Twofactorsecret.String)
		if !(valid) {
			utils.RespondWithJSON(w, 400, Response{Token: "Error validating 2FA."})
			return
		}
	}

	if user.Token.String == "" || user.TokenCreatedAt.Time.Add(2*7*24*time.Hour).Before(time.Now()) || user.IsSuperuser.Bool {
		newToken, err := utils.GenerateTokenHex(32)
		if err != nil {
			utils.RespondWithJSON(w, 400, Response{Token: "Error generating Token results from database"})
		}

		updatedUser, err := app.Queries.UpdateTokenByID(context.Background(), db.UpdateTokenByIDParams{
			ID:    user.ID,
			Token: sql.NullString{String: newToken, Valid: true},
		})
		if err != nil {
			utils.RespondWithJSON(w, 400, Response{Token: "Error writing updated user to database"})
		}
		Answer.Token = updatedUser.Token.String
	}

	utils.RespondWithJSON(w, 200, Answer)
}

func (app *App) editoneuser(w http.ResponseWriter, r *http.Request) {

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		IsActive    bool   `json:"is_active"`
		IsSuperuser bool   `json:"is_superuser"`
		Username    string `json:"username"`
		Permissions string `json:"permissions"`
		Groups      string `json:"groups"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	email := reqBody.Email
	if !utils.IsValidEmail(email) {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error Email format. Is the email valid?",
			Error:  nil,
		})
		return
	}

	userid := r.Header.Get("UserId")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err,
		})
		return
	}

	olduser, err := app.Queries.SelectUserById(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error getting olduser from db",
			Error:  err,
		})
		return
	}

	updateParams := db.UpdateUserByIDParams{
		ID:          useriduuid,
		IsActive:    sql.NullBool{Bool: reqBody.IsActive, Valid: true},
		IsSuperuser: sql.NullBool{Bool: reqBody.IsSuperuser, Valid: true},
	}

	if reqBody.Email != "" && utils.IsValidEmail(reqBody.Email) {
		updateParams.Email = reqBody.Email // Assuming Email is a string and not sql.NullString in your schema
	} else if reqBody.Email != "" && !utils.IsValidEmail(reqBody.Email) {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error Email format. Is the email valid?",
			Error:  nil,
		})
		return
	}

	if reqBody.Password != "" {
		updateParams.Password, err = utils.HashPassword(reqBody.Password)
		if err != nil {
			utils.RespondWithJSON(w, 400, utils.ErrorResponse{
				Detail: "Error hashing password",
				Error:  err,
			})
		}
	} else {
		updateParams.Password = olduser.Password
	}
	// Repeat for other fields, adjusting for their types
	if reqBody.FirstName != "" {
		updateParams.FirstName = sql.NullString{String: reqBody.FirstName, Valid: true}
	} else {
		updateParams.FirstName = olduser.FirstName
	}
	if reqBody.LastName != "" {
		updateParams.LastName = sql.NullString{String: reqBody.LastName, Valid: true}
	} else {
		updateParams.LastName = olduser.LastName
	}

	if reqBody.Username == "" {
		updateParams.Username = reqBody.Email
	} else {
		updateParams.Username = reqBody.Username
	}

	_, err = app.Queries.UpdateUserByID(context.Background(), updateParams)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error updating User",
			Error:  err,
		})

		return
	}
	// The user is changed and hence needs to be deleted from cache.
	go4users.Del(userid)
	utils.RespondWithJSON(w, 200, utils.ErrorResponse{
		Detail: "User updated",
		Error:  nil,
	})

}

func (app *App) editUserGroups(w http.ResponseWriter, r *http.Request) {
	defer nullGroupsAndPermissions()

	userid := r.Header.Get("UserId")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err,
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
				UserID: useriduuid,
				Name:   g.Name,
			})
			if err != nil {

				continue
			}

		} else {
			err = app.Queries.DeleteUserGroupsByName(context.Background(), db.DeleteUserGroupsByNameParams{
				UserID: useriduuid,
				Name:   g.Name,
			})
			if err != nil {

				continue
			}
		}
	}
	utils.RespondWithJSON(w, 200, struct{}{})
}
func (app *App) editGroupPermissions(w http.ResponseWriter, r *http.Request) {
	defer nullGroupsAndPermissions()

	groupId := r.Header.Get("GroupId")
	groupiduuid, err := uuid.Parse(groupId)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err,
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
			err = app.Queries.InsertGroupPermissionByName(context.Background(), db.InsertGroupPermissionByNameParams{
				GroupID: groupiduuid,
				Name:    p.Name,
			})
			if err != nil {
				continue
			}

		} else {
			err = app.Queries.DeleteGroupPermissionByName(context.Background(), db.DeleteGroupPermissionByNameParams{
				GroupID: groupiduuid,
				Name:    p.Name,
			})
			if err != nil {
				continue
			}
		}
	}

	utils.RespondWithJSON(w, 200, struct{}{})

}

func (app *App) editUserPermissions(w http.ResponseWriter, r *http.Request) {
	defer nullGroupsAndPermissions()
	userid := r.Header.Get("UserId")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err,
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
				UserID: useriduuid,
				Name:   p.Name,
			})
			if err != nil {
				continue
			}

		} else {
			err = app.Queries.DeleteUserPermissionByName(context.Background(), db.DeleteUserPermissionByNameParams{
				UserID: useriduuid,
				Name:   p.Name,
			})
			if err != nil {
				continue
			}
		}
	}
	utils.RespondWithJSON(w, 200, struct{}{})

}

func (app *App) getGroups(w http.ResponseWriter, r *http.Request) {

	groups, err := app.Queries.GetGroups(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error getting all groups",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, groups)
}

func (app *App) getGroupById(w http.ResponseWriter, r *http.Request) {

	groupId := r.Header.Get("GroupId")
	groupiduuid, err := uuid.Parse(groupId)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err,
		})
		return
	}

	groups, err := app.Queries.GetGroupById(context.Background(), groupiduuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error getting all groups",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, groups)
}

func (app *App) getPermissionById(w http.ResponseWriter, r *http.Request) {

	permissionId := r.Header.Get("PermissionId")
	permissioniduuid, err := uuid.Parse(permissionId)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err,
		})
		return
	}

	permission, err := app.Queries.GetPermissionById(context.Background(), permissioniduuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error getting permission by Id",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, permission)
}

func (app *App) createPermission(w http.ResponseWriter, r *http.Request) {

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Name string `json:"name"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if reqBody.Name == "" {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "no empty names allowed",
			Error:  errors.New("no empty names allowed"),
		})
		return
	}

	newPermission, err := app.Queries.CreatePermission(context.Background(), db.CreatePermissionParams{
		Name: reqBody.Name,
		ID:   uuid.New(),
	})
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error creating new permission",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, newPermission)

}
func (app *App) createGroup(w http.ResponseWriter, r *http.Request) {

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Name string `json:"name"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if reqBody.Name == "" {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "no empty names allowed",
			Error:  errors.New("no empty names allowed"),
		})
		return
	}

	newGroup, err := app.Queries.CreateGroup(context.Background(), db.CreateGroupParams{
		Name: reqBody.Name,
		ID:   uuid.New(),
	})
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error creating new permission",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, newGroup)

	// null cache.

}

func (app *App) deletePermission(w http.ResponseWriter, r *http.Request) {
	defer nullGroupsAndPermissions()
	PermissionId := r.Header.Get("PermissionId")
	permissionuuid, err := uuid.Parse(PermissionId)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not parse permission ID",
			Error:  err,
		})
		return
	}
	err = app.Queries.DeletePermissionById(context.Background(), permissionuuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error getting all permissions",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, struct{}{})
}

func (app *App) deleteGroup(w http.ResponseWriter, r *http.Request) {
	defer nullGroupsAndPermissions()
	GroupId := r.Header.Get("GroupId")
	groupuuid, err := uuid.Parse(GroupId)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not parse group ID",
			Error:  err,
		})
		return
	}
	err = app.Queries.DeleteGroupById(context.Background(), groupuuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error deleting group",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, struct{}{})
}

func (app *App) getPermissions(w http.ResponseWriter, r *http.Request) {

	permissions, err := app.Queries.GetPermissions(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "error getting all permissions",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, permissions)
}

func (app *App) getPermissionsForGroup(w http.ResponseWriter, r *http.Request) {

	groupId := r.Header.Get("GroupId")
	groupiduuid, err := uuid.Parse(groupId)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err,
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
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not get permissions",
			Error:  err,
		})
		return
	}

	permissionsForGroup, err := app.Queries.GetPermissionsByGroupId(context.Background(), groupiduuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not get permissions from db",
			Error:  err,
		})
		return
	}

	// Create a map for quick lookup to see if a group is one of the user's groups
	groupPermissionsMap := make(map[string]bool)
	for _, g := range permissionsForGroup {
		groupPermissionsMap[g.Name] = true
	}

	// Now, when constructing the response, check if the group is in the user's group map
	for _, g := range permissions {
		_, hasPermission := groupPermissionsMap[g.Name] // Check if the group exists in the map
		response = append(response, Response{
			Name:    g.Name,
			Checked: hasPermission,
		})
	}

	utils.RespondWithJSON(w, 200, response)
}

func (app *App) createBackup(w http.ResponseWriter, r *http.Request) {
	cmd := exec.Command("/bin/bash", "./backup.sh")
	output, err := cmd.CombinedOutput()
	if err != nil {

		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Failed to create backup",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, utils.ErrorResponse{
		Detail: string(output),
		Error:  err,
	})
}

func (app *App) getBackups(w http.ResponseWriter, r *http.Request) {
	type Response struct {
		Filename string `json:"file_name"`
	}

	files, err := os.ReadDir("./backup")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read backup directory: %v", err), http.StatusInternalServerError)

		return
	}

	var filenames []Response
	for _, file := range files {
		if !file.IsDir() {
			filenames = append(filenames, Response{
				Filename: file.Name(),
			})
		}
	}

	utils.RespondWithJSON(w, 200, filenames)
}

func (app *App) downloadBackup(w http.ResponseWriter, r *http.Request) {
	fileName := r.Header.Get("FileName")
	filePath := "./backup/" + fileName

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "File not found",
			Error:  err,
		})
		return
	}

	// Open the file
	file, err := os.Open(filePath)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error opening file",
			Error:  err,
		})
		return
	}
	defer file.Close()

	// Set the headers for a binary file download
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+fileName+"\"")

	// Copy the file content to the response body
	if _, err := io.Copy(w, file); err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error sending file",
			Error:  err,
		})
		return
	}
}

func (app *App) deleteBackup(w http.ResponseWriter, r *http.Request) {
	fileName := r.Header.Get("FileName")
	filePath := "./backup/" + fileName

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "File not found",
			Error:  err,
		})
		return
	}

	if err := os.Remove(filePath); err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Failed to delete file",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, struct{}{})
}

func (app *App) getUserGroups(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("UserId")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not parse user ID",
			Error:  err,
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
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not get groups",
			Error:  err,
		})
		return
	}

	// Get groups for the specific user
	groupsForUser, err := app.Queries.GetGroupsByUserId(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not get groups from db",
			Error:  err,
		})
		return
	}

	// Create a map for quick lookup to see if a group is one of the user's groups
	userGroupsMap := make(map[string]bool)
	for _, g := range groupsForUser {
		userGroupsMap[g.Name] = true
	}

	// Now, when constructing the response, check if the group is in the user's group map
	for _, g := range groups {
		_, hasGroup := userGroupsMap[g.Name] // Check if the group exists in the map
		response = append(response, Response{
			Name:     g.Name,
			Hasgroup: hasGroup,
		})
	}

	utils.RespondWithJSON(w, 200, response)

}

func (app *App) getUserPermissions(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("UserId")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not get permissions from db",
			Error:  err,
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
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not get permissions",
			Error:  err,
		})
		return
	}

	permissionsForUser, err := app.Queries.GetPermissionsByUserId(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Can not get permissions from db",
			Error:  err,
		})
		return
	}

	// Create a map for quick lookup to see if a group is one of the user's groups
	userPermissionsMap := make(map[string]bool)
	for _, g := range permissionsForUser {
		userPermissionsMap[g.Name] = true
	}

	// Now, when constructing the response, check if the group is in the user's group map
	for _, g := range permissions {
		_, hasPermission := userPermissionsMap[g.Name] // Check if the group exists in the map
		response = append(response, Response{
			Name:          g.Name,
			Haspermission: hasPermission,
		})
	}

	utils.RespondWithJSON(w, 200, response)
}

func (app *App) createoneuser(w http.ResponseWriter, r *http.Request) {

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Username    string `json:"username"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		IsActive    bool   `json:"is_active"`
		IsSuperuser bool   `json:"is_superuser"`
		Groups      string `json:"groups"`
		Permissions string `json:"permissions"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	email := reqBody.Email
	if !utils.IsValidEmail(email) {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error Email format. Is the email valid?",
			Error:  nil,
		})

	}

	password := reqBody.Password
	if password == "" {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error Pasword Is the password valid?",
			Error:  nil,
		})
		return
	}

	newToken, err := utils.GenerateTokenHex(32)
	if err != nil {
		return
	}

	newusername := reqBody.Username
	if newusername == "" {
		newusername = reqBody.Email
	}
	newpassword, err := utils.HashPassword(password)
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "Error hashing password",
			Error:  err,
		})
	}

	newuser, err := app.Queries.CreateUser(context.Background(), db.CreateUserParams{
		ID:          uuid.New(),
		Username:    newusername,
		Token:       sql.NullString{String: newToken, Valid: true},
		Email:       email,
		Password:    newpassword,
		FirstName:   sql.NullString{String: reqBody.FirstName, Valid: true},
		LastName:    sql.NullString{String: reqBody.LastName, Valid: true},
		IsActive:    sql.NullBool{Bool: reqBody.IsActive, Valid: true},
		IsSuperuser: sql.NullBool{Bool: reqBody.IsSuperuser, Valid: true},
	})
	if err != nil {
		utils.RespondWithJSON(w, 400, utils.ErrorResponse{
			Detail: "nice",
			Error:  err,
		})

		return
	}

	groupArray := strings.Split(reqBody.Groups, "|")

	for _, g := range groupArray {
		var dbGroup db.Group

		dbGroup, err = app.Queries.GetGroupByName(context.Background(), g)
		if err != nil {
			dbGroup, err = app.Queries.CreateGroup(context.Background(), db.CreateGroupParams{
				ID:   uuid.New(),
				Name: g,
			})
			if err != nil {
				utils.RespondWithJSON(w, 400, utils.ErrorResponse{
					Detail: "error creating new group",
					Error:  err,
				})
				return
			}
		}

		_, err = app.Queries.InsertUserGroups(context.Background(), db.InsertUserGroupsParams{
			UserID:  newuser.ID,
			GroupID: dbGroup.ID,
		})
		if err != nil {
			utils.RespondWithJSON(w, 400, utils.ErrorResponse{
				Detail: "error instering into usergroups",
				Error:  err,
			})
			return
		}

	}

	permissionArray := strings.Split(reqBody.Permissions, "|")

	for _, p := range permissionArray {
		var dbPermission db.Permission

		dbPermission, err = app.Queries.GetPermissionByName(context.Background(), p)
		if err != nil {
			dbPermission, err = app.Queries.CreatePermission(context.Background(), db.CreatePermissionParams{
				ID:   uuid.New(),
				Name: p,
			})
			if err != nil {
				utils.RespondWithJSON(w, 400, utils.ErrorResponse{
					Detail: "error creating new group",
					Error:  err,
				})
				return
			}
		}

		_, err = app.Queries.InsertUserPermission(context.Background(), db.InsertUserPermissionParams{
			UserID:       newuser.ID,
			PermissionID: dbPermission.ID,
		})
		if err != nil {
			utils.RespondWithJSON(w, 400, utils.ErrorResponse{
				Detail: "error instering into userpermissions",
				Error:  err,
			})
			return
		}

	}

	utils.RespondWithJSON(w, 200, utils.ToastResponse{
		Header: "User",
		Text:   "User created",
	},
	)

}

func (app *App) deleteoneuser(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("UserId")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err,
		})
		return
	}

	//TODO: Should superuser be deleteable?

	err = app.Queries.DeleteUserById(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error deleting this user",
			Error:  err,
		})
		return
	}

	// The user is changed and hence needs to be deleted from cache.
	go4users.Del(userid)

	utils.RespondWithJSON(w, 200, struct{}{})

}

func (app *App) downloadCSVTemplate(w http.ResponseWriter, r *http.Request) {
	// Define your CSV template
	csvTemplate := []byte("email,password,username,fname,lname,is_active,is_superuser,groups: use | as delimiter e.g.: controller|adviser\n")

	// Set the headers to inform the browser about the download
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"user_template.csv\"")

	// Write the CSV template to the response
	w.Write(csvTemplate)
}

func (app *App) bulkCreateUsers(w http.ResponseWriter, r *http.Request) {

	// Parse the multipart form with a max memory of 32 MB.
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file, _, err := r.FormFile("upload_csv")
	if err != nil {
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create a CSV reader from the file
	csvReader := csv.NewReader(file)

	// Assuming the first row contains headers and you want to skip it
	if _, err := csvReader.Read(); err != nil {
		http.Error(w, "Failed to read the CSV file", http.StatusInternalServerError)
		return
	}

	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			http.Error(w, "Failed to parse the CSV file", http.StatusInternalServerError)
			return
		}
		// Assuming CSV columns are email, password, fname, lname, isActive, isSuperuser in order
		email := record[0]
		password := record[1]
		username := record[2]
		first_name := record[3]
		last_name := record[4]
		isActive := record[5] == "true"
		isSuperuser := record[6] == "false"
		groups := record[7]

		// Create JSON string from CSV row
		jsonData := fmt.Sprintf(`{"email":"%s", "password":"%s", "username":"%s","first_name":"%s", "last_name":"%s", "is_active":%t, "is_superuser":%t, "groups":"%s"}`,
			email, password, username, first_name, last_name, isActive, isSuperuser, groups)

		fmt.Println(jsonData)
		// Convert JSON string to io.Reader
		jsonDataReader := strings.NewReader(jsonData)
		fmt.Println(jsonDataReader)
		// Temporarily replace r.Body to simulate a request body containing JSON
		originalBody := r.Body
		r.Body = io.NopCloser(jsonDataReader)
		defer func() { r.Body = originalBody }()

		// Call your existing createoneuser function to create a user
		app.createoneuser(w, r)

		// Here, you might want to add some logic to handle the response from createoneuser,
		// e.g., checking if the user was created successfully before proceeding to the next record.
	}

	utils.RespondWithJSON(w, 200, utils.ErrorResponse{
		Detail: "nice",
		Error:  nil,
	})
}

func (app *App) oneuser(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("UserId")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err,
		})
		return
	}

	user, err := app.Queries.SelectUserById(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting this user",
			Error:  err,
		})
		return
	}
	type Responseuser struct {
		Username     string `json:"username"`
		Email        string `json:"email"`
		FirstName    string `json:"first_name"`
		LastName     string `json:"last_name"`
		Created_at   int64  `json:"created_at"`
		Is_superuser bool   `json:"is_superuser"`
		Is_active    bool   `json:"is_active"`
		ID           string `json:"id"`
		Groups       string `json:"groups"`
		Permissions  string `json:"permissions"`
	}

	usergroups, err := app.Queries.GetGroupsByUserId(context.Background(), user.ID)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting groups for user",
			Error:  err,
		})
		return
	}

	var groupNames []string
	for _, usergroup := range usergroups {
		groupNames = append(groupNames, usergroup.Name)
	}
	groupstring := strings.Join(groupNames, "|")

	userpermissions, err := app.Queries.GetPurePermissionsByUserId(context.Background(), user.ID)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting permissions for user",
			Error:  err,
		})
		return
	}

	var permissionNames []string
	for _, usergroup := range userpermissions {
		permissionNames = append(permissionNames, usergroup.Name)
	}
	permissionstring := strings.Join(permissionNames, "|")

	responseuser := Responseuser{
		Username:     user.Username,
		Email:        user.Email,
		FirstName:    user.FirstName.String,
		LastName:     user.LastName.String,
		Created_at:   user.UserCreatedAt.UnixMilli(),
		Is_active:    user.IsActive.Bool,
		Is_superuser: user.IsSuperuser.Bool,
		ID:           user.ID.String(),
		Groups:       groupstring,
		Permissions:  permissionstring,
	}

	utils.RespondWithJSON(w, 200, responseuser)

}

func (app *App) allusers(w http.ResponseWriter, r *http.Request) {

	allUsers, err := app.Queries.SelectAllUsers(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting all users",
			Error:  err,
		})
		return
	}

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
	}

	var Responseusers []Responseuser

	for _, user := range allUsers {

		usergroups, err := app.Queries.GetGroupsByUserId(context.Background(), user.ID)
		if err != nil {
			utils.RespondWithJSON(w, 500, utils.ErrorResponse{
				Detail: "Error getting groups for user",
				Error:  err,
			})
			return
		}

		var groupNames []string
		for _, usergroup := range usergroups {
			groupNames = append(groupNames, usergroup.Name)
		}
		groupstring := strings.Join(groupNames, "|")

		Responseusers = append(Responseusers, Responseuser{
			Username:     user.Username,
			Email:        user.Email,
			FirstName:    user.FirstName.String,
			LastName:     user.LastName.String,
			Created_at:   user.UserCreatedAt.UnixMilli(),
			Last_login:   user.LastLogin.Time.UnixMilli(),
			Is_active:    user.IsActive.Bool,
			Is_superuser: user.IsSuperuser.Bool,
			ID:           user.ID.String(),
			Groups:       groupstring,
		})

	}

	utils.RespondWithJSON(w, 200, Responseusers)

}

func (app *App) GetLogs(w http.ResponseWriter, r *http.Request) {
	endpoint := chi.URLParam(r, "endpoint")

	var logCounts []db.CountLogsByUriAndDayRow
	if endpoint == "-" {
		endpoint = "index.html"
	}

	logCounts, err := app.Queries.CountLogsByUriAndDay(context.Background(), sql.NullString{String: "/" + endpoint, Valid: true})
	if err != nil {
		http.Error(w, "Failed to fetch log counts", http.StatusInternalServerError)
		return
	}
	utils.RespondWithJSON(w, 200, logCounts)

}

// Get Error Logs
func (app *App) GetErrorLogs(w http.ResponseWriter, r *http.Request) {

	type Response struct {
		Timestamp        string `json:"timestamp"`
		ClientIP         string `json:"client_ip"`
		RequestMethod    string `json:"request_method"`
		RequestURI       string `json:"request_uri"`
		RequestProtocol  string `json:"request_protocol"`
		StatusCode       int    `json:"status_code"`
		ResponseDuration int    `json:"response_duration"`
		UserAgent        string `json:"user_agent"`
		Referrer         string `json:"referrer"`
	}

	var ErrorLogResponse []Response

	logs, err := app.Queries.SelectNon200LogEntries(context.Background())
	if err != nil {
		http.Error(w, "Failed to fetch ErrorLogs", http.StatusInternalServerError)
		return
	}

	for _, log := range logs {
		ErrorLogResponse = append(ErrorLogResponse, Response{
			Timestamp:        log.Timestamp.Time.String(),
			ClientIP:         log.ClientIp.String,
			RequestMethod:    log.RequestMethod.String,
			RequestURI:       log.RequestUri.String,
			RequestProtocol:  log.RequestProtocol.String,
			StatusCode:       int(log.StatusCode.Int16),
			ResponseDuration: int(log.ResponseDuration.Int16),
			UserAgent:        log.UserAgent.String,
			Referrer:         log.Referrer.String,
		})

	}

	utils.RespondWithJSON(w, 200, ErrorLogResponse)
}
