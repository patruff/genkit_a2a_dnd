// A script to demonstrate WZA wizard using LightRAG MCP for knowledge retrieval
import fetch from 'node-fetch';
import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';

// Sleep function for pausing between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration
const LIGHTRAG_API_URL = 'http://localhost:8020';

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

// Function to query LightRAG
async function queryLightRAG(query, mode = 'hybrid') {
  console.log(formatMessage('lightrag', `Querying knowledge base: "${query}"`));
  
  try {
    const response = await fetch(`${LIGHTRAG_API_URL}/query`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        query,
        mode,
        only_need_context: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(formatMessage('lightrag', 'Knowledge retrieved successfully'));
    console.log(formatJSON('lightrag', result));
    
    return result.data;
  } catch (error) {
    console.error(formatMessage('lightrag', `Error querying knowledge base: ${error.message}`));
    return "I cannot access that knowledge at the moment.";
  }
}

// Function to insert text into LightRAG
async function insertTextToLightRAG(text) {
  console.log(formatMessage('lightrag', `Adding new knowledge to the repository...`));
  console.log(formatJSON('lightrag', { text: text.slice(0, 100) + '...' }));
  
  try {
    const response = await fetch(`${LIGHTRAG_API_URL}/insert`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(formatMessage('lightrag', 'Knowledge successfully stored'));
    console.log(formatJSON('lightrag', result));
    
    return true;
  } catch (error) {
    console.error(formatMessage('lightrag', `Error storing knowledge: ${error.message}`));
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

// Main scenario function
async function runScenario() {
  console.log(chalk.bold.green('\n🧙‍♂️ WZA THE KNOWLEDGE-SEEKING WIZARD 📚\n'));
  
  // Step 0: Initialize LightRAG with magic lore
  printStepHeader(0, "Preparing the magical knowledge repository");
  
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
  
  // Check if LightRAG is available
  try {
    const health = await fetch(`${LIGHTRAG_API_URL}/health`);
    if (health.ok) {
      console.log(formatMessage('lightrag', 'Knowledge repository is accessible'));
      
      // Insert magical lore into LightRAG
      await insertTextToLightRAG(magicLore);
    } else {
      throw new Error(`Health check returned status ${health.status}`);
    }
  } catch (err) {
    console.error(formatMessage('lightrag', 'Knowledge repository is not available. Please make sure LightRAG is running on http://localhost:8020'));
    console.log(formatMessage('lightrag', 'Continuing with local knowledge only...'));
  }
  
  // Give a moment for the insertion to be processed
  await sleep(2000);
  
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
  
  // Step 5: WZA consults his magical knowledge
  printStepHeader(5, "WZA consults his magical knowledge");
  console.log(chalk.bold("🎲 WZA searches his arcane memory..."));
  rollDice(); // For dramatic effect
  
  // Query LightRAG about the gem
  const gemKnowledge = await queryLightRAG("What are magical gems like the Blue Sapphire of Netheril?");
  
  // WZA shares knowledge about the gem
  const wzaExplanation = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `You recall information about magical gems like the Blue Sapphire of Netheril. Share this information with Bob and Homie: "${gemKnowledge}"` }]
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
  printStepHeader(7, "WZA learns about magical thieves");
  
  // Query LightRAG about thieves and magical items
  const thiefKnowledge = await queryLightRAG("What do thieves like Homie typically do with magical gems?");
  
  // WZA contemplates what he's learned
  const wzaContemplation = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `You've read Homie's mind and discovered his intentions to steal the gem. You also recall information about thieves and magical gems: "${thiefKnowledge}". Share your concerns with Bob, but be subtle about it so as not to openly accuse Homie.` }]
  });
  
  await sleep(2000);
  
  // Step 8: Bob asks for protection
  printStepHeader(8, "Bob asks for magical protection");
  const bobRequest = await sendA2ARequest('bob', {
    role: 'user',
    parts: [{ text: `After hearing ${wzaContemplation}, you're concerned about the safety of your gem. Ask WZA if there's any magical way he could help protect it from theft.` }]
  });
  
  await sleep(2000);
  
  // Step 9: WZA consults knowledge about protection spells
  printStepHeader(9, "WZA researches protection magic");
  
  // Query LightRAG about protection magic
  const protectionKnowledge = await queryLightRAG("What protection spells can a wizard use to prevent theft?");
  
  // WZA offers magical protection
  const wzaProtection = await sendA2ARequest('wza', {
    role: 'user',
    parts: [{ text: `Bob just asked: "${bobRequest}". Offer to cast a protection spell on the gem based on your magical knowledge: "${protectionKnowledge}". Describe the spell and its effects in a dramatic way.` }]
  });
  
  await sleep(2000);
  
  // Step 10: Homie is deterred
  printStepHeader(10, "Homie reconsiders his plan");
  const homieRethink = await sendA2ARequest('homie', {
    role: 'user',
    parts: [{ text: `WZA just cast a protection spell on the gem you were planning to steal: "${wzaProtection}". You're now worried about magical traps. Express your new respect for magic users and subtly back off from your theft plan.` }]
  });
  
  await sleep(2000);
  
  // Step 11: Tavern concludes the story
  printStepHeader(11, "The scene concludes at The Tipsy Gnome");
  const conclusion = await sendA2ARequest('tavern', {
    role: 'user',
    parts: [{ text: `The scene has played out with WZA using his magical knowledge to protect Bob's gem, and Homie deciding not to steal it. Describe the closing scene in the tavern with all three characters.` }]
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
  
  console.log(chalk.bold.green('\n🎬 THE WIZARD KNOWLEDGE SCENARIO HAS CONCLUDED 🎬\n'));
}

// Run the scenario
try {
  console.log(chalk.bold('Starting the WZA Knowledge Wizard scenario...\n'));
  console.log(chalk.bold('This scenario features:'));
  console.log(chalk.bold('- 🧙‍♂️ WZA the wizard consulting a magical knowledge repository'));
  console.log(chalk.bold('- 🍺 Bob the bartender with his magical blue gemstone'));
  console.log(chalk.bold('- 🗡️ Homie the sneaky gnome thief interested in the gem'));
  console.log(chalk.bold('- 🏠 The Tipsy Gnome tavern setting'));
  console.log(chalk.bold('- 📚 LightRAG knowledge base for magical information'));
  console.log(chalk.bold('- 🎲 Dice rolls for dramatic effect\n'));
  
  runScenario().catch(error => {
    console.error('Scenario failed:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error starting scenario:', error);
  process.exit(1);
}