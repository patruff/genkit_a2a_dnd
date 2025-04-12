import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TavernState, TavernLog } from './types.js';

// URL of the tavern server
const TAVERN_URL = 'http://localhost:41247';

// Path to state and log files
const STATE_FILE_PATH = path.join(process.cwd(), 'tavern_state.json');
const LOG_FILE_PATH = path.join(process.cwd(), 'tavern_log.json');

// Default state to start from
const DEFAULT_TAVERN_STATE: TavernState = {
  name: "The Tipsy Gnome",
  time: "Evening",
  atmosphere: "Warm and inviting",
  characters: [
    {
      name: "Homie",
      type: "gnome thief",
      description: "A cheerful gnome thief with nimble fingers and a mischievous smile",
      status: "present"
    },
    {
      name: "Bob",
      type: "human bartender",
      description: "A friendly middle-aged human with a hearty laugh who keeps the tavern running",
      status: "tending bar"
    }
  ],
  objects: [
    { name: "Bar", description: "A long wooden counter with several stools" },
    { name: "Fireplace", description: "A stone hearth with a crackling fire" },
    { name: "Tables", description: "Several wooden tables scattered throughout the room" },
    { name: "Drinks", description: "Various mugs, glasses and bottles of beverages" }
  ],
  events: [],
  lastUpdated: new Date().toISOString(),
  metadata: {
    characterGoals: {}
  }
};

// Empty log to start from
const EMPTY_LOG: TavernLog = {
  conversations: [],
  actions: [],
  timestamps: []
};

/**
 * Send a request to the tavern server
 */
async function sendTavernRequest(message: string): Promise<any> {
  try {
    const taskId = `task_${Date.now()}`;
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "tasks/send",
      params: {
        id: taskId,
        message: {
          role: "user",
          parts: [{ text: message }]
        }
      }
    };
    
    console.log(`📤 Sending request to tavern: "${message}" (TaskID: ${taskId})`);
    
    const response = await fetch(TAVERN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Type check for error response
    if (responseData && typeof responseData === 'object' && 'error' in responseData) {
      throw new Error(`Tavern server returned an error: ${JSON.stringify((responseData as any).error)}`);
    }
    
    // Add some debug level logging for checking responses
    if (process.env.DEBUG === 'true') {
      console.log(`📥 Received response for "${message}":`, JSON.stringify(responseData, null, 2));
    }
    
    return responseData;
  } catch (error) {
    console.error('\n⚠️ Error sending request to tavern:', error);
    throw error;
  }
}

/**
 * Initialize a new tavern scenario
 */
async function initializeScenario(
  scenarioName: string, 
  time: string = "Evening", 
  atmosphere: string = "Warm and inviting",
  additionalObjects: Array<{name: string, description: string}> = []
): Promise<void> {
  try {
    // Create a new state with the scenario details
    const newState: TavernState = {
      ...DEFAULT_TAVERN_STATE,
      name: scenarioName || "The Tipsy Gnome",
      time,
      atmosphere,
      objects: [...DEFAULT_TAVERN_STATE.objects, ...additionalObjects],
      lastUpdated: new Date().toISOString(),
      events: [{
        description: `A new scenario "${scenarioName}" begins`,
        timestamp: new Date().toISOString()
      }]
    };

    // Write the new state to disk
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(newState, null, 2));
    await fs.writeFile(LOG_FILE_PATH, JSON.stringify(EMPTY_LOG, null, 2));

    console.log(`Initialized new scenario: "${scenarioName}"`);
  } catch (error) {
    console.error('Error initializing scenario:', error);
    throw error;
  }
}

/**
 * Set character goals for a scenario
 */
async function setCharacterGoals(goals: Record<string, string>): Promise<void> {
  try {
    for (const [character, goal] of Object.entries(goals)) {
      console.log(`Setting ${character}'s goal to: "${goal}"`);
      await sendTavernRequest(`Set ${character}'s goal to "${goal}"`);
    }
  } catch (error) {
    console.error('Error setting character goals:', error);
    throw error;
  }
}

/**
 * Start interaction between characters
 */
async function startInteraction(maxTurns: number = 5): Promise<any> {
  try {
    // First set the max turns if different from default
    if (maxTurns !== 5) {
      console.log(`Setting max turns to ${maxTurns}...`);
      await sendTavernRequest(`Set max turns to ${maxTurns}`);
    }
    
    // Then start the interaction
    console.log('\n🎭 STARTING CHARACTER INTERACTION 🎭');
    console.log('--------------------------------------');
    
    // Use a progress indicator
    const progressIndicator = setInterval(() => {
      process.stdout.write('.');
    }, 1000);
    
    const result = await sendTavernRequest('Let them talk');
    
    // Clear the progress indicator
    clearInterval(progressIndicator);
    console.log('\nInteraction complete!');
    
    return result;
  } catch (error) {
    console.error('Error starting interaction:', error);
    throw error;
  }
}

/**
 * Get the current tavern state and log
 */
async function getTavernStateAndLog(): Promise<{state: TavernState, log: TavernLog}> {
  try {
    const stateData = await fs.readFile(STATE_FILE_PATH, 'utf8');
    const logData = await fs.readFile(LOG_FILE_PATH, 'utf8');
    
    return {
      state: JSON.parse(stateData),
      log: JSON.parse(logData)
    };
  } catch (error) {
    console.error('Error reading tavern state and log:', error);
    throw error;
  }
}

/**
 * Display the recent conversations in a readable format
 */
function displayConversations(log: TavernLog, limit: number = 10): void {
  console.log('\n📜 CONVERSATION TRANSCRIPT 📜');
  console.log('==============================\n');
  
  const recentConversations = log.conversations.slice(-limit);
  
  if (recentConversations.length === 0) {
    console.log('No conversations recorded yet.');
    return;
  }
  
  recentConversations.forEach((conv, index) => {
    const timestamp = new Date(conv.timestamp).toLocaleTimeString();
    
    // Style the output based on the speaker
    if (conv.speaker === 'Homie') {
      console.log(`\x1b[33m🦊 Homie (${timestamp}):\x1b[0m "${conv.message}"`);
    } else if (conv.speaker === 'Bob') {
      console.log(`\x1b[36m🍺 Bob (${timestamp}):\x1b[0m "${conv.message}"`);
    } else if (conv.speaker === 'User') {
      console.log(`\x1b[32m👤 User (${timestamp}):\x1b[0m "${conv.message}"`);
    } else {
      console.log(`\x1b[37m${conv.speaker} (${timestamp}):\x1b[0m "${conv.message}"`);
    }
    
    // Add a small pause between messages for readability
    if (index < recentConversations.length - 1) {
      console.log('');
    }
  });
  
  // Display actions as well if any
  const recentActions = log.actions.slice(-limit);
  if (recentActions.length > 0) {
    console.log('\n🎲 ACTIONS & EVENTS 🎲');
    console.log('====================\n');
    
    recentActions.forEach(action => {
      const timestamp = new Date(action.timestamp).toLocaleTimeString();
      console.log(`\x1b[35m⚡ ${action.character} (${timestamp}):\x1b[0m ${action.action}`);
    });
  }
}

/**
 * Run a complete scenario
 */
async function runScenario(
  scenarioName: string,
  goals: Record<string, string>,
  maxTurns: number = 5,
  time: string = "Evening",
  atmosphere: string = "Warm and inviting",
  additionalObjects: Array<{name: string, description: string}> = []
): Promise<void> {
  try {
    console.log('\n🏰 STARTING D&D SCENARIO 🏰');
    console.log('===========================');
    console.log(`Scenario: \x1b[1m${scenarioName}\x1b[0m`);
    console.log(`Time: ${time} | Atmosphere: ${atmosphere}`);
    
    if (Object.keys(goals).length > 0) {
      console.log('\n🎯 CHARACTER GOALS:');
      for (const [character, goal] of Object.entries(goals)) {
        if (character === 'Homie') {
          console.log(`\x1b[33m🦊 Homie:\x1b[0m "${goal}"`);
        } else if (character === 'Bob') {
          console.log(`\x1b[36m🍺 Bob:\x1b[0m "${goal}"`);
        } else {
          console.log(`${character}: "${goal}"`);
        }
      }
    }
    
    if (additionalObjects.length > 0) {
      console.log('\n🎨 SPECIAL OBJECTS IN SCENE:');
      additionalObjects.forEach(obj => {
        console.log(`\x1b[32m${obj.name}:\x1b[0m ${obj.description}`);
      });
    }
    
    console.log('\n🔧 SETTING UP SCENARIO...');
    
    // Initialize the scenario
    await initializeScenario(scenarioName, time, atmosphere, additionalObjects);
    
    // Set character goals
    console.log('🎯 Setting character goals...');
    await setCharacterGoals(goals);
    
    // Start the interaction
    await startInteraction(maxTurns);
    
    // Get and display the results
    const { log } = await getTavernStateAndLog();
    displayConversations(log, maxTurns * 2);
    
    console.log(`\n✨ Scenario "${scenarioName}" completed successfully. ✨`);
  } catch (error) {
    console.error(`\n❌ Error running scenario "${scenarioName}":`, error);
  }
}

// Main function to run from command line
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
DnD Tavern Scenario Runner

Usage:
  npm run scenario "Scenario Name" --homie "Homie's goal" --bob "Bob's goal" [options]

Options:
  --maxTurns <number>      Maximum turns for interaction (default: 5)
  --time <string>          Time of day (default: "Evening")
  --atmosphere <string>    Tavern atmosphere (default: "Warm and inviting")
  --add-object <name:desc> Add custom object to the tavern (can be used multiple times)
  
Examples:
  npm run scenario "Theft Night" --homie "steal Bob's wallet" --bob "catch anyone stealing from him"
  npm run scenario "Tavern Party" --homie "entertain the crowd" --bob "serve everyone drinks" --time "Night" --atmosphere "Festive and loud"
    `);
    process.exit(0);
  }
  
  // Parse scenario name
  const scenarioName = args[0];
  
  // Parse options
  let homieGoal = '';
  let bobGoal = '';
  let maxTurns = 5;
  let time = "Evening";
  let atmosphere = "Warm and inviting";
  const additionalObjects: Array<{name: string, description: string}> = [];
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--homie' && i + 1 < args.length) {
      homieGoal = args[++i];
    } else if (arg === '--bob' && i + 1 < args.length) {
      bobGoal = args[++i];
    } else if (arg === '--maxTurns' && i + 1 < args.length) {
      maxTurns = parseInt(args[++i], 10);
    } else if (arg === '--time' && i + 1 < args.length) {
      time = args[++i];
    } else if (arg === '--atmosphere' && i + 1 < args.length) {
      atmosphere = args[++i];
    } else if (arg === '--add-object' && i + 1 < args.length) {
      const objectSpec = args[++i];
      const [name, ...descParts] = objectSpec.split(':');
      const description = descParts.join(':');
      if (name && description) {
        additionalObjects.push({ name, description });
      }
    }
  }
  
  const goals: Record<string, string> = {};
  if (homieGoal) goals['Homie'] = homieGoal;
  if (bobGoal) goals['Bob'] = bobGoal;
  
  // Run the scenario
  try {
    await runScenario(scenarioName, goals, maxTurns, time, atmosphere, additionalObjects);
    console.log('Scenario execution completed.');
  } catch (error) {
    console.error('Failed to run scenario:', error);
    process.exit(1);
  }
}

// Execute the main function 
// In TypeScript/Node ESM, there's no direct equivalent to require.main === module
// The simplest solution is to just call main() directly
main();

// Export the functions for use in other scripts
export {
  initializeScenario,
  setCharacterGoals,
  startInteraction,
  getTavernStateAndLog,
  displayConversations,
  runScenario
};