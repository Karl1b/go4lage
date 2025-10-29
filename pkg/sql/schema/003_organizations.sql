-- +goose Up
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    organization_name VARCHAR(150) UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    active_until TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE users_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    users_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organizations_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(users_id, organizations_id)
);

-- +goose Down
DROP TABLE users_organizations;
DROP TABLE organizations;