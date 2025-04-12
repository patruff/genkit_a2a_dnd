// Display A2A JSON message chain in a readable format
import * as fs from 'fs/promises';
import * as path from 'path';

// Colors for different message types
const colors = {
  request: '\x1b[36m', // Cyan
  response: '\x1b[32m', // Green
  error: '\x1b[31m', // Red
  homie: '\x1b[33m', // Yellow
  bob: '\x1b[34m', // Blue
  tavern: '\x1b[35m', // Magenta
  reset: '\x1b[0m' // Reset
};

// Read and display message history
async function displayMessageChain() {
  try {
    // Check if message history exists
    const logDir = path.join(process.cwd(), 'a2a_logs');
    const historyFile = path.join(logDir, 'complete_message_history.json');
    
    let messages = [];
    
    try {
      const fileContent = await fs.readFile(historyFile, 'utf8');
      messages = JSON.parse(fileContent);
    } catch (error) {
      // If complete history doesn't exist, try to read individual files
      console.log('Complete message history not found, trying to read individual logs...');
      
      // Read individual log files
      const bobLogs = await readJsonlFile(path.join(logDir, 'bob_messages.jsonl'));
      const homieLogs = await readJsonlFile(path.join(logDir, 'homie_messages.jsonl'));
      
      messages = [...bobLogs, ...homieLogs].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }
    
    if (messages.length === 0) {
      console.log('No A2A messages found. Run a scenario first to generate messages.');
      return;
    }
    
    // Display messages in a readable format
    console.log('\n🔄 A2A JSON MESSAGE CHAIN 🔄');
    console.log('============================\n');
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      
      // Display message header based on type
      let header = '';
      
      if (msg.type === 'Request') {
        header = `${colors.request}REQUEST ${i+1}/${messages.length} [${timestamp}] ${msg.from} -> ${msg.to}${colors.reset}`;
      } else if (msg.type === 'Response') {
        header = `${colors.response}RESPONSE ${i+1}/${messages.length} [${timestamp}] ${msg.from} -> ${msg.to}${colors.reset}`;
      } else if (msg.type === 'Error') {
        header = `${colors.error}ERROR ${i+1}/${messages.length} [${timestamp}] Agent: ${msg.agent}${colors.reset}`;
      }
      
      console.log(header);
      
      // Display payload with proper formatting
      if (msg.payload) {
        // Highlight the agent message text for better readability
        if (msg.type === 'Response' && 
            msg.payload.result?.status?.message?.parts?.[0]?.text) {
          const agentText = msg.payload.result.status.message.parts[0].text;
          console.log(`${colors[msg.from.toLowerCase()] || ''}Agent Text: ${agentText.slice(0, 100)}...${colors.reset}`);
        }
        
        // Print the JSON with basic formatting
        if (msg.type === 'Request') {
          // For requests, focus on the user message
          if (msg.payload.params?.message?.parts?.[0]?.text) {
            console.log(`User Message: "${msg.payload.params.message.parts[0].text}"`);
          }
          console.log(`Method: ${msg.payload.method}, TaskID: ${msg.payload.params?.id || 'unknown'}`);
        } else {
          // For responses, show status and partial result
          console.log(`Status: ${msg.payload.result?.status?.state || 'unknown'}`);
        }
      } else if (msg.error) {
        console.log(`Error: ${msg.error}`);
      }
      
      console.log('-'.repeat(50) + '\n');
    }
    
    console.log(`Total messages: ${messages.length}`);
    console.log('\nFor full JSON details, check the files in the a2a_logs directory:');
    console.log(`  ${logDir}\n`);
  } catch (error) {
    console.error('Error displaying message chain:', error);
  }
}

// Read JSONL file and parse each line as JSON
async function readJsonlFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Execute
displayMessageChain().catch(console.error);