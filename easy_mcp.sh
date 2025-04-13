#!/bin/bash

# Path to your local MCP configuration
CONFIG_FILE="./local_config_mcp.json"

# Read the MCP server configuration
COMMAND=$(jq -r '.mcpServers.filesystem.command' $CONFIG_FILE)
ARGS=$(jq -r '.mcpServers.filesystem.args | join(" ")' $CONFIG_FILE)

# Print the command that will be executed
echo "Starting MCP server with command: $COMMAND $ARGS"

# Execute the command
$COMMAND $ARGS
