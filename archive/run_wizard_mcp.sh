#!/bin/bash

# Load MCP configuration
MCP_CONFIG="./mcp_config.json"
if [ ! -f "$MCP_CONFIG" ]; then
  echo "Error: MCP configuration file not found at $MCP_CONFIG"
  exit 1
fi

# Start the filesystem MCP server
echo "📁 Starting the filesystem MCP server..."
# Get the command and args from the config file
FILESYSTEM_CMD=$(jq -r '.mcpServers.filesystem.command' $MCP_CONFIG)
FILESYSTEM_ARGS=$(jq -r '.mcpServers.filesystem.args | join(" ")' $MCP_CONFIG)

# Start the MCP server in the background
eval "$FILESYSTEM_CMD $FILESYSTEM_ARGS &"
MCP_PID=$!

# Wait for MCP server to start
echo "⏳ Waiting for MCP server to start..."
sleep 3

# Ensure all agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo "Agents not running! Starting agents..."
  ./start_a2a_agents.sh &
  sleep 5
fi

# Create future.txt if it doesn't exist
FUTURE_PATH="/mnt/c/Users/patru/anthropicFun/future.txt"
if [ ! -f "$FUTURE_PATH" ]; then
  echo "Creating future.txt file..."
  echo "Homie will try to steal Bob's gem tonight!" > "$FUTURE_PATH"
fi

# Run the interactive scenario
echo "🔮 Starting scenario: WZA Sees the Future with Real MCP"
echo ""
echo "WZA will now use the real filesystem MCP to read and write to future.txt"
echo "Located at: $FUTURE_PATH"
echo ""
echo "Let's ask WZA to read the future:"

# First, let's ask WZA to read the future
curl -X POST http://localhost:41248 \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"tasks/send\",
    \"params\": {
      \"id\": \"future-vision-${RANDOM}\",
      \"message\": {
        \"role\": \"user\",
        \"parts\": [{ \"text\": \"[ACTION: SEE_FUTURE]\" }]
      }
    }
  }"

echo -e "\n\nNow, let's ask WZA to change the future:"
sleep 3

# Now, let's ask WZA to change the future
curl -X POST http://localhost:41248 \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 2,
    \"method\": \"tasks/send\",
    \"params\": {
      \"id\": \"change-future-${RANDOM}\",
      \"message\": {
        \"role\": \"user\",
        \"parts\": [{ \"text\": \"[ACTION: CHANGE_FUTURE content: \\\"Bob has protected the gem, Homie does not steal the gem now\\\"]\" }]
      }
    }
  }"

echo -e "\n\nLet's verify the future has changed:"
sleep 3

# Finally, let's verify the future has changed
curl -X POST http://localhost:41248 \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tasks/send\",
    \"params\": {
      \"id\": \"verify-future-${RANDOM}\",
      \"message\": {
        \"role\": \"user\",
        \"parts\": [{ \"text\": \"[ACTION: SEE_FUTURE]\" }]
      }
    }
  }"

echo -e "\n\n🔮 THE MCP SCENARIO HAS CONCLUDED 🔮"
echo -e "\nThe content of future.txt should now be: \"Bob has protected the gem, Homie does not steal the gem now\""
echo -e "\nYou can verify this by checking: $FUTURE_PATH"

# Clean up
echo -e "\nStopping MCP server..."
kill $MCP_PID

exit 0