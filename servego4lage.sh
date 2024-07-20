#!/usr/bin/env bash

set -e

# Navigate to the SQL directory
cd /app/pkg/sql || exit

# Run sqlc generate
sqlc generate

# Navigate back to the application root
cd - || exit

go build -o go4lage
./go4lage rungoose up
./go4lage setupgp
./go4lage startserver
