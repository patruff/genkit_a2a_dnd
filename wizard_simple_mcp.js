// A script to demonstrate WZA the mind-reading wizard with "future sight" via MCP
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// Sleep function for pausing between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Improved MCP client that uses stdio/pipe communication
class ImprovedMCPClient {
  constructor(command, args, allowedDirectory = null) {
    this.requestId = 1;
    this.command = command;
    this.args = args;
    this.allowedDirectory = allowedDirectory;
    this.process = null;
    this.initialized = false;
    this.messageQueue = [];
    this.serverCapabilities = null;
    this.availableTools = new Set();
  }

  async connect() {
    console.log(`Starting MCP server with command: ${this.command} ${this.args.join(' ')}`);
    console.log('⏳ Waiting for MCP server to start...');

    return new Promise((resolve, reject) => {
      try {
        const spawnOptions = {
          stdio: ['pipe', 'pipe', 'pipe']
        };

        if (this.allowedDirectory) {
          spawnOptions.cwd = this.allowedDirectory;
        }

        this.process = spawn(this.command, this.args, spawnOptions);
        
        this.process.on('error', (error) => {
          console.error(`MCP process error: ${error.message}`);
          reject(error);
        });

        this.process.stderr.on('data', (data) => {
          console.error(`MCP stderr: ${data.toString().trim()}`);
        });

        this.process.stdout.on('data', (data) => {
          const messages = data.toString().split('\n').filter(line => line.trim());
          
          for (const message of messages) {
            try {
              const response = JSON.parse(message);
              
              if (response.id) {
                const pending = this.messageQueue.find(m => m.id === response.id);
                if (pending) {
                  if (response.error) {
                    pending.reject(new Error(response.error.message));
                  } else {
                    pending.resolve(response.result);
                  }
                  this.messageQueue = this.messageQueue.filter(m => m.id !== response.id);
                }
              }
              
              // If this is server initialization information
              if (response.method === "server/ready") {
                console.log("MCP server is ready!");
              }
            } catch (error) {
              // Not JSON or other parsing error, just log the raw message
              console.log(`MCP output: ${message}`);
            }
          }
        });

        // Initialize the session after a short delay to ensure the server is ready
        setTimeout(() => {
          this.initialize()
            .then(() => resolve(this))
            .catch(reject);
        }, 1000);
      } catch (error) {
        console.error(`Failed to start MCP process: ${error.message}`);
        reject(error);
      }
    });
  }

  async initialize() {
    console.log("Initializing MCP session...");
    
    const initMessage = {
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "0.1.0",
        capabilities: {
          tools: {
            call: true,
            list: true
          }
        },
        clientInfo: {
          name: "WZA-Wizard",
          version: "1.0.0"
        }
      },
      id: this.requestId++
    };

    try {
      const response = await this.sendMessage(initMessage);
      
      if (!response || typeof response.protocolVersion !== 'string') {
        throw new Error('Invalid initialization response from server');
      }

      this.serverCapabilities = response.capabilities;
      this.initialized = true;
      
      // Signal we're fully initialized
      await this.sendMessage({
        jsonrpc: "2.0",
        method: "notifications/initialized"
      });
      
      // Get available tools
      await this.updateAvailableTools();
      
      console.log("MCP session initialized successfully");
      return true;
    } catch (error) {
      console.error(`Failed to initialize MCP session: ${error.message}`);
      throw error;
    }
  }

  async updateAvailableTools() {
    try {
      const message = {
        jsonrpc: "2.0",
        method: "tools/list",
        params: {},
        id: this.requestId++
      };

      const response = await this.sendMessage(message);
      if (response && response.tools) {
        this.availableTools = new Set(response.tools.map(tool => tool.name));
        console.log(`Available MCP tools: ${Array.from(this.availableTools).join(', ')}`);
      }
    } catch (error) {
      console.error(`Failed to get available tools: ${error.message}`);
    }
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        return reject(new Error("MCP process not started"));
      }

      // Only track messages with IDs (requests that expect responses)
      if (message.id !== undefined) {
        this.messageQueue.push({
          id: message.id,
          resolve,
          reject
        });
      } else {
        // For notifications with no ID, resolve immediately
        resolve();
      }

      const messageStr = JSON.stringify(message) + '\n';
      this.process.stdin.write(messageStr, (error) => {
        if (error) {
          console.error(`Failed to send message: ${error.message}`);
          reject(error);
        }
      });
    });
  }

  async readFile(filePath) {
    if (!this.initialized) {
      throw new Error("MCP client not initialized");
    }

    try {
      const result = await this.callTool('read_file', { path: filePath });
      return result?.content || null;
    } catch (error) {
      console.error(`MCP read_file failed: ${error.message}`);
      return null;
    }
  }

  async writeFile(filePath, content) {
    if (!this.initialized) {
      throw new Error("MCP client not initialized");
    }

    try {
      const result = await this.callTool('write_file', {
        path: filePath,
        content
      });
      return result?.success || false;
    } catch (error) {
      console.error(`MCP write_file failed: ${error.message}`);
      return false;
    }
  }

  async callTool(toolName, toolArgs) {
    if (!this.initialized) {
      throw new Error("MCP client not initialized");
    }

    if (!this.availableTools.has(toolName)) {
      console.warn(`Warning: Tool '${toolName}' may not be available. Trying anyway...`);
    }

    try {
      const message = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: toolName,
          arguments: toolArgs
        },
        id: this.requestId++
      };

      return await this.sendMessage(message);
    } catch (error) {
      console.error(`Tool call '${toolName}' failed: ${error.message}`);
      throw error;
    }
  }

  async close() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.initialized = false;
    this.availableTools.clear();
    console.log("MCP connection closed");
  }
}

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
  future: {
    name: 'Future',
    color: chalk.red,
    emoji: '🔮'
  },
  mcp: {
    name: 'MCP',
    color: chalk.green,
    emoji: '🔌'
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
  if (!agentInfo || !agentInfo.port) {
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
async function runWizardScenario() {
  console.log(chalk.bold.green('\n🧙‍♂️ WZA THE MIND READING WIZARD WITH MCP FUTURE SIGHT 🧙‍♂️\n'));
  
  // Read configuration from easy_mcp_config.json
  let mcpConfig;
  try {
    const configData = fs.readFileSync('./easy_mcp_config.json', 'utf8');
    mcpConfig = JSON.parse(configData);
    console.log(formatMessage('mcp', 'Configuration loaded from easy_mcp_config.json'));
  } catch (error) {
    console.error(`Error loading MCP configuration: ${error.message}`);
    return;
  }
  
  // Get MCP server configuration
  const fsConfig = mcpConfig.mcpServers?.filesystem;
  if (!fsConfig) {
    console.error('No filesystem MCP configuration found!');
    return;
  }
  
  // Create MCP client and connect
  const mcpClient = new ImprovedMCPClient(
    fsConfig.command,
    fsConfig.args,
    fsConfig.args[2] // The allowed directory is the third argument
  );
  
  try {
    console.log(formatMessage('mcp', 'Connecting to MCP server...'));
    await mcpClient.connect();
    console.log(formatMessage('mcp', 'Connected to MCP server successfully'));
    
    // Get the future file path from MCP config
    const allowedDir = fsConfig.args[2];
    const futurePath = path.join(allowedDir, 'future.txt');
    console.log(formatMessage('future', `Using future file: ${futurePath}`));
    
    // Function to read the future via MCP
    async function readFuture() {
      console.log(formatMessage('future', `Reading future from ${futurePath} via MCP`));
      
      const content = await mcpClient.readFile(futurePath);
      
      if (content) {
        console.log(formatMessage('future', `Future content: ${content}`));
        return content;
      } else {
        console.log(formatMessage('future', `Future file not found or empty, creating default`));
        const defaultContent = "Homie will try to steal Bob's gem tonight!";
        
        await mcpClient.writeFile(futurePath, defaultContent);
        
        return defaultContent;
      }
    }
    
    // Function to change the future via MCP
    async function changeFuture(content) {
      console.log(formatMessage('future', `Changing future to: ${content}`));
      
      const success = await mcpClient.writeFile(futurePath, content);
      
      if (success) {
        console.log(formatMessage('future', `Future successfully changed`));
        return true;
      } else {
        console.error(formatMessage('future', `Failed to change future`));
        return false;
      }
    }
    
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
      parts: [{ text: "[ACTION: READ_MINDS target: \"Homie\"]" }]
    });
    
    await sleep(2000);
    
    // Step 6: WZA looks into the future via MCP
    printStepHeader(6, "WZA sees the future via MCP");
    
    // First ensure future.txt exists with our prediction via MCP
    await changeFuture("Homie will steal Bob's gem tonight while Bob is distracted by a bar fight!");
    
    console.log(chalk.bold("🎲 WZA casts Divination to see the future..."));
    rollDice(); // For dramatic effect
    
    // Now WZA reads the future file via MCP
    const futureContent = await readFuture();
    
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
    
    // Step 10: WZA changes the future via MCP
    printStepHeader(10, "WZA changes the future via MCP");
    
    console.log(chalk.bold("🎲 WZA casts Alter Fate to change the future..."));
    rollDice(); // For dramatic effect
    
    // WZA changes the future by writing to the future file via MCP
    await changeFuture("Homie and Bob become friends, and Homie helps protect the gem from other thieves");
    
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
    const finalFuture = await readFuture();
    console.log(chalk.bold.green(`"${finalFuture}"`));
    console.log(chalk.bold('='.repeat(80)) + '\n');
    
    console.log(chalk.bold.green('\n🎬 THE WIZARD MCP SCENARIO HAS CONCLUDED 🎬\n'));
    
  } catch (error) {
    console.error(`Scenario error: ${error.message}`);
  } finally {
    // Ensure MCP client is closed
    if (mcpClient) {
      await mcpClient.close();
    }
  }
}

// Run the scenario
try {
  console.log(chalk.bold('Starting the WZA scenario with MCP integration...\n'));
  console.log(chalk.bold('This scenario features:'));
  console.log(chalk.bold('- 🧙‍♂️ WZA the mind-reading wizard with future sight'));
  console.log(chalk.bold('- 🍺 Bob the vigilant bartender with his prized gem'));
  console.log(chalk.bold('- 🗡️ Homie the sneaky gnome thief with sticky fingers'));
  console.log(chalk.bold('- 🏠 The Tipsy Gnome tavern setting'));
  console.log(chalk.bold('- 🔌 MCP integration for future-reading capabilities'));
  console.log(chalk.bold('- 🎲 Dice rolls for dramatic effect\n'));
  
  runWizardScenario().catch(error => {
    console.error('Scenario failed:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error starting scenario:', error);
  process.exit(1);
}