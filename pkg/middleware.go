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

// This makes sure that only logged in users can access the route.
// If you enter a group or permission only users with one of them will be able to use this route.
// It adds the user to the context as well.
func (app *App) AuthMiddleware(group string, permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			// Extract the token from the Authorization header
			authorization := r.Header.Get("Authorization")
			token := strings.TrimPrefix(authorization, "Token ")

			// Retrieve the user by token
			user, err := getUserByToken(token, app.Queries)
			if err != nil {
				app.Utils.RespondWithJSON(w, ErrorResponse{
					Detail: "Error Getting User By Token",
					Error:  err.Error(),
				})
				return
			}

			// Inactive users are not permitted to user the app. Superusers are always permitted
			if !user.IsActive.Bool && !user.IsSuperuser.Bool {
				app.Utils.RespondWithJSON(w, ErrorResponse{
					Detail: "User inactive.",
					Error:  "user is not active",
				})
				return
			}

			// Superusers have a a different timeout setting
			if user.IsSuperuser.Bool && user.TokenCreatedAt.Time.Add(time.Duration(Settings.SuperuserTokenValidMins)*time.Minute).Before(time.Now()) {
				app.Utils.RespondWithJSON(w, ErrorResponse{
					Detail: "Login again.",
					Error:  "token outdated",
				})
				return
			}

			// User token timeout check
			if !user.IsSuperuser.Bool && user.TokenCreatedAt.Time.Add(time.Duration(Settings.UserTokenValidMins)*time.Minute).Before(time.Now()) {
				app.Utils.RespondWithJSON(w, ErrorResponse{
					Detail: "Login again.",
					Error:  "token outdated",
				})
				return
			}

			hasPermission := false

			if permission != "" {
				hasPermission, err = userHasPermission(user, permission, app.Queries)
				if err != nil {
					app.Utils.RespondWithJSON(w, ErrorResponse{
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
					app.Utils.RespondWithJSON(w, ErrorResponse{
						Detail: "Error getting group for user",
						Error:  err.Error(),
					})
					return
				}
			}
			if !(hasPermission || hasGroup) && !(group == "" && permission == "") {

				app.Utils.RespondWithJSON(w, ErrorResponse{
					Detail: "You do not have the permission or are not in the correct group to do this",
					Error:  "permission check failed",
				})
				return
			}

			if user.LastLogin.Time.Add(time.Duration(Settings.UserLoginTrackingTimeMins) * time.Minute).Before(time.Now()) {
				_, err = app.Queries.UpdateLastLoginByID(context.Background(), user.ID)
				if err != nil {
					app.Utils.RespondWithJSON(w, ErrorResponse{
						Detail: "Error updating last login time",
						Error:  err.Error(),
					})
					return
				}
				go4users.Del(user.ID.String())
			}

			// Insert user into the request context for later use
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
