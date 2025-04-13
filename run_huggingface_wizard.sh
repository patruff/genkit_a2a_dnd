#!/bin/bash
# Script to run the Hugging Face wizard agent with the DnD characters

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "Error: GOOGLE_API_KEY environment variable is not set."
  echo "Please set it using: export GOOGLE_API_KEY=your_api_key_here"
  exit 1
fi

# Navigate to the correct directory
cd "$(dirname "$0")"

# Build the project first
echo "Building the project..."
npm run build

# Function to wait for server to be ready
wait_for_server() {
  local port=$1
  local server_name=$2
  local log_file=$3
  local max_attempts=30
  local attempts=0
  
  echo "Waiting for $server_name to start on port $port..."
  
  while ! nc -z localhost $port && [ $attempts -lt $max_attempts ]; do
    sleep 1
    ((attempts++))
    echo -n "."
  done
  
  if [ $attempts -lt $max_attempts ]; then
    echo " $server_name is ready!"
    return 0
  else
    echo " $server_name failed to start after ${max_attempts}s"
    echo "Last 10 lines of log file:"
    tail -n 10 "$log_file"
    return 1
  fi
}

# Start the DnD agents first
echo "Starting Homie the gnome thief agent..."
node ./dist/agents/dnd/index.js > homie_agent.log 2>&1 &
HOMIE_PID=$!

# Wait for Homie to be ready before starting Bob
wait_for_server 41245 "Homie agent" "homie_agent.log" || { kill $HOMIE_PID; exit 1; }

echo "Starting Bob the bartender agent..."
node ./dist/agents/bob/index.js > bob_agent.log 2>&1 &
BOB_PID=$!

# Wait for Bob to be ready before starting the tavern server
wait_for_server 41246 "Bob agent" "bob_agent.log" || { kill $HOMIE_PID; kill $BOB_PID; exit 1; }

echo "Starting the tavern server..."
node ./dist/agents/dndserver/index.js > tavern_server.log 2>&1 &
TAVERN_PID=$!

# Wait for the tavern server to be ready
wait_for_server 41247 "Tavern server" "tavern_server.log" || { kill $HOMIE_PID; kill $BOB_PID; kill $TAVERN_PID; exit 1; }

# Now start the Hugging Face Wizard Agent
echo "Starting the Hugging Face Wizard Agent..."
node ./dist/agents/wizard/index.js > wizard_huggingface.log 2>&1 &
WIZARD_PID=$!

# Wait for Wizard to be ready
wait_for_server 41248 "Hugging Face Wizard" "wizard_huggingface.log" || { kill $HOMIE_PID; kill $BOB_PID; kill $TAVERN_PID; kill $WIZARD_PID; exit 1; }

echo ""
echo "All services are running!"
echo "Homie agent (PID: $HOMIE_PID) - http://localhost:41245"
echo "Bob agent (PID: $BOB_PID) - http://localhost:41246"
echo "Tavern server (PID: $TAVERN_PID) - http://localhost:41247"
echo "Hugging Face Wizard (PID: $WIZARD_PID) - http://localhost:41248"
echo ""
echo "You can now run the tests with:"
echo "1. Basic wizard discovery:"
echo "   node --loader ts-node/esm test_wizard_discovery.js"
echo ""
echo "2. Hugging Face wizard features:"
echo "   node --loader ts-node/esm test_wizard_huggingface.js"
echo ""
echo "3. DnD integration test (recommended):"
echo "   node --loader ts-node/esm test_wizard_dnd_integration.js"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C to kill all background processes
trap "echo 'Stopping all services...'; kill $HOMIE_PID $BOB_PID $TAVERN_PID $WIZARD_PID; exit 0" INT

# Keep the script running
wait