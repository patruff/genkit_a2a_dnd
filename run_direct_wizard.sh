#!/bin/bash

# Check if npm packages are installed
echo "Checking required packages..."
if ! npm list chalk > /dev/null 2>&1; then
  echo "Installing chalk package..."
  npm install chalk
fi

if ! npm list node-fetch > /dev/null 2>&1; then
  echo "Installing node-fetch package..."
  npm install node-fetch
fi

# Create a directory for the wizard data if needed
FUTURE_DIR="/mnt/c/Users/patru/anthropicFun"
echo "Using future directory: $FUTURE_DIR"

# Try to create directory if it doesn't exist
mkdir -p "$FUTURE_DIR" 2>/dev/null || true

# Make sure future.txt exists in the allowed directory
FUTURE_PATH="$FUTURE_DIR/future.txt"
echo "Initializing future.txt at $FUTURE_PATH..."
echo "Homie will try to steal Bob's gem tonight!" > "$FUTURE_PATH" 2>/dev/null || {
  echo "Warning: Could not write to $FUTURE_PATH, using local wizard_data directory instead."
  FUTURE_DIR="./wizard_data"
  mkdir -p "$FUTURE_DIR"
  FUTURE_PATH="$FUTURE_DIR/future.txt"
  echo "Homie will try to steal Bob's gem tonight!" > "$FUTURE_PATH"
}

# Ensure all agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo "Agents not running! Starting agents..."
  ./start_a2a_agents.sh &
  AGENTS_PID=$!
  echo "⏳ Waiting for agents to start..."
  sleep 5
fi

# Export environment variable for the scenario script to use
export MCP_ALLOWED_DIR="$FUTURE_DIR"

# Run the enhanced wizard scenario
echo "🎭 Starting the wizard scenario with direct file access..."
node wizard_direct_scenario.js

# If we started the agents, stop them
if [ ! -z "$AGENTS_PID" ]; then
  echo "Stopping agent processes..."
  kill $AGENTS_PID 2>/dev/null || true
fi

echo "✨ Scenario completed! The final future can be found at: $FUTURE_PATH"

exit 0