#!/bin/bash

# DnD Tavern Demo Scenario
# This script demonstrates how to run a custom D&D scenario

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "Error: GOOGLE_API_KEY environment variable is not set."
  echo "Please set it using: export GOOGLE_API_KEY=your_api_key_here"
  exit 1
fi

echo "
🎲 D&D TAVERN SCENARIO DEMO 🎲
=============================

This script will:
1. Build the project
2. Start all necessary services (in separate logs)
3. Run a custom heist scenario with Homie trying to steal a gem
4. Display the interaction between characters
"

# Ask for confirmation
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Build the project
echo "
🔨 Building the project...
------------------------"
npm run build

# Kill any existing processes on these ports
echo "
🧹 Cleaning up any existing processes...
--------------------------------------"
kill $(lsof -t -i:41245 -i:41246 -i:41247 2>/dev/null) 2>/dev/null || true
sleep 1

# Start the servers with detailed logs
echo "
🚀 Starting servers...
-------------------"

echo "Starting Homie the gnome thief agent..."
node ./dist/agents/dnd/index.js > homie_agent.log 2>&1 &
HOMIE_PID=$!
echo "Homie PID: $HOMIE_PID"

echo "Starting Bob the bartender agent..."
node ./dist/agents/bob/index.js > bob_agent.log 2>&1 &
BOB_PID=$!
echo "Bob PID: $BOB_PID"

echo "Starting the tavern server..."
node ./dist/agents/dndserver/index.js > tavern_server.log 2>&1 &
TAVERN_PID=$!
echo "Tavern PID: $TAVERN_PID"

# Give the servers time to start
echo "
⏳ Waiting for servers to start...
------------------------------"
sleep 10

# Check if servers are running
if ! nc -z localhost 41245 || ! nc -z localhost 41246 || ! nc -z localhost 41247; then
  echo "
❌ ERROR: One or more servers failed to start. Check logs:
  - homie_agent.log
  - bob_agent.log
  - tavern_server.log"
  
  echo "Homie agent log (last 10 lines):"
  tail -n 10 homie_agent.log
  
  echo "Bob agent log (last 10 lines):"
  tail -n 10 bob_agent.log
  
  echo "Tavern server log (last 10 lines):"
  tail -n 10 tavern_server.log
  
  # Clean up
  kill $HOMIE_PID $BOB_PID $TAVERN_PID 2>/dev/null || true
  exit 1
fi

echo "
✅ All servers are running!"

# Run the scenario
echo "
🎭 Running the 'Tavern Heist' scenario...
--------------------------------------"

# Enable debug mode for more verbose output
export DEBUG=true

# Run the scenario with multiple turns
npx tsx src/agents/dndserver/start_scenario.ts "Tavern Heist" \
  --homie "steal a valuable gem hidden behind the bar without being caught" \
  --bob "protect the tavern's valuables from thieves" \
  --maxTurns 4 \
  --time "Midnight" \
  --atmosphere "Dark and quiet with few patrons" \
  --add-object "Gem:A glowing blue gem displayed in a case behind the bar" \
  --add-object "Lockbox:A small metal box with an intricate lock"

# Clean up
echo "
🧹 Cleaning up...
--------------"
kill $HOMIE_PID $BOB_PID $TAVERN_PID

echo "
🎬 Demo completed! 
----------------
You can now run your own scenarios with:
npm run scenario \"Your Scenario\" --homie \"Homie's goal\" --bob \"Bob's goal\"

For more examples, check the SCENARIO_README.md file.
"