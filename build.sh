#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install project dependencies
pip install -r requirements.txt

# Apply database migrations
python flexilance-mvp/manage.py migrate