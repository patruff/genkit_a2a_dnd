# Homie the Gnome Thief - DnD Character Agent

This agent implements a Dungeons & Dragons character - a cheerful gnome thief named Homie who specializes in lockpicking, stealth, and getting into (and occasionally out of) trouble.

## Features

- Roleplays as Homie the gnome thief in D&D adventures
- Maintains character stats and abilities
- Responds to requests for skill checks, ability rolls, etc. 
- Stays in character with a light-hearted, mischievous tone
- Uses A2A protocol for smooth integration with A2A clients

## Setup

1. Make sure you have the required dependencies installed:
   ```
   npm install
   ```

2. Generate an API key for Google Gemini API and set it as `GOOGLE_API_KEY` environment variable

3. Run the agent:
   ```
   npm run build
   node ./dist/agents/dnd/index.js
   ```

4. The agent will be available at http://localhost:41245

## Usage

You can interact with Homie using any A2A client by connecting to the agent's endpoint. Example prompts:

- "Homie, we need to sneak into the castle. What's your plan?"
- "Can you check for traps in this dungeon corridor?"
- "There's a locked chest in front of us. Can you help us open it?"
- "What should we do about the guards up ahead?"
- "Tell us about your backstory, Homie."
- "Roll a stealth check to avoid detection."

## Character Details

Homie is a level 5 Gnome Thief with the following stats:
- STR: 8
- DEX: 16
- CON: 10
- INT: 14
- WIS: 12
- CHA: 15

His strongest skills include Stealth, Lockpicking, Sleight of Hand, Deception, and Acrobatics.

## Technical Implementation

The agent uses:
- Google's Gemini model via genkit
- A2A protocol for standardized agent communication
- Custom prompt engineering to maintain character voice and abilities

For more information on the A2A protocol, see the main project README.