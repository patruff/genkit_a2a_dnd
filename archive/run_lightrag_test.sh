#!/bin/bash

# Install required packages if not already installed
if ! npm list node-fetch > /dev/null 2>&1; then
  echo "Installing node-fetch package..."
  npm install node-fetch
fi

if ! npm list chalk > /dev/null 2>&1; then
  echo "Installing chalk package..."
  npm install chalk
fi

if ! npm list uuid > /dev/null 2>&1; then
  echo "Installing uuid package..."
  npm install uuid
fi

echo "Running LightRAG test script..."
node test_lightrag_mcp.js

echo "Test complete"