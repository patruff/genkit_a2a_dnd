# The Tipsy Gnome Tavern - DnD Tavern System

This system creates a virtual D&D tavern called "The Tipsy Gnome" with interactive character agents that can converse with each other and pursue goals.

## Features

- A tavern server that manages the environment and coordinates characters
- Character agents (Homie the gnome thief and Bob the bartender) that roleplay D&D personas
- Goal-oriented interactions with skill checks and dice rolls
- Persistent state saved to disk between sessions
- Configurable conversation settings (number of turns, etc.)
- Uses A2A protocol for standardized agent communication

## Step-by-Step Setup

### Prerequisites

1. Node.js installed (v14+ recommended)
2. Google Gemini API key (for the LLM interactions)

### Initial Setup

1. Clone the A2A repository and navigate to the project folder:
   ```bash
   cd /path/to/A2A
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Set your Google Gemini API key as an environment variable:
   ```bash
   # Linux/macOS
   export GOOGLE_API_KEY=your_api_key_here
   
   # Windows (Command Prompt)
   set GOOGLE_API_KEY=your_api_key_here
   
   # Windows (PowerShell)
   $env:GOOGLE_API_KEY="your_api_key_here"
   ```

### Running the System

You need to run three separate servers (one for each character agent and one for the tavern server):

1. Start Homie the gnome thief agent (in a terminal):
   ```bash
   node ./dist/agents/dnd/index.js
   ```
   This will start Homie's agent server on port 41245.

2. Start Bob the bartender agent (in a new terminal):
   ```bash
   node ./dist/agents/bob/index.js
   ```
   This will start Bob's agent server on port 41246.

3. Start the tavern server (in a third terminal):
   ```bash
   node ./dist/agents/dndserver/index.js
   ```
   This will start the tavern server on port 41247.

All three servers must be running simultaneously for the system to work.

### Using the System

You can interact with the tavern using any A2A client. For testing, you can use curl commands:

```bash
# Example: Check what's happening in the tavern
curl -X POST http://localhost:41247 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tasks/send",
    "params": {
      "id": "task123",
      "message": {
        "role": "user",
        "parts": [{"text": "What is happening in the tavern right now?"}]
      }
    }
  }'
```

## Using Character Goals

One of the key features is setting goals for characters and watching them work toward these goals:

1. Set a goal for Homie:
   ```bash
   curl -X POST http://localhost:41247 \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tasks/send",
       "params": {
         "id": "task123",
         "message": {
           "role": "user",
           "parts": [{"text": "Set Homie'\''s goal to \"steal Bob'\''s wallet\""}]
         }
       }
     }'
   ```

2. Run an interaction between the characters:
   ```bash
   curl -X POST http://localhost:41247 \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tasks/send",
       "params": {
         "id": "task123",
         "message": {
           "role": "user",
           "parts": [{"text": "Let them talk"}]
         }
       }
     }'
   ```

3. You'll see Homie attempting to accomplish his goal during the conversation, making appropriate skill checks (like Sleight of Hand).

## Common Commands

- "What's happening in the tavern right now?"
- "Let Homie and Bob have a conversation."
- "Set max turns to 3." (Configures how many turns each character gets)
- "Tell me about The Tipsy Gnome tavern."
- "Run an interaction between the characters."
- "Who's currently in the tavern?"
- "Set Homie's goal to 'steal Bob's wallet'"
- "Give Bob goal as 'tell a story about dragons'"

## State Management

The tavern server maintains two state files in the working directory:

- `tavern_state.json`: Contains the current tavern state, including character goals
- `tavern_log.json`: Contains a record of all conversations and actions

These files are saved automatically after each interaction and when the server is shut down.

## Troubleshooting

- If an agent fails to start, check that the required port (41245, 41246, or 41247) is not in use
- If the characters don't interact, ensure all three servers are running
- Check the console logs for each server to identify issues
- Verify your GOOGLE_API_KEY is correctly set and valid

## Technical Implementation

The system uses:
- Google's Gemini model via genkit for AI capabilities
- A2A protocol for standardized agent communication
- TypeScript for type safety and maintainability
- File-based persistence for tavern state