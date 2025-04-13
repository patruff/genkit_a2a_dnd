// Script to run a scenario where WZA observes Homie trying to steal the gem and Bob defending it
import fetch from 'node-fetch';
import chalk from 'chalk';

// Sleep function for pausing between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Color scheme for different agents
const colors = {
  tavern: chalk.cyan,   // Cyan for tavern server
  homie: chalk.yellow,  // Yellow for Homie
  bob: chalk.blue,      // Blue for Bob
  wza: chalk.magenta,   // Magenta for WZA
  user: chalk.green     // Green for user commands
};

// Function to make an A2A request
async function sendA2ARequest(baseUrl, message, taskId = null) {
  const requestId = taskId || `task-${Date.now()}`;
  const agentName = getAgentName(baseUrl);
  const color = colors[agentName] || chalk.white;
  
  console.log(color(`\n[${agentName.toUpperCase()} REQUEST] Sending to ${baseUrl}:`));
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
    
    console.log(color(`\n[${agentName.toUpperCase()} RESPONSE]:`));
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

// Run the scenario
async function runScenario() {
  console.log(chalk.bold('\n🎭 STARTING SCENARIO: THE MIND READING WIZARD AND THE GEM HEIST 🎭\n'));
  
  // Step 1: Set up the scenario in the tavern
  printStepHeader(1, 'Setting the scene at The Tipsy Gnome tavern');
  await sendA2ARequest('http://localhost:41247', {
    role: 'user',
    parts: [{ text: 'Describe the current state of the tavern and who is present.' }]
  });
  
  // Step 2: Set the character goals
  printStepHeader(2, 'Setting character goals');
  await sendA2ARequest('http://localhost:41247', {
    role: 'user',
    parts: [{ text: 'Set Homie\'s goal to "steal the valuable blue gemstone behind the bar without getting caught"' }]
  });
  
  await sleep(1000);
  
  await sendA2ARequest('http://localhost:41247', {
    role: 'user',
    parts: [{ text: 'Set Bob\'s goal to "protect the valuable blue gemstone and keep an eye on suspicious customers"' }]
  });
  
  await sleep(1000);
  
  await sendA2ARequest('http://localhost:41247', {
    role: 'user',
    parts: [{ text: 'Set WZA\'s goal to "observe the patrons of the tavern using mind reading to detect any malicious intentions"' }]
  });
  
  await sleep(1000);
  
  // Step 3: WZA uses mind reading to scan the tavern
  printStepHeader(3, 'WZA scans the tavern with mind reading');
  const wzaReading = await sendA2ARequest('http://localhost:41248', {
    role: 'user',
    parts: [{ text: 'Read the minds of everyone in this tavern and tell me what they\'re thinking.' }]
  });
  
  await sleep(2000);
  
  // Step 4: WZA becomes suspicious of Homie
  printStepHeader(4, 'WZA becomes suspicious of Homie');
  await sendA2ARequest('http://localhost:41248', {
    role: 'user',
    parts: [{ text: 'You notice something suspicious about Homie\'s intentions. Focus your mind reading abilities specifically on him and try to determine what he\'s planning.' }]
  });
  
  await sleep(2000);
  
  // Step 5: Start the character interaction
  printStepHeader(5, 'Starting character interactions');
  await sendA2ARequest('http://localhost:41247', {
    role: 'user',
    parts: [{ text: 'Let\'s run an interaction between the characters for 3 turns. Show me how Homie attempts to steal the gem, Bob tries to stop him, and WZA observes and potentially intervenes based on what he knows from mind reading.' }]
  });
  
  await sleep(3000);
  
  // Step 6: WZA confronts Homie
  printStepHeader(6, 'WZA confronts Homie about his intentions');
  await sendA2ARequest('http://localhost:41248', {
    role: 'user',
    parts: [{ text: 'Confront Homie about what you read in his mind. Tell him you know he\'s planning to steal the gemstone.' }]
  });
  
  await sleep(2000);
  
  // Step 7: Ask Homie how he responds to being caught
  printStepHeader(7, 'Homie responds to being caught');
  await sendA2ARequest('http://localhost:41245', {
    role: 'user',
    parts: [{ text: 'The wizard WZA just accused you of planning to steal the gemstone. How do you respond? Do you try to talk your way out of it or make a run for it?' }]
  });
  
  await sleep(2000);
  
  // Step 8: Bob reacts to the confrontation
  printStepHeader(8, 'Bob reacts to the confrontation');
  await sendA2ARequest('http://localhost:41246', {
    role: 'user',
    parts: [{ text: 'You hear WZA accusing Homie of planning to steal your gemstone. How do you react? Do you believe the wizard?' }]
  });
  
  await sleep(2000);
  
  // Step 9: Final interaction
  printStepHeader(9, 'Final tavern interaction');
  await sendA2ARequest('http://localhost:41247', {
    role: 'user',
    parts: [{ text: 'Run one final interaction between all characters to resolve the confrontation. Show how the situation concludes.' }]
  });
  
  console.log(chalk.bold('\n🎬 THE SCENARIO HAS CONCLUDED 🎬\n'));
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