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
	settings "github.com/karl1b/go4lage/pkg/settings"
	"github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"
	"github.com/pquerna/otp/totp"
)

// App
type App struct {
	Queries *db.Queries
}

// Info about dashboard. Is 2FA for SU enabled?
func (app *App) Dashboardinfo(w http.ResponseWriter, _ *http.Request) {
	type Response struct {
		Tfa bool `json:"tfa"`
	}
	var Answer Response

	Answer.Tfa = settings.Settings.Superuser2FA

	utils.RespondWithJSON(w, Answer)
}

// Login Endpoint with Auth Throttle.
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
		Token               string `json:"token"`
		Email               string `json:"email"`
		IsSuperuser         bool   `json:"is_superuser"`
		IsOrganizationAdmin bool   `json:"is_organizationadmin"`
		OrganizationName    string `json:"organization_name,omitzero"`
		OrganizationId      string `json:"organization_id,omitzero"`
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
	Answer.IsSuperuser = user.IsSuperuser.Bool

	if settings.Settings.Superuser2FA && user.IsSuperuser.Bool {
		valid := totp.Validate(reqBody.Twofactorkey, user.Twofactorsecret.String)
		if !(valid) {
			utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "2fa not valid", Error: "2fa not valid"})
			return
		}
	}

	var organization db.Organization

	organization, err = app.Queries.OrganizationSelectUserOrganization(context.Background(), user.ID)
	if err != nil {
		if (errors.Is(err, sql.ErrNoRows) || errors.Is(err, pgx.ErrNoRows) || strings.Contains(err.Error(), "no rows in result set")) && user.IsSuperuser.Bool {

		} else {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting organization for user in middleware",
				Error:  err.Error(),
			})
			return
		}
	} else {

		Answer.OrganizationId = uuid.UUID(organization.ID.Bytes).String()
		Answer.OrganizationName = organization.OrganizationName
	}

	groups, err := cache.GetGroupsByUser(user.ID, app.Queries)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting groups for user in middleware",
			Error:  err.Error(),
		})
		return
	}

	Answer.IsOrganizationAdmin = slices.Contains(groups, utils.OrganizationAdminGroup)

	if !user.Token.Valid || user.Token.String == "" || user.TokenCreatedAt.Time.Add(time.Duration(settings.Settings.UserTokenValidMins)*time.Minute).Before(time.Now()) || user.IsSuperuser.Bool {
		newToken, err := utils.GenerateTokenHex(32)
		if err != nil {

			utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "Error logging in", Error: err.Error()})
			return
		}

		updatedUser, err := app.Queries.UpdateTokenByID(context.Background(), db.UpdateTokenByIDParams{
			ID:    user.ID,
			Token: pgtype.Text{String: newToken, Valid: true},
		})
		if err != nil {

			utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "Error writing updated user to database", Error: err.Error()})
			return

		}
		Answer.Token = updatedUser.Token.String
	}

	utils.RespondWithJSON(w, Answer)
}

func (app *App) Logout(w http.ResponseWriter, r *http.Request) {
	infos, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	user := infos.User
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to get user from context",
			Error:  "failed to get user from context",
		})
		return
	}

	_, err := app.Queries.UpdateTokenByID(context.Background(), db.UpdateTokenByIDParams{
		ID:    user.ID,
		Token: pgtype.Text{String: "", Valid: false},
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to null token",
			Error:  "failed to get user from context",
		})
		return
	}

	cache.Go4users.Del(user.Token.String) // The user is changed and hence needs to be deleted from cache.

	utils.RespondWithJSON(w, utils.ErrorResponse{
		Detail: "User token cleared",
		Error:  "",
	})

}
