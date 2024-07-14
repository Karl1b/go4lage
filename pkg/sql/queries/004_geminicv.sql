-- name: CreateCVRun :one
INSERT INTO cvruns (id)
VALUES ($1)
RETURNING id, timestamp;

-- name: LinkUserToCVRun :exec
INSERT INTO users_cvruns (user_id, cvrun_id)
VALUES ($1, $2);

-- name: CheckCVrunUser :one
SELECT * FROM users_cvruns WHERE user_id=$1 AND cvrun_id=$2;

-- name: CreateCVRunScan :one
INSERT INTO cvrunscans (
    id, filepath, lang, anual_gross_salary_min, anual_gross_salary_avg, anual_gross_salary_max, 
    hourly_freelance_rate_min, hourly_freelance_rate_avg, hourly_freelance_rate_max, next_career_step, start_version
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11)
RETURNING id, timestamp, filepath, lang, 
    anual_gross_salary_min, anual_gross_salary_avg, anual_gross_salary_max, 
    hourly_freelance_rate_min, hourly_freelance_rate_avg, hourly_freelance_rate_max, next_career_step, start_version;

-- name: LinkCVRunToCVRunScan :exec
INSERT INTO cvruns_cvrunscans (cvrun_id, cvrunscan_id)
VALUES ($1, $2);

-- name: SelectAllCVrunsForUser :many
SELECT * FROM users_cvruns WHERE user_id=$1;

-- name: UpdateCVRunScan :exec
UPDATE cvrunscans
SET filepath = $2,
    lang = $3,
    anual_gross_salary_min = $4,
    anual_gross_salary_avg = $5,
    anual_gross_salary_max = $6,
    hourly_freelance_rate_min = $7,
    hourly_freelance_rate_avg = $8,
    hourly_freelance_rate_max = $9,
    next_career_step = $10,
    timestamp = DEFAULT
WHERE id = $1;

-- name: ReadCVrun :one
SELECT * FROM cvruns WHERE id = $1;

-- name: FindBestCVRunScan :one
SELECT cvrunscans.*
FROM cvrunscans
JOIN cvruns_cvrunscans ON cvrunscans.id = cvruns_cvrunscans.cvrunscan_id
WHERE cvruns_cvrunscans.cvrun_id = $1
ORDER BY cvrunscans.anual_gross_salary_avg DESC
LIMIT 1;

-- name: SelectAllCVRunScans :many
SELECT cvrunscans.*
FROM cvrunscans
JOIN cvruns_cvrunscans ON cvrunscans.id = cvruns_cvrunscans.cvrunscan_id
WHERE cvruns_cvrunscans.cvrun_id = $1
ORDER BY cvrunscans.anual_gross_salary_avg DESC;

-- name: CountUserRuns :one
SELECT COUNT(*) FROM users_cvruns WHERE user_id = $1;
