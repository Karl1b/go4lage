package settings

import (
	"fmt"

	"github.com/DeanPDX/dotconfig"
)

var Settings Go4lageSettings

func init() {
	var err error
	Settings, err = dotconfig.FromFileName[Go4lageSettings](".env")
	if err != nil {
		fmt.Printf("Error: %v.", err)
	}
	//fmt.Println(Settings)
}

type Go4lageSettings struct {
	ApiPort                   string `env:"APIPORT"`
	Port                      string `env:"PORT"`
	Debug                     bool   `env:"DEBUG"`
	Baseurl                   string `env:"BASEURL"`
	Apiurl                    string `env:"APIURL"`
	GooseDriver               string `env:"GOOSE_DRIVER"`
	GooseDbString             string `env:"GOOSE_DBSTRING"`
	LoginThrottleTimeS        int    `env:"LOGINTHROTTLE_TIME_S"`
	Superuser2FA              bool   `env:"SUPERUSER_2FA"`
	UserTokenValidMins        int    `env:"USER_TOKEN_VALID_MINS"`
	SuperuserTokenValidMins   int    `env:"SUPERUSER_TOKEN_VALID_MINS"`
	UserLoginTrackingTimeMins int    `env:"USER_LOGIN_TRACKING_MINS"`
	AppName                   string `env:"APP_NAME"`
	DbURL                     string `env:"DB_URL"`
}
