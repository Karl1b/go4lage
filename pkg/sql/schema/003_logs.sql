-- +goose Up
CREATE TABLE detailed_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(39),
    request_method VARCHAR(10),
    request_uri TEXT,
    request_protocol VARCHAR(10),
    status_code SMALLINT,
    response_duration SMALLINT,
    user_agent TEXT,
    referrer TEXT
);

-- +goose Down
DROP TABLE detailed_logs;