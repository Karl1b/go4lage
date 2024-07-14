-- +goose Up
CREATE TABLE cvruns (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users_cvruns (
    PRIMARY KEY (user_id, cvrun_id),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cvrun_id UUID REFERENCES cvruns(id) ON DELETE CASCADE
);

CREATE TABLE cvrunscans (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    filepath TEXT UNIQUE NOT NULL,
    lang VARCHAR(2) DEFAULT 'EN',
    start_version BOOLEAN DEFAULT false,
    anual_gross_salary_min INT,
    anual_gross_salary_avg INT,
    anual_gross_salary_max INT,
    hourly_freelance_rate_min INT,
    hourly_freelance_rate_avg INT,
    hourly_freelance_rate_max INT,
    next_career_step TEXT
);

CREATE TABLE cvruns_cvrunscans (
    PRIMARY KEY (cvrun_id, cvrunscan_id),
    cvrun_id UUID REFERENCES cvruns(id) ON DELETE CASCADE,
    cvrunscan_id UUID REFERENCES cvrunscans(id) ON DELETE CASCADE
);

-- +goose Down
DROP TABLE cvruns_cvrunscans;
DROP TABLE cvrunscans;
DROP TABLE users_cvruns;
DROP TABLE cvruns;
