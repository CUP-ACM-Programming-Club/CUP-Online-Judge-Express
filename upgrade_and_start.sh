#!/bin/bash
git fetch --all && git reset --hard origin/typescript && npm i && npm run build && npm restart && npm run websocket:restart
