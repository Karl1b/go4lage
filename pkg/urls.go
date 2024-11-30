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

	"github.com/karl1b/go4lage/pkg/geminicv"
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
	//r.Use(app.DatabaseLogger) // Logger with db write. Uncommend to log everything.
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

	/* 	Example for the database logger: Tracking hits on index and on imprint.
	"Conversion rate."
	*/
	r.With(app.DatabaseLogger).Get("/", utils.Root)
	r.With(app.DatabaseLogger).Get("/imprint", utils.Root)
	r.With(app.DatabaseLogger).Get("/geminicv", utils.Root)

	// * for statics, serves the root folder content
	r.Get("/*", utils.Root)

	r.Post("/adminapi/login", adminApp.Login)
	r.Get("/adminapi/dashboardinfo", adminApp.Dashboardinfo)

	r.With(app.AuthMiddleware("", "")).Get("/adminapi/logout", adminApp.Logout)

	// Admin dashboard endpoints
	r.Route("/adminapi", func(r chi.Router) {
		// In this example every user that is active and has the group "staff" can use the endpoint. And superusers of course.
		r.Use(app.AuthMiddleware("staff", ""))

		r.Get("/allusers", adminApp.Allusers)
		r.Get("/oneuser", adminApp.Oneuser)
		r.Delete("/deleteuser", adminApp.Deleteoneuser)
		r.Put("/oneuser", adminApp.Editoneuser)
		r.Post("/oneuser", adminApp.Createoneuser)
		r.Post("/bulkcreateusers", adminApp.BulkCreateUsers)
		r.Get("/downloadcsvtemplate", adminApp.DownloadCSVTemplate)
		r.Get("/getusergroups", adminApp.GetUserGroups)
		r.Get("/getuserpermissions", adminApp.GetUserPermissions)
		r.Post("/editusergroups", adminApp.EditUserGroups)
		r.Post("/edituserpermissions", adminApp.EditUserPermissions)
		r.Get("/getgroups", adminApp.GetGroups)
		r.Get("/getgroup", adminApp.GetGroupById)
		r.Get("/getpermissions", adminApp.GetPermissions)
		r.Get("/getpermission", adminApp.GetPermissionById)
		r.Get("/getpermissionsforgroup", adminApp.GetPermissionsForGroup)
		r.Post("/editgrouppermissions", adminApp.EditGroupPermissions)
		r.Delete("/deletepermission", adminApp.DeletePermission)
		r.Delete("/deletegroup", adminApp.DeleteGroup)
		r.Put("/creategroup", adminApp.CreateGroup)
		r.Put("/createpermission", adminApp.CreatePermission)
		r.Get("/createbackup", adminApp.CreateBackup)
		r.Get("/getbackups", adminApp.GetBackups)
		r.Get("/downloadbackup", adminApp.DownloadBackup)
		r.Delete("/deletebackup", adminApp.DeleteBackup)
		r.Get("/getlogs/{endpoint}", adminApp.GetLogs)
		r.Get("/geterrorlogs", adminApp.GetErrorLogs)
	})

	gcv := geminicv.GeApp{
		Queries: queries,
		Utils:   &Settings,
	}

	r.Route("/geminicv", func(r chi.Router) {
		r.Use(app.AuthMiddleware("", ""))
		r.Post("/uploadcv", gcv.UploadCV)
		r.Post("/uploadtext", gcv.UploadText)
		r.Get("/allruns", gcv.Allruns)
		r.Get("/run", gcv.Run)

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
