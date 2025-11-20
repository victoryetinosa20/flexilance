#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install project dependencies
pip install -r requirements.txt

# Collect static files for deployment
python flexilance-mvp/manage.py collectstatic --no-input

# Apply database migrations
python flexilance-mvp/manage.py migrate