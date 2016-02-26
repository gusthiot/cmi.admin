#!/bin/sh

# Restore a Mongo dump

[ -z "$1" ] && { echo >&2 "Usage: mongo-restore.sh <dir>"; exit 1 }
dumpdir="$(cd "$1" && pwd)"

docker run -it --link deploy_mongo_1 -v "$dumpdir":/dump --entrypoint=/bin/bash mongo \
  -c "mongorestore --drop -h deploy_mongo_1 -d meteor /dump/meteor"
