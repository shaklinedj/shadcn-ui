#!/bin/bash
set -e

# Install dependencies
pnpm install

# Start the dev server in the background
pnpm run dev &
SERVER_PID=$!

# Wait for the server to be ready
sleep 15

# Run the verification script
python jules-scratch/verification/verify_features.py

# Kill the server
kill $SERVER_PID
