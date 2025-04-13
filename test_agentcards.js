import fetch from 'node-fetch';

// Sleep function for pausing between requests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAgentCards() {
  console.log('Testing agent card discovery functionality...');
  
  // Define the servers to test
  const servers = [
    { name: 'Homie', url: 'http://localhost:41245' },
    { name: 'Bob', url: 'http://localhost:41246' },
    { name: 'Tavern', url: 'http://localhost:41247' },
    { name: 'Wizard', url: 'http://localhost:41248' }
  ];
  
  // Test if each server has a well-known agent card
  for (const server of servers) {
    try {
      const wellKnownUrl = new URL('/.well-known/agent.json', server.url).toString();
      console.log(`Testing ${server.name} agent card at: ${wellKnownUrl}`);
      
      const response = await fetch(wellKnownUrl);
      if (response.ok) {
        const agentCard = await response.json();
        console.log(`[SUCCESS] ${server.name} agent card discovered:`);
        console.log(JSON.stringify(agentCard, null, 2));
      } else {
        console.error(`[ERROR] Failed to discover ${server.name} agent: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`[ERROR] Error discovering ${server.name} agent:`, error.message);
    }
    
    // Wait a bit between requests
    await sleep(500);
  }

  // Test wizard's ability to discover other agents
  try {
    console.log('\nTesting wizard\'s ability to read minds (discover agents)...');
    
    // Send a mind reading request to the wizard
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
          id: 'test-mind-reading',
          message: {
            role: 'user',
            parts: [{ text: 'Can you read everyone\'s mind and tell me what they\'re thinking?' }]
          }
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('\nWizard response:');
      
      if (result.result && result.result.status && result.result.status.message) {
        // Find the text part in the message
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(textPart.text);
        } else {
          console.log('No text part found in wizard response');
        }
      } else {
        console.log('Unexpected response structure from wizard:', JSON.stringify(result, null, 2));
      }
    } else {
      console.error(`Failed to get wizard response: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Error testing wizard mind reading:', error.message);
  }
}

// Run the test
testAgentCards().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});