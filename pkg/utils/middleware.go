package utils

import (
	"context"
	"net/http"
	"slices"
	"strings"
	"time"

	cache "github.com/karl1b/go4lage/pkg/cache"
	settings "github.com/karl1b/go4lage/pkg/settings"

	"github.com/karl1b/go4lage/pkg/sql/db"
)

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
			var perms []string
			perms, err = cache.GetPermissionsByUser(user.ID, app.Queries)
			if err != nil {
				RespondWithJSON(w, ErrorResponse{
					Detail: "Error getting permission for user",
					Error:  err.Error(),
				})
				return
			}

			if permission != "" {
				hasPermission = userHasPermission(user.IsSuperuser.Bool, permission, perms)
			}
			hasGroup := false
			var groups []string
			groups, err = cache.GetGroupsByUser(user.ID, app.Queries)
			if err != nil {
				RespondWithJSON(w, ErrorResponse{
					Detail: "Error getting group for user",
					Error:  err.Error(),
				})
				return

			}
			if group != "" {
				hasGroup = userHasGroup(user.IsSuperuser.Bool, group, groups)
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

			var organization db.Organization

			if !(user.IsSuperuser.Bool) {
				organization, err = cache.GetOrganizationByUserID(user.ID.Bytes, app.Queries)
				if err != nil {
					RespondWithJSON(w, ErrorResponse{
						Detail: "Error getting organization for user in middleware",
						Error:  err.Error(),
					})
					return
				}
			}

			infos := InfoKey{
				User:         user,
				Organization: organization,
				Groups:       groups,
				Permissions:  perms,
			}

			ctx := context.WithValue(r.Context(), InfoContextKey, infos)

			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
		})
	}
}

func userHasPermission(isSuperUser bool, requiredPerm string, perms []string) bool {
	if isSuperUser {
		return true
	}
	if slices.Contains(perms, requiredPerm) {
		return true
	}
	return false
}

func userHasGroup(isSuperUser bool, requiredGroup string, groups []string) bool {
	if isSuperUser {
		return true
	}
	if slices.Contains(groups, requiredGroup) {
		return true
	}
	return false

}
