#!/bin/sh
set -e
# Apply migrations, seed if empty, then start the server.
node /app/node_modules/prisma/build/index.js migrate deploy
node prisma/seed.mjs || true
exec node server.js
