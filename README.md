# A2A & MCP D&D Fantasy Tavern System

This system creates a virtual D&D tavern called "The Tipsy Gnome" with interactive character agents that can communicate with each other, perform actions, and integrate with the Multi-agent Collaboration Protocol (MCP).

## Features

- A tavern server that manages the environment and coordinates characters
- Character agents (Homie the gnome thief, Bob the bartender, and WZA the wizard)
- **Agent Templating System** for easily creating new D&D character agents
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
    }
  ],
  "metadata": {
    "icon": "🧙‍♂️",
    "theme_color": "#9966CC",
    "display_name": "WZA",
    "mcp": {
      "enabled": true,
      "endpoint": "http://localhost:8080",
      "capabilities": ["filesystem"],
      "tools": [
        {
          "name": "filesystem/readFile",
          "description": "Read content from a file"
        },
        {
          "name": "filesystem/writeFile", 
          "description": "Write content to a file"
        }
      ]
    }
  }
}
```

## Agent Templating System

The system includes a templating system for creating new D&D character agents. This allows you to quickly generate new agents by defining their properties in agent card configurations.

### Location of Templates

Templates are located in the following directories:
- **Agent Templates**: `/src/templates/`
- **Agent Cards**: `/src/agentcards/`
- **Generator Script**: `/src/scripts/agent_generator.js`

### Example Agent Card

Here's an example agent card for a gnome bard:

```json
{
  "agent_id": "pipwick",
  "character": {
    "name": "Pipwick Glitterstring",
    "race": "Gnome",
    "class": "Bard",
    "level": 6,
    "personality": "cheerful and witty",
    "speech_style": "poetic and musical",
    "description": "A Dungeons & Dragons character agent - Pipwick is a cheerful gnome bard who uses music and stories to charm audiences and share valuable information about the world around them.",
    "port": 41249,
    "initial_action": "Pipwick strums a cheerful tune on their lute and gives a little bow",
    "skills": ["Performance", "Persuasion", "History", "Deception", "Insight"],
    "stats": {
      "strength": 8,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 13,
      "wisdom": 10,
      "charisma": 18
    },
    "skills_list": [
      {
        "id": "bardic_performance",
        "name": "Bardic Performance",
        "description": "Can perform music, poetry, and stories that inspire allies and influence others",
        "tags": ["dnd", "bard", "performance", "charisma"],
        "examples": [
          "Can you play a song for us?",
          "Tell us a story about ancient heroes.",
          "Do you know any songs about dragons?"
        ]
      }
    ]
  }
}
```

### Generating a New Agent

To generate a new agent from an agent card:

```bash
# List available agent cards
npm run agent:list

# Generate an agent from a specific card
npm run agent:generate <card_name>

# Example: Generate a gnome bard agent
npm run agent:generate gnome_bard
```

This will:
1. Create a new agent directory with all necessary files
2. Generate the agent implementation based on the template
3. Add an npm script to start the agent

### Running a Generated Agent

After generating an agent, you can start it using:

```bash
# Start a generated agent
npm run start:<agent_id>

# Example: Start the gnome bard agent
npm run start:pipwick
```

For more details on the agent templating system, see the [Agent Templating README](src/README_AGENT_TEMPLATES.md).

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

## Summary of Key Files

### Core Script Files
- `easy_mcp_wizard.sh` - Main launcher for the stdio-based MCP integration (**Recommended**)
- `run_direct_wizard.sh` - Alternative launcher using direct filesystem access
- `run_wizard_scenario.sh` - Basic mind reading scenario
- `start_a2a_agents.sh` - Script to start all A2A agents

### Agent Templating Files
- `/src/templates/` - Templates for agent files
- `/src/agentcards/` - Agent card configurations
- `/src/scripts/agent_generator.js` - Script for generating agents
- `/src/README_AGENT_TEMPLATES.md` - Documentation for the templating system

### Configuration Files
- `easy_mcp_config.json` - Configuration for the stdio-based MCP server
- `mcp_config.json` - Legacy configuration file

### Implementation Files
- `wizard_simple_mcp.js` - Main implementation with stdio-based MCP
- `wizard_direct_scenario.js` - Alternative implementation with direct file access
- `wizard_scenario.js` - Basic mind reading scenario implementation
- `src/mcp-client.js` - General MCP client library

---
**NOTE:** 
This is sample code for demonstration purposes only.
---