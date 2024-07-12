#!/bin/sh
# Navigate to the SQL directory
cd /app/pkg/sql

# Run sqlc generate
sqlc generate

# Navigate back to the application root
cd ../..

go build -o go4lage
./go4lage rungoose up
./go4lage setupgp
./go4lage startserver
