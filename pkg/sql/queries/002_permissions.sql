-- name: CreatePermission :one
INSERT INTO permissions (id,name) VALUES ($1,$2) RETURNING *;

-- name: CreateGroup :one
INSERT INTO groups (id,name) VALUES ($1,$2) RETURNING *;

-- name: DeletePermissionByName :exec
DELETE FROM permissions WHERE name = $1;

-- name: DeletePermissionById :exec
DELETE FROM permissions WHERE id = $1;

-- name: DeleteGroupByName :exec
DELETE FROM groups WHERE name = $1;

-- name: DeleteGroupById :exec
DELETE FROM groups WHERE id = $1;

-- name: InsertUserPermission :one
INSERT INTO users_permissions (user_id,permission_id) VALUES ($1,$2) RETURNING *;

-- name: InsertUserGroups :one
INSERT INTO users_groups (user_id,group_id) VALUES ($1,$2) RETURNING *;

-- name: InsertGroupPermission :one
INSERT INTO groups_permissions (group_id,permission_id) VALUES ($1,$2) RETURNING *;

-- name: InsertGroupPermissionByName :exec
INSERT INTO groups_permissions (group_id,permission_id)
VALUES ($1,(SELECT id FROM permissions WHERE name =$2));

-- name: DeleteGroupPermissionByName :exec
DELETE FROM groups_permissions
WHERE group_id = $1 
AND permission_id = (SELECT id FROM permissions WHERE name = $2);

-- name: InsertUserGroupsByName :one
INSERT INTO users_groups (user_id, group_id)
VALUES ($1, (SELECT id FROM groups WHERE name = $2))
RETURNING *;


-- name: InsertUserPermissionByName :one
INSERT INTO users_permissions (user_id, permission_id)
VALUES ($1, (SELECT id FROM permissions WHERE name = $2))
RETURNING *;


-- name: DeleteUserGroupsByName :exec
DELETE FROM users_groups
WHERE user_id = $1 AND group_id IN (
    SELECT id FROM groups WHERE name = $2
);


-- name: DeleteUserPermissionByName :exec
DELETE FROM users_permissions
WHERE user_id = $1 AND permission_id IN (
    SELECT id FROM permissions WHERE name = $2
);

-- name: GetPermissionByName :one
SELECT * from permissions WHERE name = $1;

-- name: GetGroupByName :one
SELECT * from groups WHERE name = $1;

-- name: GetGroupById :one
SELECT * from groups WHERE id = $1;

-- name: GetPermissionById :one
SELECT * from permissions WHERE id = $1;

-- name: GetPermissionsByUserId :many
SELECT p.* FROM permissions AS p
INNER JOIN users_permissions AS up ON p.id = up.permission_id
WHERE up.user_id = $1

UNION

SELECT p.* FROM permissions AS p
INNER JOIN groups_permissions AS gp ON p.id = gp.permission_id
INNER JOIN users_groups AS ug ON gp.group_id = ug.group_id
WHERE ug.user_id = $1;

-- name: GetPurePermissionsByUserId :many
SELECT p.* FROM permissions AS p
INNER JOIN users_permissions AS up ON p.id = up.permission_id
WHERE up.user_id = $1;

-- name: GetPermissionsByGroupId :many
SELECT p.* FROM permissions AS p
INNER JOIN groups_permissions AS gp ON p.id = gp.permission_id
WHERE gp.group_id = $1;


-- name: GetGroupsByUserId :many
SELECT g.* FROM groups AS g
INNER JOIN users_groups AS ug ON g.id = ug.group_id
WHERE ug.user_id = $1;

-- name: GetGroups :many
SELECT * FROM groups;

-- name: GetPermissions :many
SELECT * FROM permissions;