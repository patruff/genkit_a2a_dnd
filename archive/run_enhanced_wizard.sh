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
MCP_ALLOWED_DIR="/mnt/c/Users/patru/anthropicFun"
echo "Using wizard data directory: $MCP_ALLOWED_DIR"

# Make sure directory exists
mkdir -p "$MCP_ALLOWED_DIR" 2>/dev/null || true

# Make sure future.txt exists in the allowed directory
FUTURE_PATH="$MCP_ALLOWED_DIR/future.txt"
echo "Initializing future.txt at $FUTURE_PATH..."
echo "Homie will try to steal Bob's gem tonight!" > "$FUTURE_PATH"

# Ensure all agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo "Agents not running! Starting agents..."
  ./start_a2a_agents.sh &
  AGENTS_PID=$!
  echo "⏳ Waiting for agents to start..."
  sleep 5
fi

# Export environment variable for the scenario script to use
export MCP_ALLOWED_DIR="$MCP_ALLOWED_DIR"

# Run the enhanced wizard scenario
echo "🎭 Starting the enhanced wizard scenario with direct file access..."
node wizard_enhanced_scenario.js

# If we started the agents, stop them
if [ ! -z "$AGENTS_PID" ]; then
  echo "Stopping agent processes..."
  kill $AGENTS_PID 2>/dev/null || true
fi

echo "✨ Scenario completed! The final future can be found at: $FUTURE_PATH"

exit 0