-- +goose Up
CREATE TABLE users (
    id UUID PRIMARY KEY,
    user_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    email TEXT UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    token VARCHAR(64) UNIQUE,
    token_created_at TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(64) UNIQUE,
    reset_token_created_at TIMESTAMP WITH TIME ZONE,
    twofactorsecret VARCHAR(32),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE
);

-- +goose Down
DROP TABLE users;
