import { A2AServer, } from "../../server/index.js";
import { ai } from "./genkit.js";
// Load the prompt defined in bob_agent.prompt
const bobAgentPrompt = ai.prompt("bob_agent");
/**
 * Task Handler for Bob the Bartender agent.
 */
async function* bobAgentHandler(context) {
    console.log(`[BobAgent] Processing task ${context.task.id} with state ${context.task.status.state}`);
    // Yield an initial "working" status
    yield {
        state: "working",
        message: {
            role: "agent",
            parts: [{ text: "*Bob polishes a mug with his apron* What can I getcha?" }],
        },
    };
    // Prepare messages for Genkit prompt using the full history from context
    const messages = (context.history ?? [])
        .map((m) => ({
        role: (m.role === "agent" ? "model" : "user"),
        content: m.parts
            .filter((p) => !!p.text)
            .map((p) => ({
            text: p.text,
        })),
    }))
        .filter((m) => m.content.length > 0);
    // Add a check in case history was empty or only contained non-text parts
    if (messages.length === 0) {
        console.warn(`[BobAgent] No valid text messages found in history for task ${context.task.id}. Cannot proceed.`);
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
    const character = context.task.metadata?.character;
    const tavernState = context.task.metadata?.tavernState;
    const characterGoal = context.task.metadata?.goal;
    try {
        // Run the Genkit prompt
        const response = await bobAgentPrompt({
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
        }, {
            messages,
        });
        const responseText = response.text;
        const lines = responseText.trim().split("\n");
        const finalStateLine = lines.at(-1)?.trim().toUpperCase();
        const agentReply = lines
            .slice(0, lines.length - 1)
            .join("\n")
            .trim();
        let finalState = "unknown";
        // Map prompt output instruction to A2A TaskState
        if (finalStateLine === "COMPLETED") {
            finalState = "completed";
        }
        else if (finalStateLine === "AWAITING_USER_INPUT") {
            finalState = "input-required";
        }
        else {
            console.warn(`[BobAgent] Unexpected final state line from prompt: ${finalStateLine}. Defaulting to 'input-required'.`);
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
        console.log(`[BobAgent] Task ${context.task.id} finished with state: ${finalState}`);
    }
    catch (error) {
        console.error(`[BobAgent] Error processing task ${context.task.id}:`, error);
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
const bobAgentCard = {
    name: "Bob the Bartender",
    description: "A Dungeons & Dragons character agent - Bob is a friendly human bartender at The Tipsy Gnome tavern, with a wealth of knowledge about local gossip and a few stories from his former adventuring days.",
    url: "http://localhost:41246", // Using a different port to avoid conflicts
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
            id: "dnd_bartender_roleplay",
            name: "D&D Bartender Roleplay",
            description: "Interact with Bob the bartender at The Tipsy Gnome tavern. He'll serve drinks, share gossip, and tell tales of his younger adventuring days.",
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
    ],
};
// Create server with the task handler. Defaults to InMemoryTaskStore.
const server = new A2AServer(bobAgentHandler, {
    card: bobAgentCard
});
// Start the server with a custom port
server.start(41246);
console.log("[BobAgent] Server started on http://localhost:41246");
console.log("[BobAgent] Press Ctrl+C to stop the server");
