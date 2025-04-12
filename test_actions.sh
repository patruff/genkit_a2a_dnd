#!/bin/bash

# Test script for the new D&D action system

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "Error: GOOGLE_API_KEY environment variable is not set."
  echo "Please set it using: export GOOGLE_API_KEY=your_api_key_here"
  exit 1
fi

echo "
🎲 D&D ACTION SYSTEM TEST 🎲
==========================

This script will:
1. Build the project with the new action system
2. Start all necessary server components
3. Run a heist scenario with action-based skill checks
4. Display the results of the interactions
"

# Kill any existing processes on the ports
echo "Cleaning up any existing processes..."
kill $(lsof -t -i:41245 -i:41246 -i:41247 2>/dev/null) 2>/dev/null || true
sleep 1

# Build the project
echo "Building the project..."
npm run build

# Start the servers in the background
echo "Starting servers in the background..."
node ./dist/agents/dnd/index.js > action_test_homie.log 2>&1 &
HOMIE_PID=$!

node ./dist/agents/bob/index.js > action_test_bob.log 2>&1 &
BOB_PID=$!

node ./dist/agents/dndserver/index.js > action_test_tavern.log 2>&1 &
TAVERN_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 10

# Check if servers are running
if ! nc -z localhost 41245 || ! nc -z localhost 41246 || ! nc -z localhost 41247; then
  echo "Error: One or more servers failed to start."
  kill $HOMIE_PID $BOB_PID $TAVERN_PID 2>/dev/null || true
  exit 1
fi

echo "All servers are running!"

# Run the test scenario
echo "
Running 'The Gem Heist' scenario with action-based skill checks...
"

# Enable detailed logging
export DEBUG=true

# Run in a way that highlights action results
npx tsx src/agents/dndserver/start_scenario.ts "The Gem Heist" \
  --homie "steal the valuable gem from behind the bar" \
  --bob "protect the gem at all costs" \
  --maxTurns 3 \
  --add-object "Rare Gem:A brilliant blue sapphire worth a fortune, displayed on a shelf behind the bar" \
  --add-object "Display Case:A locked glass case protecting the gem, requiring a key or lockpicking to open" \
  --atmosphere "Late night with few patrons, perfect for heist attempts"

echo "
=== DICE ROLL SUMMARY ==="
echo "Extracting dice rolls and action results from interaction..."
grep -E "\[SYSTEM:.*Roll:" action_test_tavern.log | sed 's/.*\[SYSTEM: //g' | sed 's/\]$//g' | sort

echo "
=== ACTION SUCCESS/FAILURE ==="
grep -E "(SUCCESS|FAILURE)" action_test_tavern.log | grep "attempts to" | sort

# Clean up
echo "
Cleaning up processes...
"
kill $HOMIE_PID $BOB_PID $TAVERN_PID

echo "
✅ Test complete! Check the log files for detailed results:
- action_test_homie.log
- action_test_bob.log
- action_test_tavern.log
"