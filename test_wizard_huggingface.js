// Test script for Hugging Face wizard integration
import fetch from 'node-fetch';

// Sleep function for pausing between requests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHuggingFaceWizard() {
  console.log('========================================');
  console.log('TESTING HUGGING FACE WIZARD INTEGRATION');
  console.log('========================================');
  
  // Test the /.well-known/agent.json endpoint
  console.log('\n1. Testing agent card endpoint...\n');
  
  try {
    const wellKnownUrl = 'http://localhost:41248/.well-known/agent.json';
    console.log(`Checking Hugging Face Wizard agent card at ${wellKnownUrl}...`);
    
    const response = await fetch(wellKnownUrl);
    if (response.ok) {
      const agentCard = await response.json();
      console.log('✅ Hugging Face Wizard agent card available:');
      console.log(JSON.stringify(agentCard, null, 2));
      
      // Verify Hugging Face branding
      const isHuggingFaceThemed = 
        agentCard.name.includes('Hugging Face') && 
        agentCard.provider?.organization === 'Hugging Face' &&
        agentCard.metadata?.icon === '🤗';
      
      if (isHuggingFaceThemed) {
        console.log('✅ Hugging Face branding correctly implemented in agent card');
      } else {
        console.log('❌ Missing or incorrect Hugging Face branding in agent card');
      }
      
      // Verify the model discovery skill
      const hasModelDiscoverySkill = agentCard.skills?.some(s => s.id === 'model_discovery');
      
      if (hasModelDiscoverySkill) {
        console.log('✅ Model discovery skill present in agent card');
      } else {
        console.log('❌ Model discovery skill missing from agent card');
      }
    } else {
      console.error(`❌ Failed to get Hugging Face Wizard agent card: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error accessing Hugging Face Wizard agent card:', error.message);
  }
  
  // Test model discovery
  console.log('\n2. Testing model discovery functionality...\n');
  
  try {
    const taskId = `test-model-discovery-${Date.now()}`;
    console.log(`Sending model discovery request to Hugging Face Wizard (task ID: ${taskId})...`);
    
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
            parts: [{ text: 'What are the best AI models on Hugging Face for text generation?' }]
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
          
          // Check if the response mentions key models and Hugging Face
          const mentionsTextModels = 
            textPart.text.toLowerCase().includes('llama') || 
            textPart.text.toLowerCase().includes('mistral');
          const mentionsHuggingFace = 
            textPart.text.includes('🤗') || 
            textPart.text.toLowerCase().includes('hugging face');
          
          console.log(`Response mentions text models: ${mentionsTextModels ? '✅' : '❌'}`);
          console.log(`Response mentions Hugging Face: ${mentionsHuggingFace ? '✅' : '❌'}`);
          
          if (mentionsTextModels && mentionsHuggingFace) {
            console.log('\n✅ SUCCESS: Hugging Face Wizard successfully provided model information!');
          } else {
            console.log('\n❌ FAILURE: Hugging Face Wizard failed to properly discuss text models.');
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
    console.error('❌ Error testing model discovery:', error.message);
  }
  
  // Test the explicit DISCOVER_MODELS action
  console.log('\n3. Testing explicit DISCOVER_MODELS action...\n');
  
  try {
    await sleep(1000); // Wait a bit between requests
    
    const taskId = `test-model-action-${Date.now()}`;
    console.log(`Sending explicit model discovery action to Hugging Face Wizard (task ID: ${taskId})...`);
    
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
            parts: [{ text: 'I need to do image generation. Can you suggest the best models?\n[ACTION: DISCOVER_MODELS category: "image"]' }]
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
          
          // Check if the response mentions image models and Hugging Face
          const mentionsImageModels = 
            textPart.text.toLowerCase().includes('stable diffusion') || 
            textPart.text.toLowerCase().includes('midjourney') ||
            textPart.text.toLowerCase().includes('controlnet');
          const mentionsHuggingFace = 
            textPart.text.includes('🤗') || 
            textPart.text.toLowerCase().includes('hugging face');
          
          console.log(`Response mentions image models: ${mentionsImageModels ? '✅' : '❌'}`);
          console.log(`Response mentions Hugging Face: ${mentionsHuggingFace ? '✅' : '❌'}`);
          
          if (mentionsImageModels && mentionsHuggingFace) {
            console.log('\n✅ SUCCESS: Hugging Face Wizard successfully provided image model information!');
          } else {
            console.log('\n❌ FAILURE: Hugging Face Wizard failed to properly discuss image models.');
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
    console.error('❌ Error testing explicit model discovery action:', error.message);
  }
}

// Run the test
testHuggingFaceWizard().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});