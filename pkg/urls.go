package go4lage

import (
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
	"github.com/karl1b/go4lage/pkg/sql/db"
	"github.com/karl1b/go4lage/pkg/utils"
	_ "github.com/lib/pq"

	"github.com/karl1b/go4lage/pkg/geminicv"
)

// App
type App struct {
	Queries *db.Queries
	Utils   *utils.Go4lageSettings
}

func StartServer() {
	conn, cleanup := utils.SetUp()
	defer cleanup()
	queries := db.New(conn)

	app := App{
		Queries: queries,
		Utils:   &Settings,
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
	r.With(app.DatabaseLogger).Get("/", root)
	r.With(app.DatabaseLogger).Get("/imprint", root)

	r.Get("/*", root) // * for statics

	r.Post("/adminapi/login", app.login)

	r.Get("/adminapi/dashboardinfo", app.dashboardinfo)

	r.With(app.AuthMiddleware("", "")).Get("/adminapi/logout", app.logout)

	// Admin dashboard endpoints
	r.Route("/adminapi", func(r chi.Router) {
		r.Use(app.AuthMiddleware("staff", "")) // In this example every user that is active and has the group "staff" can use the endpoint. And superusers of course.
		r.Get("/allusers", app.allusers)
		r.Get("/oneuser", app.oneuser)
		r.Delete("/deleteuser", app.deleteoneuser)
		r.Put("/oneuser", app.editoneuser)
		r.Post("/oneuser", app.createoneuser)
		r.Post("/bulkcreateusers", app.bulkCreateUsers)
		r.Get("/downloadcsvtemplate", app.downloadCSVTemplate)
		r.Get("/getusergroups", app.getUserGroups)
		r.Get("/getuserpermissions", app.getUserPermissions)
		r.Post("/editusergroups", app.editUserGroups)
		r.Post("/edituserpermissions", app.editUserPermissions)
		r.Get("/getgroups", app.getGroups)
		r.Get("/getgroup", app.getGroupById)
		r.Get("/getpermissions", app.getPermissions)
		r.Get("/getpermission", app.getPermissionById)
		r.Get("/getpermissionsforgroup", app.getPermissionsForGroup)
		r.Post("/editgrouppermissions", app.editGroupPermissions)
		r.Delete("/deletepermission", app.deletePermission)
		r.Delete("/deletegroup", app.deleteGroup)
		r.Put("/creategroup", app.createGroup)
		r.Put("/createpermission", app.createPermission)
		r.Get("/createbackup", app.createBackup)
		r.Get("/getbackups", app.getBackups)
		r.Get("/downloadbackup", app.downloadBackup)
		r.Delete("/deletebackup", app.deleteBackup)
		r.Get("/getlogs/{endpoint}", app.GetLogs)
		r.Get("/geterrorlogs", app.GetErrorLogs)
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
		Addr:    ":" + Settings.Port,
	}
	log.Printf("runs on: %s", Settings.Port)
	srv.ListenAndServe()
}
