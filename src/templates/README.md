# Agent Templates

This directory contains template files used by the agent generator script to create new D&D character agents.

## Templates

- **agent_template.prompt** - Template for agent prompt files
- **agent_template.ts** - Template for agent implementation files
- **agent_template_genkit.ts** - Template for agent Genkit configuration

## How Templates Work

The templates use Handlebars syntax for variable substitution and conditional logic. The agent generator script reads an agent card JSON file, then uses these templates to generate the necessary files for a new agent.

## Customization

You can customize these templates to change how agents are generated. The templates support:

- Variable substitution: `{{variable}}`
- Conditional blocks: `{{#if condition}}...{{/if}}`
- Iteration: `{{#each array}}...{{/each}}`
- Helper functions: `{{#unless @last}}...{{/unless}}`

## Agent File Structure

Each agent consists of the following files:

1. **index.ts** - Main implementation file containing the agent handler, agent card, and server setup
2. **[agent_id]_agent.prompt** - Prompt template defining the agent's personality, abilities, and behavior
3. **genkit.ts** - Genkit configuration for AI model integration
4. **README.md** - Documentation for the agent

## Example

See the example agents in the `src/agents` directory for reference implementations.