package admin

import (
	"context"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"slices"
	"strings"
	"time"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	cache "github.com/karl1b/go4lage/pkg/cache"
	settings "github.com/karl1b/go4lage/pkg/settings"

	"github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"
	"github.com/pquerna/otp/totp"
)

/* Here are the endpoints for the admin dashboard. */

// Tells the dashboard if the superuser tfa is needed
func (app *App) Dashboardinfo(w http.ResponseWriter, _ *http.Request) {
	type Response struct {
		Tfa bool `json:"tfa"`
	}
	var Answer Response

	Answer.Tfa = settings.Settings.Superuser2FA

	utils.RespondWithJSON(w, Answer)
}

func (app *App) Login(w http.ResponseWriter, r *http.Request) {
	err := cache.Loginthrottler.Check(r.RemoteAddr) // Auth throttle
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Auththrottle",
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

	user, err := app.Queries.SelectUserByEmail(context.Background(), strings.TrimSpace(strings.ToLower(reqBody.Email)))
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "Select user by mail failed", Error: err.Error()})
		return
	}

	err = utils.CompareHashAndPassword(user.Password, reqBody.Password)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error comparing password",
			Error:  err.Error(),
		})
		return
	}

	if !user.IsActive.Bool && !user.IsSuperuser.Bool {
		utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "User is not active", Error: "user is not active"})
		return
	}

	Answer.Token = user.Token.String
	Answer.Email = user.Email

	if settings.Settings.Superuser2FA && user.IsSuperuser.Bool {
		valid := totp.Validate(reqBody.Twofactorkey, user.Twofactorsecret.String)
		if !(valid) {
			utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "2fa not valid", Error: "2fa not valid"})
			return
		}
	}

	if !user.Token.Valid || user.Token.String == "" || user.TokenCreatedAt.Time.Add(time.Duration(settings.Settings.UserTokenValidMins)*time.Minute).Before(time.Now()) || user.IsSuperuser.Bool {
		newToken, err := utils.GenerateTokenHex(32)
		if err != nil {

			utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "Error logging in", Error: err.Error()})
			return
		}

		updatedUser, err := app.Queries.UpdateTokenByID(context.Background(), db.UpdateTokenByIDParams{
			ID:    user.ID,
			Token: sql.NullString{String: newToken, Valid: true},
		})
		if err != nil {

			utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "Error writing updated user to database", Error: err.Error()})
			return

		}
		Answer.Token = updatedUser.Token.String
	}

	utils.RespondWithJSON(w, Answer)
}

func (app *App) Editoneuser(w http.ResponseWriter, r *http.Request) {
	userid := r.Header.Get("Id")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error reading body",
			Error:  err.Error(),
		})
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
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error unmarshall body",
			Error:  err.Error(),
		})
		return
	}

	email := strings.TrimSpace(strings.ToLower(reqBody.Email))
	if !utils.IsValidEmail(email) {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error Email format. Is the email valid?",
			Error:  "",
		})
		return
	}

	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err.Error(),
		})
		return
	}

	olduser, err := app.Queries.SelectUserById(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting olduser from db",
			Error:  err.Error(),
		})
		return
	}

	updateParams := db.UpdateUserByIDParams{
		ID:          useriduuid,
		IsActive:    sql.NullBool{Bool: reqBody.IsActive, Valid: true},
		IsSuperuser: sql.NullBool{Bool: reqBody.IsSuperuser, Valid: true},
	}

	if reqBody.Email != "" && utils.IsValidEmail(reqBody.Email) {
		updateParams.Email = email
	} else if reqBody.Email != "" && !utils.IsValidEmail(reqBody.Email) {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error Email format. Is the email valid?",
			Error:  "",
		})
		return
	}

	if reqBody.Password != "" {
		updateParams.Password, err = utils.HashPassword(reqBody.Password)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error hashing password",
				Error:  err.Error(),
			})
		}
	} else {
		updateParams.Password = olduser.Password
	}

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
		updateParams.Username = email
	} else {
		updateParams.Username = reqBody.Username
	}

	allgroups, err := app.Queries.GetGroups(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error hashing password",
			Error:  err.Error(),
		})
	}
	allpermissions, err := app.Queries.GetPermissions(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error hashing password",
			Error:  err.Error(),
		})
	}

	newGroups := strings.Split(reqBody.Groups, "|")
	newPermissions := strings.Split(reqBody.Permissions, "|")

	oldGroups, _ := cache.GetGroupsByUser(useriduuid, app.Queries)

	oldPurePermissions, err := app.Queries.GetPurePermissionsByUserId(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error hashing password",
			Error:  err.Error(),
		})
	}
	var oldPurePerms []string
	for _, op := range oldPurePermissions {
		oldPurePerms = append(oldPurePerms, op.Name)
	}

	for _, g := range allgroups {
		oldHasgroup := slices.Contains(oldGroups, g.Name)
		if slices.Contains(newGroups, g.Name) {
			if !oldHasgroup {
				app.Queries.InsertUserGroupsByName(context.Background(), db.InsertUserGroupsByNameParams{
					UserID: useriduuid,
					Name:   g.Name,
				})
			}
		} else {
			if oldHasgroup {
				app.Queries.DeleteUserGroupsByName(context.Background(), db.DeleteUserGroupsByNameParams{
					UserID: useriduuid,
					Name:   g.Name,
				})
			}
		}
	}

	for _, p := range allpermissions {
		oldhasperm := slices.Contains(oldPurePerms, p.Name)
		if slices.Contains(newPermissions, p.Name) {
			if !oldhasperm {
				app.Queries.InsertUserPermissionByName(context.Background(), db.InsertUserPermissionByNameParams{
					UserID: useriduuid,
					Name:   p.Name,
				})

			}
		} else {
			if oldhasperm {
				app.Queries.DeleteUserPermissionByName(
					context.Background(),
					db.DeleteUserPermissionByNameParams{
						UserID: useriduuid,
						Name:   p.Name,
					},
				)
			}
		}
	}

	_, err = app.Queries.UpdateUserByID(context.Background(), updateParams)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error updating User",
			Error:  err.Error(),
		})

		return
	}

	cache.Go4users.Del(userid) // The user is changed and hence needs to be deleted from cache.
	cache.Go4groups.Del(userid)
	cache.Go4permissions.Del(userid)

	allUserCache.SetOrCreate(Responseuser{
		Username:     updateParams.Username,
		Email:        updateParams.Email,
		FirstName:    updateParams.FirstName.String,
		LastName:     updateParams.LastName.String,
		Created_at:   olduser.UserCreatedAt.Unix(),
		Last_login:   olduser.LastLogin.Time.Unix(),
		Is_superuser: updateParams.IsSuperuser.Bool,
		Is_active:    updateParams.IsActive.Bool,
		ID:           olduser.ID.String(),
		Groups:       strings.Join(newGroups, "|"),
		Permissions:  strings.Join(newPermissions, "|"),
	}, *app)

	utils.RespondWithJSON(w, utils.ToastResponse{
		Header: "User updated",
		Text:   "",
	})

}

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

	var groupstring string
	var groups []string

	for _, g := range reqBody {
		if g.Checked {
			_, err = app.Queries.InsertUserGroupsByName(context.Background(), db.InsertUserGroupsByNameParams{
				UserID: useriduuid,
				Name:   g.Name,
			})
			if err != nil {
				groups = append(groups, g.Name)
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

	groupstring = strings.Join(groups, "|")

	user, err := app.Queries.SelectUserById(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error select user by ID",
			Error:  err.Error(),
		})
		return
	}

	permissions, _ := cache.GetPermissionsByUser(user.ID, app.Queries)

	allUserCache.SetOrCreate(Responseuser{
		Username:     user.Username,
		Email:        user.Email,
		FirstName:    user.FirstName.String,
		LastName:     user.LastName.String,
		Created_at:   user.UserCreatedAt.Unix(),
		Last_login:   user.LastLogin.Time.Unix(),
		Is_superuser: user.IsSuperuser.Bool,
		Is_active:    user.IsActive.Bool,
		ID:           user.ID.String(),
		Groups:       groupstring,
		Permissions:  strings.Join(permissions, "|"),
	}, *app)

	utils.RespondWithJSON(w, struct{}{})
}

func (app *App) EditGroupPermissions(w http.ResponseWriter, r *http.Request) {
	defer cache.NullGroupsAndPermissions()

	groupId := r.Header.Get("Id")
	groupiduuid, err := uuid.Parse(groupId)
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

	allUserCache.SetAllUsermap(app)

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

	var permissions []string

	for _, p := range reqBody {

		if p.Checked {
			_, err = app.Queries.InsertUserPermissionByName(context.Background(), db.InsertUserPermissionByNameParams{
				UserID: useriduuid,
				Name:   p.Name,
			})
			if err != nil {
				permissions = append(permissions, p.Name)
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

	user, err := app.Queries.SelectUserById(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error select user by ID",
			Error:  err.Error(),
		})
		return
	}

	groups, _ := cache.GetGroupsByUser(user.ID, app.Queries)

	allUserCache.SetOrCreate(Responseuser{
		Username:     user.Username,
		Email:        user.Email,
		FirstName:    user.FirstName.String,
		LastName:     user.LastName.String,
		Created_at:   user.UserCreatedAt.Unix(),
		Last_login:   user.LastLogin.Time.Unix(),
		Is_superuser: user.IsSuperuser.Bool,
		Is_active:    user.IsActive.Bool,
		ID:           user.ID.String(),
		Groups:       strings.Join(groups, "|"),
		Permissions:  strings.Join(permissions, "|"),
	}, *app)

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

	groups, err := app.Queries.GetGroupById(context.Background(), groupiduuid)
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

	permission, err := app.Queries.GetPermissionById(context.Background(), permissioniduuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error getting permission by Id",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, permission)
}

func (app *App) CreatePermission(w http.ResponseWriter, r *http.Request) {

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
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "no empty names allowed",
			Error:  "no empty names allowed",
		})
		return
	}

	newPermission, err := app.Queries.CreatePermission(context.Background(), db.CreatePermissionParams{
		Name: reqBody.Name,
		ID:   uuid.New(),
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error creating new permission",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, newPermission)

}
func (app *App) CreateGroup(w http.ResponseWriter, r *http.Request) {
	defer cache.NullGroupsAndPermissions()

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
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "no empty names allowed",
			Error:  "no empty names allowed",
		})
		return
	}

	newGroup, err := app.Queries.CreateGroup(context.Background(), db.CreateGroupParams{
		Name: reqBody.Name,
		ID:   uuid.New(),
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error creating new permission",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, newGroup)

}

func (app *App) DeletePermission(w http.ResponseWriter, r *http.Request) {
	defer cache.NullGroupsAndPermissions()
	PermissionId := r.Header.Get("Id")
	permissionuuid, err := uuid.Parse(PermissionId)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not parse permission ID",
			Error:  err.Error(),
		})
		return
	}
	err = app.Queries.DeletePermissionById(context.Background(), permissionuuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error getting all permissions",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, struct{}{})
}

func (app *App) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	defer cache.NullGroupsAndPermissions()
	GroupId := r.Header.Get("Id")
	groupuuid, err := uuid.Parse(GroupId)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Can not parse group ID",
			Error:  err.Error(),
		})
		return
	}
	err = app.Queries.DeleteGroupById(context.Background(), groupuuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "error deleting group",
			Error:  err.Error(),
		})
		return
	}

	allUserCache.SetAllUsermap(app)

	utils.RespondWithJSON(w, struct{}{})
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

	permissionsForGroup, err := app.Queries.GetPermissionsByGroupId(context.Background(), groupiduuid)
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
func (app *App) CreateBackup(w http.ResponseWriter, _ *http.Request) {
	cmd := exec.Command("/bin/bash", "./backup.sh")
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Backup error: %v\nOutput: %s", err, output)
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to create backup",
			Error:  err.Error(),
		})
		return
	}
	utils.RespondWithJSON(w, utils.ToastResponse{
		Header: "Backup sucessfull",
		Text:   string(output),
	})
}
func (app *App) Logout(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(utils.UserKey{}).(db.User)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to get user from context",
			Error:  "failed to get user from context",
		})
		return
	}

	userid := user.ID.String()

	_, err := app.Queries.UpdateTokenByID(context.Background(), db.UpdateTokenByIDParams{
		ID:    user.ID,
		Token: sql.NullString{String: "", Valid: false},
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to null token",
			Error:  "failed to get user from context",
		})
		return
	}

	cache.Go4users.Del(userid) // The user is changed and hence needs to be deleted from cache.
	utils.RespondWithJSON(w, utils.ErrorResponse{
		Detail: "User token cleared",
		Error:  "",
	})

}

func (app *App) GetBackups(w http.ResponseWriter, _ *http.Request) {
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

	utils.RespondWithJSON(w, filenames)
}

func (app *App) DownloadBackup(w http.ResponseWriter, r *http.Request) {
	fileName := r.Header.Get("Id")
	filePath := "./backup/" + fileName

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "File not found",
			Error:  err.Error(),
		})
		return
	}

	file, err := os.Open(filePath)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error opening file",
			Error:  err.Error(),
		})
		return
	}
	defer file.Close()

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+fileName+"\"")

	if _, err := io.Copy(w, file); err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error sending file",
			Error:  err.Error(),
		})
		return
	}
}

func (app *App) DeleteBackup(w http.ResponseWriter, r *http.Request) {
	fileName := r.Header.Get("Id")
	filePath := "./backup/" + fileName

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "File not found",
			Error:  err.Error(),
		})
		return
	}

	if err := os.Remove(filePath); err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to delete file",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, struct{}{})
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

	groupsForUser, err := app.Queries.GetGroupsByUserId(context.Background(), useriduuid)
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

	permissionsForUser, err := app.Queries.GetPermissionsByUserId(context.Background(), useriduuid)
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

func (app *App) Createoneuser(w http.ResponseWriter, r *http.Request) {

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

	email := strings.ToLower(strings.TrimSpace(reqBody.Email))
	if !utils.IsValidEmail(email) {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error Email format. Is the email valid?",
			Error:  "",
		})

	}

	password := reqBody.Password
	if password == "" {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error Pasword Is the password valid?",
			Error:  "",
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
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error hashing password",
			Error:  err.Error(),
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
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "nice",
			Error:  err.Error(),
		})

		return
	}

	groupArray := strings.Split(reqBody.Groups, "|")

	for _, g := range groupArray {
		var dbGroup db.Group
		if g == "" {
			continue
		}
		dbGroup, err = app.Queries.GetGroupByName(context.Background(), g)
		if err != nil {
			dbGroup, err = app.Queries.CreateGroup(context.Background(), db.CreateGroupParams{
				ID:   uuid.New(),
				Name: g,
			})
			if err != nil {
				utils.RespondWithJSON(w, utils.ErrorResponse{
					Detail: "error creating new group",
					Error:  err.Error(),
				})
				return
			}
		}

		_, err = app.Queries.InsertUserGroups(context.Background(), db.InsertUserGroupsParams{
			UserID:  newuser.ID,
			GroupID: dbGroup.ID,
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "error instering into usergroups",
				Error:  err.Error(),
			})
			return
		}

	}

	permissionArray := strings.Split(reqBody.Permissions, "|")

	for _, p := range permissionArray {
		var dbPermission db.Permission
		if p == "" {
			continue
		}

		dbPermission, err = app.Queries.GetPermissionByName(context.Background(), p)
		if err != nil {
			dbPermission, err = app.Queries.CreatePermission(context.Background(), db.CreatePermissionParams{
				ID:   uuid.New(),
				Name: p,
			})
			if err != nil {
				utils.RespondWithJSON(w, utils.ErrorResponse{
					Detail: "error creating new group",
					Error:  err.Error(),
				})
				return
			}
		}

		_, err = app.Queries.InsertUserPermission(context.Background(), db.InsertUserPermissionParams{
			UserID:       newuser.ID,
			PermissionID: dbPermission.ID,
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "error instering into userpermissions",
				Error:  err.Error(),
			})
			return
		}

	}

	allUserCache.SetOrCreate(Responseuser{
		Username:     newuser.Username,
		Email:        newuser.Email,
		FirstName:    newuser.FirstName.String,
		LastName:     newuser.LastName.String,
		Created_at:   newuser.UserCreatedAt.Unix(),
		Last_login:   newuser.LastLogin.Time.Unix(),
		Is_superuser: newuser.IsSuperuser.Bool,
		Is_active:    newuser.IsActive.Bool,
		ID:           newuser.ID.String(),
		Groups:       "",
		Permissions:  "",
	}, *app)

	utils.RespondWithJSON(w, utils.ToastResponse{
		Header: "User",
		Text:   "User created",
	},
	)

}

func (app *App) Deleteoneuser(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("Id")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err.Error(),
		})
		return
	}

	//TODO: Should superuser be deleteable?

	err = app.Queries.DeleteUserById(context.Background(), useriduuid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error deleting this user",
			Error:  err.Error(),
		})
		return
	}

	// The user is changed and hence needs to be deleted from cache.
	cache.Go4users.Del(userid)
	// Set cache correctly

	allUserCache.Del(userid)

	utils.RespondWithJSON(w, struct{}{})

}

func (app *App) DownloadCSVTemplate(w http.ResponseWriter, _ *http.Request) {
	// Define your CSV template
	csvTemplate := []byte("email,password,username,fname,lname,is_active,is_superuser,groups: use | as delimiter e.g.: controller|adviser\n")

	// Set the headers to inform the browser about the download
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"user_template.csv\"")

	// Write the CSV template to the response
	w.Write(csvTemplate)
}

func (app *App) BulkCreateUsers(w http.ResponseWriter, r *http.Request) {

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
		isActive := strings.ToLower(record[5]) == "true" || record[5] == "1"
		isSuperuser := strings.ToLower(record[6]) == "true" || record[6] == "1"
		groups := record[7]

		// Create JSON string from CSV row
		jsonData := fmt.Sprintf(`{"email":"%s", "password":"%s", "username":"%s","first_name":"%s", "last_name":"%s", "is_active":%t, "is_superuser":%t, "groups":"%s"}`,
			email, password, username, first_name, last_name, isActive, isSuperuser, groups)

		// Convert JSON string to io.Reader
		jsonDataReader := strings.NewReader(jsonData)

		// Temporarily replace r.Body to simulate a request body containing JSON
		originalBody := r.Body
		r.Body = io.NopCloser(jsonDataReader)
		defer func() { r.Body = originalBody }()

		app.Createoneuser(w, r)

	}

	utils.RespondWithJSON(w, utils.ErrorResponse{
		Detail: "nice",
		Error:  "",
	})
}

func (app *App) Oneuser(w http.ResponseWriter, r *http.Request) {

	userid := r.Header.Get("Id")

	responseuser, _ := allUserCache.Get(userid)

	utils.RespondWithJSON(w, responseuser)

}

// Sets all fields correctly from DB
func (app *App) Allusers(w http.ResponseWriter, _ *http.Request) {

	Responseusers := allUserCache.GetAll()

	utils.RespondWithJSON(w, Responseusers)
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
	utils.RespondWithJSON(w, logCounts)

}

// Get Error Logs
func (app *App) GetErrorLogs(w http.ResponseWriter, _ *http.Request) {

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

	utils.RespondWithJSON(w, ErrorLogResponse)
}
