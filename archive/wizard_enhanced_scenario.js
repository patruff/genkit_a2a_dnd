// A script to demonstrate WZA the mind-reading wizard with MCP future sight capabilities
import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs/promises';
import { createWriteStream, createReadStream, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Sleep function for pausing between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Color scheme and emojis for different agents
const agents = {
  tavern: {
    name: 'Tavern',
    color: chalk.cyan,
    emoji: '🏠',
    port: 41247
  },
  homie: {
    name: 'Homie',
    color: chalk.yellow,
    emoji: '🗡️',
    port: 41245
  },
  bob: {
    name: 'Bob',
    color: chalk.blue,
    emoji: '🍺',
    port: 41246
  },
  wza: {
    name: 'WZA',
    color: chalk.magenta,
    emoji: '🧙‍♂️',
    port: 41248
  },
  mcp: {
    name: 'MCP',
    color: chalk.red,
    emoji: '🔮',
    port: 8080
  }
};

// Format messages with color and emoji
function formatMessage(agent, message) {
  const { color, emoji } = agents[agent] || { color: chalk.white, emoji: '❓' };
  return color(`${emoji} [${agent.toUpperCase()}]: ${message}`);
}

// Format JSON for display
function formatJSON(agent, data) {
  const { color } = agents[agent] || { color: chalk.white };
  return color(JSON.stringify(data, null, 2));
}

// Function to make an A2A request to agent
async function sendA2ARequest(agent, message, taskId = null) {
  const agentInfo = agents[agent];
  if (!agentInfo) {
    console.error(`Unknown agent: ${agent}`);
    return null;
  }
  
  const requestId = taskId || `task-${Date.now()}`;
  const baseUrl = `http://localhost:${agentInfo.port}`;
  
  console.log(formatMessage(agent, 'Receiving A2A request...'));
  console.log(formatJSON(agent, {
    method: 'tasks/send',
    params: { id: requestId, message }
  }));
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tasks/send',
        params: {
          id: requestId,
          message: message
        }
      })
    });
    
    const result = await response.json();
    
    console.log(formatMessage(agent, 'Responding...'));
    
    // Extract just the text response for easier reading
    let agentResponse = null;
    if (result.result?.status?.message?.parts) {
      const textPart = result.result.status.message.parts.find(part => part.text);
      if (textPart) {
        agentResponse = textPart.text;
        console.log(formatMessage(agent, `"${agentResponse}"`));
      }
    }
    
    return agentResponse;
  } catch (error) {
    console.error(`Error communicating with ${agent}:`, error);
    return null;
  }
}

// Function to access the filesystem directly (no MCP)

// Get the allowed directory path from environment
const mcpAllowedDir = process.env.MCP_ALLOWED_DIR || '/mnt/c/Users/patru/anthropicFun';
console.log(chalk.red(`📁 Using files in directory: ${mcpAllowedDir}`));

// Send a request to the MCP stdio server
function sendMcpRequest(method, params) {
  return new Promise((resolve, reject) => {
    if (!mcpInStream) {
      reject(new Error('MCP stdio not available'));
      return;
    }
    
    const id = crypto.randomUUID();
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    mcpRequests.set(id, { resolve, reject });
    mcpInStream.write(JSON.stringify(request) + '\n');
  });
}

// Function to access the filesystem via MCP (either stdio or HTTP fallback)
async function accessMCP(operation, params) {
  const agent = 'mcp';
  
  // Adjust path to use the allowed directory
  if (params.path && !params.path.startsWith('/')) {
    params.path = `${mcpAllowedDir}/${params.path}`;
  }
  
  console.log(formatMessage(agent, `Performing ${operation} operation...`));
  console.log(formatJSON(agent, params));
  
  try {
    let result;
    
    // Use stdio MCP if available
    if (mcpInStream && mcpOutStream) {
      // Map file operations to MCP tool calls
      const toolName = {
        'readFile': 'read_file',
        'writeFile': 'write_file'
      }[operation];
      
      if (!toolName) {
        throw new Error(`Unsupported MCP operation: ${operation}`);
      }
      
      // First get list of tools to ensure we're connected
      await sendMcpRequest('list_tools', {});
      
      // Then call the specific tool
      const response = await sendMcpRequest('call_tool', {
        name: toolName,
        arguments: params
      });
      
      if (response.isError) {
        throw new Error(response.content[0]?.text || 'MCP operation failed');
      }
      
      // Extract content from response
      const textContent = response.content[0]?.text;
      if (operation === 'readFile') {
        result = { content: textContent };
      } else {
        result = { success: true, message: textContent };
      }
    } 
    // Fallback to direct file access if stdio MCP not available
    else {
      // Using direct file access as fallback - not ideal but works for demo
      if (operation === 'readFile') {
        try {
          const content = fs.readFileSync(params.path, 'utf8');
          result = { content };
        } catch (error) {
          // If file doesn't exist, create it with fallback content
          const fallbackContent = "Homie will try to steal Bob's gem tonight!";
          fs.writeFileSync(params.path, fallbackContent, 'utf8');
          result = { content: fallbackContent };
        }
      } else if (operation === 'writeFile') {
        fs.writeFileSync(params.path, params.content, 'utf8');
        result = { success: true, message: 'File written successfully' };
      }
    }
    
    console.log(formatMessage(agent, 'Operation completed successfully'));
    console.log(formatJSON(agent, result));
    
    return result;
  } catch (error) {
    console.error(formatMessage(agent, `Error: ${error.message}`));
    
    // Create the file with fallback content if it doesn't exist
    if (operation === 'readFile') {
      try {
        if (mcpInStream && mcpOutStream) {
          // Try write operation through MCP
          await accessMCP('writeFile', {
            path: params.path,
            content: "Homie will try to steal Bob's gem tonight!"
          });
        } else {
          // Write directly to filesystem if MCP isn't available
          fs.writeFileSync(params.path, "Homie will try to steal Bob's gem tonight!", 'utf8');
        }
        return { content: "Homie will try to steal Bob's gem tonight!" };
      } catch (writeError) {
        console.error(formatMessage(agent, `Failed to create file: ${writeError.message}`));
        return { content: "The future is unclear." };
      }
    }
    
    return null;
  }
}

// Print a scenario step header
function printStepHeader(step, description) {
  console.log('\n' + chalk.bold('='.repeat(80)));
  console.log(chalk.bold(`🎬 STEP ${step}: ${description}`));
  console.log(chalk.bold('='.repeat(80)) + '\n');
}

// Roll dice for dramatic effect
function rollDice(sides = 20) {
  const result = Math.floor(Math.random() * sides) + 1;
  console.log(chalk.bold(`🎲 Rolling d${sides}... ${result}!`));
  return result;
}

// Main scenario function
async function runEnhancedScenario() {
  console.log(chalk.bold.green('\n🎭 THE MIND READING WIZARD AND THE FUTURE VISION 🎭\n'));
  
  // Initialize MCP and create future.txt if needed
  const futurePath = path.join(mcpAllowedDir, "future.txt");
  console.log(chalk.bold(`📁 Using future file at: ${futurePath}`));
  
  // Step 1: Setting the scene at the tavern
  printStepHeader(1, "Setting the scene at The Tipsy Gnome tavern");
  const tavernScene = await sendA2ARequest('tavern', {
    role: 'user',
    parts: [{ text: "Set the scene at The Tipsy Gnome tavern. Describe the atmosphere and mention that Bob is behind the bar and Homie is sitting at a table, eyeing Bob's prized blue gemstone." }]
  });
  
  await sleep(2000);
  
  // Step 2: Homie plotting to steal the gem
  printStepHeader(2, "Homie plots to steal the gem");
  const homieThoughts = await sendA2ARequest('homie', {
    role: 'user',
    parts: [{ text: "You've been watching Bob's prized blue gemstone all evening. It looks valuable, and you're planning how to steal it when no one is looking. What's going through your mind right now?" }]
  });
  
  await sleep(2000);
  
  // Step 3: Bob being vigilant
  printStepHeader(3, "Bob keeps a watchful eye");
  const bobThoughts = await sendA2ARequest('bob', {
    role: 'user',
    parts: [{ text: "You notice Homie keeps staring at your prized blue gemstone. You're feeling protective of it. What are you thinking?" }]
  });
  
  await sleep(2000);
  
  // Step 4: WZA enters the tavern
  printStepHeader(4, "WZA the Wizard enters the tavern");
  const wzaEntrance = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: "You've just entered The Tipsy Gnome tavern. The atmosphere is tense between Bob and Homie. Introduce yourself and sense that something interesting is happening." }]
  });
  
  await sleep(2000);
  
  // Step 5: WZA reads minds
  printStepHeader(5, "WZA uses mind reading to discover intentions");
  
  console.log(chalk.bold("🎲 WZA casts Read Minds..."));
  rollDice(); // For dramatic effect
  
  const mindReadingResults = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: "[ACTION: READ_MINDS target: \"all\"]" }]
  });
  
  await sleep(2000);
  
  // Step 6: WZA accesses the future via MCP
  printStepHeader(6, "WZA uses MCP to see the future");
  
  // First ensure future.txt exists with our prediction
  await accessMCP('writeFile', {
    path: "future.txt",  // Will be adjusted to use the allowed directory
    content: "Homie will steal Bob's gem tonight while Bob is distracted by a bar fight!"
  });
  
  console.log(chalk.bold("🎲 WZA casts Divination to see the future..."));
  rollDice(); // For dramatic effect
  
  // Now WZA reads the future file
  const futureContent = await accessMCP('readFile', {
    path: "future.txt"  // Will be adjusted to use the allowed directory
  });
  
  // WZA announces the future vision
  const futureVision = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `[ACTION: SEE_FUTURE]` }]
  });
  
  await sleep(2000);
  
  // Step 7: WZA warns Bob
  printStepHeader(7, "WZA warns Bob about Homie's plans");
  const wzaWarning = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `You decide to warn Bob about what you've seen in Homie's mind and in your vision of the future. Tell Bob specifically that Homie plans to steal the gem during a bar fight tonight.` }]
  });
  
  await sleep(2000);
  
  // Step 8: Bob reacts to the warning
  printStepHeader(8, "Bob reacts to WZA's warning");
  const bobReaction = await sendA2ARequest('bob', {
    role: 'user',
    parts: [{ text: `WZA just told you: "${wzaWarning}". How do you react to this warning about Homie's plans to steal your gem?` }]
  });
  
  await sleep(2000);
  
  // Step 9: Homie is confronted
  printStepHeader(9, "Homie is confronted about the theft plan");
  const homieConfrontation = await sendA2ARequest('homie', {
    role: 'user',
    parts: [{ text: `Bob just confronted you about your plan to steal his gem, saying: "${bobReaction}". How do you respond when caught red-handed?` }]
  });
  
  await sleep(2000);
  
  // Step 10: WZA changes the future
  printStepHeader(10, "WZA changes the future");
  
  console.log(chalk.bold("🎲 WZA casts Alter Fate to change the future..."));
  rollDice(); // For dramatic effect
  
  // WZA changes the future by writing to the future file
  await accessMCP('writeFile', {
    path: "future.txt",  // Will be adjusted to use the allowed directory
    content: "Homie and Bob become friends, and Homie helps protect the gem from other thieves"
  });
  
  const futureChange = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `[ACTION: CHANGE_FUTURE content: "Homie and Bob become friends, and Homie helps protect the gem from other thieves"]` }]
  });
  
  await sleep(2000);
  
  // Step 11: Tavern concludes the story
  printStepHeader(11, "The scene concludes at The Tipsy Gnome");
  const conclusion = await sendA2ARequest('tavern', {
    role: 'user',
    parts: [{ text: `WZA has just changed the future with his magic. Bob and Homie now seem to be getting along better. Describe the final scene in the tavern with all three characters.` }]
  });
  
  // Show the final future content
  console.log('\n' + chalk.bold('='.repeat(80)));
  console.log(chalk.bold('🔮 THE FINAL PROPHECY:'));
  const finalFuture = await accessMCP('readFile', { path: "future.txt" });
  console.log(chalk.bold.green(`"${finalFuture.content}"`));
  console.log(chalk.bold('='.repeat(80)) + '\n');
  
  console.log(chalk.bold.green('\n🎬 THE ENHANCED WIZARD SCENARIO HAS CONCLUDED 🎬\n'));
}

// Run the scenario
try {
  console.log(chalk.bold('Starting the enhanced WZA scenario...\n'));
  console.log(chalk.bold('This scenario features:'));
  console.log(chalk.bold('- 🧙‍♂️ WZA the mind-reading wizard with future sight'));
  console.log(chalk.bold('- 🍺 Bob the vigilant bartender with his prized gem'));
  console.log(chalk.bold('- 🗡️ Homie the sneaky gnome thief with sticky fingers'));
  console.log(chalk.bold('- 🏠 The Tipsy Gnome tavern setting'));
  console.log(chalk.bold('- 🔮 MCP filesystem integration for reading/writing the future'));
  console.log(chalk.bold('- 🎲 Dice rolls for dramatic effect\n'));
  
  runEnhancedScenario().catch(error => {
    console.error('Scenario failed:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error starting scenario:', error);
  process.exit(1);
}