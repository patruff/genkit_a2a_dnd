#!/bin/bash

# Start all A2A agents and the tavern server in the background
echo "Starting Homie the Gnome Thief..."
node dist/agents/dnd/index.js > homie.log 2>&1 &
HOMIE_PID=$!

echo "Starting Bob the Bartender..."
node dist/agents/bob/index.js > bob.log 2>&1 &
BOB_PID=$!

echo "Starting WZA (Mind Reader)..."
node dist/agents/wizard/index.js > wza.log 2>&1 &
WZA_PID=$!

echo "Starting The Tipsy Gnome Tavern Server..."
node dist/agents/dndserver/index.js > tavern.log 2>&1 &
TAVERN_PID=$!

echo "All agents and tavern server started!"
echo "- Homie (Thief) on http://localhost:41245"
echo "- Bob (Bartender) on http://localhost:41246"
echo "- WZA (Mind Reader) on http://localhost:41248"
echo "- The Tipsy Gnome Tavern on http://localhost:41247"
echo
echo "Press Ctrl+C to stop all services"

# Wait for user to press Ctrl+C
trap "echo 'Stopping all services...'; kill $HOMIE_PID $BOB_PID $WZA_PID $TAVERN_PID; exit 0" INT
wait