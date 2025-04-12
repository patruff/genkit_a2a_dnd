# The Tipsy Gnome Tavern - DnD Tavern System

This system creates a virtual D&D tavern called "The Tipsy Gnome" with interactive character agents that can converse with each other, perform actions with real dice rolls, and pursue goals.

## Features

- A tavern server that manages the environment and coordinates characters
- Character agents (Homie the gnome thief and Bob the bartender) that roleplay D&D personas
- **Interactive Action System with real dice rolls and mechanical outcomes**
- Goal-oriented interactions with skill checks and mid-narrative continuations
- Persistent state saved to disk between sessions
- Configurable conversation settings (number of turns, etc.)
- Uses A2A protocol for standardized agent communication

## Action System

The D&D Tavern now features a fully interactive action system where:

- Characters can perform actions like stealing, hiding, perceiving, persuading, etc.
- Actions are resolved using real dice rolls with D&D mechanics (not just descriptive text)
- Characters have stats, skills, and modifiers that affect their success chance
- Actions have consequences in the narrative (success/failure changes outcomes)
- Narrative flow includes character reactions to action outcomes

### How Actions Work

1. **Action Format**: Characters use special action tags in their responses:
   ```
   [ACTION: STEAL target: "gem", skill: "Sleight of Hand", difficulty: "hard"]
   ```

2. **Processing Flow**:
   - The system detects action tags in character responses
   - It pauses the narrative at that point
   - It rolls dice and applies appropriate modifiers
   - It determines success/failure based on difficulty class (DC)
   - It generates an outcome description
   - It asks the character to continue the narrative based on the outcome
   - The final narrative includes the original text, action result, and continuation

3. **Available Actions**:
   - STEAL: Attempt to take an item
   - HIDE: Try to conceal yourself
   - DETECT/PERCEPTION: Notice details or threats
   - DECEIVE: Lie or mislead someone
   - PERSUADE: Convince someone to do something
   - INTIMIDATE: Frighten or coerce someone
   - UNLOCK: Pick a lock or open a container
   - ACROBATICS: Perform agile maneuvers
   - ATTACK: Combat actions

4. **Skills and Modifiers**:
   Each character has specific skills with modifiers:
   - Homie: Stealth +6, Sleight of Hand +6, Lockpicking +6, Deception +5, etc.
   - Bob: Perception +3, Insight +3, Persuasion +4, Intimidation +2, etc.

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

3. You'll see Homie attempting to accomplish his goal during the conversation, making appropriate skill checks (like Sleight of Hand) with actual dice rolls and outcomes that affect the narrative flow.

## Running a Test Scenario

The project includes a test script that demonstrates the action system:

```bash
# Make sure the GOOGLE_API_KEY is set
export GOOGLE_API_KEY=your_api_key_here

# Run the test scenario
./test_actions.sh
```

This will:
1. Start all three servers
2. Set up "The Gem Heist" scenario where:
   - Homie's goal is to steal a valuable gem
   - Bob's goal is to protect the gem
3. Run an interaction for several turns
4. Display dice roll results and action outcomes

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

## Technical Implementation

The system uses:
- **gameEngine.ts**: Core dice rolling and skill check mechanics
- **processAction.ts**: Mid-narrative continuation for action reactions
- **types.ts**: TypeScript interfaces for action system
- Google's Gemini model via genkit for AI capabilities
- A2A protocol for standardized agent communication
- TypeScript for type safety and maintainability
- File-based persistence for tavern state

## A2A Integration

The action system integrates with the A2A framework by:
1. Using the standard JSON-RPC protocol for all communications
2. Implementing multi-agent interactions between character agents
3. Handling state persistence across multiple conversation turns
4. Maintaining consistent character personalities and goals
5. Using continuation requests to handle action outcomes