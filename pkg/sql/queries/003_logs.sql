-- name: InsertLogEntry :exec
INSERT INTO detailed_logs (
    client_ip,
    request_method,
    request_uri,
    request_protocol,
    status_code,
    response_duration,
    user_agent,
    referrer
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
);

-- name: SelectAllLogEntries :many
SELECT * FROM detailed_logs;

-- name: SelectNon200LogEntries :many
SELECT * FROM detailed_logs
WHERE status_code <> 200;

-- name: CountLogsByHour :many
SELECT
    DATE(timestamp) AS log_date,
    EXTRACT(HOUR FROM timestamp) AS log_hour,
    COUNT(*) AS total_count
FROM
    detailed_logs
WHERE
    request_uri = $1
GROUP BY
    DATE(timestamp), EXTRACT(HOUR FROM timestamp)
ORDER BY
    DATE(timestamp), EXTRACT(HOUR FROM timestamp);

-- name: CountLogsByUriAndDay :many
SELECT
    DATE(timestamp) AS log_date,
    request_uri,
    COUNT(*) AS total_count
FROM
    detailed_logs
WHERE
    request_uri = $1
GROUP BY
    DATE(timestamp), request_uri
ORDER BY
    DATE(timestamp);