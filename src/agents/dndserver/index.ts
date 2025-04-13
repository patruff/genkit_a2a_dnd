import {
  A2AServer,
  TaskContext,
  TaskYieldUpdate,
  schema,
  InMemoryTaskStore,
} from "../../server/index.js";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";
import { AgentClient } from "./agentClient.js";
import { 
  TavernState, 
  CharacterAction, 
  TavernLog, 
  SkillCheckResult,
  GameActionRequest 
} from "./types.js";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as gameEngine from './gameEngine.js';
import { processAction, createSkillCheckResult } from './processAction.js';

// Load the prompt defined in tavern_server.prompt
const tavernServerPrompt = ai.prompt("tavern_server");

// Initialize tavern state
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
    },
    {
      name: "WZA",
      type: "mind-reading wizard",
      description: "A wise wizard with mystical mind-reading capabilities and keen observational skills",
      status: "sitting quietly in the corner"
    }
  ],
  objects: [
    { name: "Bar", description: "A long wooden counter with several stools" },
    { name: "Fireplace", description: "A stone hearth with a crackling fire" },
    { name: "Tables", description: "Several wooden tables scattered throughout the room" },
    { name: "Drinks", description: "Various mugs, glasses and bottles of beverages" },
    { name: "Gemstone", description: "A glittering blue gemstone displayed in a case behind the bar" }
  ],
  events: [],
  lastUpdated: new Date().toISOString(),
  metadata: {
    characterGoals: {}
  }
};

// Tavern log to track all interactions
let tavernLog: TavernLog = {
  conversations: [],
  actions: [],
  timestamps: []
};

const STATE_FILE_PATH = path.join(process.cwd(), 'tavern_state.json');
const LOG_FILE_PATH = path.join(process.cwd(), 'tavern_log.json');

let currentTavernState: TavernState = { ...DEFAULT_TAVERN_STATE };
let maxTurns = 5; // Default max turns for agent interaction
let currentTurn = 0;

// Initialize agent clients
const AGENT_CONFIGS = {
  homie: {
    url: 'http://localhost:41245',
    name: 'Homie the Gnome Thief'
  },
  bob: {
    url: 'http://localhost:41246',
    name: 'Bob the Bartender'
  },
  wza: {
    url: 'http://localhost:41248',
    name: 'WZA'
  }
};

let agentClients: Record<string, AgentClient> = {};

// Initialize agent clients
async function initializeAgentClients() {
  try {
    agentClients.homie = new AgentClient(AGENT_CONFIGS.homie.url, AGENT_CONFIGS.homie.name);
    agentClients.bob = new AgentClient(AGENT_CONFIGS.bob.url, AGENT_CONFIGS.bob.name);
    agentClients.wza = new AgentClient(AGENT_CONFIGS.wza.url, AGENT_CONFIGS.wza.name);
    console.log('[TavernServer] Agent clients initialized');
  } catch (error) {
    console.error('[TavernServer] Failed to initialize agent clients:', error);
  }
}

// Load state and log files if they exist
async function loadStateAndLog() {
  try {
    // Load tavern state
    const stateData = await fs.readFile(STATE_FILE_PATH, 'utf8');
    currentTavernState = JSON.parse(stateData);
    console.log('[TavernServer] Loaded tavern state from file');
  } catch (error) {
    console.log('[TavernServer] No tavern state file found, using default state');
    currentTavernState = { ...DEFAULT_TAVERN_STATE };
  }

  try {
    // Load tavern log
    const logData = await fs.readFile(LOG_FILE_PATH, 'utf8');
    tavernLog = JSON.parse(logData);
    console.log('[TavernServer] Loaded tavern log from file');
  } catch (error) {
    console.log('[TavernServer] No tavern log file found, using empty log');
    tavernLog = { conversations: [], actions: [], timestamps: [] };
  }
}

// Save state and log to files
async function saveStateAndLog() {
  try {
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(currentTavernState, null, 2));
    await fs.writeFile(LOG_FILE_PATH, JSON.stringify(tavernLog, null, 2));
    console.log('[TavernServer] Saved tavern state and log');
  } catch (error) {
    console.error('[TavernServer] Error saving tavern state and log:', error);
  }
}

// Update tavern log with a new character action
function logCharacterAction(character: string, action: string) {
  const timestamp = new Date().toISOString();
  
  const characterAction: CharacterAction = {
    character,
    action,
    timestamp
  };
  
  tavernLog.actions.push(characterAction);
  tavernLog.timestamps.push(timestamp);
  
  // Update tavern state
  currentTavernState.lastUpdated = timestamp;
  currentTavernState.events.push({
    description: `${character} ${action}`,
    timestamp
  });
  
  // Keep only the last 10 events in the tavern state
  if (currentTavernState.events.length > 10) {
    currentTavernState.events = currentTavernState.events.slice(-10);
  }
}

// Log conversation between characters or with user
function logConversation(speaker: string, listener: string, message: string) {
  const timestamp = new Date().toISOString();
  
  tavernLog.conversations.push({
    speaker,
    listener,
    message,
    timestamp
  });
  tavernLog.timestamps.push(timestamp);
  
  // Update tavern state
  currentTavernState.lastUpdated = timestamp;
}

// Regex patterns for detecting action requests in agent responses
const ACTION_PATTERNS = {
  STEAL: /\[\s*ACTION\s*:\s*STEAL\s*(.*?)\s*\]/i,
  HIDE: /\[\s*ACTION\s*:\s*HIDE\s*(.*?)\s*\]/i,
  DETECT: /\[\s*ACTION\s*:\s*DETECT\s*(.*?)\s*\]/i,
  SEARCH: /\[\s*ACTION\s*:\s*SEARCH\s*(.*?)\s*\]/i,
  DECEIVE: /\[\s*ACTION\s*:\s*DECEIVE\s*(.*?)\s*\]/i,
  PERSUADE: /\[\s*ACTION\s*:\s*PERSUADE\s*(.*?)\s*\]/i,
  INTIMIDATE: /\[\s*ACTION\s*:\s*INTIMIDATE\s*(.*?)\s*\]/i,
  PERCEPTION: /\[\s*ACTION\s*:\s*PERCEPTION\s*(.*?)\s*\]/i,
  UNLOCK: /\[\s*ACTION\s*:\s*UNLOCK\s*(.*?)\s*\]/i,
  ACROBATICS: /\[\s*ACTION\s*:\s*ACROBATICS\s*(.*?)\s*\]/i,
  ATTACK: /\[\s*ACTION\s*:\s*ATTACK\s*(.*?)\s*\]/i,
  // Add more patterns as needed
};

// Parse and extract action requests from agent messages
function parseActionRequests(message: string): GameActionRequest[] {
  const actionRequests: GameActionRequest[] = [];
  
  // Check for each action type
  for (const [actionType, pattern] of Object.entries(ACTION_PATTERNS)) {
    const match = message.match(pattern);
    if (match) {
      const actionDetails = match[1] || '';
      
      // Extract target from action details
      let target = '';
      const targetMatch = actionDetails.match(/target: ?"?([^",]+)"?/i);
      if (targetMatch) {
        target = targetMatch[1].trim();
      }
      
      // Extract skill from action details
      let skill = '';
      const skillMatch = actionDetails.match(/skill: ?"?([^",]+)"?/i);
      if (skillMatch) {
        skill = skillMatch[1].trim();
      }
      
      // Extract difficulty from action details
      let difficulty: 'easy' | 'medium' | 'hard' | 'very hard' = 'medium';
      const difficultyMatch = actionDetails.match(/difficulty: ?"?([^",]+)"?/i);
      if (difficultyMatch) {
        const difficultyValue = difficultyMatch[1].trim().toLowerCase();
        if (['easy', 'medium', 'hard', 'very hard'].includes(difficultyValue)) {
          difficulty = difficultyValue as any;
        }
      }
      
      // Extract advantage from action details
      let advantage: 'advantage' | 'disadvantage' | 'normal' = 'normal';
      const advantageMatch = actionDetails.match(/advantage: ?"?([^",]+)"?/i);
      if (advantageMatch) {
        const advantageValue = advantageMatch[1].trim().toLowerCase();
        if (['advantage', 'disadvantage', 'normal'].includes(advantageValue)) {
          advantage = advantageValue as any;
        }
      }
      
      actionRequests.push({
        actionType: actionType.toLowerCase(),
        target,
        skill,
        difficulty,
        advantage
      });
    }
  }
  
  return actionRequests;
}

// Import createSkillCheckResult from processAction.js instead of defining it here

// Process character interaction for a specific turn
async function processCharacterTurn(activeCharacter: string, listeningCharacter: string) {
  try {
    const activeAgent = agentClients[activeCharacter.toLowerCase()];
    if (!activeAgent) {
      console.error(`[TavernServer] Agent client for ${activeCharacter} not found`);
      return;
    }
    
    // Get the most recent interactions as context
    const recentLog = {
      conversations: tavernLog.conversations.slice(-5),
      actions: tavernLog.actions.slice(-5)
    };
    
    // Create a context message with the recent history and tavern state
    let contextMessage = `You are in ${currentTavernState.name}. `;
    
    if (recentLog.actions.length > 0) {
      contextMessage += `Recent actions: ${recentLog.actions.map(a => {
        let actionText = `${a.character} ${a.action}`;
        if (a.success !== undefined) {
          actionText += a.success ? " (SUCCESS)" : " (FAILURE)";
        }
        if (a.skillCheck) {
          actionText += ` [Roll: ${a.skillCheck.rollValue}+${a.skillCheck.modifier}=${a.skillCheck.total} vs DC ${a.skillCheck.difficultyClass}]`;
        }
        return actionText;
      }).join('. ')}. `;
    }
    
    if (recentLog.conversations.length > 0) {
      contextMessage += `Recent conversations: ${recentLog.conversations.map(c => `${c.speaker} to ${c.listener}: "${c.message}"`).join('. ')}. `;
    }
    
    // Add special instructions for action handling with improved flow
    contextMessage += `\nIMPORTANT: To perform actions that require dice rolls, use the ACTION format at the point in your narrative where you want the check to occur:

[ACTION: ACTIONTYPE target: "target object or character", skill: "specific skill", difficulty: "easy/medium/hard/very hard"]

After this action line, your message will be paused and the system will roll dice to determine success or failure. Then you should continue your response based on that outcome - DO NOT continue writing immediately after an action tag.

Examples:
- To steal: "*I carefully reach for the gem while Bob is distracted*" [ACTION: STEAL target: "gem", skill: "Sleight of Hand"]
- To notice: "*I scan the room for anything suspicious*" [ACTION: PERCEPTION target: "hidden threats"]
- To hide: "*I duck behind the bar as Bob turns around*" [ACTION: HIDE target: "behind the bar"]

Your actions have real consequences - failure might lead to:
- Being caught in the act 
- Combat (If you attack someone)
- Loss of opportunities
- Complications to your goal

You are ${activeCharacter}. What do you say or do next?`;
    
    // Get any character goals that were set
    const characterGoals: Record<string, string> = currentTavernState.metadata?.characterGoals || {};
    const characterGoal = characterGoals[activeCharacter] || "";
    
    // Send the message to the agent with goals and tavern state
    const response = await activeAgent.sendMessage(contextMessage, {
      tavernState: currentTavernState,
      goal: characterGoal
    });
    
    // Parse any action requests from the response
    const actionRequests = parseActionRequests(response);
    let modifiedResponse = response;
    
    // Process each action request
    for (const request of actionRequests) {
      console.log(`[TavernServer] Processing ${request.actionType} action from ${activeCharacter}`);
      // Use our specialized action processor that handles mid-narrative continuation
      modifiedResponse = await processAction(
        request,
        activeCharacter,
        activeAgent,
        modifiedResponse,
        currentTavernState,
        tavernLog,
        characterGoal
      );
    }
    
    // Log the agent's response (with action results appended)
    logConversation(activeCharacter, listeningCharacter, modifiedResponse);
    console.log(`[TavernServer] ${activeCharacter}: "${modifiedResponse}"`);
    
    return modifiedResponse;
  } catch (error) {
    console.error(`[TavernServer] Error in character turn for ${activeCharacter}:`, error);
    return null;
  }
}

// Run a complete interaction cycle for all characters
async function runInteractionCycle(userMessage?: string) {
  // Reset turn counter if this is a new cycle
  if (currentTurn >= maxTurns * 2) {
    currentTurn = 0;
  }
  
  // If there's a user message, log it
  if (userMessage) {
    logConversation('User', 'Tavern', userMessage);
  }
  
  const characters = ['Homie', 'Bob', 'WZA'];
  const totalTurns = characters.length * maxTurns; // Each character gets maxTurns turns
  
  console.log(`\n[TavernServer] Starting ${totalTurns} turn interaction cycle`);
  
  for (let i = currentTurn; i < totalTurns; i++) {
    const activeCharIdx = i % characters.length;
    const listeningCharIdx = (i + 1) % characters.length;
    
    const activeCharacter = characters[activeCharIdx];
    const listeningCharacter = characters[listeningCharIdx];
    
    console.log(`\n[TavernServer] Turn ${Math.floor(i/2) + 1} - ${activeCharacter}'s turn`);
    
    await processCharacterTurn(activeCharacter, listeningCharacter);
    
    // Save state after each turn
    await saveStateAndLog();
    
    currentTurn++;
  }
  
  // Reset turn counter for next cycle
  currentTurn = 0;
  
  // Save full message history
  try {
    await AgentClient.saveMessageHistory();
  } catch (error) {
    console.error('[TavernServer] Error saving message history:', error);
  }
  
  return {
    message: "Interaction cycle completed",
    tavernState: currentTavernState,
    log: tavernLog
  };
}

/**
 * Task Handler for the DnD Tavern Server.
 */
async function* tavernServerHandler(
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate> {
  console.log(
    `[TavernServer] Processing task ${context.task.id} with state ${context.task.status.state}`
  );

  // Yield an initial "working" status
  yield {
    state: "working",
    message: {
      role: "agent",
      parts: [{ text: "*The door to The Tipsy Gnome tavern creaks open...*" }],
    },
  };

  // Prepare messages for Genkit prompt
  const messages: MessageData[] = (context.history ?? [])
    .map((m) => ({
      role: (m.role === "agent" ? "model" : "user") as "user" | "model",
      content: m.parts
        .filter((p): p is schema.TextPart => !!(p as schema.TextPart).text)
        .map((p) => ({
          text: p.text,
        })),
    }))
    .filter((m) => m.content.length > 0);

  // Add a check in case history was empty
  if (messages.length === 0) {
    console.warn(
      `[TavernServer] No valid text messages found in history for task ${context.task.id}.`
    );
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ text: "*The tavern seems empty and quiet...*" }],
      },
    };
    return; // Stop processing
  }

  try {
    // Extract user request from the last message
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    const userRequest = lastUserMessage?.content[0]?.text || "";
    
    // Check for special commands
    if (userRequest.toLowerCase().includes("set max turns")) {
      const match = userRequest.match(/set max turns(?: to)? (\d+)/i);
      if (match && match[1]) {
        maxTurns = parseInt(match[1], 10);
        yield {
          state: "completed",
          message: {
            role: "agent",
            parts: [{ text: `Max turns set to ${maxTurns}. Each character will have up to ${maxTurns} turns in an interaction cycle.` }],
          },
        };
        return;
      }
    }
    
    // Check for character goal setting
    const setGoalMatch = userRequest.match(/(?:set|give) (\w+)(?:'s| the)? goal (?:to|as) ['"](.+?)['"]/i);
    if (setGoalMatch) {
      const characterName = setGoalMatch[1];
      const goalText = setGoalMatch[2];
      
      // Check if character exists in the tavern
      const character = currentTavernState.characters.find(
        c => c.name.toLowerCase() === characterName.toLowerCase()
      );
      
      if (character) {
        // Ensure the metadata and characterGoals exist
        if (!currentTavernState.metadata) {
          currentTavernState.metadata = {};
        }
        if (!currentTavernState.metadata.characterGoals) {
          currentTavernState.metadata.characterGoals = {};
        }
        
        // Set the character goal
        currentTavernState.metadata.characterGoals[character.name] = goalText;
        
        // Log the goal setting as an action
        logCharacterAction('User', `assigns a goal to ${character.name}: "${goalText}"`);
        
        // Save the updated state
        await saveStateAndLog();
        
        yield {
          state: "completed",
          message: {
            role: "agent",
            parts: [{ text: `Goal set for ${character.name}: "${goalText}". The character will now work toward this goal in future interactions.` }],
          },
        };
        return;
      } else {
        yield {
          state: "completed",
          message: {
            role: "agent",
            parts: [{ text: `Character "${characterName}" not found in the tavern. Available characters: ${currentTavernState.characters.map(c => c.name).join(', ')}` }],
          },
        };
        return;
      }
    }
    
    // Check if this is a request to run an interaction cycle
    if (
      userRequest.toLowerCase().includes("run interaction") || 
      userRequest.toLowerCase().includes("start conversation") ||
      userRequest.toLowerCase().includes("let them talk")
    ) {
      yield {
        state: "working",
        message: {
          role: "agent",
          parts: [{ text: `Starting an interaction cycle with max ${maxTurns} turns per character...` }],
        },
      };
      
      await runInteractionCycle();
      
      // Format the interactions into a readable narrative
      const recentConversations = tavernLog.conversations.slice(-maxTurns * 2);
      const narrativeLog = recentConversations.map(c => `**${c.speaker}**: "${c.message}"`).join("\n\n");
      
      yield {
        state: "completed",
        message: {
          role: "agent",
          parts: [{ text: `# The Tipsy Gnome - Recent Interactions\n\n${narrativeLog}` }],
        },
      };
      return;
    }
    
    // Process as a normal user message - use the prompt to determine what to do
    const response = await tavernServerPrompt(
      { 
        tavernState: currentTavernState,
        tavernLog: {
          conversations: tavernLog.conversations.slice(-10),
          actions: tavernLog.actions.slice(-10)
        },
        maxTurns,
        now: new Date().toISOString() 
      },
      { messages }
    );

    const responseText = response.text;
    const lines = responseText.trim().split("\n");
    const finalStateLine = lines.at(-1)?.trim().toUpperCase();
    const agentReply = lines
      .slice(0, lines.length - 1)
      .join("\n")
      .trim();

    let finalState: schema.TaskState = "unknown";

    // Check if response includes a recommendation to run agent interaction
    const shouldRunInteraction = responseText.toLowerCase().includes("run_agent_interaction");

    // Map prompt output instruction to A2A TaskState
    if (finalStateLine === "COMPLETED") {
      finalState = "completed";
    } else if (finalStateLine === "AWAITING_USER_INPUT") {
      finalState = "input-required";
    } else {
      console.warn(
        `[TavernServer] Unexpected final state line from prompt: ${finalStateLine}. Defaulting to 'input-required'.`
      );
      finalState = "input-required";
    }

    // If prompted, run the agent interaction
    if (shouldRunInteraction) {
      yield {
        state: "working",
        message: {
          role: "agent",
          parts: [{ type: "text", text: "Letting the characters interact..." }],
        },
      };
      
      await runInteractionCycle(userRequest);
      
      // Format the interactions into a readable narrative
      const recentConversations = tavernLog.conversations.slice(-maxTurns * 2);
      const narrativeLog = recentConversations.map(c => `**${c.speaker}**: "${c.message}"`).join("\n\n");
      
      yield {
        state: "completed",
        message: {
          role: "agent",
          parts: [{ type: "text", text: `# The Tipsy Gnome - Recent Interactions\n\n${narrativeLog}` }],
        },
      };
    } else {
      // Yield the normal response
      yield {
        state: finalState,
        message: {
          role: "agent",
          parts: [{ type: "text", text: agentReply }],
        },
      };
    }

    console.log(
      `[TavernServer] Task ${context.task.id} finished with state: ${finalState}`
    );
  } catch (error: any) {
    console.error(
      `[TavernServer] Error processing task ${context.task.id}:`,
      error
    );
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `*The tavern server encountered an error: ${error.message}*` }],
      },
    };
  }
}

// --- Server Setup ---

const tavernServerCard: schema.AgentCard = {
  name: "The Tipsy Gnome Tavern",
  description:
    "A Dungeons & Dragons tavern server that manages interactions between multiple character agents, including Homie the gnome thief and Bob the bartender.",
  url: "http://localhost:41247", // Using a different port
  provider: {
    organization: "A2A Samples",
  },
  version: "0.0.1",
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: true,
  },
  authentication: null,
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "dnd_tavern_management",
      name: "D&D Tavern Management",
      description:
        "Manages a virtual D&D tavern environment with multiple character agents who can interact with each other and the user.",
      tags: ["dnd", "tavern", "multi-agent", "roleplay", "fantasy"],
      examples: [
        "Let Homie and Bob have a conversation.",
        "Set max turns to 3.",
        "What's happening in the tavern right now?",
        "Tell me about The Tipsy Gnome tavern.",
        "Run an interaction between the characters.",
        "Who's currently in the tavern?",
      ],
    },
  ],
};

// Initialize and start the server
async function startServer() {
  try {
    // Initialize agent clients
    await initializeAgentClients();
    
    // Load saved state and log
    await loadStateAndLog();
    
    // Create server with the task handler
    const server = new A2AServer(tavernServerHandler, { 
      card: tavernServerCard
    });
    // Start the server on a custom port
    server.start(41247);

    console.log("[TavernServer] Server started on http://localhost:41247");
    console.log("[TavernServer] Press Ctrl+C to stop the server");
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n[TavernServer] Shutting down and saving state...');
      await saveStateAndLog();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('[TavernServer] Failed to start server:', error);
  }
}

// Start the server
startServer();