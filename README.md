# A2A & MCP D&D Fantasy Tavern System

This system creates a virtual D&D tavern called "The Tipsy Gnome" with interactive character agents that can converse with each other, perform actions with real dice rolls, and pursue goals.

## Features

- A tavern server that manages the environment and coordinates characters
- Character agents (Homie the gnome thief, Bob the bartender, and WZA the wizard)
- **Interactive Action System with real dice rolls and mechanical outcomes**
- **Mind Reading abilities** that allow WZA to detect other agents via the A2A protocol
- **Future Sight abilities** where WZA uses MCP to access the filesystem
- Goal-oriented interactions with skill checks and mid-narrative continuations
- **Dual protocol integration** combining A2A and MCP for enhanced capabilities

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
    }
  ],
  "metadata": {
    "icon": "🧙‍♂️",
    "theme_color": "#9966CC",
    "display_name": "WZA",
    "mcp": {
      "enabled": true,
      "capabilities": ["filesystem"],
      "tools": [
        {
          "name": "readFile",
          "description": "Read content from a file"
        },
        {
          "name": "writeFile", 
          "description": "Write content to a file"
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

### Mind Reading Scenario

To see a complete scenario where WZA uses mind reading to detect Homie's plan to steal the gemstone:

```bash
./run_wizard_scenario.sh
```

This script will run through a pre-defined scenario showing:
1. WZA scanning the tavern with mind reading
2. Homie attempting to steal the gemstone
3. Bob defending the tavern
4. All interactions with dice rolls and skill checks

### MCP Future-Seeing Scenario

To see WZA using MCP (Multi-agent Collaboration Protocol) to access the filesystem and see the future:

```bash
./run_wizard_mcp.sh
```

This script demonstrates:
1. WZA using MCP to read from future.txt, revealing Homie's plan to steal the gem
2. Bob reacting to the prophecy and taking precautions
3. Homie denying the accusations
4. WZA using MCP to write a new future to the file, changing fate itself

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

### How A2A and MCP Work Together

The combination of A2A and MCP creates a powerful system:

1. **A2A provides agent discovery and communication**:
   - Agents register capabilities through well-known endpoints
   - They communicate via standardized JSON-RPC
   - The tavern server coordinates interactions between agents

2. **MCP provides access to external tools and resources**:
   - MCP lets agents access tools like the filesystem
   - It extends agent capabilities beyond what A2A alone provides
   - The agent card's metadata section declares MCP capabilities

3. **Integration flow**:
   - WZA discovers Homie and Bob via A2A protocol
   - WZA reads their intentions through A2A mind reading
   - WZA accesses future.txt through MCP filesystem capability
   - WZA alters the future by writing to the file via MCP
   - All responses and conversations happen via A2A protocol

This demonstrates how A2A handles communication between agents, while MCP provides specialized tool capabilities that extend what agents can do.

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

---
**NOTE:** 
This is sample code and not production-quality libraries.
---