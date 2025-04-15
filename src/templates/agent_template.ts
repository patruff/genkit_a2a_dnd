import {
  A2AServer,
  TaskContext,
  TaskYieldUpdate,
  schema,
  InMemoryTaskStore, 
} from "../../server/index.js";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";

// Load the prompt defined in %%agent_id%%_agent.prompt
const %%agent_id%%AgentPrompt = ai.prompt("%%agent_id%%_agent");

/**
 * Task Handler for %%character.name%% agent.
 */
async function* %%agent_id%%AgentHandler(
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate> {
  console.log(
    `[%%agent_id%%Agent] Processing task ${context.task.id} with state ${context.task.status.state}`
  );

  // Yield an initial "working" status
  yield {
    state: "working",
    message: {
      role: "agent",
      parts: [{ text: "*%%character.initial_action%%*" }],
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
      `[%%agent_id%%Agent] No valid text messages found in history for task ${context.task.id}.`
    );
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ text: "*%%character.fail_action%%*" }],
      },
    };
    return; // Stop processing
  }

  // Get character info and goal from metadata
  const character = context.task.metadata?.character as any | undefined;
  const characterGoal = context.task.metadata?.goal as string | undefined;

  try {
    // Run the prompt with character information
    const response = await %%agent_id%%AgentPrompt(
      { 
        character: character || %%character.default_character%%,
        goal: characterGoal || "%%character.default_goal%%", 
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
    console.error(`[%%agent_id%%Agent] Error:`, error);
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `*%%character.error_action%%* ${error.message}` }],
      },
    };
  }
}

// --- Server Setup ---

const %%agent_id%%AgentCard: schema.AgentCard = {
  name: "%%character.name%%",
  description: "%%character.description%%",
  url: "http://localhost:%%character.port%%",
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
    // Replace this with actual skills from the agent card
  ],
};

// Create server with the task handler
const server = new A2AServer(%%agent_id%%AgentHandler, { 
  card: %%agent_id%%AgentCard
});

// Start the server on port %%character.port%%
server.start(%%character.port%%);

console.log("[%%agent_id%%Agent] Server started on http://localhost:%%character.port%%");
console.log("[%%agent_id%%Agent] Press Ctrl+C to stop the server");