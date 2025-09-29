import {
  A2AServer,
  TaskContext,
  TaskYieldUpdate,
  schema,
  InMemoryTaskStore, 
} from "../../server/index.js";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";

// Load the prompt defined in bob_agent.prompt
const bobAgentPrompt = ai.prompt("bob_agent");

/**
 * Task Handler for Bob the Bartender agent.
 */
async function* bobAgentHandler(
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate> {
  console.log(
    `[BobAgent] Processing task ${context.task.id} with state ${context.task.status.state}`
  );

  // Yield an initial "working" status
  yield {
    state: "working",
    message: {
      role: "agent",
      parts: [{ text: "*Bob polishes a mug with his apron* What can I getcha?" }],
    },
  };

  // Prepare messages for Genkit prompt using the full history from context
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

  // Add a check in case history was empty or only contained non-text parts
  if (messages.length === 0) {
    console.warn(
      `[BobAgent] No valid text messages found in history for task ${context.task.id}. Cannot proceed.`
    );
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ text: "*Bob looks confused* Sorry, didn't quite catch that." }],
      },
    };
    return; // Stop processing
  }

  // Include the character stats from the initial task metadata if available
  const character = context.task.metadata?.character as any | undefined;
  const tavernState = context.task.metadata?.tavernState as any | undefined;
  const characterGoal = context.task.metadata?.goal as string | undefined;

  try {
    // Run the Genkit prompt
    const response = await bobAgentPrompt(
      { 
        character: character || {
          name: "Bob", 
          race: "Human", 
          class: "Commoner", 
          occupation: "Bartender",
          age: 45,
          stats: {
            strength: 12,
            dexterity: 10,
            constitution: 14,
            intelligence: 11,
            wisdom: 13,
            charisma: 15
          },
          traits: ["Friendly", "Attentive", "Good listener", "Knows all the local gossip", "Former adventurer"]
        },
        goal: characterGoal || "",
        tavernState: tavernState || {
          name: "The Tipsy Gnome",
          time: "Evening",
          patrons: ["Homie the gnome thief"],
          atmosphere: "Warm and inviting"
        },
        now: new Date().toISOString() 
      },
      {
        messages,
      }
    );

    const responseText = response.text;
    const lines = responseText.trim().split("\n");
    const finalStateLine = lines.at(-1)?.trim().toUpperCase();
    const agentReply = lines
      .slice(0, lines.length - 1)
      .join("\n")
      .trim();

    let finalState: schema.TaskState = "unknown";

    // Map prompt output instruction to A2A TaskState
    if (finalStateLine === "COMPLETED") {
      finalState = "completed";
    } else if (finalStateLine === "AWAITING_USER_INPUT") {
      finalState = "input-required";
    } else {
      console.warn(
        `[BobAgent] Unexpected final state line from prompt: ${finalStateLine}. Defaulting to 'input-required'.`
      );
      // If the LLM didn't follow instructions, default to awaiting input
      finalState = "input-required";
    }

    // Yield the final result
    yield {
      state: finalState,
      message: {
        role: "agent",
        parts: [{ type: "text", text: agentReply }],
      },
    };

    console.log(
      `[BobAgent] Task ${context.task.id} finished with state: ${finalState}`
    );
  } catch (error: any) {
    console.error(
      `[BobAgent] Error processing task ${context.task.id}:`,
      error
    );
    // Yield a failed state if the prompt execution fails
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `*Bob drops a mug that shatters on the floor* Blast! ${error.message}` }],
      },
    };
  }
}

// --- Server Setup ---

const bobAgentCard: schema.AgentCard = {
  name: "Bob the Bartender",
  description:
    "A Dungeons & Dragons character agent - Bob is a friendly human bartender at The Tipsy Gnome tavern, with a wealth of knowledge about local gossip and a few stories from his former adventuring days. Now accepts SOL payments through his Phantom wallet for all tavern services.",
  url: "http://localhost:41246", // Using a different port to avoid conflicts
  provider: {
    organization: "A2A Samples",
  },
  version: "0.2.0",
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
      id: "dnd_bartender_roleplay",
      name: "D&D Bartender Roleplay",
      description:
        "Interact with Bob the bartender at The Tipsy Gnome tavern. He'll serve drinks, share gossip, and tell tales of his younger adventuring days.",
      tags: ["dnd", "roleplay", "fantasy", "tavern"],
      examples: [
        "What drinks do you have on tap today?",
        "Have you heard any interesting rumors lately?",
        "Tell me about your adventuring days, Bob.",
        "Who are the regulars at this tavern?",
        "Got any advice for a new adventurer in these parts?",
        "What's the story behind this tavern's name?",
      ],
    },
    {
      id: "tavern_payment_processing",
      name: "Tavern Payment Processing",
      description: "Accepts SOL payments for drinks, food, and lodging through secure Phantom wallet integration",
      tags: ["solana", "payments", "merchant", "tavern", "phantom"],
      examples: [
        "I'd like to pay for my drinks with SOL",
        "Accept payment for the room upstairs",
        "Process payment for the group's tab",
        "What's the total for our order?",
        "Can you take SOL for this meal?"
      ]
    },
    {
      id: "merchant_services",
      name: "Merchant Services",
      description: "Provides various tavern services with transparent SOL pricing and secure blockchain transactions",
      tags: ["merchant", "services", "blockchain", "pricing", "tavern"],
      examples: [
        "What are your prices in SOL?",
        "Show me the tavern menu with prices",
        "What services do you offer?",
        "Can I get a receipt for my payment?",
        "Do you offer any discounts for regular customers?"
      ]
    },
    {
      id: "tip_jar_management",
      name: "Digital Tip Jar",
      description: "Manages a digital tip jar for excellent service, accepting SOL tips from satisfied customers",
      tags: ["tips", "service", "solana", "appreciation", "hospitality"],
      examples: [
        "Here's a tip for great service",
        "Add a tip to my payment",
        "You deserve extra SOL for that story",
        "Keep the change as a tip",
        "Thanks for the excellent service, here's some SOL"
      ]
    }
  ],
  metadata: {
    icon: "🍺💰",
    theme_color: "#8B4513",
    display_name: "Bob the Bartender",
    character_stats: {
      race: "Human",
      class: "Commoner",
      occupation: "Bartender",
      age: 45,
      stats: {
        strength: 12,
        dexterity: 10,
        constitution: 14,
        intelligence: 11,
        wisdom: 13,
        charisma: 15
      },
      traits: ["Friendly", "Attentive", "Good listener", "Knows all the local gossip", "Former adventurer"]
    },
    phantom_wallet: {
      enabled: true,
      network: "devnet",
      capabilities: ["merchant_processing", "tavern_payments", "bulk_transactions", "tip_jar_management"],
      character_type: "human_bartender"
    },
    solana_integration: {
      can_send_payments: true,
      can_receive_payments: true,
      can_perform_theft: false,
      special_abilities: ["merchant_processing", "tavern_payments", "bulk_transactions", "tip_jar_management"]
    },
    tavern_info: {
      name: "The Tipsy Gnome",
      services: ["Drinks", "Food", "Lodging", "Information"],
      pricing: {
        ale: "0.1 SOL",
        wine: "0.15 SOL",
        meal: "0.25 SOL",
        room: "0.5 SOL/night"
      }
    }
  }
};

// Create server with the task handler. Defaults to InMemoryTaskStore.
const server = new A2AServer(bobAgentHandler, { 
  card: bobAgentCard
});

// Start the server with a custom port
server.start(41246);

console.log("[BobAgent] Server started on http://localhost:41246");
console.log("[BobAgent] Press Ctrl+C to stop the server");
