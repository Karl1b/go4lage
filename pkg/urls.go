package go4lage

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
	admin "github.com/karl1b/go4lage/pkg/admin"

	settings "github.com/karl1b/go4lage/pkg/settings"
	"github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"

	_ "github.com/lib/pq"
)

func StartServer() {
	conn, cleanup := utils.SetUp()
	defer cleanup()
	queries := db.New(conn)

	app := utils.App{
		Queries: queries,
	}

	adminApp := admin.App{
		Queries: queries,
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Id"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "Settings"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// * for statics, serves the root folder content
	r.Get("/*", utils.Root)

	r.Post("/adminapi/login", adminApp.Login)
	r.Get("/adminapi/dashboardinfo", adminApp.Dashboardinfo)

	r.Route("/adminapi", func(r chi.Router) {
		// Routes with basic auth middleware
		r.Group(func(r chi.Router) {
			r.Use(app.AuthMiddleware("", "")) // "", "" means everyone who is logged in can use it.

			/* Logout */
			r.Get("/logout", adminApp.Logout)

			/* Feedback */
			r.Post("/updatefeedbackuser", adminApp.UpdateFeedBackUser)
			r.Get("/getuserspecificfeedback", adminApp.GetUserSpecificFeedBack)
			r.Post("/newfeedback", adminApp.NewFeedBack)
		})

		// Routes for organization admins
		r.Group(func(r chi.Router) {
			r.Use(app.AuthMiddleware(utils.OrganizationAdminGroup, ""))

			/* Users */
			r.Get("/allusers", adminApp.AllUsers)
			r.Get("/oneuser", adminApp.OneUser)
			r.Delete("/deleteuser", adminApp.Deleteoneuser)
			r.Put("/oneuser", adminApp.Editoneuser)
			r.Post("/oneuser", adminApp.Createoneuser)

			/* User Groups and Permissions */
			r.Get("/getusergroups", adminApp.GetUserGroups)
			r.Get("/getuserpermissions", adminApp.GetUserPermissions)
			r.Post("/editusergroups", adminApp.EditUserGroups)
			r.Post("/edituserpermissions", adminApp.EditUserPermissions)

			/* Permissions R */
			r.Get("/getgroups", adminApp.GetGroups)
			r.Get("/getgroup", adminApp.GetGroupById)
			r.Get("/getpermissions", adminApp.GetPermissions)
			r.Get("/getpermission", adminApp.GetPermissionById)
			r.Get("/getpermissionsforgroup", adminApp.GetPermissionsForGroup)

			/* ORGANIZATIONS */
			r.Get("/allorganizations", adminApp.AllOrganizations)
			r.Get("/oneorganization", adminApp.OneOrganization)
		})

		// Routes for only superusers
		r.Group(func(r chi.Router) {
			r.Use(app.AuthMiddleware("onlysuperuser", ""))

			/* Organizations */
			r.Post("/createorganization", adminApp.CreateOrganization)
			r.Delete("/deleteorganization", adminApp.DeleteOrganization)
			r.Put("/editoneorganization", adminApp.EditOrganization)

			/* Feedback */
			r.Get("/allfeedback", adminApp.AllFeedBack)
			r.Get("/newfeedback", adminApp.NewFeedBack)
			r.Post("/updatefeedbackstaff", adminApp.UpdateFeedBackStaff)

		})

	})

	//r.Get("/accesslogs", app.getAccessLogs) */

	srv := &http.Server{
		Handler: r,
		Addr:    ":" + settings.Settings.Port,
	}
	log.Printf("runs on: %s", settings.Settings.Port)
	err := srv.ListenAndServe()
	if err != nil {
		fmt.Println(err)
	}
}
