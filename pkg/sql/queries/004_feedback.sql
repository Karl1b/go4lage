-- name: FeedBackCreate :one
INSERT INTO feedback (id, created_by, full_url, behaviour_is, behaviour_should, chat) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING *;

-- name: FeedBackGetById :one
SELECT * FROM feedback WHERE id = $1;

-- name: FeedBackGetByCreatedBy :many
SELECT * FROM feedback WHERE created_by = $1 ORDER BY created_at DESC;

-- name: FeedBackGetAll :many
SELECT * FROM feedback ORDER BY created_at DESC;

-- name: FeedBackGetUnsolved :many
SELECT * FROM feedback WHERE is_solved = false ORDER BY last_active DESC;

-- name: FeedBackGetSolved :many
SELECT * FROM feedback WHERE is_solved = true ORDER BY last_active DESC;

-- name: FeedBackUpdateChat :one
UPDATE feedback 
SET chat = $2, last_active = CURRENT_TIMESTAMP 
WHERE id = $1 
RETURNING *;

-- name: FeedBackMarkSolved :one
UPDATE feedback 
SET is_solved = true, last_active = CURRENT_TIMESTAMP 
WHERE id = $1 
RETURNING *;

-- name: FeedBackMarkUnsolved :one
UPDATE feedback 
SET is_solved = false, last_active = CURRENT_TIMESTAMP 
WHERE id = $1 
RETURNING *;

-- name: FeedBackUpdateLastActive :exec
UPDATE feedback 
SET last_active = CURRENT_TIMESTAMP 
WHERE id = $1;

-- name: FeedBackDelete :exec
DELETE FROM feedback WHERE id = $1;

-- name: FeedBackGetByUrl :many
SELECT * FROM feedback WHERE full_url = $1 ORDER BY created_at DESC;

-- name: FeedBackGetRecentActivity :many
SELECT * FROM feedback 
WHERE last_active >= $1 
ORDER BY last_active DESC;

-- name: FeedBackCount :one
SELECT COUNT(*) FROM feedback;

-- name: FeedBackCountUnsolved :one
SELECT COUNT(*) FROM feedback WHERE is_solved = false;

-- name: FeedBackCountSolved :one
SELECT COUNT(*) FROM feedback WHERE is_solved = true;


-- name: FeedBackGetByUserId :many
SELECT * FROM feedback WHERE created_by = $1 ORDER BY created_at DESC;