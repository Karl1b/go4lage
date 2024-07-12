#!/bin/bash

# Check if at least one argument was provided
if [ "$#" -eq 0 ]; then
    $"goose"
    echo "Add the goose command from above: $0 <goose_command>"
    exit 1
fi

source ../../../.env
export GOOSE_DRIVER=$GOOSE_DRIVER
export GOOSE_DBSTRING=$GOOSE_DBSTRING
goose_command= goose $1

echo $goose_command
$goose_command
