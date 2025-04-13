# Merlin the Wizard - D&D Character Agent with Mind Reading

This agent implements Merlin, a wise human wizard in a D&D setting who has the special ability to "read minds" of other characters by discovering them through the A2A protocol.

## Features

- **Mind Reading**: Merlin can use arcane powers to perceive the abilities, skills, and goals of other characters
- **Agent Discovery**: Uses the A2A protocol's well-known endpoint (/.well-known/agent.json) to discover other agents
- **In-Character Analysis**: Provides insightful observations about other characters' motivations and capabilities
- **Character Persistence**: Remembers information about previously discovered characters

## How It Works

Merlin uses the A2A protocol's agent discovery mechanism to implement mind reading as a magical ability:

1. **Agent Discovery**: When Merlin receives a mind reading request, he:
   - Maps character names to their agent URLs
   - Sends requests to their /.well-known/agent.json endpoints
   - Retrieves their AgentCard information
   - Parses this information into character insights

2. **Action Format**: Mind reading is triggered using a special action tag:
   ```
   [ACTION: READ_MINDS target: "character name or all"]
   ```

3. **Mind Reading Results**: After processing, Merlin provides insights about:
   - Character abilities and skills
   - Character motivations and goals
   - Potential strategies the character might be employing

## Setting Up

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
   export GOOGLE_API_KEY=your_api_key_here
   ```

### Running the Wizard Agent

You need to run all the agents to test Merlin's mind reading abilities:

1. The easiest way is to use the provided test script:
   ```bash
   ./test_wizard.sh
   ```

   This will start all the agents (Homie, Bob, the Tavern Server, and Merlin).

2. Alternatively, you can manually start each server:
   ```bash
   # Start Homie (gnome thief)
   node ./dist/agents/dnd/index.js
   
   # Start Bob (bartender)
   node ./dist/agents/bob/index.js
   
   # Start the tavern server
   node ./dist/agents/dndserver/index.js
   
   # Start Merlin (wizard)
   node ./dist/agents/wizard/index.js
   ```

3. Connect to Merlin using the CLI:
   ```bash
   npx tsx src/cli.ts http://localhost:41248
   ```

## Example Interactions

- **Reading a specific character's mind**:
  ```
  User: What can you tell me about Homie the gnome thief?
  Merlin: [ACTION: READ_MINDS target: "homie"]
  ```

- **Reading all characters' minds**:
  ```
  User: What can you perceive about everyone in this tavern?
  Merlin: [ACTION: READ_MINDS target: "all"]
  ```

- **Using insights strategically**:
  ```
  User: Based on what you know about Bob and Homie, what should we be wary of?
  ```

## Technical Implementation

The implementation demonstrates:

1. **A2A Protocol Integration**: Uses the standard A2A well-known endpoint to discover agents
2. **Agent Card Usage**: Extracts information from agent cards for in-character use
3. **Multi-Agent Awareness**: Enables agents to be aware of each other's capabilities
4. **Action Processing**: Implements a custom action type (READ_MINDS) with agent discovery

The wizard agent maintains a map of discovered agents, allowing it to remember information about characters it has previously encountered.