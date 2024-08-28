#!/bin/bash

# Define backup directory and filename with timestamp
BACKUP_DIR="./backup"
DATA_DIR="./data"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
SQL_BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"
DATA_BACKUP_FILE="$BACKUP_DIR/data_backup_${TIMESTAMP}.tar.gz"
FINAL_BACKUP_FILE="$BACKUP_DIR/${TIMESTAMP}_backup.tar.gz"

# Ensure backup and data directories exist
mkdir -p $BACKUP_DIR
mkdir -p $DATA_DIR

# Run pg_dump and compress the output
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" | gzip >$SQL_BACKUP_FILE
# Check if pg_dump was successful
if [ $? -ne 0 ]; then
  echo "pg_dump failed. Backup aborted."
  exit 1
fi

# Create a backup of the data volume
tar czf $DATA_BACKUP_FILE -C $DATA_DIR .

# Check if tar for data backup was successful
if [ $? -ne 0 ]; then
  echo "Data backup failed. Backup aborted."
  exit 1
fi

# Combine both SQL dump and data volume backup into one compressed file
tar czf $FINAL_BACKUP_FILE -C $BACKUP_DIR $(basename $SQL_BACKUP_FILE) $(basename $DATA_BACKUP_FILE)

# Check if tar for final backup was successful
if [ $? -ne 0 ]; then
  echo "Final backup creation failed."
  exit 1
fi

# Cleanup intermediate files
rm $SQL_BACKUP_FILE $DATA_BACKUP_FILE

echo "Complete backup created at $FINAL_BACKUP_FILE"
