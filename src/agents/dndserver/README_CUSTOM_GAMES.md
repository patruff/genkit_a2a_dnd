# Custom DnD Games with A2A Agents

This guide explains how to set up and run custom Dungeons & Dragons scenarios using the A2A agent framework. You'll be able to create custom scenarios with specific character goals and watch how agents interact.

## Overview

The DnD tavern system consists of:

1. **Homie the Gnome Thief** - A cheerful gnome thief character agent
2. **Bob the Bartender** - A friendly human bartender character agent
3. **The Tipsy Gnome Tavern Server** - Manages the environment and coordinates interactions
4. **Scenario Runner** - Our new tool for creating custom scenarios easily

## Setup

### Prerequisites

- Node.js installed (v14+ recommended)
- Google Gemini API key (for the LLM interactions)

### Getting Started

1. Set your Google Gemini API key:
   ```bash
   # Linux/macOS
   export GOOGLE_API_KEY=your_api_key_here
   
   # Windows (PowerShell)
   $env:GOOGLE_API_KEY="your_api_key_here"
   ```

2. Navigate to the project folder:
   ```bash
   cd /path/to/A2A/samples/js
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start all services using our convenience script:
   ```bash
   ./start_dnd_services.sh
   ```
   
   This will start Homie, Bob, and the tavern server in the background with proper logging.

## Creating Custom Scenarios

Once the services are running, you can create and run custom scenarios using our new scenario runner:

```bash
# Basic example
npm run scenario "Theft Night" --homie "steal Bob's wallet" --bob "catch anyone stealing from him"
```

### Available Options

- **Scenario Name** (required): The first argument is the name of your scenario
- **--homie**: Goal for Homie the gnome thief
- **--bob**: Goal for Bob the bartender
- **--maxTurns**: Maximum turns for the interaction (default: 5)
- **--time**: Time of day in the tavern (default: "Evening")
- **--atmosphere**: Tavern atmosphere description (default: "Warm and inviting")
- **--add-object**: Add a custom object to the tavern (format: "Name:Description")

## Example Custom Scenarios

### 1. Heist Night

```bash
npm run scenario "Heist Night" \
  --homie "steal a valuable gem hidden behind the bar" \
  --bob "protect the tavern's valuables from thieves" \
  --time "Midnight" \
  --atmosphere "Dark and quiet with few patrons" \
  --add-object "Gem:A glowing blue gem displayed in a case behind the bar" \
  --add-object "Lockbox:A small metal box with an intricate lock"
```

### 2. Tavern Celebration

```bash
npm run scenario "Tavern Celebration" \
  --homie "win a drinking contest and impress the crowd" \
  --bob "organize the best tavern celebration ever" \
  --time "Night" \
  --atmosphere "Festive, loud with music and laughter" \
  --add-object "Band:A small group of musicians playing lively tunes" \
  --add-object "Contest Table:A table set up for drinking competitions" \
  --maxTurns 10
```

### 3. Secret Mission

```bash
npm run scenario "Secret Mission" \
  --homie "deliver a secret message to Bob without anyone noticing" \
  --bob "identify the spy in the tavern" \
  --time "Evening" \
  --atmosphere "Tense and suspicious, with patrons eyeing each other" \
  --add-object "Sealed Letter:A mysterious envelope with unknown contents" \
  --add-object "Suspicious Patrons:Several cloaked figures watching from the corners"
```

## Viewing Results

After running a scenario, you'll see the conversation output in your terminal. You can also examine the state files:

- `tavern_state.json`: Contains the current tavern state and character goals
- `tavern_log.json`: Contains all conversations and actions

## Advanced Usage: Scripting Multiple Scenarios

You can create a script to run multiple scenarios in sequence:

```javascript
// save as run_multiple_scenarios.js
import { runScenario } from './src/agents/dndserver/start_scenario.js';

async function runMultipleScenarios() {
  // First scenario
  await runScenario(
    "Robbery Attempt", 
    { "Homie": "steal Bob's gold", "Bob": "defend the tavern's treasure" },
    5
  );
  
  // Second scenario
  await runScenario(
    "Friendly Rivalry", 
    { "Homie": "challenge Bob to a game of dice", "Bob": "win the game but not be too smug about it" },
    5
  );
  
  // Third scenario with custom environment
  await runScenario(
    "Mysterious Visitor", 
    { "Homie": "eavesdrop on Bob's conversation with a hooded stranger", "Bob": "keep a secret meeting private" },
    8,
    "Midnight",
    "Dark and mysterious with fog seeping under the door",
    [{ name: "Hooded Stranger", description: "A mysterious figure in a dark cloak seated in the corner" }]
  );
}

runMultipleScenarios().catch(console.error);
```

Run it with:
```bash
node run_multiple_scenarios.js
```

## Troubleshooting

- **Agents not responding**: Ensure all three servers are running (check the logs)
- **Connection errors**: Make sure ports 41245, 41246, and 41247 are not in use
- **API errors**: Verify your GOOGLE_API_KEY is set correctly
- **Scenario not starting**: Check the logs for errors in the background processes

## How It Works

The scenario runner:
1. Initializes a new tavern state with your scenario details
2. Sets the specified goals for each character
3. Configures the environment (time, atmosphere, objects)
4. Starts an interaction with your specified number of turns
5. Displays the resulting conversation

The agents use the goals you set to guide their behavior during the interaction, making decisions and taking actions that align with those goals.

## Extending the System

You can modify `start_scenario.ts` to add more features:
- Add more character types
- Implement dice rolls and skill checks for specific actions
- Create branching scenarios based on character successes or failures
- Add inventory management for objects

For more advanced customization, see the agent code in the `dnd` and `bob` directories.