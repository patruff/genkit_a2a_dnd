// Test script for Hugging Face wizard integration with DnD characters
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

// Sleep function for pausing between requests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWizardDndIntegration() {
  console.log('========================================================');
  console.log('TESTING HUGGING FACE WIZARD INTEGRATION WITH DND AGENTS');
  console.log('========================================================');
  
  // Test the mind reading of both characters
  console.log('\n1. Testing mind reading of DnD characters...\n');
  
  try {
    const taskId = `test-dnd-${Date.now()}`;
    console.log(`Sending mind reading request to Hugging Face Wizard agent (task ID: ${taskId})...`);
    
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
            parts: [{ text: 'As the Hugging Face Wizard, can you read the minds of everyone in this tavern and tell me what they\'re thinking?' }]
          }
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Hugging Face Wizard response received:');
      
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(`\n"${textPart.text}"\n`);
          
          // Check if the response mentions both Homie and Bob
          const mentionsHomie = textPart.text.toLowerCase().includes('homie');
          const mentionsBob = textPart.text.toLowerCase().includes('bob');
          const mentionsHuggingFace = textPart.text.includes('🤗') || textPart.text.toLowerCase().includes('hugging face');
          
          console.log(`Response mentions Homie: ${mentionsHomie ? '✅' : '❌'}`);
          console.log(`Response mentions Bob: ${mentionsBob ? '✅' : '❌'}`);
          console.log(`Response mentions Hugging Face branding: ${mentionsHuggingFace ? '✅' : '❌'}`);
          
          if (mentionsHomie && mentionsBob && mentionsHuggingFace) {
            console.log('\n✅ SUCCESS: Hugging Face Wizard successfully integrated with DnD characters!');
          } else {
            console.log('\n❌ FAILURE: Hugging Face Wizard integration incomplete.');
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
  
  // Test specific mind reading with model discovery
  console.log('\n2. Testing specific mind reading with model discovery...\n');
  
  try {
    await sleep(1000); // Wait a bit between requests
    
    const taskId = `test-specific-${Date.now()}`;
    console.log(`Sending specific mind reading with model info request (task ID: ${taskId})...`);
    
    const response = await fetch('http://localhost:41248', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tasks/send',
        params: {
          id: taskId,
          message: {
            role: 'user',
            parts: [{ text: 'Read Bob\'s mind and then tell me which Hugging Face models could help him be a better bartender.' }]
          }
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Hugging Face Wizard response received:');
      
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(`\n"${textPart.text}"\n`);
          
          // Check if the response includes Bob's thoughts and model recommendations
          const mentionsBobThoughts = textPart.text.toLowerCase().includes('bob') && 
                                     (textPart.text.toLowerCase().includes('think') || 
                                      textPart.text.toLowerCase().includes('mind') || 
                                      textPart.text.toLowerCase().includes('goal'));
          const mentionsModels = textPart.text.toLowerCase().includes('model') || 
                                textPart.text.toLowerCase().includes('llama') || 
                                textPart.text.toLowerCase().includes('mistral');
          
          console.log(`Response mentions Bob's thoughts: ${mentionsBobThoughts ? '✅' : '❌'}`);
          console.log(`Response recommends models: ${mentionsModels ? '✅' : '❌'}`);
          
          if (mentionsBobThoughts && mentionsModels) {
            console.log('\n✅ SUCCESS: Hugging Face Wizard successfully combines mind reading with model discovery!');
          } else {
            console.log('\n❌ FAILURE: Hugging Face Wizard failed to combine mind reading with model discovery.');
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
    console.error('❌ Error testing specific mind reading with model discovery:', error.message);
  }
}

// Run the test
testWizardDndIntegration().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});