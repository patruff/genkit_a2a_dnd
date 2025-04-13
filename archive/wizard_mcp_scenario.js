// A script to demonstrate WZA wizard using MCP to access the file system
// and discover the future via future.txt
import fetch from 'node-fetch';
import fs from 'fs/promises';
import chalk from 'chalk';

// Sleep function for pausing between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Color scheme for different agents and protocols
const colors = {
  tavern: chalk.cyan,     // Cyan for tavern server
  homie: chalk.yellow,    // Yellow for Homie
  bob: chalk.blue,        // Blue for Bob
  wza: chalk.magenta,     // Magenta for WZA
  user: chalk.green,      // Green for user commands
  mcp: chalk.red,         // Red for MCP operations
  a2a: chalk.white        // White for A2A operations
};

// Function to make an A2A request
async function sendA2ARequest(baseUrl, message, taskId = null) {
  const requestId = taskId || `task-${Date.now()}`;
  const agentName = getAgentName(baseUrl);
  const color = colors[agentName] || chalk.white;
  
  console.log(color(`\n[${agentName.toUpperCase()} A2A REQUEST] Sending to ${baseUrl}:`));
  console.log(color(JSON.stringify({jsonrpc: '2.0', method: 'tasks/send', params: {id: requestId, message}}, null, 2)));
  
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
    
    console.log(color(`\n[${agentName.toUpperCase()} A2A RESPONSE]:`));
    console.log(color(JSON.stringify(result, null, 2)));
    
    if (result.result?.status?.message?.parts) {
      const textPart = result.result.status.message.parts.find(part => part.text);
      if (textPart) {
        return textPart.text;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error communicating with ${agentName}:`, error);
    return null;
  }
}

// Function to simulate an MCP file system operation
async function simulateMCPFileOperation(operation, params) {
  const color = colors.mcp;
  
  console.log(color(`\n[MCP FILESYSTEM REQUEST] Operation: ${operation}`));
  console.log(color(JSON.stringify(params, null, 2)));
  
  try {
    let result;
    
    // Simulate different file operations
    if (operation === 'readFile') {
      // Check if file exists first
      try {
        await fs.access(params.path);
      } catch (error) {
        // Create the file with initial content if it doesn't exist
        if (params.path.includes('future.txt')) {
          await fs.writeFile(params.path, 'Homie will try to steal Bob\'s gem tonight!');
        }
      }
      
      // Read the file
      const content = await fs.readFile(params.path, 'utf8');
      result = { content };
    } else if (operation === 'writeFile') {
      await fs.writeFile(params.path, params.content);
      result = { success: true, message: 'File written successfully' };
    } else if (operation === 'listFiles') {
      const files = await fs.readdir(params.directory);
      result = { files };
    }
    
    console.log(color(`\n[MCP FILESYSTEM RESPONSE]:`));
    console.log(color(JSON.stringify(result, null, 2)));
    
    return result;
  } catch (error) {
    console.error(`Error in MCP filesystem operation:`, error);
    return { error: error.message };
  }
}

// Helper to get agent name from URL
function getAgentName(url) {
  if (url.includes('41245')) return 'homie';
  if (url.includes('41246')) return 'bob';
  if (url.includes('41247')) return 'tavern';
  if (url.includes('41248')) return 'wza';
  return 'unknown';
}

// Print a scenario step header
function printStepHeader(step, description) {
  console.log('\n' + chalk.bold('='.repeat(80)));
  console.log(chalk.bold(`STEP ${step}: ${description}`));
  console.log(chalk.bold('='.repeat(80)) + '\n');
}

// Run the scenario demonstrating WZA using MCP for filesystem access
async function runScenario() {
  console.log(chalk.bold('\n🔮 STARTING SCENARIO: WZA SEES THE FUTURE WITH MCP 🔮\n'));
  
  // Create the future.txt file directory if it doesn't exist
  const futureDir = './wizard_data';
  try {
    await fs.mkdir(futureDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
  const futurePath = `${futureDir}/future.txt`;
  
  // Step 1: Initialize Agents
  printStepHeader(1, 'Initializing Agents');
  console.log('Checking if agents are running on their respective ports...');
  
  try {
    await Promise.all([
      fetch('http://localhost:41245').catch(() => console.log('Homie agent not responding, will be started by the start_a2a_agents.sh script')),
      fetch('http://localhost:41246').catch(() => console.log('Bob agent not responding, will be started by the start_a2a_agents.sh script')),
      fetch('http://localhost:41248').catch(() => console.log('WZA agent not responding, will be started by the start_a2a_agents.sh script')),
      fetch('http://localhost:41247').catch(() => console.log('Tavern server not responding, will be started by the start_a2a_agents.sh script'))
    ]);
  } catch (error) {
    console.error('Error checking agent availability:', error);
  }
  
  // Step 2: Initialize MCP for the wizard
  printStepHeader(2, 'Initializing MCP for WZA wizard');
  console.log(colors.mcp('Registering filesystem MCP capability for WZA...'));
  console.log(colors.mcp(`Creating future.txt at ${futurePath} for WZA to access...`));
  
  // Create the future.txt file with the initial prophecy
  await simulateMCPFileOperation('writeFile', {
    path: futurePath,
    content: 'Homie will try to steal Bob\'s gem tonight!'
  });
  
  await sleep(1000);
  
  // Step 3: WZA uses MCP to read the future from file
  printStepHeader(3, 'WZA reads the future using MCP');
  
  // First, WZA accesses the filesystem
  console.log(colors.mcp('[Simulated MCP Interaction] WZA accesses the filesystem to read future.txt...'));
  const futureContent = await simulateMCPFileOperation('readFile', {
    path: futurePath
  });
  
  await sleep(1000);
  
  // WZA announces what he read from the future file
  const wzaResponse = await sendA2ARequest('http://localhost:41248', {
    role: 'user',
    parts: [{ text: `You just used your magical powers to see the future. The vision was clear: "${futureContent.content}". Announce what you've seen to the tavern!` }]
  });
  
  await sleep(2000);
  
  // Step 4: Bob reacts to the wizard's prophecy
  printStepHeader(4, 'Bob reacts to WZA\'s prophecy');
  const bobResponse = await sendA2ARequest('http://localhost:41246', {
    role: 'user',
    parts: [{ text: `WZA just announced: "${wzaResponse}". How do you react to this prophecy about Homie trying to steal your gem?` }]
  });
  
  await sleep(2000);
  
  // Step 5: Homie denies the accusation
  printStepHeader(5, 'Homie reacts to being accused');
  const homieResponse = await sendA2ARequest('http://localhost:41245', {
    role: 'user',
    parts: [{ text: `WZA just announced that he can see the future and predicted: "${wzaResponse}". Bob then said: "${bobResponse}". How do you respond to these accusations?` }]
  });
  
  await sleep(2000);
  
  // Step 6: WZA uses MCP to write a new future
  printStepHeader(6, 'WZA changes the future with MCP');
  
  // First, WZA uses the MCP to write to the future.txt file
  console.log(colors.mcp('[Simulated MCP Interaction] WZA accesses the filesystem to update future.txt...'));
  await simulateMCPFileOperation('writeFile', {
    path: futurePath,
    content: 'Bob has protected the gem, Homie does not steal the gem now'
  });
  
  await sleep(1000);
  
  // WZA announces the change in the future
  const wzaFinalResponse = await sendA2ARequest('http://localhost:41248', {
    role: 'user',
    parts: [{ text: `You've used your magical powers to alter the future. You've written a new future that says: "Bob has protected the gem, Homie does not steal the gem now". Announce to everyone that you've changed fate itself!` }]
  });
  
  // Step 7: Tavern concludes the scenario
  printStepHeader(7, 'Tavern announces the conclusion');
  await sendA2ARequest('http://localhost:41247', {
    role: 'user',
    parts: [{ text: `Describe the final scene in the tavern after WZA announced: "${wzaFinalResponse}"` }]
  });
  
  console.log(chalk.bold('\n🔮 THE MCP SCENARIO HAS CONCLUDED 🔮\n'));
  
  // Show the contents of future.txt at the end
  const finalFuture = await simulateMCPFileOperation('readFile', {
    path: futurePath
  });
  
  console.log(chalk.bold(`\nThe final contents of future.txt: "${finalFuture.content}"\n`));
}

// Check if chalk is installed
try {
  if (!chalk) {
    console.error("The chalk package is required for this script. Please install it with 'npm install chalk'");
    process.exit(1);
  }
} catch (error) {
  console.error("The chalk package is required for this script. Please install it with 'npm install chalk'");
  process.exit(1);
}

// Run the scenario
runScenario().catch(error => {
  console.error('Scenario failed:', error);
  process.exit(1);
});