# D&D Agent Templating System

This system allows you to create new D&D character agents using templates and agent cards. You can quickly generate new character agents like gnome bards, human fighters, or any other D&D character type by defining their properties in an agent card configuration.

## System Components

The agent templating system consists of three main components:

1. **Agent Cards**: JSON files that define the properties of a D&D character agent
2. **Templates**: Handlebars templates for generating agent files
3. **Generator Script**: A script that creates new agents from agent cards

## Directory Structure

```
src/
├── agents/               # Generated agents go here
├── agentcards/           # Agent card configurations
│   ├── README.md         # Documentation for agent cards
│   ├── gnome_bard.json   # Example agent card
│   └── human_fighter.json# Example agent card
├── scripts/              # Utility scripts
│   ├── README.md         # Documentation for scripts
│   └── agent_generator.js# Agent generator script
├── templates/            # Template files for agent generation
│   ├── README.md         # Documentation for templates
│   ├── agent_template.prompt    # Prompt template
│   ├── agent_template.ts        # Implementation template
│   └── agent_template_genkit.ts # Genkit configuration template
└── README_AGENT_TEMPLATES.md    # This documentation file
```

## How to Create a New Agent

### Step 1: Define an Agent Card

Create a new JSON file in the `agentcards` directory with the properties of your agent. Use the existing examples as a guide.

Example structure:

```json
{
  "agent_id": "unique_id",
  "character": {
    "name": "Character Name",
    "race": "Human/Gnome/Elf/etc.",
    "class": "Fighter/Wizard/Thief/etc.",
    "level": 5,
    "personality": "brave and bold",
    "speech_style": "confident and direct",
    "description": "A D&D character agent - Details about this character...",
    "port": 41249,
    // Additional character properties...
    "skills_list": [
      // Skills and abilities...
    ]
  }
}
```

### Step 2: Generate the Agent

Run the agent generator script to create a new agent from your agent card:

```bash
node src/scripts/agent_generator.js generate <cardName>
```

For example:

```bash
node src/scripts/agent_generator.js generate gnome_bard
```

### Step 3: Run the Agent

Start your new agent using the automatically created npm script:

```bash
npm run start:<agent_id>
```

For example:

```bash
npm run start:pipwick
```

## Available Agent Cards

You can list all available agent cards with:

```bash
node src/scripts/agent_generator.js list
```

## Customizing Templates

If you need to customize how agents are generated, you can modify the template files in the `templates` directory:

- **agent_template.prompt**: Controls how agent prompts are structured
- **agent_template.ts**: Controls how agent implementations are structured
- **agent_template_genkit.ts**: Controls the Genkit configuration

## Example Agents

The system includes example agent cards for:

1. **Pipwick Glitterstring** (gnome_bard.json) - A cheerful gnome bard who uses music and stories
2. **Thorne Ironheart** (human_fighter.json) - A stoic human fighter with a strict code of honor

## Advanced Usage

For more advanced agent behavior, you can add special abilities, custom action processing, and additional metadata to your agent cards. See the agent card documentation for details.

## Dependencies

The agent generator script requires:

- Node.js
- handlebars
- commander

Install dependencies with:

```bash
npm install handlebars commander
```

## License

This agent templating system is part of the A2A Samples and is subject to the same licensing as the rest of the repository.