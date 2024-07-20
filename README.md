# Go4Lage

    Go4Lage serves as the ideal platform for launching small to medium-sized
    projects, whether you need a backend for your application or a server-side
    rendered web application. Crafted in Go, it offers simplicity and
    exceptional speed. Designed for self-hosting within a Docker Compose
    network, Go4Lage ensures significant cost savings for your company, making
    it more competitive for small to medium-sized enterprises. It includes a
    comprehensive range of features.

## Setup

### Variant One: With Docker

1. Clone this repo.
2. Copy the Docker environment settings to `.env`:
3. Adjust .env if needed.

```bash
cp dockerenv .env
```

4. Start the Docker Compose network:

```bash
sudo docker-compose up
```

### Production

This is similar to variant Two but with one additional step for a production environment:

1. Use a native Nginx instance on your VPS and point it to the Docker containers for SSL.
   This setup allows you to have multiple Go4Lage instances, one per customer if needed.

#### From there

You can access the command line with:

```bash
sudo docker exec -it go4lage_app /bin/bash
```

This will display your commands.

```bash
./go4lage
```

This will create your superuser for example.

```bash
./go4lage createsuperuser
```

Now you can access the admin dashboard and create normal users. By accessing it with */admin* in the url.

### Variant: Without Docker with native DB (Useful for Heavy Development)

1. Clone this repo.
2. Navigate to the SQL package:

```bash
cd /pkg/sql
```

3. Generate SQL code:

```bash
sqlc generate
```

4. Return to the root directory:

5. Copy the native environment settings to `.env`:

```bash
cp nativeenv .env
```

6. Adjust the `.env` file to your needs.
7. In PostgreSQL:

- Create a database user and password.
- Grant the user all rights on the database.

8. migrate the database.
9. Build your application.

### Developing the admin dashboard

The admin dasboard is a vite react app availbale non-minified in a different repository.

## The documentation and homepage:

In fact, the documentation is this repo.

[Go4Lage Homepage](https://go4lage.com "Go4lage Documentation")
