#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}🧙‍♂️ WZA Wizard with LightRAG MCP Integration 🔌${NC}"
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

if ! npm list uuid > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing uuid package...${NC}"
  npm install uuid
fi

# Check if @modelcontextprotocol/cli is installed
if ! npm list @modelcontextprotocol/cli > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing MCP CLI package...${NC}"
  npm install @modelcontextprotocol/cli
fi

# Determine if running in WSL
if grep -q Microsoft /proc/version; then
  echo -e "${BLUE}Detected Windows Subsystem for Linux (WSL)${NC}"
  IS_WSL=1
else
  IS_WSL=0
fi

# Determine available LightRAG endpoints to try
echo -e "${BLUE}Testing various LightRAG API endpoints...${NC}"
API_ENDPOINTS=(
  "http://0.0.0.0:8020"
  "http://localhost:8020"
  "http://127.0.0.1:8020"
  "http://host.docker.internal:8020"
)

LIGHTRAG_AVAILABLE=0
WORKING_ENDPOINT=""

for endpoint in "${API_ENDPOINTS[@]}"; do
  echo -e "${YELLOW}Trying ${endpoint}/health...${NC}"
  if curl -s "${endpoint}/health" > /dev/null; then
    echo -e "${GREEN}✅ LightRAG API is available at ${endpoint}${NC}"
    LIGHTRAG_AVAILABLE=1
    WORKING_ENDPOINT="${endpoint}"
    break
  else
    echo -e "${YELLOW}⚠️ LightRAG API not available at ${endpoint}${NC}"
  fi
done

if [ $LIGHTRAG_AVAILABLE -eq 0 ]; then
  echo -e "${YELLOW}⚠️ WARNING: LightRAG API doesn't appear to be running on any tested endpoint${NC}"
  echo -e "${YELLOW}The scenario will continue using MCP or simulated responses if needed.${NC}"
else
  echo -e "${GREEN}✅ Using LightRAG API at ${WORKING_ENDPOINT}${NC}"
fi

# Check if an MCP server is defined in mcp_config.json
echo -e "${BLUE}Checking MCP configuration...${NC}"
if grep -q "lightrag" mcp_config.json; then
  echo -e "${GREEN}✅ LightRAG MCP configuration found in mcp_config.json${NC}"
  
  # Extract configured MCP port, defaulting to 8080 if not found
  MCP_PORT=8080
  if grep -q '"port":' mcp_config.json; then
    MCP_PORT=$(grep -o '"port": *[0-9]*' mcp_config.json | head -1 | grep -o '[0-9]*' || echo "8080")
  fi
  echo -e "${BLUE}MCP Port configured as: ${MCP_PORT}${NC}"
  
  # Check if LightRAG MCP server is running on the configured port
  echo -e "${BLUE}Checking if LightRAG MCP server is running...${NC}"
  if ! curl -s "http://0.0.0.0:${MCP_PORT}" > /dev/null; then
    echo -e "${YELLOW}LightRAG MCP server not running. Starting it...${NC}"
    
    # Use npx in the background
    if [ $IS_WSL -eq 1 ]; then
      echo -e "${BLUE}Starting MCP in WSL mode...${NC}"
      # In WSL, we try to use a common configuration that works in this environment
      npx @modelcontextprotocol/cli start --name lightrag --port "${MCP_PORT}" --env "LIGHTRAG_API_URL=${WORKING_ENDPOINT:-http://localhost:8020}" &
    else
      # Regular Linux/Unix environment
      npx @modelcontextprotocol/cli start --name lightrag --port "${MCP_PORT}" --env "LIGHTRAG_API_URL=${WORKING_ENDPOINT:-http://localhost:8020}" &
    fi
    
    MCP_PID=$!
    echo -e "${GREEN}MCP server started with PID ${MCP_PID}${NC}"
    # Give it time to start
    echo -e "${YELLOW}⏳ Waiting for MCP server to start...${NC}"
    sleep 5
  else
    echo -e "${GREEN}✅ LightRAG MCP server is already running on port ${MCP_PORT}${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ No LightRAG MCP configuration found in mcp_config.json${NC}"
  echo -e "${YELLOW}Starting MCP server with default settings...${NC}"
  npx @modelcontextprotocol/cli start --name lightrag --port 8080 --env "LIGHTRAG_API_URL=${WORKING_ENDPOINT:-http://localhost:8020}" &
  MCP_PID=$!
  echo -e "${GREEN}MCP server started with PID ${MCP_PID}${NC}"
  echo -e "${YELLOW}⏳ Waiting for MCP server to start...${NC}"
  sleep 5
fi

# Ensure all A2A agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo -e "${YELLOW}A2A agents not running! Starting agents...${NC}"
  ./start_a2a_agents.sh &
  AGENTS_PID=$!
  echo -e "${YELLOW}⏳ Waiting for agents to start...${NC}"
  sleep 5
fi

# Show summary of available services
echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}SERVICES STATUS SUMMARY:${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Check and display LightRAG API status
for endpoint in "${API_ENDPOINTS[@]}"; do
  if curl -s "${endpoint}/health" > /dev/null; then
    echo -e "${GREEN}✅ LightRAG API: Available at ${endpoint}${NC}"
  else
    echo -e "${YELLOW}⚠️ LightRAG API: Not available at ${endpoint}${NC}"
  fi
done

# Check and display MCP status
if curl -s "http://0.0.0.0:${MCP_PORT:-8080}" > /dev/null; then
  echo -e "${GREEN}✅ LightRAG MCP: Running on port ${MCP_PORT:-8080}${NC}"
else
  echo -e "${YELLOW}⚠️ LightRAG MCP: Not detected on port ${MCP_PORT:-8080}${NC}"
fi

# Check and display A2A agent status
if curl -s http://localhost:41248 > /dev/null; then
  echo -e "${GREEN}✅ WZA Agent: Running on port 41248${NC}"
else
  echo -e "${YELLOW}⚠️ WZA Agent: Not detected${NC}"
fi

if curl -s http://localhost:41245 > /dev/null; then
  echo -e "${GREEN}✅ Homie Agent: Running on port 41245${NC}"
else
  echo -e "${YELLOW}⚠️ Homie Agent: Not detected${NC}"
fi

if curl -s http://localhost:41246 > /dev/null; then
  echo -e "${GREEN}✅ Bob Agent: Running on port 41246${NC}"
else
  echo -e "${YELLOW}⚠️ Bob Agent: Not detected${NC}"
fi

if curl -s http://localhost:41247 > /dev/null; then
  echo -e "${GREEN}✅ Tavern Agent: Running on port 41247${NC}"
else
  echo -e "${YELLOW}⚠️ Tavern Agent: Not detected${NC}"
fi

echo -e "${BLUE}=======================================================${NC}"

# Run the wizard LightRAG MCP scenario
echo -e "${GREEN}🎭 Starting the Wizard Knowledge scenario with LightRAG MCP integration...${NC}"
node wizard_lightrag_mcp_scenario.js

# If we started the agents, stop them
if [ ! -z "$AGENTS_PID" ]; then
  echo -e "${BLUE}Stopping agent processes...${NC}"
  kill $AGENTS_PID 2>/dev/null || true
fi

# If we started the MCP server, stop it
if [ ! -z "$MCP_PID" ]; then
  echo -e "${BLUE}Stopping MCP server...${NC}"
  kill $MCP_PID 2>/dev/null || true
fi

echo -e "${GREEN}✨ Scenario completed!${NC}"

exit 0
