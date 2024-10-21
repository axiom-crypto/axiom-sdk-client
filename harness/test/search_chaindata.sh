#!/bin/bash

cd $(git rev-parse --show-toplevel)

cd harness
source .env

node dist/cli/index.js search --rpc-url $RPC_URL_1 --output ./output
# node dist/cli/index.js search --rpc-url $RPC_URL_11155111 --include 5658516,5672778,5672780,5672783,5672787,5675149 --output ./output
