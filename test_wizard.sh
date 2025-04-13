#!/bin/bash

# Test script for the Wizard agent with mind reading capability

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "Error: GOOGLE_API_KEY environment variable is not set."
  echo "Please set it using: export GOOGLE_API_KEY=your_api_key_here"
  exit 1
fi

echo "
🧙 WIZARD MIND READING TEST 🧙
==============================

This script will:
1. Build the project
2. Start all necessary server components including the Wizard
3. Let you interact with the Wizard agent to test mind reading
"

# Kill any existing processes on the ports
echo "Cleaning up any existing processes..."
kill $(lsof -t -i:41245 -i:41246 -i:41247 -i:41248 2>/dev/null) 2>/dev/null || true
sleep 1

# Build the project
echo "Building the project..."
npm run build

# Start the servers in the background
echo "Starting servers in the background..."
node ./dist/agents/dnd/index.js > wizard_test_homie.log 2>&1 &
HOMIE_PID=$!

node ./dist/agents/bob/index.js > wizard_test_bob.log 2>&1 &
BOB_PID=$!

node ./dist/agents/dndserver/index.js > wizard_test_tavern.log 2>&1 &
TAVERN_PID=$!

node ./dist/agents/wizard/index.js > wizard_test_wizard.log 2>&1 &
WIZARD_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 10

# Check if servers are running and report which ones are available
echo "Checking server status..."
if ! nc -z localhost 41245; then
  echo "⚠️ Homie server (port 41245) is not responding"
  SERVER_ISSUE=true
else
  echo "✅ Homie server is running on port 41245"
fi

if ! nc -z localhost 41246; then
  echo "⚠️ Bob server (port 41246) is not responding"
  SERVER_ISSUE=true
else
  echo "✅ Bob server is running on port 41246"
fi

if ! nc -z localhost 41247; then
  echo "⚠️ Tavern server (port 41247) is not responding"
  SERVER_ISSUE=true
else
  echo "✅ Tavern server is running on port 41247"
fi

if ! nc -z localhost 41248; then
  echo "⚠️ Wizard server (port 41248) is not responding"
  SERVER_ISSUE=true
else
  echo "✅ Wizard server is running on port 41248"
fi

if [ "$SERVER_ISSUE" = true ]; then
  echo "Error: One or more servers failed to start."
  echo "Check the log files for more details:"
  echo "- wizard_test_homie.log"
  echo "- wizard_test_bob.log"
  echo "- wizard_test_tavern.log"
  echo "- wizard_test_wizard.log"
  kill $HOMIE_PID $BOB_PID $TAVERN_PID $WIZARD_PID 2>/dev/null || true
  exit 1
fi

echo "All servers are running!"

# Set up the tavern with character goals
echo "Setting up character goals in the tavern..."
curl -s -X POST http://localhost:41247 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tasks/send",
    "params": {
      "id": "task123",
      "message": {
        "role": "user",
        "parts": [{"text": "Set Homie'\''s goal to \"steal the gemstone without being noticed\""}]
      }
    }
  }' > /dev/null

curl -s -X POST http://localhost:41247 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tasks/send",
    "params": {
      "id": "task124",
      "message": {
        "role": "user",
        "parts": [{"text": "Set Bob'\''s goal to \"protect the tavern and its valuables\""}]
      }
    }
  }' > /dev/null

echo "
✅ Setup complete! You can now interact with the Wizard agent using the CLI:

npx tsx src/cli.ts http://localhost:41248

Example commands to try:
- \"What can you tell me about the people in this tavern?\"
- \"Can you read Homie's mind?\"
- \"Read everyone's mind and tell me what they're thinking.\"

To exit, press Ctrl+C.
"

# Keep the script running until user presses Ctrl+C
echo "Press Ctrl+C to stop the servers and exit..."
trap "echo 'Stopping servers...'; kill $HOMIE_PID $BOB_PID $TAVERN_PID $WIZARD_PID 2>/dev/null || true; echo 'Servers stopped.'; exit 0" SIGINT
while true; do
  sleep 1
done