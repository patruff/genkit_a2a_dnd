#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}🧙‍♂️ WZA Wizard with Simple MCP Integration 🔌${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Install required packages if not already installed
echo -e "${BLUE}Checking required packages...${NC}"
if ! npm list node-fetch > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing node-fetch package...${NC}"
  npm install node-fetch
fi

if ! npm list chalk > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing chalk package...${NC}"
  npm install chalk
fi

# Set up a future directory within the JS project
FUTURE_DIR="./wizard_data"
echo -e "${BLUE}Checking if directory exists: ${FUTURE_DIR}${NC}"
if [ ! -d "$FUTURE_DIR" ]; then
  echo -e "${YELLOW}Creating directory: ${FUTURE_DIR}${NC}"
  mkdir -p "$FUTURE_DIR" 2>/dev/null || {
    echo -e "${RED}Could not create directory: ${FUTURE_DIR}${NC}"
    echo -e "${YELLOW}Will use default /tmp directory instead${NC}"
    FUTURE_DIR="/tmp"
  }
fi

# Create easy_mcp_config.json with the current node paths
echo -e "${YELLOW}Creating easy_mcp_config.json...${NC}"
cat > easy_mcp_config.json << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "$(which node)",
      "args": [
        "$(which npx)",
        "@modelcontextprotocol/server-filesystem",
        "${FUTURE_DIR}"
      ]
    }
  }
}
EOF

echo -e "${GREEN}Configuration created:${NC}"
cat easy_mcp_config.json

# Create a test future.txt file to verify permissions
echo -e "${BLUE}Testing file write access to ${FUTURE_DIR}/future.txt${NC}"
echo "This is a test" > "${FUTURE_DIR}/future.txt" 2>/dev/null && {
  echo -e "${GREEN}Write test successful!${NC}"
} || {
  echo -e "${RED}Cannot write to ${FUTURE_DIR}/future.txt${NC}"
  echo -e "${YELLOW}Please check permissions${NC}"
}

# Ensure all A2A agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo -e "${YELLOW}A2A agents not running! Starting agents...${NC}"
  ./start_a2a_agents.sh &
  AGENTS_PID=$!
  echo -e "${YELLOW}⏳ Waiting for agents to start...${NC}"
  sleep 5
fi

# Run the wizard scenario
echo -e "${GREEN}🎭 Starting the Wizard scenario with stdio-based MCP integration...${NC}"
echo -e "${YELLOW}Note: The MCP server is now managed directly by the scenario script${NC}"
node wizard_simple_mcp.js

# If we started the agents, stop them
if [ ! -z "$AGENTS_PID" ]; then
  echo -e "${BLUE}Stopping agent processes...${NC}"
  kill $AGENTS_PID 2>/dev/null || true
fi

echo -e "${GREEN}✨ Scenario completed!${NC}"
echo -e "${BLUE}The future.txt file can be found at: ${FUTURE_DIR}/future.txt${NC}"

exit 0