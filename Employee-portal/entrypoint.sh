#!/bin/sh
set -e

# Create necessary directories if they don't exist
mkdir -p /app/staticfiles /app/logs /app/media /app/vector_db

# Ensure proper permissions (world-writable to handle volume mount issues)
chmod -R 777 /app/staticfiles /app/logs /app/media /app/vector_db

# Only run migrations/static collection in the web container
if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
    echo "Applying database migrations..."
    python manage.py migrate --noinput

    echo "Collecting static files..."
    python manage.py collectstatic --noinput --clear
fi

echo "Starting: $*"
exec "$@"