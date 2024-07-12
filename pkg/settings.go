package go4lage

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type go4lageSettings struct {
	ApiPort                   string
	Port                      string
	Debug                     bool
	Baseurl                   string
	Apiurl                    string
	GooseDriver               string
	GooseDbString             string
	LoginThrottleTimeS        int
	Superuser2FA              bool
	UserTokenValidMins        int
	SuperuserTokenValidMins   int
	UserLoginTrackingTimeMins int
}

var Settings go4lageSettings

func init() {

	// Load .env into global Settings.
	godotenv.Load(".env")
	debug := os.Getenv("DEBUG")
	if debug == "" {
		log.Fatal("DEBUG is empty")
	}
	isdebug, err := strconv.ParseBool(debug)
	if err != nil {
		log.Fatal("Error parsing debug")
	}
	Settings.Debug = isdebug
	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT is empty")
	}
	Settings.Port = port

	apiPort := os.Getenv("APIPORT")
	Settings.ApiPort = apiPort
	// ApiPort can be empty
	Baseurl := os.Getenv("BASEURL")
	if Baseurl == "" {
		log.Fatal("BASEURL is empty")
	}

	Settings.Baseurl = Baseurl
	Apiurl := os.Getenv("APIURL")
	if Apiurl == "" {
		log.Fatal("BASEURL is empty")
	}
	Settings.Apiurl = Apiurl

	GooseDriver := os.Getenv("GOOSE_DRIVER")
	if Baseurl == "" {
		log.Fatal("GOOSE_DRIVER is empty")
	}
	Settings.GooseDriver = GooseDriver
	GooseDbString := os.Getenv("GOOSE_DBSTRING")
	if Baseurl == "" {
		log.Fatal("GOOSE_DBSTRING is empty")
	}
	Settings.GooseDbString = GooseDbString

	sup2fa := os.Getenv("SUPERUSER_2FA")
	superuser2FA, err := strconv.ParseBool(sup2fa)
	if err != nil {
		log.Fatal("Error parsing superuser 2fa")
	}
	Settings.Superuser2FA = superuser2FA

	usertokenvalid := os.Getenv("USER_TOKEN_VALID_MINS")
	usertokenvalidInt, err := strconv.Atoi(usertokenvalid)
	if err != nil {
		log.Fatal("Error parsing USER_TOKEN_VALID_MINS")
	}
	Settings.UserTokenValidMins = usertokenvalidInt

	susertokenvalid := os.Getenv("SUPERUSER_TOKEN_VALID_MINS")
	susertokenvalidInt, err := strconv.Atoi(susertokenvalid)
	if err != nil {
		log.Fatal("Error parsing SUPERUSER_TOKEN_VALID_MINS")
	}
	Settings.SuperuserTokenValidMins = susertokenvalidInt

	loginthrottletimes := os.Getenv("LOGINTHROTTLE_TIME_S")
	loingthrottletimesint, err := strconv.Atoi(loginthrottletimes)
	if err != nil {
		log.Fatal("Error parsing LOGINTHROTTLE_TIME_S")
	}
	Settings.LoginThrottleTimeS = loingthrottletimesint

	usertrackingtimemins := os.Getenv("USER_LOGIN_TRACKING_MINS")
	usertrackingtimeminsInt, err := strconv.Atoi(usertrackingtimemins)
	if err != nil {
		log.Fatal("Error parsing USER_LOGIN_TRACKING_MINS")
	}
	Settings.UserLoginTrackingTimeMins = usertrackingtimeminsInt

}
