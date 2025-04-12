# DnD Tavern Scenario Runner

A tool for easily creating and running custom D&D tavern scenarios with Homie the gnome thief and Bob the bartender.

## Features

- Create custom named scenarios
- Set specific goals for each character
- Configure environmental details (time, atmosphere, objects)
- Adjust the number of conversation turns
- View conversation logs in a readable format

## Setup

Before using the scenario runner, make sure you have the DnD tavern system set up:

1. First build the project:
```bash
npm run build
```

2. Set your Google Gemini API key:
```bash
export GOOGLE_API_KEY=your_api_key_here
```

3. Start the character agent servers in separate terminals:
```bash
# Terminal 1 - Start Homie
node ./dist/agents/dnd/index.js

# Terminal 2 - Start Bob
node ./dist/agents/bob/index.js

# Terminal 3 - Start the tavern server
node ./dist/agents/dndserver/index.js
```

## Using the Scenario Runner

Once all the agents are running, you can use the scenario runner in a new terminal:

```bash
# Basic usage
node ./dist/agents/dndserver/start_scenario.js "Theft Night" --homie "steal Bob's wallet" --bob "catch anyone stealing from him"

# Full example with all options
node ./dist/agents/dndserver/start_scenario.js "Tavern Party" \
  --homie "entertain the crowd with magic tricks" \
  --bob "serve everyone drinks while keeping an eye on his coins" \
  --maxTurns 8 \
  --time "Night" \
  --atmosphere "Festive and loud with music playing" \
  --add-object "Stage:A small wooden platform for performances" \
  --add-object "Crowd:A group of enthusiastic tavern patrons"
```

## Command-line Options

- **Scenario Name** (required): The first argument is the name of your scenario
- **--homie**: Goal for Homie the gnome thief
- **--bob**: Goal for Bob the bartender
- **--maxTurns**: Maximum turns for the interaction (default: 5)
- **--time**: Time of day in the tavern (default: "Evening")
- **--atmosphere**: Tavern atmosphere description (default: "Warm and inviting")
- **--add-object**: Add a custom object to the tavern (format: "Name:Description")

## Example Scenarios

### Theft Attempt

```bash
node ./dist/agents/dndserver/start_scenario.js "Theft Attempt" \
  --homie "steal Bob's wallet without getting caught" \
  --bob "keep the bar running smoothly while being suspicious of Homie" \
  --atmosphere "Somewhat tense with Bob keeping a watchful eye"
```

### Drinking Contest

```bash
node ./dist/agents/dndserver/start_scenario.js "Drinking Contest" \
  --homie "challenge Bob to a drinking contest and try to win" \
  --bob "accept the challenge but water down his own drinks to stay sober" \
  --add-object "Contest Table:A sturdy table set up for the drinking competition" \
  --add-object "Strong Ale:Several mugs of potent dwarven brew"
```

### Adventurer Recruitment

```bash
node ./dist/agents/dndserver/start_scenario.js "Adventurer Recruitment" \
  --homie "convince Bob to join him on a treasure hunt" \
  --bob "listen to the proposal but be skeptical about leaving the tavern" \
  --add-object "Treasure Map:A weathered parchment with a mysterious X marked" \
  --time "Late Night" \
  --atmosphere "Quiet and secretive, perfect for planning adventures"
```

## Viewing Results

The scenario runner will automatically display the conversation between characters after completion. You can also manually check:

- `tavern_state.json`: Contains the current state of the tavern and character goals
- `tavern_log.json`: Contains all conversations and actions that took place

## Programmatic Usage

You can also import the scenario runner functions in your own scripts:

```javascript
import { runScenario } from './start_scenario';

async function myCustomScenario() {
  await runScenario(
    "Custom Scenario", 
    { 
      "Homie": "perform a daring theft", 
      "Bob": "protect his valuables" 
    },
    10, // maxTurns
    "Midnight", // time
    "Dark and mysterious", // atmosphere
    [{ name: "Secret Door", description: "A hidden entrance behind the bar" }]
  );
}

myCustomScenario();
```