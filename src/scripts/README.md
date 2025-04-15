# Agent Generator Scripts

This directory contains utility scripts for generating and managing D&D character agents.

## Available Scripts

- **agent_generator.js** - Generates new agents based on agent card configurations

## Agent Generator

The agent generator script creates new D&D character agents from agent card configurations. It handles the creation of all necessary files, including the agent implementation, prompt template, and configuration.

### Prerequisites

Make sure you have the required dependencies:

```
npm install commander handlebars
```

### Usage

```
# List all available agent cards
node src/scripts/agent_generator.js list

# Generate an agent from a specific card
node src/scripts/agent_generator.js generate <cardName>
```

### Example

```
# Generate a gnome bard agent
node src/scripts/agent_generator.js generate gnome_bard
```

## Agent Cards

Agent cards are stored in the `/src/agentcards` directory and define the properties of each agent. See the README.md in that directory for details on the agent card structure.

## Templates

The agent generator uses templates from the `/src/templates` directory to create the agent files. See the README.md in that directory for details on how templates work.