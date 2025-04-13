// Test script for wizard agent discovery functionality
import fetch from 'node-fetch';

// Sleep function for pausing between requests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWizardDiscovery() {
  console.log('========================================');
  console.log('TESTING WIZARD AGENT DISCOVERY');
  console.log('========================================');
  
  // Test the /.well-known/agent.json endpoint for each server
  const servers = [
    { name: 'Homie', url: 'http://localhost:41245' },
    { name: 'Bob', url: 'http://localhost:41246' },
    { name: 'WZA', url: 'http://localhost:41248' }
  ];
  
  console.log('\n1. Testing well-known endpoint for each agent...\n');
  
  for (const server of servers) {
    try {
      const wellKnownUrl = new URL('/.well-known/agent.json', server.url).toString();
      console.log(`Checking ${server.name} at ${wellKnownUrl}...`);
      
      const response = await fetch(wellKnownUrl);
      if (response.ok) {
        const agentCard = await response.json();
        console.log(`✅ ${server.name} agent card available:`);
        console.log(JSON.stringify(agentCard, null, 2));
      } else {
        console.error(`❌ Failed to get ${server.name} agent card: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error accessing ${server.name} agent:`, error.message);
    }
    
    console.log('\n---\n');
  }
  
  // Test a mind-reading request
  console.log('\n2. Testing mind reading functionality...\n');
  
  try {
    const taskId = `test-${Date.now()}`;
    console.log(`Sending mind reading request to WZA agent (task ID: ${taskId})...`);
    
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
            parts: [{ text: 'Read the minds of everyone in this tavern and tell me what they\'re thinking.' }]
          }
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('WZA response received:');
      
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(`\n"${textPart.text}"\n`);
          
          // Check if the response mentions both Homie and Bob
          const mentionsHomie = textPart.text.toLowerCase().includes('homie');
          const mentionsBob = textPart.text.toLowerCase().includes('bob');
          
          console.log(`Response mentions Homie: ${mentionsHomie ? '✅' : '❌'}`);
          console.log(`Response mentions Bob: ${mentionsBob ? '✅' : '❌'}`);
          
          if (mentionsHomie && mentionsBob) {
            console.log('\n✅ SUCCESS: WZA successfully discovered both agents!');
          } else {
            console.log('\n❌ FAILURE: WZA failed to discover all agents.');
          }
        } else {
          console.log('❌ No text content in the response.');
        }
      } else {
        console.log('❌ Unexpected response structure:');
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.error(`❌ Request failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error testing mind reading:', error.message);
  }
  
}

// Run the test
testWizardDiscovery().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});