#!/bin/bash

# Install required packages if not already installed
echo "Checking required packages..."
if ! npm list node-fetch > /dev/null 2>&1; then
  echo "Installing node-fetch package..."
  npm install node-fetch
fi

if ! npm list chalk > /dev/null 2>&1; then
  echo "Installing chalk package..."
  npm install chalk
fi

# Check if LightRAG is running
echo "Checking if LightRAG API is available..."
if ! curl -s http://localhost:8020/health > /dev/null; then
  echo "⚠️ WARNING: LightRAG API doesn't appear to be running on http://localhost:8020"
  echo "The scenario will continue but without the knowledge repository features."
  echo "Start the LightRAG server if you want the full experience."
else
  echo "✅ LightRAG API is available"
fi

# Ensure all agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo "Agents not running! Starting agents..."
  ./start_a2a_agents.sh &
  AGENTS_PID=$!
  echo "⏳ Waiting for agents to start..."
  sleep 5
fi

# Run the wizard LightRAG scenario
echo "🎭 Starting the Wizard Knowledge scenario with LightRAG integration..."
node wizard_lightrag_scenario.js

# If we started the agents, stop them
if [ ! -z "$AGENTS_PID" ]; then
  echo "Stopping agent processes..."
  kill $AGENTS_PID 2>/dev/null || true
fi

echo "✨ Scenario completed!"

exit 0