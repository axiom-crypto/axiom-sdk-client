#!/bin/bash

cd $(git rev-parse --show-toplevel)

cd harness
source .env

node dist/cli/index.js search --provider $PROVIDER_URI_1 --output ./output
# node dist/cli/index.js search --provider $PROVIDER_URI_11155111 --include 5658516,5672778,5672780,5672783,5672787,5675149 --output ./output
# node dist/cli/index.js search --provider $PROVIDER_URI_84532 --include 8285121 --output ./output
# node dist/cli/index.js search --provider $PROVIDER_URI_8453 --include 13006428 --output ./output
