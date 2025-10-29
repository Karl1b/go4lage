package admin

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	cache "github.com/karl1b/go4lage/pkg/cache"
	"github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"
)

func (app *App) AllUsers(w http.ResponseWriter, r *http.Request) {
	rinfo, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	var allUsers []db.User
	var err error

	if rinfo.User.IsSuperuser.Bool {
		allUsers, err = app.Queries.SelectAllUsers(context.Background())
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting all users",
				Error:  err.Error(),
			})
			return
		}
	} else {
		allUsers, err = app.Queries.OrganizationSelectAllUsers(context.Background(), rinfo.Organization.ID)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting users for organization",
				Error:  err.Error(),
			})
			return
		}
	}

	type OrganizationResponse struct {
		ID               uuid.UUID `json:"id"`
		CreatedAt        time.Time `json:"created_at"`
		OrganizationName string    `json:"organization_name"`
		Email            string    `json:"email"`
		ActiveUntil      time.Time `json:"active_until"`
	}

	type ResponseUser struct {
		Username     string               `json:"username"`
		Email        string               `json:"email"`
		FirstName    string               `json:"first_name"`
		LastName     string               `json:"last_name"`
		CreatedAt    time.Time            `json:"created_at"`
		LastLogin    time.Time            `json:"last_login"`
		IsSuperuser  bool                 `json:"is_superuser"`
		IsActive     bool                 `json:"is_active"`
		ID           string               `json:"id"`
		Groups       string               `json:"groups"`
		Organization OrganizationResponse `json:"organization,omitzero"`
	}

	var responseUsers []ResponseUser

	for _, dbUser := range allUsers {
		userGroups, err := app.Queries.GetGroupsByUserId(context.Background(), dbUser.ID)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting groups for user",
				Error:  err.Error(),
			})
			return
		}

		var groupNames []string
		for _, userGroup := range userGroups {
			groupNames = append(groupNames, userGroup.Name)
		}
		groupString := strings.Join(groupNames, "|")

		var organizationInfo OrganizationResponse

		userOrganization, err := app.Queries.OrganizationSelectUserOrganization(context.Background(), dbUser.ID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) || errors.Is(err, pgx.ErrNoRows) || strings.Contains(err.Error(), "no rows in result set") {

			} else {
				utils.RespondWithJSON(w, utils.ErrorResponse{
					Detail: "Error getting organization for user",
					Error:  err.Error(),
				})
				return
			}
		} else {
			organizationInfo = OrganizationResponse{
				ID:               userOrganization.ID.Bytes,
				CreatedAt:        userOrganization.CreatedAt.Time,
				OrganizationName: userOrganization.OrganizationName,
				Email:            userOrganization.Email,
				ActiveUntil:      userOrganization.ActiveUntil.Time,
			}
		}

		// Handle potential null timestamps - return actual time.Time values
		var createdAt time.Time
		var lastLogin time.Time

		if dbUser.UserCreatedAt.Valid {
			createdAt = dbUser.UserCreatedAt.Time
		}

		if dbUser.LastLogin.Valid {
			lastLogin = dbUser.LastLogin.Time
		}

		id := uuid.UUID(dbUser.ID.Bytes).String()

		responseUsers = append(responseUsers, ResponseUser{
			Username:     dbUser.Username,
			Email:        dbUser.Email,
			FirstName:    dbUser.FirstName.String,
			LastName:     dbUser.LastName.String,
			CreatedAt:    createdAt,
			LastLogin:    lastLogin,
			IsActive:     dbUser.IsActive.Bool,
			IsSuperuser:  dbUser.IsSuperuser.Bool,
			ID:           id,
			Groups:       groupString,
			Organization: organizationInfo,
		})
	}

	utils.RespondWithJSON(w, responseUsers)
}

func (app *App) OneUser(w http.ResponseWriter, r *http.Request) {
	userid := r.Header.Get("Id")
	useriduuid, err := uuid.Parse(userid)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting parsing ID",
			Error:  err.Error(),
		})
		return
	}

	rinfo, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	user, err := app.Queries.SelectUserById(context.Background(), pgtype.UUID{
		Bytes: useriduuid,
		Valid: true,
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting this user",
			Error:  err.Error(),
		})
		return
	}

	userOrganization, err := app.Queries.OrganizationSelectUserOrganization(context.Background(), pgtype.UUID{
		Bytes: useriduuid,
		Valid: true,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, sql.ErrNoRows) {
		} else {

			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting this user's organization",
				Error:  err.Error(),
			})
			return
		}
	}

	if userOrganization.ID != rinfo.Organization.ID || !userOrganization.ID.Valid {
		if !(rinfo.User.IsSuperuser.Bool) {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "No permission to see this user",
				Error:  "user organization is not your organization",
			})
			return
		}

	}

	type OrganizationResponse struct {
		ID               uuid.UUID `json:"id"`
		CreatedAt        time.Time `json:"created_at"`
		OrganizationName string    `json:"organization_name"`
		Email            string    `json:"email"`
		ActiveUntil      time.Time `json:"active_until"`
	}

	type ResponseUser struct {
		Username     string               `json:"username"`
		Email        string               `json:"email"`
		FirstName    string               `json:"first_name"`
		LastName     string               `json:"last_name"`
		CreatedAt    int64                `json:"created_at"`
		LastLogin    int64                `json:"last_login"`
		IsSuperuser  bool                 `json:"is_superuser"`
		IsActive     bool                 `json:"is_active"`
		ID           uuid.UUID            `json:"id"`
		Groups       string               `json:"groups"`
		Permissions  string               `json:"permissions"`
		Organization OrganizationResponse `json:"organization,omitzero"`
	}

	usergroups, err := app.Queries.GetGroupsByUserId(context.Background(), user.ID)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting groups for user",
			Error:  err.Error(),
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
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting permissions for user",
			Error:  err.Error(),
		})
		return
	}

	var permissionNames []string
	for _, userperm := range userpermissions {
		permissionNames = append(permissionNames, userperm.Name)
	}
	permissionstring := strings.Join(permissionNames, "|")

	var createdAt int64
	var lastLogin int64

	if user.UserCreatedAt.Valid {
		createdAt = user.UserCreatedAt.Time.Unix()
	}

	if user.LastLogin.Valid {
		lastLogin = user.LastLogin.Time.Unix()
	}

	var organizationInfo OrganizationResponse

	userOrganization, err = app.Queries.OrganizationSelectUserOrganization(context.Background(), user.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) || errors.Is(err, pgx.ErrNoRows) {
			// User has no organization - leave organizationInfo as zero value
		} else {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting organization for user",
				Error:  err.Error(),
			})
			return
		}
	} else {

		uuid, err := userOrganization.ID.UUIDValue()
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error parsing uuid for user organization",
				Error:  err.Error(),
			})
			return
		}

		organizationInfo = OrganizationResponse{
			ID:               uuid.Bytes,
			CreatedAt:        userOrganization.CreatedAt.Time,
			OrganizationName: userOrganization.OrganizationName,
			Email:            userOrganization.Email,
			ActiveUntil:      userOrganization.ActiveUntil.Time,
		}
	}

	responseuser := ResponseUser{
		Username:     user.Username,
		Email:        user.Email,
		FirstName:    user.FirstName.String,
		LastName:     user.LastName.String,
		CreatedAt:    createdAt,
		LastLogin:    lastLogin,
		IsActive:     user.IsActive.Bool,
		IsSuperuser:  user.IsSuperuser.Bool,
		ID:           uuid.UUID(user.ID.Bytes),
		Groups:       groupstring,
		Permissions:  permissionstring,
		Organization: organizationInfo,
	}

	utils.RespondWithJSON(w, responseuser)
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

	// Get the requesting user's info from context
	rinfo, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	// Permission check - only superusers can delete any user, others can only delete their org members
	if !rinfo.User.IsSuperuser.Bool {
		userOrganization, err := app.Queries.OrganizationSelectUserOrganization(context.Background(), pgtype.UUID{
			Bytes: useriduuid,
			Valid: true,
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting this user's organization",
				Error:  err.Error(),
			})
			return
		}
		if userOrganization.ID != rinfo.Organization.ID {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "No permission to delete this user",
				Error:  "user organization is not your organization",
			})
			return
		}
	}

	// Now perform the deletion
	dbuser, err := app.Queries.DeleteUserById(context.Background(), pgtype.UUID{
		Bytes: useriduuid,
		Valid: true,
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error deleting this user",
			Error:  err.Error(),
		})
		return
	}

	// The user is changed and hence needs to be deleted from cache.
	cache.Go4users.Del(dbuser.Token.String)

	utils.RespondWithJSON(w, struct{}{})
}
func (app *App) Createoneuser(w http.ResponseWriter, r *http.Request) {

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Username       string `json:"username"`
		Email          string `json:"email"`
		Password       string `json:"password"`
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		IsActive       bool   `json:"is_active"`
		IsSuperuser    bool   `json:"is_superuser"`
		Groups         string `json:"groups"`
		Permissions    string `json:"permissions"`
		OrganizationID string `json:"organization_id"` // Added to optionally specify org
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get the requesting user's info from context
	rinfo, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	hasPermToHandle := slices.Contains(rinfo.Permissions, utils.HandleOrganizationPermission)

	// Regular users cannot create users at all (they don't have permission to add users to their org)
	if !(rinfo.User.IsSuperuser.Bool || hasPermToHandle) {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "No permission to create users",
			Error:  "only superusers and OrganizationStaff can create users",
		})
		return
	}

	// Determine which organization the new user should belong to
	var targetOrgID pgtype.UUID
	if reqBody.OrganizationID != "" {
		// If organization ID is provided, parse it
		orgUUID, err := uuid.Parse(reqBody.OrganizationID)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error parsing organization ID",
				Error:  err.Error(),
			})
			return
		}
		targetOrgID = pgtype.UUID{Bytes: orgUUID, Valid: true}

		// Non-superusers can only create users in their own organization
		if !(rinfo.User.IsSuperuser.Bool) {
			if targetOrgID != rinfo.Organization.ID {
				utils.RespondWithJSON(w, utils.ErrorResponse{
					Detail: "No permission to create users in other organizations",
					Error:  "you can only create users in your own organization",
				})
				return
			}
		}
	} else {
		// If no organization specified, use the creator's organization (unless they're a superuser)
		if !(rinfo.User.IsSuperuser.Bool) {
			targetOrgID = rinfo.Organization.ID
		}
		// Superusers can create users without an organization if they don't specify one
	}

	email := strings.ToLower(strings.TrimSpace(reqBody.Email))
	if !utils.IsValidEmail(email) {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error Email format. Is the email valid?",
			Error:  "",
		})
		return
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
		return
	}

	newuser, err := app.Queries.CreateUser(context.Background(), db.CreateUserParams{
		ID:          pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Username:    newusername,
		Token:       pgtype.Text{String: newToken, Valid: true},
		Email:       email,
		Password:    newpassword,
		FirstName:   pgtype.Text{String: reqBody.FirstName, Valid: true},
		LastName:    pgtype.Text{String: reqBody.LastName, Valid: true},
		IsActive:    pgtype.Bool{Bool: reqBody.IsActive, Valid: true},
		IsSuperuser: pgtype.Bool{Bool: reqBody.IsSuperuser, Valid: true},
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "nice",
			Error:  err.Error(),
		})

		return
	}

	// Associate user with organization if targetOrgID is set
	if targetOrgID.Valid {

		_, err = app.Queries.OrganizationLinkUser(context.Background(), db.OrganizationLinkUserParams{
			UsersID:         newuser.ID,
			OrganizationsID: targetOrgID,
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error Organization link user",
				Error:  err.Error(),
			})

			return
		}

	}

	groupArray := strings.SplitSeq(reqBody.Groups, "|")

	for g := range groupArray {
		var dbGroup db.Group
		if g == "" {
			continue
		}

		dbGroup, err = app.Queries.GetGroupByName(context.Background(), g)
		if err != nil {
			dbGroup, err = app.Queries.CreateGroup(context.Background(), db.CreateGroupParams{
				ID:   pgtype.UUID{Bytes: uuid.New(), Valid: true},
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

	permissionArray := strings.SplitSeq(reqBody.Permissions, "|")

	for p := range permissionArray {
		var dbPermission db.Permission
		if p == "" {
			continue
		}

		dbPermission, err = app.Queries.GetPermissionByName(context.Background(), p)
		if err != nil {
			dbPermission, err = app.Queries.CreatePermission(context.Background(), db.CreatePermissionParams{
				ID:   pgtype.UUID{Bytes: uuid.New(), Valid: true},
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

	utils.RespondWithJSON(w, utils.ToastResponse{
		Header: "User",
		Text:   "User created",
	})

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
		Email          string `json:"email"`
		Password       string `json:"password"`
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		IsActive       bool   `json:"is_active"`
		IsSuperuser    bool   `json:"is_superuser"`
		Username       string `json:"username"`
		Permissions    string `json:"permissions"`
		Groups         string `json:"groups"`
		OrganizationID string `json:"organization_id"`
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

	// Get the requesting user's info from context
	rinfo, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	olduser, err := app.Queries.SelectUserById(context.Background(), pgtype.UUID{
		Bytes: useriduuid,
		Valid: true,
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting olduser from db",
			Error:  err.Error(),
		})
		return
	}

	// Permission check - only superuserscan edit any user, others can only edit their org members
	if !(rinfo.User.IsSuperuser.Bool) {
		userOrganization, err := app.Queries.OrganizationSelectUserOrganization(context.Background(), pgtype.UUID{
			Bytes: useriduuid,
			Valid: true,
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting this user's organization",
				Error:  err.Error(),
			})
			return
		}
		if userOrganization.ID != rinfo.Organization.ID {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "No permission to edit this user",
				Error:  "user organization is not your organization",
			})
			return
		}
	}

	updateParams := db.UpdateUserByIDParams{
		ID: pgtype.UUID{
			Bytes: useriduuid,
			Valid: true,
		},

		IsActive: pgtype.Bool{Bool: reqBody.IsActive, Valid: true},

		IsSuperuser: pgtype.Bool{Bool: reqBody.IsSuperuser, Valid: true},
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
		updateParams.FirstName = pgtype.Text{String: reqBody.FirstName, Valid: true}
	} else {
		updateParams.FirstName = olduser.FirstName
	}
	if reqBody.LastName != "" {
		updateParams.LastName = pgtype.Text{String: reqBody.LastName, Valid: true}
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

	oldGroups, _ := cache.GetGroupsByUser(pgtype.UUID{
		Bytes: useriduuid,
		Valid: true,
	}, app.Queries)

	oldPurePermissions, err := app.Queries.GetPurePermissionsByUserId(context.Background(), pgtype.UUID{
		Bytes: useriduuid,
		Valid: true,
	})
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

					UserID: pgtype.UUID{
						Bytes: useriduuid,
						Valid: true,
					},
					Name: g.Name,
				})
			}
		} else {
			if oldHasgroup {
				app.Queries.DeleteUserGroupsByName(context.Background(), db.DeleteUserGroupsByNameParams{
					UserID: pgtype.UUID{
						Bytes: useriduuid,
						Valid: true,
					},
					Name: g.Name,
				})
			}
		}
	}

	for _, p := range allpermissions {
		oldhasperm := slices.Contains(oldPurePerms, p.Name)
		if slices.Contains(newPermissions, p.Name) {
			if !oldhasperm {
				app.Queries.InsertUserPermissionByName(context.Background(), db.InsertUserPermissionByNameParams{
					UserID: pgtype.UUID{
						Bytes: useriduuid,
						Valid: true,
					},
					Name: p.Name,
				})

			}
		} else {
			if oldhasperm {
				app.Queries.DeleteUserPermissionByName(
					context.Background(),
					db.DeleteUserPermissionByNameParams{
						UserID: pgtype.UUID{
							Bytes: useriduuid,
							Valid: true,
						},
						Name: p.Name,
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

	var targetOrgID pgtype.UUID
	if reqBody.OrganizationID != "" {
		// If organization ID is provided, parse it
		orgUUID, err := uuid.Parse(reqBody.OrganizationID)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error parsing organization ID",
				Error:  err.Error(),
			})
			return
		}
		targetOrgID = pgtype.UUID{Bytes: orgUUID, Valid: true}

		// Non-superusers can only create users in their own organization
		if !(rinfo.User.IsSuperuser.Bool) {
			if targetOrgID != rinfo.Organization.ID {
				utils.RespondWithJSON(w, utils.ErrorResponse{
					Detail: "No permission to create users in other organizations",
					Error:  "you can only create users in your own organization",
				})
				return
			}
		}
	} else {
		// If no organization specified, use the creator's organization (unless they're a superuser)
		if !(rinfo.User.IsSuperuser.Bool) {
			targetOrgID = rinfo.Organization.ID
		}
		// Superusers can create users without an organization if they don't specify one
	}

	if targetOrgID.Valid {
		_, err = app.Queries.OrganizationLinkUser(context.Background(), db.OrganizationLinkUserParams{
			UsersID:         olduser.ID,
			OrganizationsID: targetOrgID,
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error Organization link user",
				Error:  err.Error(),
			})

			return
		}
	}

	cache.Go4users.Del(olduser.Token.String) // The user is changed and hence needs to be deleted from cache.
	cache.Go4groups.Del(olduser.ID.Bytes)
	cache.Go4permissions.Del(olduser.ID.Bytes)

	utils.RespondWithJSON(w, utils.ToastResponse{
		Header: "User updated",
		Text:   "",
	})
}
