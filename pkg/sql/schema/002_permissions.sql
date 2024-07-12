-- +goose Up
CREATE TABLE permissions (
    id UUID PRIMARY KEY, 
    name VARCHAR(35) UNIQUE NOT NULL
);

CREATE TABLE users_permissions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE, 
    PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE groups (
    id UUID PRIMARY KEY, 
    name VARCHAR(35) UNIQUE NOT NULL
);

CREATE TABLE users_groups (
    PRIMARY KEY (user_id, group_id),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE groups_permissions (
    PRIMARY KEY (group_id, permission_id),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE
);

-- +goose Down

DROP TABLE users_permissions;
DROP TABLE users_groups;
DROP TABLE groups_permissions;
DROP TABLE permissions;
DROP TABLE groups;
