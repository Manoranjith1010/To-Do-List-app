#!/bin/sh
set -e

# Apply any pending database migrations before the API starts.
echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting API..."
exec "$@"
