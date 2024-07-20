package go4lage

import (
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"image/png"
	"log"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/karl1b/go4lage/pkg/sql/db"
	_ "github.com/lib/pq"
	"github.com/pquerna/otp/totp"
	"github.com/pressly/goose/v3"

	"github.com/karl1b/go4lage/pkg/utils"
	"github.com/pquerna/otp"
)

func displayTFASecret(key *otp.Key, data []byte) {
	fmt.Printf("Issuer:       %s\n", key.Issuer())
	fmt.Printf("Account Name: %s\n", key.AccountName())
	fmt.Printf("Secret:       %s\n", key.Secret())
	fmt.Println("Writing PNG to qr-code.png....")
	os.WriteFile("qr-code.png", data, 0644)
	fmt.Println("")
	fmt.Println("Please add your TOTP to your OTP Application now!")
	fmt.Println("")
}

func CreateSuperuser() {

	var email, password, repeatPassword, passcode string
	fmt.Println("Create a superuser for your go4lage backend:")

	for {
		fmt.Println("Enter Email:")
		fmt.Scanln(&email)
		if utils.IsValidEmail(email) {
			break
		}
		fmt.Println("Enter a valid email")
	}

	fmt.Println("Enter Password:")
	fmt.Scanln(&password)
	fmt.Println("Repeat Password:")
	fmt.Scanln(&repeatPassword)
	if password != repeatPassword {
		fmt.Println("Passwords do not match. Please try again.")
		return
	}

	conn, cleanup := utils.SetUp()
	defer cleanup()
	queries := db.New(conn)

	newToken, err := utils.GenerateTokenHex(32)
	if err != nil {
		return
	}

	newpassword, err := utils.HashPassword(password)
	if err != nil {
		panic(err)
	}

	tfsecret := sql.NullString{String: "", Valid: true}

	if Settings.Superuser2FA {
		key, err := totp.Generate(totp.GenerateOpts{
			Issuer:      Settings.Baseurl,
			AccountName: email,
		})
		if err != nil {
			panic(err)
		}
		// Convert TOTP key into a PNG
		var buf bytes.Buffer
		img, err := key.Image(200, 200)
		if err != nil {
			panic(err)
		}
		png.Encode(&buf, img)

		// display the QR code to the user.
		displayTFASecret(key, buf.Bytes())

		fmt.Println("Enter passcode")
		fmt.Scanln(&passcode)

		valid := totp.Validate(passcode, key.Secret())
		if !valid {
			panic("invalid passcode")
		}
		tfsecret.String = key.Secret()
	}

	id := uuid.New()
	user, err := queries.CreateUser(context.Background(), db.CreateUserParams{
		ID:              id,
		Token:           sql.NullString{String: newToken, Valid: true},
		Email:           email,
		FirstName:       sql.NullString{String: "Super", Valid: true},
		LastName:        sql.NullString{String: "User", Valid: true},
		Password:        newpassword,
		IsSuperuser:     sql.NullBool{Bool: true, Valid: true},
		Twofactorsecret: tfsecret,
		Username:        email,
	})
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("Superuser created:")
	fmt.Println(user)

}

// Usefull for testing.
func CreateFakeUsers(a string) {

	count, err := strconv.Atoi(a)
	if err != nil {
		panic(err)
	}

	conn, cleanup := utils.SetUp()
	defer cleanup()
	queries := db.New(conn)

	for i := range count {

		email := "fakemail" + strconv.Itoa(i) + "@fake.com"
		password := strconv.Itoa(i)
		newpassword, err := utils.HashPassword(password)
		if err != nil {
			panic(err)
		}
		tfsecret := sql.NullString{String: "", Valid: true}

		name := "Fakeuser" + strconv.Itoa(i)
		newToken, err := utils.GenerateTokenHex(32)
		if err != nil {
			return
		}
		id := uuid.New()
		user, err := queries.CreateUser(context.Background(), db.CreateUserParams{
			ID:              id,
			Token:           sql.NullString{String: newToken, Valid: true},
			Email:           email,
			Password:        newpassword,
			IsSuperuser:     sql.NullBool{Bool: false, Valid: true},
			Twofactorsecret: tfsecret,
			Username:        email,
			IsActive:        sql.NullBool{Bool: true, Valid: true},
			FirstName:       sql.NullString{String: name, Valid: true},
			LastName:        sql.NullString{String: name, Valid: true},
		})
		if err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println(user)

	}

}

/*
This does setup your groups and permissions, so that you do not have to enter the admin dashboard.
It is purely additive. It will not delete anything.
*/
func SetupGroupsAndPermissions() {
	conn, cleanup := utils.SetUp()
	defer cleanup()
	queries := db.New(conn)

	type groupPerm struct {
		group       string
		permissions []string
	}

	/* Enter your groups with permissions here */
	groups := []groupPerm{
		{
			group:       "staff", // "staff is the default group for users to be able to use the admin dashboard"
			permissions: []string{},
		},
		{
			group:       "controller", // In this case the group controller is created.
			permissions: []string{"can_control", "can_read_smth"},
		},
	}

	for _, gp := range groups {
		var newgroup db.Group
		if gp.group == "" {
			continue
		}
		newgroup, err := queries.CreateGroup(context.Background(), db.CreateGroupParams{
			ID:   uuid.New(),
			Name: gp.group,
		})
		if err != nil {
			newgroup, err = queries.GetGroupByName(context.Background(), gp.group)
			if err != nil {
				log.Fatal(err)
			}
		}

		for _, p := range gp.permissions {
			var newperm db.Permission
			if p == "" {
				continue
			}
			newperm, err := queries.CreatePermission(context.Background(), db.CreatePermissionParams{
				ID:   uuid.New(),
				Name: p,
			})
			if err != nil {
				newperm, err = queries.GetPermissionByName(context.Background(), p)
				if err != nil {
					log.Fatal(err)
				}
			}
			queries.InsertGroupPermission(context.Background(), db.InsertGroupPermissionParams{
				GroupID:      newgroup.ID,
				PermissionID: newperm.ID,
			})
		}
	}
}

// This runs goose out of go4lage.
func RunGoose(cmd string) {
	// Open the DB connection
	db, err := sql.Open(Settings.GooseDriver, Settings.GooseDbString)
	if err != nil {
		log.Fatal("failed to open DB: ", err)
	}
	defer db.Close()

	schemepath := "./pkg/sql/schema"

	// Initialize Goose
	goose.SetDialect(Settings.GooseDriver)
	// Run the Goose command
	var confirmation string

	switch cmd {
	case "up":
		err = goose.Up(db, schemepath)
	case "up-by-one":
		err = goose.UpByOne(db, schemepath)
	case "down":
		fmt.Println("Warning, down is a destructive command, continue? (y/N):")
		fmt.Scanln(&confirmation)
		if confirmation != "y" {
			return
		}
		err = goose.Down(db, schemepath)
	case "redo":
		err = goose.Redo(db, schemepath)
	case "reset":
		fmt.Println("Warning, reset is a destructive command, continue? (y/N):")
		fmt.Scanln(&confirmation)
		if confirmation != "y" {
			return
		}
		err = goose.Reset(db, schemepath)
	case "status":
		err = goose.Status(db, schemepath)
	case "version":
		err = goose.Version(db, schemepath)
	case "fix":
		err = goose.Fix(".")
	default:
		log.Fatal("unknown goose command:", cmd)

	}
	if err != nil {
		log.Fatal(fmt.Printf("failed to run goose command `%s`: %v", cmd, err))
	}

}
