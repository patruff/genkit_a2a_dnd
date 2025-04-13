# A2A & MCP D&D Fantasy Tavern System

This system creates a virtual D&D tavern called "The Tipsy Gnome" with interactive character agents that can communicate with each other, perform actions, and integrate with the Multi-agent Collaboration Protocol (MCP).

## Features

- A tavern server that manages the environment and coordinates characters
- Character agents (Homie the gnome thief, Bob the bartender, and WZA the wizard)
- **MCP Integration** allowing WZA to access the filesystem for "Future Sight" capabilities
- **Mind Reading capabilities** that allow WZA to detect other agents via the A2A protocol 
- **Interactive narrative** with dramatic progressions and character development
- **Clean stdio-based MCP implementation** for robust agent-tool integration

## Characters & Agent Cards

Each character in the tavern is implemented as an A2A agent with its own agent card.

### 1. Homie the Gnome Thief

- **Characteristics**:
  - A sneaky gnome thief with nimble fingers and lockpicking abilities
  - Often tries to steal valuable items without getting caught
  - Has high Stealth and Sleight of Hand skills

- **Agent Endpoint**: http://localhost:41245

### 2. Bob the Bartender

- **Characteristics**:
  - A friendly human bartender who runs The Tipsy Gnome
  - Protects the tavern and its valuable blue gemstone
  - Has high Perception and Insight skills
  
- **Agent Endpoint**: http://localhost:41246

### 3. WZA the Wizard

- **Characteristics**:
  - A wise wizard with mystical abilities
  - Uses mind reading (via A2A) to detect malicious intentions
  - Can see and alter the future (via MCP filesystem access)
  
- **Agent Endpoint**: http://localhost:41248
- **Agent Card**:
```json
{
  "name": "WZA",
  "description": "A Dungeons & Dragons character agent - A wise and perceptive wizard with mystical mind reading abilities who can perceive the thoughts and motivations of those around them.",
  "url": "http://localhost:41248",
  "provider": {
    "organization": "A2A Samples"
  },
  "version": "0.2.0",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"],
  "skills": [
    {
      "id": "mind_reading",
      "name": "Mind Reading",
      "description": "Can perceive the motivations, goals, and abilities of other characters",
      "tags": ["dnd", "wizard", "perception", "arcana"],
      "examples": [
        "What can you tell me about the people in this tavern?",
        "Use your mind reading powers on Homie.",
        "What are the motivations of Bob?",
        "Can you read everyone's mind and tell me what they're thinking?",
        "Observe the interactions between the characters and give me your insights."
      ]
    },
    {
      "id": "future_sight",
      "name": "Future Sight",
      "description": "Can see and alter the future through magical means",
      "tags": ["dnd", "wizard", "divination", "prophecy"],
      "examples": [
        "What does the future hold?",
        "Can you predict what will happen tonight?",
        "Look into the future and tell me what you see.",
        "[ACTION: SEE_FUTURE]",
        "[ACTION: CHANGE_FUTURE content: \"A new future vision\"]"
      ]
    },
    {
      "id": "knowledge_retrieval",
      "name": "Magical Knowledge Repository",
      "description": "Can access ancient magical knowledge about artifacts, spells, and lore",
      "tags": ["dnd", "wizard", "arcana", "history", "knowledge"],
      "examples": [
        "What do you know about magical gems?",
        "Tell me about protection spells.",
        "What knowledge do you have about thieves and magical items?",
        "Research the Blue Sapphire of Netheril.",
        "Consult your magical repository about warding spells."
      ]
    }
  ],
  "metadata": {
    "icon": "🧙‍♂️",
    "theme_color": "#9966CC",
    "display_name": "WZA",
    "mcp": {
      "enabled": true,
      "endpoint": "http://localhost:8080",
      "capabilities": ["filesystem", "lightrag"],
      "tools": [
        {
          "name": "filesystem/readFile",
          "description": "Read content from a file"
        },
        {
          "name": "filesystem/writeFile", 
          "description": "Write content to a file"
        },
        {
          "name": "query_rag",
          "description": "Query the knowledge repository"
        },
        {
          "name": "insert_text",
          "description": "Add new knowledge to the repository"
        },
        {
          "name": "clear_rag",
          "description": "Clear the knowledge repository"
        }
      ]
    }
  }
}

## Getting Started

### Prerequisites

1. Node.js installed (v14+ recommended)
2. Google Gemini API key (for the LLM interactions)

### Setup

1. Clone this repository and navigate to the project folder:
   ```bash
   cd /path/to/A2A/samples/js
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

### Running the System

The easiest way to run the system is using the provided script:

```bash
./start_a2a_agents.sh
```

This script will start all agents and the tavern server:
- Homie (Thief) on http://localhost:41245
- Bob (Bartender) on http://localhost:41246
- WZA (Mind Reader) on http://localhost:41248
- The Tipsy Gnome Tavern on http://localhost:41247

## Running the Wizard Scenarios

The system includes multiple wizard scenarios, with the recommended option being the Simple MCP approach.

### Simple MCP Integration (Recommended)

For the best experience combining WZA's mind reading and future sight using stdio-based MCP:

```bash
./easy_mcp_wizard.sh
```

This streamlined scenario uses the MCP stdio protocol directly:

- 🔌 **Native stdio-based MCP** for seamless tool integration
- 🚀 **Self-contained process management** that handles the entire MCP lifecycle
- 🧠 **Clean JSON-RPC implementation** following the MCP specification
- 🪄 **Direct filesystem access** through standard MCP tools
- 🔮 **Future Sight capabilities** via MCP file operations
- 💾 **Simple configuration** with automatic path detection
- ✨ **No external services required**

This scenario provides a focused demonstration of the wizard's key abilities:
1. Mind reading (through A2A protocol)
2. Future sight (through MCP filesystem access)

The script automatically handles launching and configuring the MCP server, communicates via stdio pipes instead of HTTP, and includes comprehensive error handling.

### Direct Access Alternative

If you prefer a simplified approach without MCP, you can use:

```bash
./run_direct_wizard.sh
```

This scenario uses direct filesystem access instead of MCP but provides the same narrative experience with:

- 🎨 **Color-coded output** for each character and protocol
- 🎭 **Character emojis** for visual distinction
- 🎬 **Cinematic step-by-step progression** of the tavern scene
- 🎲 **Dice rolls** for dramatic effect during spell casting
- 🔮 **Future sight capabilities** through direct file operations

### Example Scenario Output

```
🎭 STARTING SCENARIO: THE MIND READING WIZARD AND THE GEM HEIST 🎭

================================================================================
STEP 1: Setting the scene at The Tipsy Gnome tavern
================================================================================

[TAVERN RESPONSE]:
The tavern is warmly lit by the crackling fireplace and strategically placed 
lanterns, creating a cozy atmosphere. The air is thick with the aroma of roasted 
meats, spiced ale, and a hint of woodsmoke.

Bob, the tavern owner and bartender, is behind the bar, polishing mugs and 
vigilantly watching over the valuable blue gemstone displayed behind the bar.

Homie, the gnome thief, is seated at the bar nursing a drink, occasionally 
glancing at the gemstone displayed behind the bar.

WZA, the mind-reading wizard, remains seated quietly in a corner, sipping on 
a drink and observing the scene.

================================================================================
STEP 3: WZA scans the tavern with mind reading
================================================================================

[WZA RESPONSE]:
*I gesture with my hand, subtly channeling arcane energies. My eyes glow faintly 
as I attempt to peer into the minds of everyone present.*

[ACTION: READ_MINDS target: "all"]

"Interesting... Very interesting. I sense Homie is planning something nefarious. 
His thoughts are focused intently on that blue gemstone behind the bar. He's 
calculating the perfect moment to create a distraction and snatch it while Bob 
is occupied."
```

## Action System

The D&D Tavern implements a full action-based system where characters can perform actions with real mechanical outcomes determined by code, not just text descriptions.

### Key Features

- **Real Dice Rolls**: Actions use actual randomized dice rolls with proper D&D mechanics
- **Character Stats**: Characters have attributes and skills that affect their action outcomes
- **Skill Checks**: System performs skill checks with appropriate modifiers and difficulty classes
- **Mid-Narrative Continuation**: Characters react to action outcomes as part of a continuous narrative

### Example Action

When an agent performs an action, they use a special syntax:

```
[ACTION: STEAL target: "gemstone", skill: "Sleight of Hand", difficulty: "hard"]
```

The system then:
1. Rolls a d20 and adds the character's skill modifier
2. Compares the result to the difficulty class (DC)
3. Determines success or failure
4. Sends the outcome back to the agent to continue their narrative

### Available Actions

- STEAL: Attempt to take an item
- HIDE: Try to conceal yourself
- DETECT/PERCEPTION: Notice details or threats
- DECEIVE: Lie or mislead someone
- PERSUADE: Convince someone to do something
- INTIMIDATE: Frighten or coerce someone
- UNLOCK: Pick a lock or open a container
- ACROBATICS: Perform agile maneuvers
- READ_MINDS: WZA's special ability to read intentions

## Protocol Integrations

This system demonstrates the integration of two powerful protocols:

### A2A Integration (Agent-to-Agent Protocol)

The system demonstrates several key A2A protocol features:

1. **Agent Registration**: Characters register their capabilities via well-known endpoints (/.well-known/agent.json)
2. **Multi-Agent Communication**: Agents interact via standardized JSON-RPC messages
3. **Mind Reading**: WZA discovers other agents using the A2A protocol
4. **Tavern Coordination**: The tavern server manages the shared environment state

### MCP Integration (Multi-agent Collaboration Protocol)

The MCP scenario demonstrates how agents can use the Multi-agent Collaboration Protocol:

1. **Filesystem Access**: WZA uses MCP to read and write files on the filesystem
2. **Future Prediction**: The wizard reads prophecies from future.txt via MCP
3. **Fate Alteration**: WZA changes the future by writing new content to the file
4. **Tool Augmentation**: MCP extends agent capabilities beyond their built-in functions

#### MCP Configuration

The system uses a simplified MCP configuration file that defines the filesystem server:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "/home/patruff/.nvm/versions/node/v18.20.7/bin/node",
      "args": [
        "/home/patruff/.nvm/versions/node/v18.20.7/bin/npx",
        "@modelcontextprotocol/server-filesystem",
        "/mnt/c/Users/patru/anthropicFun"
      ]
    }
  }
}
```

This configuration:
1. Specifies the exact path to the node executable
2. Defines the npx command to launch the MCP filesystem server
3. Sets the allowed directory for file operations
4. Is automatically generated with correct paths by the `easy_mcp_wizard.sh` script

### How A2A and MCP Work Together

The system integrates the A2A protocol for agent communication with MCP for tool access:

1. **A2A provides agent discovery and communication**:
   - Agents register capabilities through well-known endpoints
   - Agents interact through standardized JSON-RPC messages
   - The tavern server coordinates interactions between agents

2. **MCP provides access to external tools using stdio**:
   - The system spawns an MCP server subprocess
   - Communication occurs through stdin/stdout pipes
   - JSON-RPC messages follow the MCP protocol specification
   - The MCP client tracks requests and matches responses

3. **Integration flow**:
   - WZA discovers Homie and Bob via A2A protocol
   - WZA reads their intentions through A2A mind reading
   - WZA accesses future.txt through MCP filesystem tools
   - WZA alters the future by writing to the file via MCP
   - The narrative progresses with A2A agent interactions

The implementation demonstrates a clean approach to MCP integration using proper stdio-based communication rather than HTTP endpoints.

## Example MCP Scenario Output

Here's an example of what the MCP scenario looks like when run:

```
🔮 STARTING SCENARIO: WZA SEES THE FUTURE WITH MCP 🔮

================================================================================
STEP 1: Initializing Agents
================================================================================

Checking if agents are running on their respective ports...

================================================================================
STEP 2: Initializing MCP for WZA wizard
================================================================================

Registering filesystem MCP capability for WZA...
Creating future.txt at ./wizard_data/future.txt for WZA to access...

[MCP FILESYSTEM REQUEST] Operation: writeFile
{
  "path": "./wizard_data/future.txt",
  "content": "Homie will try to steal Bob's gem tonight!"
}

[MCP FILESYSTEM RESPONSE]:
{
  "success": true,
  "message": "File written successfully"
}

================================================================================
STEP 3: WZA reads the future using MCP
================================================================================

[Simulated MCP Interaction] WZA accesses the filesystem to read future.txt...

[MCP FILESYSTEM REQUEST] Operation: readFile
{
  "path": "./wizard_data/future.txt"
}

[MCP FILESYSTEM RESPONSE]:
{
  "content": "Homie will try to steal Bob's gem tonight!"
}

[WZA A2A REQUEST] Sending to http://localhost:41248:
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "task-1234567890",
    "message": {
      "role": "user",
      "parts": [
        {
          "text": "You just used your magical powers to see the future. The vision was clear: \"Homie will try to steal Bob's gem tonight!\". Announce what you've seen to the tavern!"
        }
      ]
    }
  }
}

[WZA A2A RESPONSE]:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "task-1234567890",
    "status": {
      "state": "input-required",
      "message": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "*WZA rises dramatically from his seat in the corner, his eyes glowing with an otherworldly blue light. He raises his staff, which begins to emanate arcane symbols that float in the air.*\n\n\"ATTENTION, PATRONS OF THE TIPSY GNOME!\" *his voice resonates with magical authority, causing the ambient conversations to cease immediately.*\n\n\"I have pierced the veil of time itself and glimpsed events yet to unfold. The future has revealed itself to me in no uncertain terms.\" *He points his staff directly at Homie, the gnome thief.*\n\n\"Homie will attempt to steal Bob's precious gem tonight! I have seen it clearly, as if it were happening before my very eyes!\"\n\n*WZA's eyes return to normal as he lowers his staff, the magical symbols fading.*\n\n\"The future can be changed, of course... but only if actions are altered. Bob, consider yourself warned. Homie...\" *he fixes the gnome with a knowing stare* \"...perhaps you might reconsider your plans for this evening?\""
          }
        ]
      }
    }
  }
}

================================================================================
STEP 6: WZA changes the future with MCP
================================================================================

[Simulated MCP Interaction] WZA accesses the filesystem to update future.txt...

[MCP FILESYSTEM REQUEST] Operation: writeFile
{
  "path": "./wizard_data/future.txt",
  "content": "Bob has protected the gem, Homie does not steal the gem now"
}

[MCP FILESYSTEM RESPONSE]:
{
  "success": true,
  "message": "File written successfully"
}

[WZA A2A REQUEST] Sending to http://localhost:41248:
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "task-1234567891",
    "message": {
      "role": "user",
      "parts": [
        {
          "text": "You've used your magical powers to alter the future. You've written a new future that says: \"Bob has protected the gem, Homie does not steal the gem now\". Announce to everyone that you've changed fate itself!"
        }
      ]
    }
  }
}

[WZA A2A RESPONSE]:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "task-1234567891",
    "status": {
      "state": "input-required",
      "message": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "*WZA's eyes begin to glow with intense arcane energy once more. The wizard raises both hands toward the ceiling, causing mystical runes to appear in a circle around him. The air crackles with magical potential.*\n\n\"BEHOLD THE POWER TO ALTER DESTINY ITSELF!\" *he proclaims as the tavern patrons fall silent again, all eyes turning to the spectacle.*\n\n*The runes spinning around WZA begin to shift and change, rearranging themselves into new patterns.*\n\n\"I have reached across the threads of fate and rewoven them to a new design! The future changes before my very eyes!\" *His voice echoes with supernatural resonance.* \"Bob has taken heed of my warning and has protected the gem with additional wards and vigilance. Homie's path has shifted - he will NOT steal the gem tonight!\"\n\n*The magical energy subsides, and WZA lowers his arms as the floating runes fade away.*\n\n\"The currents of destiny now flow in a new direction. What was certain is now impossible. What was written has been unwritten and rewritten by my hand.\" *He looks between Bob and Homie with a satisfied smile.* \"Sometimes, foreknowledge itself is enough to change what is to come.\""
          }
        ]
      }
    }
  }
}

🔮 THE MCP SCENARIO HAS CONCLUDED 🔮

The final contents of future.txt: "Bob has protected the gem, Homie does not steal the gem now"
```

## Summary of Key Files

### Core Script Files
- `easy_mcp_wizard.sh` - Main launcher for the stdio-based MCP integration (**Recommended**)
- `run_direct_wizard.sh` - Alternative launcher using direct filesystem access
- `run_wizard_scenario.sh` - Basic mind reading scenario
- `start_a2a_agents.sh` - Script to start all A2A agents

### Configuration Files
- `easy_mcp_config.json` - Configuration for the stdio-based MCP server
- `mcp_config.json` - Legacy configuration file

### Implementation Files
- `wizard_simple_mcp.js` - Main implementation with stdio-based MCP
- `wizard_direct_scenario.js` - Alternative implementation with direct file access
- `wizard_scenario.js` - Basic mind reading scenario implementation
- `src/lightrag-mcp-client.js` - Library for LightRAG MCP integration
- `src/mcp-client.js` - General MCP client library

---
**NOTE:** 
This is sample code for demonstration purposes only.
---