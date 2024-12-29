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
	"sync"
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

// Creates a lot Fake users for testing
func CreateFakeUsers(a string) {
	count, err := strconv.Atoi(a)
	if err != nil {
		panic(err)
	}

	// Number of workers - adjust based on your system capabilities
	numWorkers := 10
	if count < numWorkers {
		numWorkers = count
	}

	conn, cleanup := SetUp()
	defer cleanup()
	queries := db.New(conn)

	// Create a channel to distribute work
	jobs := make(chan int, count)
	// Create a WaitGroup to wait for all goroutines to finish
	var wg sync.WaitGroup

	// Create worker pool
	for w := 0; w < numWorkers; w++ {
		wg.Add(1)
		go worker(w, jobs, &wg, queries)
	}

	// Send jobs to workers
	for i := 0; i < count; i++ {
		jobs <- i
	}
	close(jobs)

	// Wait for all workers to complete
	wg.Wait()
}

func createUserWithContext(queries *db.Queries, email, password, name, token string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	id := uuid.New()
	_, err := queries.CreateUser(ctx, db.CreateUserParams{
		ID: pgtype.UUID{
			Bytes: id,
			Valid: true,
		},
		Token:    pgtype.Text{String: token, Valid: true},
		Email:    email,
		Password: password,

		IsSuperuser: pgtype.Bool{
			Bool:  false,
			Valid: true,
		},
		Twofactorsecret: pgtype.Text{
			String: "",
			Valid:  true,
		},
		Username: email,

		IsActive: pgtype.Bool{Bool: true, Valid: true},
		FirstName: pgtype.Text{
			String: name,
			Valid:  true,
		},
		LastName: pgtype.Text{
			String: name,
			Valid:  true,
		},
	})
	return err
}

func worker(id int, jobs <-chan int, wg *sync.WaitGroup, queries *db.Queries) {
	defer wg.Done()

	for i := range jobs {
		email := "fakemail" + strconv.Itoa(i) + "@fake.com"
		password := strconv.Itoa(i)
		newpassword, err := HashPassword(password)
		if err != nil {
			log.Printf("Worker %d: Error hashing password: %v", id, err)
			continue
		}

		name := "Fakeuser" + strconv.Itoa(i)
		newToken, err := GenerateTokenHex(32)
		if err != nil {
			log.Printf("Worker %d: Error generating token: %v", id, err)
			continue
		}

		// Create user with retries
		maxRetries := 3
		for retry := 0; retry < maxRetries; retry++ {
			err = createUserWithContext(queries, email, newpassword, name, newToken)
			if err == nil {
				break
			}
			if retry == maxRetries-1 {
				log.Printf("Worker %d: Failed to create user after %d retries: %v", id, maxRetries, err)
			}
			// Exponential backoff
			time.Sleep(time.Duration(retry*retry) * 100 * time.Millisecond)
		}
	}
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
