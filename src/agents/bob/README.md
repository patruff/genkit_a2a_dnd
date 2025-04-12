# Bob the Bartender - DnD Character Agent

This agent implements a Dungeons & Dragons character - Bob, a friendly human bartender at The Tipsy Gnome tavern, with a wealth of knowledge about local gossip and a few stories from his former adventuring days.

## Features

- Roleplays as Bob the bartender in D&D adventures
- Serves virtual drinks and food to patrons
- Shares gossip and rumors from around town
- Tells stories from his adventuring days
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
   node ./dist/agents/bob/index.js
   ```

4. The agent will be available at http://localhost:41246

## Usage

You can interact with Bob using any A2A client by connecting to the agent's endpoint. Example prompts:

- "What drinks do you have on tap today?"
- "Have you heard any interesting rumors lately?"
- "Tell me about your adventuring days, Bob."
- "Who are the regulars at this tavern?"
- "Got any advice for a new adventurer in these parts?"
- "What's the story behind this tavern's name?"

## Character Details

Bob is a 45-year-old Human Commoner (Bartender) with the following stats:
- STR: 12
- DEX: 10
- CON: 14
- INT: 11
- WIS: 13
- CHA: 15

His personality traits include being friendly, attentive, a good listener, knowledgeable about local gossip, and a former adventurer.

## Technical Implementation

The agent uses:
- Google's Gemini model via genkit
- A2A protocol for standardized agent communication
- Custom prompt engineering to maintain character voice and abilities

For more information on the A2A protocol, see the main project README.