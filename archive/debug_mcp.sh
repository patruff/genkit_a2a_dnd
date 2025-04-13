#!/bin/bash

# Install required packages if not already installed
if ! npm list uuid > /dev/null 2>&1; then
  echo "Installing uuid package..."
  npm install uuid
fi

# Check if MCP package is installed
if ! npm list @modelcontextprotocol/server-filesystem > /dev/null 2>&1; then
  echo "Installing MCP server-filesystem package..."
  npm install @modelcontextprotocol/server-filesystem
fi

# Create test directory if needed
TEST_DIR="/mnt/c/Users/patru/anthropicFun"
mkdir -p "$TEST_DIR" 2>/dev/null || echo "Note: Could not create $TEST_DIR (this might be fine if it already exists)"

echo "Running MCP debug script..."
node mcp_debug.js

echo "Debug complete"