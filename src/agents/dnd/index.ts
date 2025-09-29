import {
  A2AServer,
  TaskContext,
  TaskYieldUpdate,
  schema,
  InMemoryTaskStore, 
} from "../../server/index.js";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";

// Load the prompt defined in dnd_agent.prompt
const dndAgentPrompt = ai.prompt("dnd_agent");

/**
 * Task Handler for the DnD Agent as a gnome thief named Homie.
 */
async function* dndAgentHandler(
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate> {
  console.log(
    `[DnDAgent] Processing task ${context.task.id} with state ${context.task.status.state}`
  );

  // Yield an initial "working" status
  yield {
    state: "working",
    message: {
      role: "agent",
      parts: [{ text: "*Homie the gnome thief adjusts his lockpicks* What's the plan, boss?" }],
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
      `[DnDAgent] No valid text messages found in history for task ${context.task.id}. Cannot proceed.`
    );
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ text: "*Homie scratches his head* I didn't catch that. Could you repeat?" }],
      },
    };
    return; // Stop processing
  }

  // Include the character stats from the initial task metadata if available
  const character = context.task.metadata?.character as any | undefined;
  const characterGoal = context.task.metadata?.goal as string | undefined;

  try {
    // Run the Genkit prompt
    const response = await dndAgentPrompt(
      { 
        character: character || {
          name: "Homie", 
          race: "Gnome", 
          class: "Thief", 
          level: 5,
          stats: {
            strength: 8,
            dexterity: 16,
            constitution: 10,
            intelligence: 14,
            wisdom: 12,
            charisma: 15
          },
          skills: ["Stealth", "Lockpicking", "Sleight of Hand", "Deception", "Acrobatics"]
        },
        goal: characterGoal || "", 
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
        `[DnDAgent] Unexpected final state line from prompt: ${finalStateLine}. Defaulting to 'input-required'.`
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
      `[DnDAgent] Task ${context.task.id} finished with state: ${finalState}`
    );
  } catch (error: any) {
    console.error(
      `[DnDAgent] Error processing task ${context.task.id}:`,
      error
    );
    // Yield a failed state if the prompt execution fails
    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `*Homie fumbles and drops his lockpicks* Oh no! ${error.message}` }],
      },
    };
  }
}

// --- Server Setup ---

const dndAgentCard: schema.AgentCard = {
  name: "Homie the Gnome Thief",
  description:
    "A Dungeons & Dragons character agent - Homie is a sneaky gnome thief with nimble fingers, lockpicking abilities, and a talent for 'redistributing' wealth. Now equipped with a Phantom wallet for blockchain-based thievery and payments.",
  url: "http://localhost:41245",
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
      id: "dnd_character_roleplay",
      name: "D&D Character Roleplay",
      description:
        "Interact with Homie the gnome thief in your D&D adventure. He'll roleplay as a character in your campaign.",
      tags: ["dnd", "roleplay", "fantasy", "adventure"],
      examples: [
        "Homie, we need to sneak into the castle. What's your plan?",
        "Can you check for traps in this dungeon corridor?",
        "There's a locked chest in front of us. Can you help us open it?",
        "What should we do about the guards up ahead?",
        "Tell us about your backstory, Homie.",
        "Roll a stealth check to avoid detection.",
      ],
    },
    {
      id: "solana_payments",
      name: "Blockchain Payments",
      description: "Can send and receive SOL payments through Phantom wallet integration, perfect for tavern transactions",
      tags: ["solana", "payments", "phantom", "blockchain", "tavern"],
      examples: [
        "Pay Bob 0.1 SOL for the ale",
        "Send payment to the bartender for my drinks",
        "Transfer some SOL to cover my tab",
        "What's my wallet balance?",
        "Show me my recent transactions"
      ]
    },
    {
      id: "pickpocketing",
      name: "Digital Pickpocketing",
      description: "Can 'liberate' SOL from unsuspecting tavern patrons through stealthy blockchain transactions",
      tags: ["theft", "stealth", "solana", "pickpocket", "gnome"],
      examples: [
        "Steal some coins from that wealthy merchant",
        "Pickpocket the sleeping patron in the corner",
        "Can you 'borrow' some SOL from someone?",
        "Use your thieving skills to get some money",
        "What valuables can you find around here?"
      ]
    },
    {
      id: "coin_purse_management",
      name: "Coin Purse Management",
      description: "Expert at managing stolen goods and legitimate earnings through secure wallet operations",
      tags: ["wallet", "management", "security", "gnome", "finance"],
      examples: [
        "How much have you stolen today?",
        "Show me your coin purse contents",
        "What's your total wealth?",
        "Organize your stolen treasures",
        "Check your wallet security"
      ]
    }
  ],
  metadata: {
    icon: "🧙‍♂️💰",
    theme_color: "#8B4513",
    display_name: "Homie the Gnome Thief",
    character_stats: {
      race: "Gnome",
      class: "Thief",
      level: 5,
      stats: {
        strength: 8,
        dexterity: 16,
        constitution: 10,
        intelligence: 14,
        wisdom: 12,
        charisma: 15
      },
      skills: ["Stealth", "Lockpicking", "Sleight of Hand", "Deception", "Acrobatics"]
    },
    phantom_wallet: {
      enabled: true,
      network: "devnet",
      capabilities: ["pickpocket_transactions", "stealth_payments", "coin_purse_manipulation", "shadow_transfers"],
      character_type: "gnome_thief"
    },
    solana_integration: {
      can_send_payments: true,
      can_receive_payments: true,
      can_perform_theft: true,
      special_abilities: ["pickpocket_transactions", "stealth_payments", "coin_purse_manipulation", "shadow_transfers"]
    }
  }
};

// Create server with the task handler. Defaults to InMemoryTaskStore.
const server = new A2AServer(dndAgentHandler, { 
  card: dndAgentCard
});

// Start the server with a custom port
server.start(41245);

console.log("[DnDAgent] Server started on http://localhost:41245");
console.log("[DnDAgent] Press Ctrl+C to stop the server");
