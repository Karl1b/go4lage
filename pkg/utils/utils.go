package utils

import (
	"github.com/karl1b/go4lage/pkg/sql/db"
)

type Info struct{}
type InfoKey struct {
	User         db.User
	Organization db.Organization
	Groups       []string
	Permissions  []string
}

var InfoContextKey Info

const OrganizationAdminGroup = "organizationadmin"
const HandleOrganizationPermission = "handleorganization"
