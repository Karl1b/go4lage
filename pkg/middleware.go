package go4lage

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/karl1b/go4lage/pkg/sql/db"
	"github.com/karl1b/go4lage/pkg/utils"
)

func (app *App) DatabaseLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		defer func() {
			params := db.InsertLogEntryParams{
				ClientIp: sql.NullString{
					String: strings.Split(r.RemoteAddr, ".")[0], // It does only log the first part of the ip due to legal restrictions.
					Valid:  true,
				},
				RequestMethod: sql.NullString{
					String: r.Method,
					Valid:  true,
				},
				RequestUri: sql.NullString{
					String: r.URL.RequestURI(),
					Valid:  true,
				},
				RequestProtocol: sql.NullString{
					String: r.Proto,
					Valid:  true,
				},
				StatusCode: sql.NullInt16{
					Int16: int16(ww.Status()),
					Valid: true,
				},
				ResponseDuration: sql.NullInt16{
					Int16: int16(time.Since(start).Milliseconds()),
					Valid: true,
				},
				UserAgent: sql.NullString{
					String: r.UserAgent(),
					Valid:  true,
				},
				Referrer: sql.NullString{
					String: r.Referer(),
					Valid:  true,
				},
			}

			if err := app.Queries.InsertLogEntry(r.Context(), params); err != nil {
				fmt.Println("Error logging to database:", err)
			}
		}()

		next.ServeHTTP(ww, r)
	})
}

func (app *App) AuthMiddleware(group string, permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			// Extract the token from the Authorization header
			authorization := r.Header.Get("Authorization")
			token := strings.TrimPrefix(authorization, "Token ")

			// Retrieve the user by token
			user, err := getUserByToken(token, app.Queries)
			if err != nil {
				utils.RespondWithJSON(w, 500, utils.ErrorResponse{
					Detail: "Error Getting User By Token",
					Error:  err.Error(),
				})
				return
			}

			if !user.IsActive.Bool && !user.IsSuperuser.Bool {
				utils.RespondWithJSON(w, 400, utils.ErrorResponse{
					Detail: "User inactive.",
					Error:  "user is not active",
				})
				return
			}

			if user.IsSuperuser.Bool && user.TokenCreatedAt.Time.Add(time.Duration(Settings.SuperuserTokenValidMins)*time.Minute).Before(time.Now()) {
				utils.RespondWithJSON(w, 400, utils.ErrorResponse{
					Detail: "Login again.",
					Error:  "token outdated",
				})
				return
			}

			if !user.IsSuperuser.Bool && user.TokenCreatedAt.Time.Add(time.Duration(Settings.UserTokenValidMins)*time.Minute).Before(time.Now()) {
				utils.RespondWithJSON(w, 400, utils.ErrorResponse{
					Detail: "Login again.",
					Error:  "token outdated",
				})
				return
			}

			hasPermission := false

			if permission != "" {
				hasPermission, err = userHasPermission(user, permission, app.Queries)
				if err != nil {
					utils.RespondWithJSON(w, 500, utils.ErrorResponse{
						Detail: "Error getting permissions for user",
						Error:  err.Error(),
					})
					return
				}
			}

			hasGroup := false
			if group != "" {

				hasGroup, err = userHasGroup(user, group, app.Queries)
				if err != nil {
					utils.RespondWithJSON(w, 500, utils.ErrorResponse{
						Detail: "Error getting group for user",
						Error:  err.Error(),
					})
					return
				}
			}

			if !(hasPermission || hasGroup || (group == "" && permission == "")) {
				utils.RespondWithJSON(w, 400, utils.ErrorResponse{
					Detail: "You do not have the permission or are not in the correct group to do this",
					Error:  "permission check failed",
				})
				return
			}

			ctx := context.WithValue(r.Context(), utils.UserKey{}, user)
			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		})
	}
}

func userHasPermission(user db.User, requiredPerm string, queries *db.Queries) (bool, error) {
	if user.IsSuperuser.Bool {
		return true, nil
	}
	perms, err := getPermissionsByUser(user.ID, queries)
	if err != nil {
		return false, err
	}
	for _, perm := range perms {
		if perm == requiredPerm {
			return true, nil
		}
	}
	return false, nil
}

func userHasGroup(user db.User, requiredGroup string, queries *db.Queries) (bool, error) {
	if user.IsSuperuser.Bool {
		return true, nil
	}

	groups, err := getGroupsByUser(user.ID, queries)
	if err != nil {
		return false, err
	}
	for _, group := range groups {
		if group == requiredGroup {
			return true, nil
		}
	}
	return false, nil
}
