// Mind reading test for wizard agent
// This script will test the wizard agent's ability to read minds without needing the actual agent servers running
import fetch from 'node-fetch';

async function testMindReadingCapability() {
  console.log('Testing Wizard Agent mind reading with fallback mechanism...');
  
  try {
    const taskId = `test-${Date.now()}`;
    console.log(`Sending mind reading request to Wizard agent (Task ID: ${taskId})...`);
    
    const response = await fetch('http://localhost:41248', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tasks/send',
        params: {
          id: taskId,
          message: {
            role: 'user',
            parts: [{ text: 'Can you read the minds of everyone in this tavern and tell me what they\'re thinking?' }]
          }
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('\nWizard response received!');
      
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(`\n${textPart.text}\n`);
          
          const mentionsHomie = textPart.text.toLowerCase().includes('homie');
          const mentionsBob = textPart.text.toLowerCase().includes('bob');
          
          console.log(`Response mentions Homie: ${mentionsHomie ? '✅' : '❌'}`);
          console.log(`Response mentions Bob: ${mentionsBob ? '✅' : '❌'}`);
          
          if (mentionsHomie && mentionsBob) {
            console.log('\n✅ SUCCESS: Wizard correctly used the fallback agent cards!');
          } else {
            console.log('\n❌ FAILURE: Wizard did not correctly use fallback cards.');
          }
        } else {
          console.log('No text part found in the response');
        }
      } else {
        console.log('Unexpected response structure:');
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.error(`Failed to get wizard response: HTTP ${response.status}`);
      try {
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
      } catch (e) {
        console.error('Could not extract error details');
      }
    }
  } catch (error) {
    console.error(`Error testing mind reading: ${error.message}`);
  }
}

// Start the wizard agent and run the test
async function runTest() {
  console.log('Starting the Wizard agent for testing...');
  
  try {
    // Import and run the wizard agent directly
    const { spawn } = await import('child_process');
    const wizardProcess = spawn('node', ['./dist/agents/wizard/index.js'], {
      env: { ...process.env, GOOGLE_API_KEY: process.env.GOOGLE_API_KEY },
      stdio: 'pipe'
    });
    
    // Log output from the wizard process
    wizardProcess.stdout.on('data', (data) => {
      console.log(`[Wizard] ${data.toString().trim()}`);
    });
    
    wizardProcess.stderr.on('data', (data) => {
      console.error(`[Wizard ERR] ${data.toString().trim()}`);
    });
    
    // Wait for the server to start
    console.log('Waiting for Wizard agent to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run the test
    await testMindReadingCapability();
    
    // Clean up
    console.log('\nTest completed. Cleaning up...');
    wizardProcess.kill();
  } catch (error) {
    console.error(`Error running test: ${error.message}`);
  }
}

// Check for Google API key
if (!process.env.GOOGLE_API_KEY) {
  console.error('Error: GOOGLE_API_KEY environment variable is not set.');
  console.error('Please set it using: export GOOGLE_API_KEY=your_api_key_here');
  process.exit(1);
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});