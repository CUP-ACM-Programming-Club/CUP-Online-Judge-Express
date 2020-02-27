#!/bin/bash
git fetch --all
git reset --hard origin/typescript
npm i
tsc
npm restart
npm run websocket:restart
