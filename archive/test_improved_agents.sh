#!/bin/bash

# Script to test improved character agents with goal-oriented behavior

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "Error: GOOGLE_API_KEY environment variable is not set."
  echo "Please set it using: export GOOGLE_API_KEY=your_api_key_here"
  exit 1
fi

echo "
🎭 TESTING IMPROVED D&D TAVERN AGENTS 🎭
======================================

This script will:
1. Kill any existing agent processes
2. Copy the latest prompt files to the dist directory
3. Start all agents in separate terminals for better visibility
4. Run a test scenario with conflicting goals
"

# Kill any existing processes on these ports
echo "Cleaning up any existing processes..."
kill $(lsof -t -i:41245 -i:41246 -i:41247 2>/dev/null) 2>/dev/null || true
sleep 1

# Copy the latest prompts
echo "Copying latest prompt files..."
mkdir -p dist/agents/dnd dist/agents/bob dist/agents/dndserver
cp src/agents/dnd/dnd_agent.prompt dist/agents/dnd/
cp src/agents/bob/bob_agent.prompt dist/agents/bob/
cp src/agents/dndserver/tavern_server.prompt dist/agents/dndserver/

# Start each agent in a separate terminal for better visibility
echo "Starting agents in separate terminals for better monitoring..."

if command -v gnome-terminal &>/dev/null; then
    # Start with gnome-terminal
    gnome-terminal -- bash -c "echo 'Starting Homie agent...'; node ./dist/agents/dnd/index.js; read -p 'Press enter to close...'"
    sleep 2
    gnome-terminal -- bash -c "echo 'Starting Bob agent...'; node ./dist/agents/bob/index.js; read -p 'Press enter to close...'"
    sleep 2
    gnome-terminal -- bash -c "echo 'Starting Tavern server...'; node ./dist/agents/dndserver/index.js; read -p 'Press enter to close...'"
    sleep 3
elif command -v xterm &>/dev/null; then
    # Fall back to xterm
    xterm -e "echo 'Starting Homie agent...'; node ./dist/agents/dnd/index.js; read -p 'Press enter to close...'" &
    sleep 2
    xterm -e "echo 'Starting Bob agent...'; node ./dist/agents/bob/index.js; read -p 'Press enter to close...'" &
    sleep 2
    xterm -e "echo 'Starting Tavern server...'; node ./dist/agents/dndserver/index.js; read -p 'Press enter to close...'" &
    sleep 3
else
    # Fall back to background processes with log files
    echo "No supported terminal found, running in background mode..."
    node ./dist/agents/dnd/index.js > homie_agent.log 2>&1 &
    HOMIE_PID=$!
    echo "Homie agent started with PID: $HOMIE_PID"
    sleep 2
    
    node ./dist/agents/bob/index.js > bob_agent.log 2>&1 &
    BOB_PID=$!
    echo "Bob agent started with PID: $BOB_PID"
    sleep 2
    
    node ./dist/agents/dndserver/index.js > tavern_server.log 2>&1 &
    TAVERN_PID=$!
    echo "Tavern server started with PID: $TAVERN_PID"
    sleep 3
    
    echo "Agents started in background. Check log files for details."
fi

# Check if services are running
echo "Checking if services are running..."
if nc -z localhost 41245 && nc -z localhost 41246 && nc -z localhost 41247; then
    echo "✅ All services are running!"
    
    # Run a test scenario with conflicting goals
    echo "
🎲 Running test scenario: TAVERN HEIST 🎲
--------------------------------------"
    
    # Enable debug mode for more verbose output
    export DEBUG=true
    
    # Run the scenario with opposing goals
    echo "Starting scenario in 5 seconds..."
    sleep 5
    
    npx tsx src/agents/dndserver/start_scenario.ts "Tavern Heist" \
      --homie "steal the rare gem on display behind the bar without getting caught" \
      --bob "protect the rare gem from thieves at all costs" \
      --maxTurns 4 \
      --time "Late Evening" \
      --atmosphere "Tense and suspicious with few patrons around" \
      --add-object "Rare Gem:A brilliant blue sapphire worth a fortune, displayed prominently behind the bar" \
      --add-object "Display Case:A locked glass case with a complex lock protecting the gem"
    
    echo "
✨ Test completed! ✨

If you started the agents in terminals, they'll continue running until you close them.
If you started them in background mode, here are the PIDs to kill them:
Homie: $HOMIE_PID
Bob: $BOB_PID
Tavern: $TAVERN_PID
"
else
    echo "❌ One or more services failed to start! Check the logs for errors."
fi