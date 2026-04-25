#!/bin/sh
set -e
npx tsx migrate.ts
exec npx tsx server/index.ts
