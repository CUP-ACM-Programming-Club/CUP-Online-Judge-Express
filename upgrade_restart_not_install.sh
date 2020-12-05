#!/bin/bash
git fetch --all && git reset --hard origin/typescript && npm run build && npm restart && npm run websocket:restart
