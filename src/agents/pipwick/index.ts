import {
  A2AServer,
  TaskContext,
  TaskYieldUpdate,
  schema,
  InMemoryTaskStore, 
} from "../../server/index.js";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";

// Load the prompt defined in pipwick_agent.prompt
const pipwickAgentPrompt = ai.prompt("pipwick_agent");

/**
 * Task Handler for Pipwick Glitterstring agent.
 */
async function* pipwickAgentHandler(
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate> {
  console.log(
    `[pipwickAgent] Processing task ${context.task.id} with state ${context.task.status.state}`
  );

  // Yield an initial "working" status
  yield {
    state: "working",
    message: {
      role: "agent",
      parts: [{ text: "*Pipwick strums a cheerful tune on their lute and gives a little bow*" }],
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
      `[pipwickAgent] No valid text messages found in history for task ${context.task.id}.`
    );
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ text: "*Pipwick's music trails off in a discordant note*" }],
      },
    };
    return; // Stop processing
  }

  // Get character info and goal from metadata
  const character = context.task.metadata?.character as any | undefined;
  const characterGoal = context.task.metadata?.goal as string | undefined;

  try {
    // Run the prompt with character information
    const response = await pipwickAgentPrompt(
      { 
        character: character || {
  "name": "Pipwick Glitterstring",
  "race": "Gnome",
  "class": "Bard",
  "level": 6,
  "stats": {
    "strength": 8,
    "dexterity": 14,
    "constitution": 12,
    "intelligence": 13,
    "wisdom": 10,
    "charisma": 18
  },
  "skills": [
    "Performance",
    "Persuasion",
    "History",
    "Deception",
    "Insight"
  ]
},
        goal: characterGoal || "Collect interesting stories from travelers to compose into new songs", 
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
    console.error(`[pipwickAgent] Error:`, error);
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `*Pipwick hits a sour note and winces* ${error.message}` }],
      },
    };
  }
}

// --- Server Setup ---

const pipwickAgentCard: schema.AgentCard = {
  name: "Pipwick Glitterstring",
  description: "A Dungeons & Dragons character agent - Pipwick is a cheerful gnome bard who uses music and stories to charm audiences and share valuable information about the world around them.",
  url: "http://localhost:41249",
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
      id: "bardic_performance",
      name: "Bardic Performance",
      description: "Can perform music, poetry, and stories that inspire allies and influence others",
      tags: ["dnd", "bard", "performance", "charisma"],
      examples: ["Can you play a song for us?", "Tell us a story about ancient heroes.", "Use your music to cheer everyone up.", "Do you know any songs about dragons?", "Can your performance help us impress the noble?"]
    },
    {
      id: "knowledge_lore",
      name: "Knowledge and Lore",
      description: "Possesses extensive knowledge of history, legends, and cultural traditions from across the realms",
      tags: ["dnd", "bard", "knowledge", "intelligence"],
      examples: ["What do you know about the ancient ruins to the north?", "Have you heard any legends about this region?", "Tell me about the history of the royal family.", "What do you know about magical artifacts?", "Can you identify this strange symbol?"]
    }
  ],
};

// Create server with the task handler
const server = new A2AServer(pipwickAgentHandler, { 
  card: pipwickAgentCard
});

// Start the server on port 41249
server.start(41249);

console.log("[pipwickAgent] Server started on http://localhost:41249");
console.log("[pipwickAgent] Press Ctrl+C to stop the server");