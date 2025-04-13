#!/bin/bash

# Check for required npm packages
echo "Checking required packages..."
if ! npm list node-fetch > /dev/null 2>&1 || ! npm list chalk > /dev/null 2>&1 || ! npm list uuid > /dev/null 2>&1; then
  echo "Installing required packages..."
  npm install node-fetch chalk uuid
fi

# Create required directories
FUTURE_DIR="/mnt/c/Users/patru/anthropicFun"
echo "Ensuring directory exists: $FUTURE_DIR"
mkdir -p "$FUTURE_DIR" 2>/dev/null || true

# Make sure future.txt exists in the allowed directory
FUTURE_PATH="$FUTURE_DIR/future.txt"
echo "Initializing future.txt at $FUTURE_PATH..."
echo "Homie will try to steal Bob's gem tonight!" > "$FUTURE_PATH" 2>/dev/null

# Check if the MCP server package is installed
echo "Checking MCP server installation..."
if ! which node > /dev/null || ! ls /usr/lib/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js > /dev/null 2>&1; then
  echo "MCP server not found in system directories."
  echo "Installing MCP server globally..."
  sudo npm install -g @modelcontextprotocol/server-filesystem || {
    echo "Failed to install MCP server globally. Using local fallback."
    npm install @modelcontextprotocol/server-filesystem
    # Update config to use local path
    sed -i 's|/usr/lib/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js|./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js|g' mcp_config.json
  }
fi

# Ensure all agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo "Agents not running! Starting agents..."
  ./start_a2a_agents.sh &
  AGENTS_PID=$!
  echo "⏳ Waiting for agents to start..."
  sleep 5
fi

# Run the enhanced wizard scenario
echo "🎭 Starting the wizard scenario with MCP integration..."
node wizard_mcp_scenario_new.js

# If we started the agents, stop them
if [ ! -z "$AGENTS_PID" ]; then
  echo "Stopping agent processes..."
  kill $AGENTS_PID 2>/dev/null || true
fi

echo "✨ Scenario completed! The final future can be found at: $FUTURE_PATH"

exit 0