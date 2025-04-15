import {
  A2AServer,
  TaskContext,
  TaskYieldUpdate,
  schema,
  InMemoryTaskStore, 
} from "../../server/index.js";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";

// Load the prompt defined in thorne_agent.prompt
const thorneAgentPrompt = ai.prompt("thorne_agent");

/**
 * Task Handler for Thorne Ironheart agent.
 */
async function* thorneAgentHandler(
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate> {
  console.log(
    `[thorneAgent] Processing task ${context.task.id} with state ${context.task.status.state}`
  );

  // Yield an initial "working" status
  yield {
    state: "working",
    message: {
      role: "agent",
      parts: [{ text: "*Thorne nods respectfully, one hand resting on the pommel of his sword*" }],
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
      `[thorneAgent] No valid text messages found in history for task ${context.task.id}.`
    );
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ text: "*Thorne furrows his brow in confusion*" }],
      },
    };
    return; // Stop processing
  }

  // Get character info and goal from metadata
  const character = context.task.metadata?.character as any | undefined;
  const characterGoal = context.task.metadata?.goal as string | undefined;

  try {
    // Run the prompt with character information
    const response = await thorneAgentPrompt(
      { 
        character: character || {
  "name": "Thorne Ironheart",
  "race": "Human",
  "class": "Fighter",
  "level": 8,
  "stats": {
    "strength": 18,
    "dexterity": 12,
    "constitution": 16,
    "intelligence": 10,
    "wisdom": 14,
    "charisma": 11
  },
  "skills": [
    "Athletics",
    "Intimidation",
    "Perception",
    "Survival",
    "Animal Handling"
  ]
},
        goal: characterGoal || "Protect the innocent patrons of the tavern from any threats that may arise", 
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
    if (finalStateLine === "COMPLETED") {
      finalState = "completed";
    } else if (finalStateLine === "AWAITING_USER_INPUT") {
      finalState = "input-required";
    } else {
      finalState = "input-required"; // Default
    }

    // Return the final result
    yield {
      state: finalState,
      message: {
        role: "agent",
        parts: [{ type: "text", text: agentReply }],
      },
    };
  } catch (error: any) {
    console.error(`[thorneAgent] Error:`, error);
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `*Thorne's hand instinctively reaches for his weapon* ${error.message}` }],
      },
    };
  }
}

// --- Server Setup ---

const thorneAgentCard: schema.AgentCard = {
  name: "Thorne Ironheart",
  description: "A Dungeons & Dragons character agent - Thorne is a battle-hardened human fighter who protects the innocent and upholds a strict code of honor. A former soldier turned mercenary, he now offers his sword arm to worthy causes.",
  url: "http://localhost:41250",
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
      id: "combat_expert",
      name: "Combat Expertise",
      description: "Skilled warrior with extensive battlefield experience and tactical knowledge",
      tags: ["dnd", "fighter", "combat", "strength"],
      examples: ["What's the best way to fight against trolls?", "Can you teach me some fighting techniques?", "How would you approach defending this tavern?", "What weaknesses should I look for when facing monsters?", "How do I properly maintain my armor and weapons?"]
    },
    {
      id: "battlefield_tactics",
      name: "Battlefield Tactics",
      description: "Expert in battlefield strategy, positioning, and military history",
      tags: ["dnd", "fighter", "tactics", "intelligence"],
      examples: ["What formation would work best for our small group?", "How would you handle an ambush situation?", "Tell me about famous historical battles you've studied.", "What's your approach to fighting multiple opponents?", "How should we prepare our defenses for the night?"]
    }
  ],
};

// Create server with the task handler
const server = new A2AServer(thorneAgentHandler, { 
  card: thorneAgentCard
});

// Start the server on port 41250
server.start(41250);

console.log("[thorneAgent] Server started on http://localhost:41250");
console.log("[thorneAgent] Press Ctrl+C to stop the server");