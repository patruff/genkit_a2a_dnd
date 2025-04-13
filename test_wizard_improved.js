// Improved wizard agent test
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const LOG_FILE = './wizard_debug.log';

// Clear the log file
await fs.writeFile(LOG_FILE, '');

// Start wizard agent process
console.log('Starting Wizard agent...');
const wizardProcess = spawn('node', ['./dist/agents/wizard/index.js'], {
  env: { ...process.env, GOOGLE_API_KEY: process.env.GOOGLE_API_KEY },
  stdio: 'pipe'
});

// Log output
wizardProcess.stdout.on('data', data => {
  const output = data.toString().trim();
  fs.appendFile(LOG_FILE, output + '\n');
  console.log(`[Wizard] ${output}`);
});

wizardProcess.stderr.on('data', data => {
  const output = data.toString().trim();
  fs.appendFile(LOG_FILE, `ERROR: ${output}\n`);
  console.error(`[Wizard ERROR] ${output}`);
});

// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 5000));

// Send mind reading request
console.log('\nSending mind reading request...');
try {
  const response = await fetch('http://localhost:41248', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tasks/send',
      params: {
        id: 'test-mind-reading',
        message: {
          role: 'user',
          parts: [{ text: 'Read the minds of everyone in this tavern and tell me what you discover.' }]
        }
      }
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    console.log('\nWizard response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.result?.status?.message?.parts?.[0]?.text) {
      const text = result.result.status.message.parts[0].text;
      console.log('\nText response:');
      console.log(text);
      
      // Check if response mentions key characters
      const mentionsHomie = text.toLowerCase().includes('homie');
      const mentionsBob = text.toLowerCase().includes('bob');
      
      console.log(`\nResponse mentions Homie: ${mentionsHomie ? '✅' : '❌'}`);
      console.log(`Response mentions Bob: ${mentionsBob ? '✅' : '❌'}`);
    }
  } else {
    console.error(`Request failed: ${response.status}`);
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  // Wait to capture logs
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Terminate the wizard process
  console.log('\nCleaning up...');
  wizardProcess.kill();
  
  console.log(`\nFull logs are available in ${LOG_FILE}`);
}