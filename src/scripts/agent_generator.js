#!/usr/bin/env node

/**
 * Agent Generator Script
 * 
 * This script generates a new agent based on an agent card configuration.
 * It creates all the required files for an agent using templates.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const AGENTCARDS_DIR = path.join(__dirname, '..', 'agentcards');
const AGENTS_DIR = path.join(__dirname, '..', 'agents');

// Import commander for CLI
import { program } from 'commander';

/**
 * Load an agent card from the agentcards directory
 */
async function loadAgentCard(cardName) {
  try {
    const cardPath = path.join(AGENTCARDS_DIR, `${cardName}.json`);
    const cardContent = await fs.readFile(cardPath, 'utf8');
    return JSON.parse(cardContent);
  } catch (error) {
    console.error(`Error loading agent card ${cardName}:`, error.message);
    throw error;
  }
}

/**
 * Process template string with provided data
 */
function processTemplate(template, data) {
  // Simple implementation to replace placeholders with actual values
  let result = template;
  
  // For {{role "system"}} which needs to be preserved
  result = result.replace(/{{"{{"}}role "system"{{"}}"}}/, '{{role "system"}}');
  
  // Helper function to get nested properties
  const getNestedValue = (obj, path) => {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  };
  
  // Replace all %%variable%% occurrences
  result = result.replace(/%%([^%]+)%%/g, (match, path) => {
    const value = getNestedValue(data, path.trim());
    if (value === undefined) return match;
    return value;
  });
  
  // Handle conditional blocks (very basic implementation)
  result = result.replace(/{{#if ([^}]+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
    const value = getNestedValue(data, condition.trim());
    return value ? content : '';
  });
  
  // Handle each loops (very basic implementation)
  result = result.replace(/{{#each ([^}]+)}}([\s\S]*?){{\/each}}/g, (match, arrayPath, template) => {
    const array = getNestedValue(data, arrayPath.trim());
    if (!Array.isArray(array)) return '';
    
    return array.map((item, index) => {
      let itemContent = template;
      
      // Replace {{this}} with the current item
      if (typeof item === 'object') {
        // For objects, stringify them and remove quotes
        Object.entries(item).forEach(([key, value]) => {
          const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
          itemContent = itemContent.replace(new RegExp(`{{this\\.${key}}}`, 'g'), valueStr);
        });
      } else {
        itemContent = itemContent.replace(/{{this}}/g, item);
      }
      
      // Handle last item conditionals
      itemContent = itemContent.replace(/{{#unless @last}}([\s\S]*?){{\/unless}}/g, (m, content) => {
        return index === array.length - 1 ? '' : content;
      });
      
      return itemContent;
    }).join('');
  });
  
  return result;
}

/**
 * Load a template file
 */
async function loadTemplate(templateName) {
  try {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    return templateContent;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error.message);
    throw error;
  }
}

/**
 * Generate the default character object based on agent card
 */
function generateDefaultCharacter(card) {
  const characterData = card.character;
  
  // Default character template for the prompt
  const defaultCharacter = {
    name: characterData.name,
    race: characterData.race,
    class: characterData.class,
    level: characterData.level,
    stats: characterData.stats,
    skills: characterData.skills
  };
  
  // Format for JavaScript object representation in index.ts
  return JSON.stringify(defaultCharacter, null, 2);
}

/**
 * Generate agent files based on templates and agent card
 */
async function generateAgent(card) {
  const agentId = card.agent_id;
  const agentDir = path.join(AGENTS_DIR, agentId);
  
  try {
    // Create agent directory if it doesn't exist
    await fs.mkdir(agentDir, { recursive: true });
    
    // Load templates
    const promptTemplateContent = await loadTemplate('agent_template.prompt');
    const indexTemplateContent = await loadTemplate('agent_template.ts');
    const genkitTemplateContent = await loadTemplate('agent_template_genkit.ts');
    
    // Combine agent card data with agent_id
    const templateData = {
      ...card,
      agent_id: agentId
    };

    // Add default character to template data if not present
    if (!templateData.character.default_character) {
      templateData.character.default_character = generateDefaultCharacter(card);
    }
    
    // Generate skills list code for the agent card
    let skillsCode = '';
    if (card.character.skills_list && card.character.skills_list.length > 0) {
      skillsCode = card.character.skills_list.map(skill => {
        // Generate examples array
        const examplesCode = skill.examples?.length > 0 
          ? skill.examples.map(ex => `"${ex}"`).join(', ')
          : '';
        
        // Generate tags array
        const tagsCode = skill.tags?.length > 0
          ? skill.tags.map(tag => `"${tag}"`).join(', ')
          : '';
        
        return `{
      id: "${skill.id}",
      name: "${skill.name}",
      description: "${skill.description}",
      tags: [${tagsCode}],
      examples: [${examplesCode}]
    }`;
      }).join(',\n    ');
    }
    
    // Process templates
    let promptContent = processTemplate(promptTemplateContent, templateData);
    let indexContent = processTemplate(indexTemplateContent, templateData);
    const genkitContent = processTemplate(genkitTemplateContent, templateData);
    
    // Fix the %%now%% variable in the prompt file
    promptContent = promptContent.replace('The current time is: %%now%%', 
      'The current time is: {{now}}');
    
    // Replace the skills placeholder in the index.ts file
    indexContent = indexContent.replace('skills: [\n    // Replace this with actual skills from the agent card\n  ]', 
      skillsCode ? `skills: [\n    ${skillsCode}\n  ]` : 'skills: []');
    
    // Write files
    await fs.writeFile(path.join(agentDir, `${agentId}_agent.prompt`), promptContent);
    await fs.writeFile(path.join(agentDir, 'index.ts'), indexContent);
    await fs.writeFile(path.join(agentDir, 'genkit.ts'), genkitContent);
    
    // Create a README.md file
    const readme = `# ${card.character.name}

${card.character.description}

## Character Details

- **Race:** ${card.character.race}
- **Class:** ${card.character.class}
- **Level:** ${card.character.level}

## Running this Agent

Start the agent server:

\`\`\`
npm run start:${agentId}
\`\`\`

This will start the agent on port ${card.character.port}.
`;
    
    await fs.writeFile(path.join(agentDir, 'README.md'), readme);
    
    // Add script to package.json
    await addPackageScript(agentId, card.character.port);
    
    console.log(`Successfully generated agent ${card.character.name} (${agentId})!`);
    console.log(`Agent files created in ${agentDir}`);
    console.log(`Added start script: npm run start:${agentId}`);
    
    return {
      agentId,
      name: card.character.name,
      port: card.character.port
    };
  } catch (error) {
    console.error(`Error generating agent ${agentId}:`, error.message);
    throw error;
  }
}

/**
 * Add a start script to package.json
 */
async function addPackageScript(agentId, port) {
  try {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Add or update the start script
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts[`start:${agentId}`] = `npx tsx src/agents/${agentId}/index.ts`;
    
    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log(`Added script to package.json: start:${agentId}`);
  } catch (error) {
    console.error('Error updating package.json:', error.message);
    console.error('You will need to manually add the start script to package.json');
  }
}

/**
 * List all available agent cards
 */
async function listAgentCards() {
  try {
    const files = await fs.readdir(AGENTCARDS_DIR);
    const cardFiles = files.filter(file => file.endsWith('.json'));
    
    if (cardFiles.length === 0) {
      console.log('No agent cards found in', AGENTCARDS_DIR);
      return [];
    }
    
    console.log('Available agent cards:');
    
    const cards = [];
    for (const file of cardFiles) {
      const cardName = path.basename(file, '.json');
      if (cardName !== 'README') {
        try {
          const card = await loadAgentCard(cardName);
          console.log(`- ${cardName}: ${card.character.name} (${card.character.race} ${card.character.class})`);
          cards.push({
            name: cardName,
            card
          });
        } catch (error) {
          console.error(`  Error reading ${file}: ${error.message}`);
        }
      }
    }
    
    return cards;
  } catch (error) {
    console.error('Error listing agent cards:', error.message);
    return [];
  }
}

// CLI setup
program
  .name('agent-generator')
  .description('Generate a new D&D agent from an agent card')
  .version('1.0.0');

program
  .command('list')
  .description('List all available agent cards')
  .action(async () => {
    await listAgentCards();
  });

program
  .command('generate <cardName>')
  .description('Generate an agent from the specified agent card')
  .action(async (cardName) => {
    try {
      console.log(`Generating agent from card: ${cardName}`);
      const card = await loadAgentCard(cardName);
      await generateAgent(card);
    } catch (error) {
      console.error('Agent generation failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('create <name>')
  .description('Create a new agent card interactively')
  .action((name) => {
    console.log(`Creating a new agent card: ${name}`);
    console.log('This feature is not yet implemented.');
    console.log('Please create agent card files manually in the agentcards directory.');
  });

// Parse command line args
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}