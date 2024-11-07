#!/usr/bin/env bash

set -e

# Navigate to the SQL directory
cd /app/pkg/sql || exit

# Run sqlc generate
sqlc generate

# Navigate back to the application root
cd - || exit

go build -o go4lage
./go4lage rungoose up # Runs mmigrations
./go4lage setupgp # Adds your groups and permissions
./go4lage startserver
