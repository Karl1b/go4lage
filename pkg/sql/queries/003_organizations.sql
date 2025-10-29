-- name: OrganizationCreate :one
INSERT INTO organizations (id, organization_name, email, active_until) 
VALUES ($1, $2, $3, $4) 
RETURNING *;

-- name: OrganizationLinkUser :one
INSERT INTO users_organizations (users_id, organizations_id) 
VALUES ($1, $2) 
RETURNING *;

-- name: OrganizationUpdateUserOrganization :exec
UPDATE users_organizations SET organizations_id = $2 WHERE users_id = $1;

-- name: OrganizationAll :many
SELECT * FROM organizations;

-- name: OrganizationSelectById :one
SELECT * FROM organizations WHERE id = $1;

-- name: OrganizationUpdateById :one
UPDATE organizations
SET organization_name = $2, email = $3, active_until = $4
WHERE id = $1
RETURNING *;

-- name: OrganizationSelectUserOrganization :one
SELECT o.*
FROM organizations o
JOIN users_organizations uo ON o.id = uo.organizations_id
WHERE uo.users_id = $1
LIMIT 1;

-- name: OrganizationSelectAllUsers :many
SELECT u.*
FROM users u
JOIN users_organizations uo ON u.id = uo.users_id
WHERE uo.organizations_id = $1;

-- name: OrganizationDeleteByID :exec
DELETE FROM organizations WHERE id = $1;