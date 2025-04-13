#!/bin/bash

# MCP Connection Tester
# This script tests if MCP servers are running and accessible

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}MCP Connection Tester${NC}"
echo "====================================="
echo "Testing basic MCP prerequisites..."

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "✅ ${GREEN}Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "❌ ${RED}Node.js is not installed or not in PATH${NC}"
    exit 1
fi

# Check if NPX is installed
if command -v npx &> /dev/null; then
    echo -e "✅ ${GREEN}NPX is installed${NC}"
else
    echo -e "❌ ${RED}NPX is not installed or not in PATH${NC}"
    echo "Try installing it with: npm install -g npx"
    exit 1
fi

# Function to test if a port is in use (likely by an MCP server)
test_port() {
    local port=$1
    local server_name=$2
    
    # Try to connect to the port
    if timeout 2 bash -c "echo > /dev/tcp/localhost/$port" &>/dev/null; then
        echo -e "✅ ${GREEN}Port $port is open - $server_name MCP may be running${NC}"
        return 0
    else
        echo -e "❌ ${RED}Port $port is closed - $server_name MCP may not be running${NC}"
        return 1
    fi
}

# Test common MCP ports
echo -e "\n${YELLOW}Testing common MCP ports...${NC}"
test_port 3000 "Filesystem"
test_port 3001 "Memory"
test_port 3002 "Sequential Thinking"
test_port 8020 "LightRAG"

# Try to run basic MCP server tests
echo -e "\n${YELLOW}Attempting to start test MCP servers...${NC}"

# Test filesystem MCP
echo -e "\n${YELLOW}Testing filesystem MCP...${NC}"
TEST_DIR="/mnt/c/Users/patru/anthropicFun"
if [ -d "$TEST_DIR" ]; then
    echo -e "✅ ${GREEN}Test directory exists: $TEST_DIR${NC}"
    
    # Try to start a filesystem MCP server briefly
    echo "Starting filesystem MCP server for 5 seconds..."
    timeout 5 /home/patruff/.nvm/versions/node/v18.20.7/bin/npx @modelcontextprotocol/server-filesystem "$TEST_DIR" &
    SERVER_PID=$!
    sleep 2
    
    # Check if server is running
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "✅ ${GREEN}Filesystem MCP server started successfully${NC}"
        kill $SERVER_PID
    else
        echo -e "❌ ${RED}Failed to start filesystem MCP server${NC}"
    fi
else
    echo -e "❌ ${RED}Test directory does not exist: $TEST_DIR${NC}"
fi

# General MCP verification
echo -e "\n${YELLOW}Verification steps:${NC}"
echo "1. Ensure claude_desktop_config.json is properly configured"
echo "2. The file should be at: C:\\Users\\patru\\AppData\\Roaming\\Claude\\claude_desktop_config.json"
echo "3. Restart Claude Desktop after making changes"
echo "4. Check Claude Desktop developer tools for errors (press F12)"

echo -e "\n${YELLOW}Manual test in Claude Desktop:${NC}"
echo "Try typing: 'Use the filesystem MCP to list files in my anthropicFun directory'"

echo -e "\n${GREEN}MCP Connection Test Complete${NC}"
