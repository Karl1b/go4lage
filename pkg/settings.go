package go4lage

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
}
