# A2A D&D Fantasy Tavern System

This system creates a virtual D&D tavern called "The Tipsy Gnome" with interactive character agents that can converse with each other, perform actions with real dice rolls, and pursue goals.

## Features

- A tavern server that manages the environment and coordinates characters
- Character agents (Homie the gnome thief, Bob the bartender, and WZA the mind-reading wizard)
- **Interactive Action System with real dice rolls and mechanical outcomes**
- Mind Reading abilities that allow WZA to detect other agents' intentions
- Goal-oriented interactions with skill checks and mid-narrative continuations
- Uses A2A protocol for standardized agent communication

## Characters

1. **Homie the Gnome Thief**
   - A sneaky gnome thief with nimble fingers and lockpicking abilities
   - Often tries to steal valuable items without getting caught
   - Has high Stealth and Sleight of Hand skills

2. **Bob the Bartender**
   - A friendly human bartender who runs The Tipsy Gnome
   - Protects the tavern and its valuable blue gemstone
   - Has high Perception and Insight skills

3. **WZA the Mind-Reading Wizard**
   - A wise wizard who can read the minds of other characters
   - Uses arcane magic to detect malicious intentions
   - Integrates with the tavern server to discover other agents

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

## Running the Wizard Scenario

To see a complete scenario where WZA uses mind reading to detect Homie's plan to steal the gemstone:

```bash
./run_wizard_scenario.sh
```

This script will run through a pre-defined scenario showing:
1. WZA scanning the tavern with mind reading
2. Homie attempting to steal the gemstone
3. Bob defending the tavern
4. All interactions with dice rolls and skill checks

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

## A2A Integration

The system demonstrates several key A2A (Agent-to-Agent) protocol features:

1. **Agent Registration**: Characters register their capabilities via well-known endpoints
2. **Multi-Agent Communication**: Agents interact via standardized JSON-RPC messages
3. **Mind Reading**: WZA discovers other agents using the A2A protocol
4. **Tavern Coordination**: The tavern server manages the shared environment state

---
**NOTE:** 
This is sample code and not production-quality libraries.
---