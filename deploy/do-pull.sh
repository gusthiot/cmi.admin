#!/bin/bash

set -e -x

cd "$1"
git fetch --all --tags
git reset --hard
git checkout "$2"

