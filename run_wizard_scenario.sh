#!/bin/bash

# Ensure all agents are running
if ! curl -s http://localhost:41245 > /dev/null; then
  echo "Homie agent is not running! Starting agents..."
  ./start_a2a_agents.sh &
  sleep 5
fi

# Run the wizard scenario script
echo "Starting scenario: WZA Mind Reading Adventure"
node wizard_scenario.js

# Handle CTRL+C
trap "echo 'Stopping scenario...'; exit 0" INT