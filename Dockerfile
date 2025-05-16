# syntax=docker/dockerfile:1

FROM golang:1.24.3

WORKDIR /app

# Install sqlc globally
RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Install sqlc globally

RUN apt-get update && apt-get install -y postgresql-client
# Add the go installation path to the PATH environment variable
ENV PATH="/go/bin:${PATH}"

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Explicitly copy and set permissions for servego4lage.sh
COPY servego4lage.sh /app/servego4lage.sh
RUN chmod +x /app/servego4lage.sh

# Explicitly copy and set permissions for backup.sh
COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

# Run sqlc to generate db files
# WORKDIR /app/pkg/sql
# RUN sqlc generate

WORKDIR /app

# Build
# RUN CGO_ENABLED=0 GOOS=linux go build -o /go4lage

# Expose main and syslog port
EXPOSE 8080

ENTRYPOINT ["/app/servego4lage.sh"]
