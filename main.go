package main

import (
	"fmt"
	"log"

	"github.com/spf13/cobra"

	go4lage "github.com/karl1b/go4lage/pkg"
)

var rootCmd = &cobra.Command{
	Use:   "go4lage",
	Short: "go4lage",
	Long: `go4lage made by karlbreuer.com.
	Use at Your Own Risk: No Guarantees Attached.
Quickstart:
./go4lage rungoose up # For migrating the db.
./go4lage setupgp # For creating groups and permissions, so you do not have to use the admin board.
./go4lage createsuperuser # For creating your personal superuser account.
./go4lage startserver # This starts the webserver.
	`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("#############################################")
		fmt.Println("             Welcome home,")
		fmt.Println("                          goopher")
		fmt.Println("#############################################")
		fmt.Println()
		fmt.Println("go4lage made by karlbreuer.com.")
		fmt.Println("Use at Your Own Risk: No Guarantees Attached.")
		fmt.Println("=============================================")
		fmt.Println("Available commands, run with -h for help:")
		fmt.Println("startserver")
		fmt.Println("createsuperuser")
		fmt.Println("setupgp")
		fmt.Println("rungoose")
	},
}

var setup = &cobra.Command{
	Use:   "setupgp",
	Short: "Setup groups and permissions (optional).",
	Long:  `Setup groups and permissions (optional).`,
	Run: func(cmd *cobra.Command, args []string) {
		go4lage.SetupGroupsAndPermissions()
	},
}

var startServer = &cobra.Command{
	Use:   "startserver",
	Short: "Starts the server.",
	Long:  `Starts the server.`,
	Run: func(cmd *cobra.Command, args []string) {
		go4lage.StartServer()
	},
}
var createSuperuser = &cobra.Command{
	Use:   "createsuperuser",
	Short: "Creates a superuser.",
	Long:  `Creates a superuser.`,
	Run: func(cmd *cobra.Command, args []string) {
		go4lage.CreateSuperuser()
	},
}

var createFakeUsers = &cobra.Command{
	Use:   "createfakeusers",
	Short: "Creates fake users.",
	Long:  `Creates fake user.`,
	Run: func(cmd *cobra.Command, args []string) {
		go4lage.CreateFakeUsers(args[0])
	},
}

var rungoose = &cobra.Command{
	Use:   "rungoose",
	Short: "rungoose runs goose for database migrations",
	Long: `rungoose runs goose for database migrations:
	use it with: "up","up-by-one","down","redo","reset","status","version","fix"`,
	Run: func(cmd *cobra.Command, args []string) {
		go4lage.RunGoose(args[0])
	},
}

func init() {
	rootCmd.AddCommand(startServer)
	rootCmd.AddCommand(rungoose)
	rootCmd.AddCommand(createSuperuser)
	rootCmd.AddCommand(setup)
	rootCmd.AddCommand(createFakeUsers)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		log.Println(err)
	}
}
