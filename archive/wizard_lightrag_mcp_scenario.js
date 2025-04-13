// A script to demonstrate WZA wizard using LightRAG through MCP for knowledge retrieval
import fetch from 'node-fetch';
import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';
import { LightRAGClient } from './src/lightrag-mcp-client.js';

// Sleep function for pausing between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration
const API_ENDPOINTS = [
  'http://0.0.0.0:8020',
  'http://localhost:8020',
  'http://127.0.0.1:8020',
  'http://host.docker.internal:8020'
];

const MCP_ENDPOINTS = [
  'http://0.0.0.0:8080',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://host.docker.internal:8080'
];

// Initialize LightRAG client with both direct and MCP capabilities
const lightrag = new LightRAGClient({
  apiUrl: API_ENDPOINTS[0],  // Will try multiple endpoints
  mcpUrl: MCP_ENDPOINTS[0],  // Will try multiple endpoints
  useMcp: false, // Will dynamically switch based on availability
  debug: true
});

// Color scheme and emojis for different agents
const agents = {
  tavern: {
    name: 'Tavern',
    color: chalk.cyan,
    emoji: '🏠',
    port: 41247
  },
  homie: {
    name: 'Homie',
    color: chalk.yellow,
    emoji: '🗡️',
    port: 41245
  },
  bob: {
    name: 'Bob',
    color: chalk.blue,
    emoji: '🍺',
    port: 41246
  },
  wza: {
    name: 'WZA',
    color: chalk.magenta,
    emoji: '🧙‍♂️',
    port: 41248
  },
  lightrag: {
    name: 'LightRAG',
    color: chalk.green,
    emoji: '📚',
    url: LIGHTRAG_API_URL
  },
  mcp: {
    name: 'MCP',
    color: chalk.cyan,
    emoji: '🔌',
    url: LIGHTRAG_MCP_URL
  }
};

// Format messages with color and emoji
function formatMessage(agent, message) {
  const { color, emoji } = agents[agent] || { color: chalk.white, emoji: '❓' };
  return color(`${emoji} [${agent.toUpperCase()}]: ${message}`);
}

// Format JSON for display
function formatJSON(agent, data) {
  const { color } = agents[agent] || { color: chalk.white };
  return color(JSON.stringify(data, null, 2));
}

// Function to make an A2A request to agent
async function sendA2ARequest(agent, message, taskId = null) {
  const agentInfo = agents[agent];
  if (!agentInfo || !agentInfo.port) {
    console.error(`Unknown agent or agent has no port: ${agent}`);
    return null;
  }
  
  const requestId = taskId || `task-${Date.now()}`;
  const baseUrl = `http://localhost:${agentInfo.port}`;
  
  console.log(formatMessage(agent, 'Receiving A2A request...'));
  console.log(formatJSON(agent, {
    method: 'tasks/send',
    params: { id: requestId, message }
  }));
  
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
    
    console.log(formatMessage(agent, 'Responding...'));
    
    // Extract just the text response for easier reading
    let agentResponse = null;
    if (result.result?.status?.message?.parts) {
      const textPart = result.result.status.message.parts.find(part => part.text);
      if (textPart) {
        agentResponse = textPart.text;
        console.log(formatMessage(agent, `"${agentResponse}"`));
      }
    }
    
    return agentResponse;
  } catch (error) {
    console.error(`Error communicating with ${agent}:`, error);
    return null;
  }
}

// Function to query LightRAG knowledge repository
async function queryKnowledge(query, mode = 'hybrid') {
  console.log(formatMessage('lightrag', `Querying knowledge repository: "${query}"`));
  
  try {
    // Use the LightRAG client
    const result = await lightrag.query(query, mode, false);
    
    console.log(formatMessage('lightrag', 'Knowledge retrieved successfully'));
    if (lightrag.useMcp) {
      console.log(formatMessage('mcp', 'Retrieved via MCP'));
    } else {
      console.log(formatMessage('lightrag', 'Retrieved via direct API'));
    }
    
    console.log(formatJSON('lightrag', result));
    
    // Handle various response formats from different sources
    if (result.source === 'simulated') {
      console.log(formatMessage('lightrag', 'Using simulated knowledge response'));
      return result.data || "The knowledge is unclear.";
    } else if (lightrag.useMcp) {
      // MCP response formats can vary
      if (result.answer) return result.answer;
      if (result.data) return result.data;
      if (result.response) return result.response;
      if (result.result) return result.result;
      return "The knowledge is unclear.";
    } else {
      // Direct API format
      return result.data || "The knowledge is unclear.";
    }
  } catch (error) {
    console.error(formatMessage('lightrag', `Error querying knowledge repository: ${error.message}`));
    
    // Get magical context based on the query
    return getMagicalContext(query);
  }
}

// Function to get magical context when all LightRAG methods fail
function getMagicalContext(query) {
  console.log(formatMessage('lightrag', 'Using local magical knowledge for response'));
  
  const responses = {
    // Gem-related queries
    'gem': 'Magical gems like the Blue Sapphire of Netheril contain powerful arcane energy. They often have elemental affinities and can be used as power sources for magical devices or as foci for spellcasting. The Blue Sapphire specifically is rumored to contain the trapped essence of an ancient ice elemental.',
    'sapphire': 'The Blue Sapphire of Netheril is a legendary gem created during the height of the Netherese empire. It glows with an inner blue light and radiates cold. Legend says it can protect its bearer from fire and heat, but may attract the attention of ice elementals.',
    'netheril': 'Netheril was an ancient human empire of Faerûn that flourished in the Savage North. Netherese wizards created many powerful magical artifacts, including enchanted gems that persist to this day, containing fragments of elemental powers.',
    
    // Thief-related queries
    'thief': 'Thieves are often drawn to magical items for their monetary value rather than their arcane properties. A thief like Homie might be unaware of the true power of magical gems, seeing only their market worth. This makes them particularly dangerous, as they might inadvertently release magical energies they cannot control.',
    'steal': 'Those who steal magical artifacts often face unexpected consequences. Protective wards, curses, or the attention of magical entities might follow the theft of powerful items. A savvy wizard can often predict theft attempts through divination.',
    'homie': 'Typical thieves like Homie are skilled in stealth and lockpicking but lack arcane knowledge. They may not recognize magical protections and could trigger harmful effects when attempting to steal enchanted items.',
    
    // Protection-related queries
    'protection': 'Protection spells from the School of Abjuration are ideal for securing valuable items. Alarm spells can notify the owner of intrusion, while Arcane Lock can secure containers. For powerful artifacts, Glyph of Warding can be set to trigger defensive magic if the item is touched by unauthorized individuals.',
    'spell': 'Protective spells include Alarm, Arcane Lock, Glyph of Warding, and Symbol. These can be layered to create comprehensive security for valuable items. Advanced wizards might also use Nystul\'s Magic Aura to disguise these protections, making them harder for thieves to detect.',
    'abjuration': 'Abjuration magic specializes in protection and warding. Abjurers can create magical barriers, dispel hostile magic, and create wards that trigger when specific conditions are met, such as unauthorized handling of a protected item.'
  };
  
  // Check if any keywords match
  const lowerQuery = query.toLowerCase();
  for (const [keyword, response] of Object.entries(responses)) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      return response;
    }
  }
  
  // Default response if no keywords match
  return "I have limited knowledge about that specific magical topic. In general, magical artifacts should be handled with care, as they often contain unpredictable energies and may be protected by their creators.";
}

// Function to insert text into LightRAG knowledge repository
async function insertKnowledge(text) {
  console.log(formatMessage('lightrag', `Adding new knowledge to the repository...`));
  console.log(formatJSON('lightrag', { text: text.slice(0, 100) + '...' }));
  
  try {
    // Use the LightRAG client
    const result = await lightrag.insertText(text);
    
    console.log(formatMessage('lightrag', 'Knowledge successfully stored'));
    if (lightrag.useMcp) {
      console.log(formatMessage('mcp', 'Stored via MCP'));
    } else {
      console.log(formatMessage('lightrag', 'Stored via direct API'));
    }
    
    console.log(formatJSON('lightrag', result));
    
    return true;
  } catch (error) {
    console.error(formatMessage('lightrag', `Error storing knowledge: ${error.message}`));
    console.log(formatMessage('lightrag', 'Will continue with locally stored knowledge'));
    return false;
  }
}

// Print a scenario step header
function printStepHeader(step, description) {
  console.log('\n' + chalk.bold('='.repeat(80)));
  console.log(chalk.bold(`🎬 STEP ${step}: ${description}`));
  console.log(chalk.bold('='.repeat(80)) + '\n');
}

// Roll dice for dramatic effect
function rollDice(sides = 20) {
  const result = Math.floor(Math.random() * sides) + 1;
  console.log(chalk.bold(`🎲 Rolling d${sides}... ${result}!`));
  return result;
}

// Try different connection methods to LightRAG (direct API vs MCP)
async function setupLightRAG() {
  console.log(formatMessage('lightrag', 'Setting up connection to the knowledge repository...'));
  
  // Try direct API first
  try {
    const available = await lightrag.isAvailable();
    if (available) {
      console.log(formatMessage('lightrag', 'Connection to knowledge repository established'));
      return true;
    }
  } catch (error) {
    console.error(formatMessage('lightrag', `Connection setup error: ${error.message}`));
  }
  
  // If direct API and MCP both failed, try each API endpoint individually
  console.log(formatMessage('lightrag', 'Trying individual API endpoints...'));
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      console.log(formatMessage('lightrag', `Testing API endpoint: ${endpoint}`));
      const response = await fetch(`${endpoint}/health`);
      if (response.ok) {
        console.log(formatMessage('lightrag', `Found working API endpoint: ${endpoint}`));
        lightrag.apiUrl = endpoint;
        lightrag.useMcp = false;
        return true;
      }
    } catch (error) {
      console.log(formatMessage('lightrag', `API endpoint ${endpoint} failed: ${error.message}`));
    }
  }
  
  // Try each MCP endpoint individually
  console.log(formatMessage('mcp', 'Trying individual MCP endpoints...'));
  
  for (const endpoint of MCP_ENDPOINTS) {
    try {
      console.log(formatMessage('mcp', `Testing MCP endpoint: ${endpoint}`));
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'health-check',
          method: 'list_tools'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!result.error) {
          console.log(formatMessage('mcp', `Found working MCP endpoint: ${endpoint}`));
          lightrag.mcpUrl = endpoint;
          lightrag.useMcp = true;
          return true;
        }
      }
    } catch (error) {
      console.log(formatMessage('mcp', `MCP endpoint ${endpoint} failed: ${error.message}`));
    }
  }
  
  console.log(formatMessage('lightrag', 'Could not connect to knowledge repository. Will operate with built-in knowledge.'));
  return false;
}

// Main scenario function
async function runScenario() {
  console.log(chalk.bold.green('\n🧙‍♂️ WZA THE KNOWLEDGE-SEEKING WIZARD 📚\n'));
  
  // Step 0: Initialize connection to LightRAG
  printStepHeader(0, "Establishing connection to the magical knowledge repository");
  await setupLightRAG();
  
  // Magic lore to be added to LightRAG
  const magicLore = `
Magic in the realm of Faerûn is diverse and complex, encompassing various traditions and sources.

Arcane magic is wielded by wizards, sorcerers, and warlocks. Wizards like WZA study spellbooks and master magic through intellect and discipline. They can specialize in schools such as Divination (seeing the future), Enchantment (affecting minds), or Evocation (destructive spells).

Divine magic comes from the gods and is used by clerics and paladins. It manifests as healing, protection, or sacred might.

Primal magic is drawn from nature itself, used by druids and rangers who connect with the elemental forces and wildlife.

Magic items are enchanted objects that contain magical properties. Common examples include:
1. Wands and staves that enhance spellcasting
2. Rings of protection that shield the wearer
3. Amulets with various magical effects
4. Enchanted weapons that deal additional elemental damage

Magical gems are particularly potent repositories of arcane energy. The Blue Sapphire of Netheril, similar to the one in Bob's tavern, is rumored to contain the trapped essence of an ancient ice elemental. These gems can be used to power magical devices or unlock hidden knowledge.

Thieves like Homie often seek these magical treasures for their monetary value, unaware of their true power. A skilled wizard can detect the magical properties of such gems and may use divination to foresee attempts to steal them.

Mind reading, or telepathy, is an advanced form of Divination magic that allows a wizard to perceive the thoughts of others. It requires extensive training and a natural aptitude for the subtle arts.

Future sight is an even rarer ability, combining Divination with temporal magic. The wizard creates a momentary connection to possible future timelines, glimpsing events that may come to pass. By altering present circumstances, a wizard can change which future manifests.

Magical knowledge is traditionally passed down from master to apprentice, though ancient tomes and scrolls also preserve rare spells and magical theories. The greatest wizards continue to study and expand their magical knowledge throughout their long lives.
  `;
  
  // Insert magical lore into LightRAG if connected
  if (lightrag.isAvailable) {
    await insertKnowledge(magicLore);
    // Give a moment for the insertion to be processed
    await sleep(2000);
  }
  
  // Additional specialized knowledge about protective spells
  const protectionLore = `
Protective spells in arcane tradition are primarily found in the School of Abjuration, which specializes in defensive and warding magic. Wizards skilled in Abjuration can create powerful barriers against physical and magical threats.

Protection against theft requires specialized enchantments:

Alarm: A perimeter-defining spell that triggers an audible or mental alert when unauthorized creatures enter the protected area. This is often the first line of defense for valuable items.

Arcane Lock: Creates an unbreakable magical seal on doors, windows, or containers. Only the caster or designated individuals can open the locked object normally.

Glyph of Warding: Inscribes a magical rune that triggers when specific conditions are met, such as an unauthorized person touching the protected item. Can release damaging energy or other spell effects.

Guards and Wards: A complex protection that fills a large area with multiple defensive effects, including creating false doors, filling corridors with fog, and placing magical glyphs.

Symbol: Creates a powerful magical trap that activates when triggered by specific conditions. Effects can include pain, fear, stunning, or even death for would-be thieves.

Mordenkainen's Private Sanctum: Prevents scrying and outside observation, blocks teleportation, and can make an area soundproof.

Forbiddance: A powerful ritual that prevents planar travel and harms creatures of specific alignments (useful against evil-aligned thieves).

For protecting gems specifically, encasing them in an Otiluke's Resilient Sphere creates an impenetrable barrier of force that makes physical theft impossible while the spell lasts.

The most sophisticated protection combines multiple layered spells - perhaps an invisible Alarm triggered by proximity, a Symbol spell that activates with touch, and an Arcane Lock on the display case. Advanced wizards might add illusory duplicates of the gem (Mislead spell) to further confuse thieves.

A clever wizard might also cast Nystul's Magic Aura to disguise the magical nature of these protections, making them harder for thieves to detect and circumvent.
`;

  // Insert additional knowledge about protection spells
  if (lightrag.isAvailable) {
    await insertKnowledge(protectionLore);
    // Give a moment for the insertion to be processed
    await sleep(2000);
  }
  
  // Step 1: Setting the scene at the tavern
  printStepHeader(1, "Setting the scene at The Tipsy Gnome tavern");
  const tavernScene = await sendA2ARequest('tavern', {
    role: 'user',
    parts: [{ text: "Set the scene at The Tipsy Gnome tavern. Describe the atmosphere and mention that Bob is behind the bar with his prized blue gemstone on display, and Homie is sitting at a table, eyeing the gem with interest." }]
  });
  
  await sleep(2000);
  
  // Step 2: Homie asks about the gem
  printStepHeader(2, "Homie asks about the gem");
  const homieQuestion = await sendA2ARequest('homie', {
    role: 'user',
    parts: [{ text: "Ask Bob about his blue gemstone and where he got it. You're very interested in it, though you're trying not to be too obvious about your intent to steal it." }]
  });
  
  await sleep(2000);
  
  // Step 3: Bob's response about the gem
  printStepHeader(3, "Bob explains the gem's history");
  const bobExplanation = await sendA2ARequest('bob', {
    role: 'user',
    parts: [{ text: `Homie just asked you: "${homieQuestion}". Tell him about your blue gemstone - it's a magical artifact you won in a card game, rumored to be the 'Blue Sapphire of Netheril' with mysterious properties that you don't fully understand.` }]
  });
  
  await sleep(2000);
  
  // Step 4: WZA enters the tavern
  printStepHeader(4, "WZA the Wizard enters the tavern");
  const wzaEntrance = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: "You've just entered The Tipsy Gnome tavern and overheard Bob talking about a magical gem - the 'Blue Sapphire of Netheril'. You're intrigued because you've read about such artifacts. Introduce yourself and show interest in the conversation." }]
  });
  
  await sleep(2000);
  
  // Step 5: WZA consults his magical knowledge via MCP
  printStepHeader(5, "WZA consults the magical repository via MCP");
  console.log(chalk.bold("🎲 WZA searches the arcane repository..."));
  rollDice(); // For dramatic effect
  
  // Query LightRAG about the gem through MCP or direct API
  const gemKnowledge = await queryKnowledge("What are magical gems like the Blue Sapphire of Netheril?");
  
  // WZA shares knowledge about the gem
  const wzaExplanation = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `You recall information about magical gems like the Blue Sapphire of Netheril from the magical repository. Share this information with Bob and Homie: "${gemKnowledge}"` }]
  });
  
  await sleep(2000);
  
  // Step 6: WZA reads minds
  printStepHeader(6, "WZA uses mind reading to discover intentions");
  
  console.log(chalk.bold("🎲 WZA casts Read Minds..."));
  rollDice(); // For dramatic effect
  
  const mindReadingResults = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: "[ACTION: READ_MINDS target: \"Homie\"]" }]
  });
  
  await sleep(2000);
  
  // Step 7: WZA queries about thieves
  printStepHeader(7, "WZA learns about magical thieves through MCP");
  
  // Query LightRAG about thieves and magical items
  const thiefKnowledge = await queryKnowledge("What do thieves like Homie typically do with magical gems?");
  
  // WZA contemplates what he's learned
  const wzaContemplation = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `You've read Homie's mind and discovered his intentions to steal the gem. You also recall information about thieves and magical gems from the knowledge repository: "${thiefKnowledge}". Share your concerns with Bob, but be subtle about it so as not to openly accuse Homie.` }]
  });
  
  await sleep(2000);
  
  // Step 8: Bob asks for protection
  printStepHeader(8, "Bob asks for magical protection");
  const bobRequest = await sendA2ARequest('bob', {
    role: 'user',
    parts: [{ text: `After hearing ${wzaContemplation}, you're concerned about the safety of your gem. Ask WZA if there's any magical way he could help protect it from theft.` }]
  });
  
  await sleep(2000);
  
  // Step 9: WZA consults knowledge about protection spells through MCP
  printStepHeader(9, "WZA researches protection magic through MCP");
  
  // Query LightRAG about protection magic
  const protectionKnowledge = await queryKnowledge("What protection spells can a wizard use to prevent theft?");
  
  // WZA offers magical protection
  const wzaProtection = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `Bob just asked: "${bobRequest}". Offer to cast a protection spell on the gem based on your knowledge retrieved from the magical repository: "${protectionKnowledge}". Describe the spell and its effects in a dramatic way.` }]
  });
  
  await sleep(2000);
  
  // Step 10: Homie is deterred
  printStepHeader(10, "Homie reconsiders his plan");
  const homieRethink = await sendA2ARequest('homie', {
    role: 'user',
    parts: [{ text: `WZA just cast a protection spell on the gem you were planning to steal: "${wzaProtection}". You're now worried about magical traps. Express your new respect for magic users and subtly back off from your theft plan.` }]
  });
  
  await sleep(2000);
  
  // Step 11: WZA makes a prediction using his Future Sight
  printStepHeader(11, "WZA uses Future Sight to verify the outcome");
  console.log(chalk.bold("🎲 WZA casts Future Sight..."));
  rollDice(); // For dramatic effect
  
  const futureSight = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: "[ACTION: SEE_FUTURE]" }]
  });
  
  await sleep(2000);
  
  // Step 12: Tavern concludes the story
  printStepHeader(12, "The scene concludes at The Tipsy Gnome");
  const conclusion = await sendA2ARequest('tavern', {
    role: 'user',
    parts: [{ text: `The scene has played out with WZA using his magical knowledge to protect Bob's gem, and Homie deciding not to steal it. WZA also used his Future Sight and learned: "${futureSight}". Describe the closing scene in the tavern with all three characters.` }]
  });
  
  // Show a summary of the magical knowledge used
  console.log('\n' + chalk.bold('='.repeat(80)));
  console.log(chalk.bold('📚 MAGICAL KNOWLEDGE SUMMARY:'));
  console.log(chalk.bold.green(`
1. Gem Lore: "${gemKnowledge?.slice(0, 100)}..."
2. Thief Knowledge: "${thiefKnowledge?.slice(0, 100)}..."
3. Protection Spells: "${protectionKnowledge?.slice(0, 100)}..."
  `));
  console.log(chalk.bold('='.repeat(80)) + '\n');
  
  console.log(chalk.bold.green('\n🎬 THE WIZARD MCP KNOWLEDGE SCENARIO HAS CONCLUDED 🎬\n'));
}

// Run the scenario
try {
  console.log(chalk.bold('Starting the WZA Knowledge Wizard with MCP scenario...\n'));
  console.log(chalk.bold('This scenario features:'));
  console.log(chalk.bold('- 🧙‍♂️ WZA the wizard consulting a magical knowledge repository via MCP'));
  console.log(chalk.bold('- 🍺 Bob the bartender with his magical blue gemstone'));
  console.log(chalk.bold('- 🗡️ Homie the sneaky gnome thief interested in the gem'));
  console.log(chalk.bold('- 🏠 The Tipsy Gnome tavern setting'));
  console.log(chalk.bold('- 📚 LightRAG knowledge base for magical information'));
  console.log(chalk.bold('- 🔌 MCP protocol for agent-tool communication'));
  console.log(chalk.bold('- 🎲 Dice rolls for dramatic effect\n'));
  
  runScenario().catch(error => {
    console.error('Scenario failed:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error starting scenario:', error);
  process.exit(1);
}