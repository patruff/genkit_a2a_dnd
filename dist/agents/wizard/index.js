import { A2AServer, } from "../../server/index.js";
import { ai } from "./genkit.js";
import fetch from "node-fetch";
// Load the prompt defined in wizard_agent.prompt
const wzaAgentPrompt = ai.prompt("wizard_agent");
// Store for discovered agents
const discoveredAgents = new Map();
// Define tavern URL
const TAVERN_URL = "http://localhost:41247";
/**
 * Get agent information from the well-known endpoint
 */
async function discoverAgent(agentUrl) {
    try {
        const wellKnownUrl = new URL("/.well-known/agent.json", agentUrl).toString();
        console.log(`[WZA] Attempting to discover agent at: ${wellKnownUrl}`);
        const response = await fetch(wellKnownUrl);
        if (response.ok) {
            const agentCard = await response.json();
            console.log(`[WZA] Successfully discovered agent: ${agentCard.name}`);
            // Log the full agent card for debugging
            console.log(`[WZA] Agent card details: ${JSON.stringify(agentCard, null, 2)}`);
            return agentCard;
        }
        else {
            console.log(`[WZA] Failed to discover agent: HTTP ${response.status}`);
            return null;
        }
    }
    catch (error) {
        console.error(`[WZA] Error discovering agent:`, error);
        // More detailed error logging
        if (error instanceof Error) {
            console.error(`[WZA] Error message: ${error.message}`);
            console.error(`[WZA] Error stack: ${error.stack}`);
        }
        // Try a different approach for debugging - direct hardcoded cards for testing
        console.log(`[WZA] Falling back to hardcoded agent card for URL: ${agentUrl}`);
        // Map ports to agent types for fallback
        const port = new URL(agentUrl).port;
        if (port === "41245") { // Homie
            return {
                name: "Homie the Gnome Thief",
                description: "A sneaky gnome thief who specializes in stealing valuable items.",
                url: "http://localhost:41245",
                provider: { organization: "A2A Samples" },
                version: "0.0.1",
                capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: true },
                authentication: null,
                defaultInputModes: ["text"],
                defaultOutputModes: ["text"],
                skills: [
                    { id: "stealing", name: "Stealing", description: "Expert at stealing valuable items", tags: ["thief", "stealth"] }
                ]
            };
        }
        else if (port === "41246") { // Bob
            return {
                name: "Bob the Bartender",
                description: "A friendly bartender who runs the local tavern.",
                url: "http://localhost:41246",
                provider: { organization: "A2A Samples" },
                version: "0.0.1",
                capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: true },
                authentication: null,
                defaultInputModes: ["text"],
                defaultOutputModes: ["text"],
                skills: [
                    { id: "bartending", name: "Bartending", description: "Expert at mixing drinks and managing the tavern", tags: ["tavern", "service"] }
                ]
            };
        }
        return null;
    }
}
/**
 * Process the READ_MINDS action by fetching agent information from the tavern
 */
async function processReadMindsAction(target) {
    const results = [];
    console.log(`[WZA] Starting mind reading for target: "${target}"`);
    try {
        // Query the tavern for information about the characters
        console.log(`[WZA] Querying tavern at ${TAVERN_URL} for character information`);
        const response = await fetch(TAVERN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tasks/send',
                params: {
                    id: `wza-tavern-query-${Date.now()}`,
                    message: {
                        role: 'user',
                        parts: [{ text: "Tell me about the tavern and who's currently here." }]
                    }
                }
            })
        });
        if (!response.ok) {
            console.error(`[WZA] Failed to query tavern: HTTP ${response.status}`);
            throw new Error(`Failed to query tavern: HTTP ${response.status}`);
        }
        const tavernData = await response.json();
        console.log(`[WZA] Received tavern data: ${JSON.stringify(tavernData, null, 2)}`);
        // Extract tavern state from the response if available
        let tavernState = null;
        let characters = [];
        // Check if the response contains character information
        if (tavernData.result?.metadata?.tavernState ||
            (tavernData.result?.status?.message?.parts &&
                tavernData.result.status.message.parts.some((p) => p.text?.includes('character')))) {
            // If there's explicit tavern state in metadata, use it
            if (tavernData.result?.metadata?.tavernState) {
                tavernState = tavernData.result.metadata.tavernState;
                if (tavernState.characters) {
                    characters = tavernState.characters;
                }
            }
            // As a fallback, extract character information from the text response
            if (characters.length === 0 && tavernData.result?.status?.message?.parts) {
                const textPart = tavernData.result.status.message.parts.find((p) => p.text);
                if (textPart) {
                    // If we got text back but no structured data, we'll manually detect character mentions
                    const text = textPart.text;
                    // Check for Homie
                    if (text.includes('Homie') || text.toLowerCase().includes('gnome') || text.toLowerCase().includes('thief')) {
                        characters.push({
                            name: "Homie",
                            type: "gnome thief",
                            description: "A cheerful gnome thief with nimble fingers and a mischievous smile"
                        });
                    }
                    // Check for Bob
                    if (text.includes('Bob') || text.toLowerCase().includes('bartender') || text.toLowerCase().includes('tavern keeper')) {
                        characters.push({
                            name: "Bob",
                            type: "human bartender",
                            description: "A friendly middle-aged human with a hearty laugh who keeps the tavern running"
                        });
                    }
                }
            }
        }
        // Fallback to default character data if we couldn't get any from the tavern
        if (characters.length === 0) {
            console.log(`[WZA] No character data found in tavern response, using default character information`);
            characters = [
                {
                    name: "Homie",
                    type: "gnome thief",
                    description: "A cheerful gnome thief with nimble fingers and a mischievous smile"
                },
                {
                    name: "Bob",
                    type: "human bartender",
                    description: "A friendly human bartender who runs The Tipsy Gnome tavern"
                }
            ];
        }
        // Filter characters based on target, or include all if target is "all"
        const targetLower = target.toLowerCase();
        let targetCharacters = characters;
        if (targetLower !== "all" && targetLower !== "everyone" && targetLower !== "everybody") {
            targetCharacters = characters.filter(char => char.name.toLowerCase().includes(targetLower) ||
                char.type.toLowerCase().includes(targetLower));
            // If no specific target found, default to all
            if (targetCharacters.length === 0) {
                console.log(`[WZA] Target "${target}" not found, defaulting to all characters`);
                targetCharacters = characters;
            }
        }
        console.log(`[WZA] Will read minds of ${targetCharacters.length} characters: ${targetCharacters.map(c => c.name).join(', ')}`);
        // Process each character
        for (const char of targetCharacters) {
            // Skip self
            if (char.name.toLowerCase() === "wza") {
                console.log(`[WZA] Skipping self in mind reading`);
                continue;
            }
            const charKey = char.name.toLowerCase();
            // Check if already discovered (cache)
            if (discoveredAgents.has(charKey)) {
                console.log(`[WZA] Character ${char.name} already discovered, using cached information`);
                results.push(discoveredAgents.get(charKey));
                continue;
            }
            // Map character data to our format
            const characterInfo = {
                name: char.name,
                description: char.description || "",
                type: char.type || "unknown"
            };
            // Add character-specific information
            if (charKey === "homie" || charKey.includes("homie") || char.type?.toLowerCase().includes("thief")) {
                characterInfo.abilities = "Stealth, Lockpicking, Sleight of Hand";
                characterInfo.role = "Steals valuable items from unsuspecting patrons";
                characterInfo.skills = "Stealing, Sneaking, Deception, Lockpicking";
                characterInfo.personality = "Mischievous, Cunning, Quick-witted";
                characterInfo.goal = "To acquire valuable treasures without being detected";
                console.log(`[WZA] Added Homie-specific information`);
            }
            else if (charKey === "bob" || charKey.includes("bob") || char.type?.toLowerCase().includes("bartender")) {
                characterInfo.abilities = "Perception, Insight, Local Knowledge";
                characterInfo.role = "Runs The Tipsy Gnome tavern, serving drinks and keeping the peace";
                characterInfo.skills = "Bartending, Conversation, Local Knowledge, Perception";
                characterInfo.personality = "Friendly, Observant, Good listener";
                characterInfo.goal = "To keep the tavern running smoothly and protect it from thieves";
                console.log(`[WZA] Added Bob-specific information`);
            }
            // Store and return
            discoveredAgents.set(charKey, characterInfo);
            results.push(characterInfo);
            console.log(`[WZA] Added character to results: ${JSON.stringify(characterInfo)}`);
        }
    }
    catch (error) {
        console.error(`[WZA] Error in processReadMindsAction:`, error);
        // Fallback to basic character information if tavern query fails
        console.log(`[WZA] Using fallback character information`);
        const fallbackCharacters = [
            {
                name: "Homie the Gnome Thief",
                description: "A sneaky gnome thief who specializes in stealing valuable items",
                abilities: "Stealth, Lockpicking, Sleight of Hand",
                role: "Steals valuable items from unsuspecting patrons",
                skills: "Stealing, Sneaking, Deception, Lockpicking",
                personality: "Mischievous, Cunning, Quick-witted",
                goal: "To acquire valuable treasures without being detected"
            },
            {
                name: "Bob the Bartender",
                description: "A friendly bartender who runs the local tavern",
                abilities: "Perception, Insight, Local Knowledge",
                role: "Runs The Tipsy Gnome tavern, serving drinks and keeping the peace",
                skills: "Bartending, Conversation, Local Knowledge, Perception",
                personality: "Friendly, Observant, Good listener",
                goal: "To keep the tavern running smoothly and protect it from thieves"
            }
        ];
        results.push(...fallbackCharacters);
    }
    console.log(`[WZA] Final mind reading results: ${JSON.stringify(results, null, 2)}`);
    return results;
}
/**
 * Task Handler for the WZA mind-reading agent.
 */
async function* wzaAgentHandler(context) {
    console.log(`[WZA] Processing task ${context.task.id} with state ${context.task.status.state}`);
    // Yield an initial "working" status
    yield {
        state: "working",
        message: {
            role: "agent",
            parts: [{ text: "*WZA's eyes glow with a soft blue light as arcane runes circle around the wizard's staff* What thoughts shall I uncover for you today?" }],
        },
    };
    // Prepare messages for Genkit prompt
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
    // Add a check in case history was empty
    if (messages.length === 0) {
        console.warn(`[WZA] No valid text messages found in history for task ${context.task.id}.`);
        yield {
            state: "failed",
            message: {
                role: "agent",
                parts: [{ text: "*WZA's concentration breaks* The threads of our conversation seem to have been lost in the ether..." }],
            },
        };
        return; // Stop processing
    }
    // Get character info and goal from metadata
    const character = context.task.metadata?.character;
    const characterGoal = context.task.metadata?.goal;
    try {
        // Extract the latest user message to check for actions
        const lastMessage = context.userMessage.parts
            .filter((p) => !!p.text)
            .map(p => p.text)
            .join("\n");
        // Check for READ_MINDS action
        const readMindsMatch = lastMessage.match(/\[\s*ACTION\s*:\s*READ_MINDS\s+target\s*:\s*"([^"]+)"\s*\]/i);
        // Check user intent for mind reading
        const userRequest = messages.length > 0 ?
            messages[messages.length - 1].content.map(c => c.text).join('').toLowerCase() : '';
        const isUserRequestingMindReading = userRequest.includes('read mind') ||
            userRequest.includes('about the people') ||
            userRequest.includes('tell me about') ||
            userRequest.includes('what can you tell') ||
            userRequest.includes('who') ||
            userRequest.includes('tavern');
        // Process based on the detected action or intent
        let discoveredAgentsList = [];
        // Check if user is requesting mind reading (either explicitly or implicitly)
        if (readMindsMatch || isUserRequestingMindReading) {
            // Default to reading all minds if not specified
            const target = readMindsMatch ? readMindsMatch[1] : "all";
            console.log(`[WZA] Processing mind reading for target: ${target} (explicit action: ${!!readMindsMatch})`);
            // Fetch agent information from the tavern
            discoveredAgentsList = await processReadMindsAction(target);
            console.log(`[WZA] Sending discovered agents to LLM prompt: ${JSON.stringify(discoveredAgentsList, null, 2)}`);
        }
        // Run the prompt with discovered information
        const response = await wzaAgentPrompt({
            character: character || {
                name: "WZA",
                race: "Human",
                class: "Wizard",
                level: 12,
                stats: {
                    strength: 8,
                    dexterity: 10,
                    constitution: 12,
                    intelligence: 18,
                    wisdom: 16,
                    charisma: 14
                },
                skills: ["Arcana", "Insight", "History", "Perception", "Investigation", "Mind Reading"]
            },
            goal: characterGoal || "Understand the motivations of those around you in The Tipsy Gnome tavern",
            discovered_agents: discoveredAgentsList,
            now: new Date().toISOString()
        }, { messages });
        const responseText = response.text;
        const lines = responseText.trim().split("\n");
        const finalStateLine = lines.at(-1)?.trim().toUpperCase();
        const agentReply = lines
            .slice(0, lines.length - 1)
            .join("\n")
            .trim();
        let finalState = "unknown";
        if (finalStateLine === "COMPLETED") {
            finalState = "completed";
        }
        else if (finalStateLine === "AWAITING_USER_INPUT") {
            finalState = "input-required";
        }
        else {
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
    }
    catch (error) {
        console.error(`[WZA] Error:`, error);
        yield {
            state: "failed",
            message: {
                role: "agent",
                parts: [{ type: "text", text: `*WZA's spell fizzles as arcane energy dissipates* My mind reading powers are failing me: ${error.message}` }],
            },
        };
    }
}
// --- Server Setup ---
const wzaAgentCard = {
    name: "WZA",
    description: "A Dungeons & Dragons character agent - A wise and perceptive wizard with mystical mind reading abilities who can perceive the thoughts and motivations of those around them.",
    url: "http://localhost:41248",
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
            id: "mind_reading",
            name: "Mind Reading",
            description: "Can perceive the motivations, goals, and abilities of other characters",
            tags: ["dnd", "wizard", "perception", "arcana"],
            examples: [
                "What can you tell me about the people in this tavern?",
                "Use your mind reading powers on Homie.",
                "What are the motivations of Bob?",
                "Can you read everyone's mind and tell me what they're thinking?",
                "Observe the interactions between the characters and give me your insights.",
            ],
        }
    ],
    metadata: {
        icon: "🧙‍♂️", // Wizard emoji
        theme_color: "#9966CC", // Mystical purple
        display_name: "WZA",
    }
};
// Create server with the task handler
const server = new A2AServer(wzaAgentHandler, {
    card: wzaAgentCard
});
// Start the server on port 41248
server.start(41248);
console.log("[WZA] Server started on http://localhost:41248");
console.log("[WZA] Press Ctrl+C to stop the server");
