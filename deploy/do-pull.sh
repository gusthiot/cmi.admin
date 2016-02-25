#!/bin/bash

set -e -x

cd "$1"
git fetch --all
git reset --hard
git checkout "$2"

