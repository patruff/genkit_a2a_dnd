#!/bin/bash

# Script to run a D&D scenario with detailed JSON logging

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "Error: GOOGLE_API_KEY environment variable is not set."
  echo "Please set it using: export GOOGLE_API_KEY=your_api_key_here"
  exit 1
fi

echo "
📊 D&D TAVERN SCENARIO WITH JSON LOGGING 📊
=========================================

This script will:
1. Kill any existing agent processes
2. Rebuild the project with logging enabled
3. Start all necessary services
4. Run a small test scenario with conflicting goals
5. Save and display the JSON communication logs
"

# Ask for confirmation
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Kill any existing processes on these ports
echo "Cleaning up any existing processes..."
kill $(lsof -t -i:41245 -i:41246 -i:41247 2>/dev/null) 2>/dev/null || true
sleep 1

# Rebuild the project
echo "Building the project..."
npm run build

# Make sure logs directory exists
mkdir -p a2a_logs

# Start the servers in the background
echo "Starting Homie the gnome thief agent..."
node ./dist/agents/dnd/index.js > a2a_logs/homie_agent.log 2>&1 &
HOMIE_PID=$!

echo "Starting Bob the bartender agent..."
node ./dist/agents/bob/index.js > a2a_logs/bob_agent.log 2>&1 &
BOB_PID=$!

echo "Starting the tavern server..."
node ./dist/agents/dndserver/index.js > a2a_logs/tavern_server.log 2>&1 &
TAVERN_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 10

# Check if servers are running
if ! nc -z localhost 41245 || ! nc -z localhost 41246 || ! nc -z localhost 41247; then
  echo "Error: One or more servers failed to start."
  cat a2a_logs/homie_agent.log
  cat a2a_logs/bob_agent.log
  cat a2a_logs/tavern_server.log
  kill $HOMIE_PID $BOB_PID $TAVERN_PID 2>/dev/null || true
  exit 1
fi

echo "All servers are running!"

# Run a short test scenario
echo "
Running test scenario with 2 turns per character..."

npx tsx src/agents/dndserver/start_scenario.ts "JSON Test" \
  --homie "steal Bob's prized golden mug" \
  --bob "protect the golden mug at all costs" \
  --maxTurns 2 \
  --add-object "Golden Mug:A valuable mug made of solid gold, sitting on a shelf behind the bar"

# Give some time for logs to be saved
echo "Waiting for logs to be saved..."
sleep 2

# Display the message chain
echo "Displaying JSON message chain..."
npx tsx display_a2a_json_chain.js

# Clean up
echo "Cleaning up processes..."
kill $HOMIE_PID $BOB_PID $TAVERN_PID

echo "
✅ Done! The full JSON logs are available in the a2a_logs directory."