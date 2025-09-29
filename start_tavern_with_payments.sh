#!/bin/bash

# D&D Tavern with Solana Payments Startup Script

echo "🏰 Starting The Tipsy Gnome Tavern with Solana Payment Integration 🏰"
echo "=================================================================="

# Check if required dependencies are installed
echo "📦 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables for Solana
export A2P_NETWORK="devnet"
export A2P_RPC_URL="https://api.devnet.solana.com"

echo "🔗 Solana Network: $A2P_NETWORK"
echo "🌐 RPC Endpoint: $A2P_RPC_URL"

# Build the project
echo "🔨 Building the project..."
npm run build

# Start the MCP server for Solana payments (in background)
echo "🚀 Starting Solana MCP service..."
npx @a2p-protocol/mcp-service &
MCP_PID=$!

# Wait a moment for MCP to start
sleep 3

# Start the tavern server (DnD server)
echo "🏰 Starting The Tipsy Gnome tavern server..."
npm run agents:dndserver &
TAVERN_PID=$!

# Wait a moment for tavern to start
sleep 2

# Start Bob the Bartender
echo "🍺 Starting Bob the Bartender..."
npm run agents:bob &
BOB_PID=$!

# Wait a moment
sleep 2

# Start Homie the Gnome Thief
echo "🧙‍♂️ Starting Homie the Gnome Thief..."
npm run agents:dnd &
HOMIE_PID=$!

# Wait a moment
sleep 2

# Start WZA the Wizard
echo "🔮 Starting WZA the Wizard..."
npm run agents:wizard &
WZA_PID=$!

# Wait for all services to start
sleep 5

echo ""
echo "🎉 The Tipsy Gnome Tavern is now open for business! 🎉"
echo "=================================================="
echo ""
echo "🏰 Tavern Server: http://localhost:41247"
echo "🍺 Bob the Bartender: http://localhost:41246"
echo "🧙‍♂️ Homie the Gnome Thief: http://localhost:41245"
echo "🔮 WZA the Wizard: http://localhost:41248"
echo ""
echo "💰 Solana Payment Features:"
echo "  • Phantom wallet integration for all characters"
echo "  • SOL payments for drinks and services"
echo "  • Blockchain-based pickpocketing (Homie's specialty)"
echo "  • Mystical payment channels (WZA's magic)"
echo ""
echo "🎮 Try these commands:"
echo "  • Ask Homie to pay Bob for drinks"
echo "  • Have WZA buy a mystical ale"
echo "  • Let Homie 'redistribute' some wealth"
echo "  • Check wallet balances and transaction history"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down The Tipsy Gnome..."
    kill $MCP_PID $TAVERN_PID $BOB_PID $HOMIE_PID $WZA_PID 2>/dev/null
    echo "👋 Thanks for visiting The Tipsy Gnome! Come back soon!"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait