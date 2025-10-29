package utils

import (
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"image/png"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	settings "github.com/karl1b/go4lage/pkg/settings"
	"github.com/karl1b/go4lage/pkg/sql/db"

	_ "github.com/lib/pq"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"github.com/pressly/goose/v3"
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
		if IsValidEmail(email) {
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

	conn, cleanup := SetUp()
	defer cleanup()
	queries := db.New(conn)

	newToken, err := GenerateTokenHex(32)
	if err != nil {
		return
	}

	newpassword, err := HashPassword(password)
	if err != nil {
		panic(err)
	}

	tfsecret := pgtype.Text{String: "", Valid: true}

	if settings.Settings.Superuser2FA {
		key, err := totp.Generate(totp.GenerateOpts{
			Issuer:      settings.Settings.Baseurl,
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
		ID: pgtype.UUID{
			Bytes: id,
			Valid: true,
		},
		Token:     pgtype.Text{String: newToken, Valid: true},
		Email:     email,
		FirstName: pgtype.Text{String: "Super", Valid: true},
		LastName:  pgtype.Text{String: "User", Valid: true},
		Password:  newpassword,
		IsSuperuser: pgtype.Bool{
			Bool:  true,
			Valid: true,
		},
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

/*
This does setup your groups and permissions, so that you do not have to enter the admin dashboard.
It is purely additive. It will not delete anything. Use this to make sure that your permissions are added to the database.
*/
func SetupGroupsAndPermissions() {
	conn, cleanup := SetUp()
	defer cleanup()
	queries := db.New(conn)

	type groupPerm struct {
		group       string
		permissions []string
	}

	/* Enter your groups with permissions here */
	// Hint: Superusers are extra.
	groups := []groupPerm{

		{
			group:       OrganizationAdminGroup, // "organizationadmin" is the default group for users to be able to use the admin dashboard for their organization"
			permissions: []string{HandleOrganizationPermission},
		},
	}

	for _, gp := range groups {
		var newgroup db.Group
		if gp.group == "" {
			continue
		}
		newgroup, err := queries.CreateGroup(context.Background(), db.CreateGroupParams{
			ID: pgtype.UUID{
				Bytes: uuid.New(),
				Valid: true,
			},
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

				ID: pgtype.UUID{
					Bytes: uuid.New(),
					Valid: true,
				},
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

func CreateFakeUsers(a string) {
	count, err := strconv.Atoi(a)
	if err != nil {
		log.Fatalf("Invalid count parameter: %v", err)
	}

	// Display warning and get user confirmation
	fmt.Printf("\n⚠️  WARNING ⚠️\n")
	fmt.Printf("This script will create 3 organizations and  %d test user(s) per organization.\n", count)
	fmt.Printf("All users will have the password: 'test'\n")
	fmt.Printf("\nDo you wish to continue? (y/n): ")

	var response string
	fmt.Scanln(&response)
	response = strings.ToLower(strings.TrimSpace(response))

	if response != "y" && response != "z" {
		fmt.Println("Operation cancelled by user.")
		return
	}

	fmt.Printf("\n🚀 Starting test data creation...\n")

	// 1. Setup the environment and database connection
	SetupGroupsAndPermissions()

	conn, cleanup := SetUp()
	defer cleanup()
	queries := db.New(conn)

	// 2. Define enhanced test data
	const testPassword = "test"

	companies := []struct {
		name   string
		domain string
	}{
		{"Karl Breuer", "karlbreuer.com"},
		{"Weyland Yutani", "weyland-yutani.com"},
		{"Umbrella Corp", "umbrella.co"},
	}

	userTemplates := []struct {
		firstName string
		lastName  string
	}{
		{"Karl", "Breuer"},
		{"Alice", "Johnson"},
		{"Bob", "Smith"},
		{"Charlie", "Brown"},
		{"Diana", "Prince"},
		{"Eve", "Martinez"},
		{"Frank", "Chen"},
		{"Grace", "O'Connor"},
		{"Henry", "Patel"},
		{"Iris", "Müller"},
		{"Jack", "Anderson"},
	}

	// 3. Hash the password once to be used for all users
	hashedPassword, err := HashPassword(testPassword)
	if err != nil {
		log.Fatalf("❌ Error hashing test password: %v", err)
	}

	// 4. Get the admin group once
	adminGroup, err := queries.GetGroupByName(context.Background(), OrganizationAdminGroup)
	if err != nil {
		log.Fatalf("❌ Error getting admin group '%s': %v", OrganizationAdminGroup, err)
	}

	// 5. Loop through each company to create organizations and users
	totalOrgs := 0
	totalUsers := 0

	for _, company := range companies {
		log.Printf("📦 Creating organization: %s (%s)", company.name, company.domain)

		// Create a new UUID for the organization
		orgUUID := uuid.New()

		// Create the organization
		org, err := queries.OrganizationCreate(context.Background(), db.OrganizationCreateParams{
			ID:               pgtype.UUID{Bytes: orgUUID, Valid: true},
			OrganizationName: company.name,
			Email:            fmt.Sprintf("contact@%s", company.domain),
			ActiveUntil: pgtype.Timestamptz{
				Time:  time.Now().Add(365 * 24 * 10 * time.Hour), // Active for 10 years
				Valid: true,
			},
		})
		if err != nil {
			log.Printf("❌ Error creating organization '%s': %v", company.name, err)
			continue
		}
		log.Printf("✅ Successfully created organization '%s'", org.OrganizationName)
		totalOrgs++

		// Create users for this organization
		for i := range count {
			// Use template data, cycling through if we need more users than templates
			template := userTemplates[i%len(userTemplates)]

			userUUID := uuid.New()
			userEmail := fmt.Sprintf("%s.%s%v@%s",
				strings.ToLower(template.firstName),
				strings.ToLower(template.lastName),
				i,
				company.domain)
			userName := userEmail

			log.Printf("  👤 Creating user: %s (%s %s)", userEmail, template.firstName, template.lastName)

			// Create the user
			user, err := queries.CreateUser(context.Background(), db.CreateUserParams{
				ID:       pgtype.UUID{Bytes: userUUID, Valid: true},
				Email:    userEmail,
				Password: hashedPassword,
				Username: userName,
				FirstName: pgtype.Text{
					String: template.firstName,
					Valid:  true,
				},
				LastName: pgtype.Text{
					String: template.lastName,
					Valid:  true,
				},
				IsActive:        pgtype.Bool{Bool: true, Valid: true},
				IsSuperuser:     pgtype.Bool{Bool: false, Valid: true},
				Twofactorsecret: pgtype.Text{String: "", Valid: false},
			})
			if err != nil {
				log.Printf("  ❌ Error creating user '%s': %v", userEmail, err)
				continue
			}

			// Link the user to the organization
			_, err = queries.OrganizationLinkUser(context.Background(), db.OrganizationLinkUserParams{
				UsersID:         pgtype.UUID{Bytes: user.ID.Bytes, Valid: true},
				OrganizationsID: pgtype.UUID{Bytes: org.ID.Bytes, Valid: true},
			})
			if err != nil {
				log.Printf("  ❌ Error linking user '%s' to organization '%s': %v", userEmail, company.name, err)
				continue
			}

			// If this is the first user (i == 0), link them to the admin group
			if i == 0 {
				log.Printf("  🔑 Linking user '%s' to admin group '%s'", userEmail, adminGroup.Name)
				_, err = queries.InsertUserGroups(context.Background(), db.InsertUserGroupsParams{
					UserID:  pgtype.UUID{Bytes: user.ID.Bytes, Valid: true},
					GroupID: adminGroup.ID,
				})
				if err != nil {
					log.Printf("  ❌ Error linking user '%s' to admin group: %v", userEmail, err)
					continue
				}
			}

			totalUsers++
		}
		log.Printf("✅ Successfully created %d user(s) for organization '%s'\n", count, company.name)
	}

	log.Printf("🎉 Test data creation complete!")
	log.Printf("📊 Summary: Created %d organizations and %d users", totalOrgs, totalUsers)

}

// This runs goose out of go4lage.
func RunGoose(cmd string) {
	// Open the DB connection

	db, err := sql.Open(settings.Settings.GooseDriver, settings.Settings.GooseDbString)
	if err != nil {
		log.Fatal("failed to open DB: ", err)
	}
	defer db.Close()

	schemepath := "./pkg/sql/schema"

	// Initialize Goose
	goose.SetDialect(settings.Settings.GooseDriver)
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
