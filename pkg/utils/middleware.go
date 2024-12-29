package utils

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/jackc/pgx/v5/pgtype"

	cache "github.com/karl1b/go4lage/pkg/cache"
	settings "github.com/karl1b/go4lage/pkg/settings"

	"github.com/karl1b/go4lage/pkg/sql/db"
)

func (app *App) DatabaseLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		defer func() {
			params := db.InsertLogEntryParams{
				ClientIp: pgtype.Text{
					String: strings.Split(r.RemoteAddr, ".")[0], // It does only log the first part of the ip due to legal restrictions.
					Valid:  true,
				},
				RequestMethod: pgtype.Text{
					String: r.Method,
					Valid:  true,
				},
				RequestUri: pgtype.Text{
					String: r.URL.RequestURI(),
					Valid:  true,
				},
				RequestProtocol: pgtype.Text{
					String: r.Proto,
					Valid:  true,
				},
				StatusCode: pgtype.Int2{
					Int16: int16(ww.Status()),
					Valid: true,
				},
				ResponseDuration: pgtype.Int2{
					Int16: int16(time.Since(start).Milliseconds()),
					Valid: true,
				},
				UserAgent: pgtype.Text{
					String: r.UserAgent(),
					Valid:  true,
				},
				Referrer: pgtype.Text{
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
			user, err := cache.GetUserByToken(token, app.Queries)
			if err != nil {
				RespondWithJSON(w, ErrorResponse{
					Detail: "Error Getting User By Token",
					Error:  err.Error(),
				})
				return
			}

			// Inactive users are not permitted to user the app. Superusers are always permitted
			if !user.IsActive.Bool && !user.IsSuperuser.Bool {
				RespondWithJSON(w, ErrorResponse{
					Detail: "User inactive.",
					Error:  "user is not active",
				})
				return
			}

			// Superusers have a a different timeout setting
			if user.IsSuperuser.Bool && user.TokenCreatedAt.Time.Add(time.Duration(settings.Settings.SuperuserTokenValidMins)*time.Minute).Before(time.Now()) {
				RespondWithJSON(w, ErrorResponse{
					Detail: "Login again.",
					Error:  "token outdated",
				})
				return
			}

			// User token timeout check
			if !user.IsSuperuser.Bool && user.TokenCreatedAt.Time.Add(time.Duration(settings.Settings.UserTokenValidMins)*time.Minute).Before(time.Now()) {
				RespondWithJSON(w, ErrorResponse{
					Detail: "Login again.",
					Error:  "token outdated",
				})
				return
			}

			hasPermission := false

			if permission != "" {
				hasPermission, err = userHasPermission(user, permission, app.Queries)
				if err != nil {
					RespondWithJSON(w, ErrorResponse{
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
					RespondWithJSON(w, ErrorResponse{
						Detail: "Error getting group for user",
						Error:  err.Error(),
					})
					return
				}
			}
			if !(hasPermission || hasGroup) && !(group == "" && permission == "") {

				RespondWithJSON(w, ErrorResponse{
					Detail: "You do not have the permission or are not in the correct group to do this",
					Error:  "permission check failed",
				})
				return
			}

			if user.LastLogin.Time.Add(time.Duration(settings.Settings.UserLoginTrackingTimeMins) * time.Minute).Before(time.Now()) {
				_, err = app.Queries.UpdateLastLoginByID(context.Background(), user.ID)
				if err != nil {
					RespondWithJSON(w, ErrorResponse{
						Detail: "Error updating last login time",
						Error:  err.Error(),
					})
					return
				}
				cache.Go4users.Del(user.Token.String)

			}

			// Insert user into the request context for later use
			ctx := context.WithValue(r.Context(), UserKey{}, user)

			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
		})
	}
}

func userHasPermission(user db.User, requiredPerm string, queries *db.Queries) (bool, error) {
	if user.IsSuperuser.Bool {
		return true, nil
	}
	perms, err := cache.GetPermissionsByUser(user.ID, queries)
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

	groups, err := cache.GetGroupsByUser(user.ID, queries)
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
