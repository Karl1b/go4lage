-- name: CreateCVRun :one
INSERT INTO cvruns (id,lang,permanent)
VALUES ($1,$2,$3)
RETURNING *;

-- name: LinkUserToCVRun :exec
INSERT INTO users_cvruns (user_id, cvrun_id)
VALUES ($1, $2);

-- name: CheckCVrunUser :one
SELECT * FROM users_cvruns WHERE user_id=$1 AND cvrun_id=$2;

-- name: CreateCVRunScan :one
INSERT INTO cvrunscans (
    id, filepath, anual_gross_salary_min, anual_gross_salary_avg, hourly_freelance_rate_min, hourly_freelance_rate_avg, start_version
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: LinkCVRunToCVRunScan :exec
INSERT INTO cvruns_cvrunscans (cvrun_id, cvrunscan_id)
VALUES ($1, $2);

-- name: SelectAllCVrunsForUser :many
SELECT * FROM users_cvruns WHERE user_id=$1;

-- name: UpdateCVRunScan :exec
UPDATE cvrunscans
SET filepath = $2,
    anual_gross_salary_min = $3,
    anual_gross_salary_avg = $4,
    hourly_freelance_rate_min = $5,
    hourly_freelance_rate_avg = $6,
    start_version = $7,
    timestamp = DEFAULT
WHERE id = $1;

-- name: ReadCVrun :one
SELECT * FROM cvruns WHERE id = $1;

-- name: SelectAllCVRunScans :many
SELECT cvrunscans.*
FROM cvrunscans
JOIN cvruns_cvrunscans ON cvrunscans.id = cvruns_cvrunscans.cvrunscan_id
WHERE cvruns_cvrunscans.cvrun_id = $1;

-- name: CountUserRuns :one
SELECT COUNT(*) FROM users_cvruns WHERE user_id = $1;
