-- name: CreateUser :one
INSERT INTO users 
(id, user_created_at, token, token_created_at, reset_token, reset_token_created_at, email, password, first_name, last_name, is_active, is_superuser, twofactorsecret, username)
VALUES
($1, CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: DeleteUserById :exec
DELETE FROM users WHERE id = $1;

-- name: UpdateUserByID :one
UPDATE users
SET
    token = $2, 
    token_created_at = $3, 
    reset_token = $4, 
    reset_token_created_at = $5, 
    email = $6, 
    password = $7, 
    first_name = $8, 
    last_name = $9,
    is_active = $10,
    is_superuser = $11,
    twofactorsecret = $12,
    username = $13
WHERE id = $1
RETURNING *;

-- name: UpdateTokenByID :one
UPDATE users
SET
    token = $2, 
    token_created_at = CURRENT_TIMESTAMP,
    last_login = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: UpdateLastLoginByID :one
UPDATE users
SET
    last_login = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: SelectUserById :one
SELECT * FROM users WHERE id = $1;

-- name: SelectUserByToken :one
SELECT * FROM users WHERE token = $1;

-- name: SelectUserByEmailPassword :one
SELECT * FROM users WHERE email = $1 AND password = $2;

-- name: SelectUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: SelectAllUsers :many
SELECT * FROM users;