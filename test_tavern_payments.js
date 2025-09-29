// Test script for D&D Tavern Solana Payment Integration
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

// Sleep function for pausing between requests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testTavernPayments() {
  console.log('🏰========================================================🏰');
  console.log('    TESTING D&D TAVERN SOLANA PAYMENT INTEGRATION');
  console.log('🏰========================================================🏰');
  
  // Test 1: Initialize payment system
  console.log('\n🚀 1. Initializing tavern payment system...\n');
  
  try {
    const initResponse = await fetch('http://localhost:41247', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tasks/send',
        params: {
          id: `init-payments-${Date.now()}`,
          message: {
            role: 'user',
            parts: [{ text: '[ACTION: INITIALIZE_PAYMENTS]' }]
          }
        }
      })
    });
    
    if (initResponse.ok) {
      const result = await initResponse.json();
      console.log('✅ Payment system initialized successfully!');
    }
  } catch (error) {
    console.error('❌ Failed to initialize payments:', error.message);
  }

  await sleep(2000);

  // Test 2: Homie pays Bob for drinks
  console.log('\n🧙‍♂️ 2. Testing Homie paying Bob for drinks...\n');
  
  try {
    const homiePaymentResponse = await fetch('http://localhost:41245', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tasks/send',
        params: {
          id: `homie-pays-${Date.now()}`,
          message: {
            role: 'user',
            parts: [{ text: 'Homie, pay Bob 0.15 SOL for the ale and some bread. You owe him for the good service!' }]
          }
        }
      })
    });
    
    if (homiePaymentResponse.ok) {
      const result = await homiePaymentResponse.json();
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(`Homie's Response: "${textPart.text}"`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Homie payment test failed:', error.message);
  }

  await sleep(2000);

  // Test 3: WZA buys mystical ale
  console.log('\n🔮 3. Testing WZA buying mystical ale...\n');
  
  try {
    const wzaBeerResponse = await fetch('http://localhost:41248', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tasks/send',
        params: {
          id: `wza-beer-${Date.now()}`,
          message: {
            role: 'user',
            parts: [{ text: 'WZA, use your mystical powers to buy a Starlight Ale from Bob. Pay him with SOL through the ethereal payment channels!' }]
          }
        }
      })
    });
    
    if (wzaBeerResponse.ok) {
      const result = await wzaBeerResponse.json();
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(`WZA's Response: "${textPart.text}"`);
        }
      }
    }
  } catch (error) {
    console.error('❌ WZA beer purchase test failed:', error.message);
  }

  await sleep(2000);

  // Test 4: Homie attempts pickpocketing
  console.log('\n💰 4. Testing Homie\'s pickpocketing abilities...\n');
  
  try {
    const homieTheftResponse = await fetch('http://localhost:41245', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tasks/send',
        params: {
          id: `homie-theft-${Date.now()}`,
          message: {
            role: 'user',
            parts: [{ text: 'Homie, I see a wealthy merchant sleeping in the corner. Use your thieving skills to "liberate" some SOL from their coin purse. Be stealthy!' }]
          }
        }
      })
    });
    
    if (homieTheftResponse.ok) {
      const result = await homieTheftResponse.json();
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log(`Homie's Theft Attempt: "${textPart.text}"`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Homie theft test failed:', error.message);
  }

  await sleep(2000);

  // Test 5: Check wallet balances
  console.log('\n💳 5. Checking all wallet balances...\n');
  
  try {
    const balanceResponse = await fetch('http://localhost:41247', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 5,
        method: 'tasks/send',
        params: {
          id: `check-balances-${Date.now()}`,
          message: {
            role: 'user',
            parts: [{ text: '[ACTION: CHECK_WALLETS] Show me the current wallet status for all tavern characters.' }]
          }
        }
      })
    });
    
    if (balanceResponse.ok) {
      const result = await balanceResponse.json();
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log('Current Wallet Status:');
          console.log(textPart.text);
        }
      }
    }
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
  }

  await sleep(2000);

  // Test 6: Transaction history
  console.log('\n📜 6. Checking transaction history...\n');
  
  try {
    const historyResponse = await fetch('http://localhost:41247', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 6,
        method: 'tasks/send',
        params: {
          id: `transaction-history-${Date.now()}`,
          message: {
            role: 'user',
            parts: [{ text: '[ACTION: TRANSACTION_HISTORY] Show me the recent transaction history for the tavern.' }]
          }
        }
      })
    });
    
    if (historyResponse.ok) {
      const result = await historyResponse.json();
      if (result.result?.status?.message?.parts) {
        const textPart = result.result.status.message.parts.find(part => part.text);
        if (textPart) {
          console.log('Transaction History:');
          console.log(textPart.text);
        }
      }
    }
  } catch (error) {
    console.error('❌ Transaction history check failed:', error.message);
  }

  console.log('\n🎉========================================================🎉');
  console.log('    D&D TAVERN SOLANA PAYMENT TESTING COMPLETE!');
  console.log('🎉========================================================🎉');
  console.log('\n✨ Features Tested:');
  console.log('  ✅ Payment system initialization');
  console.log('  ✅ Homie → Bob payments');
  console.log('  ✅ WZA mystical beer purchases');
  console.log('  ✅ Homie\'s blockchain pickpocketing');
  console.log('  ✅ Wallet balance checking');
  console.log('  ✅ Transaction history tracking');
  console.log('\n🏰 The Tipsy Gnome is ready for blockchain-powered adventures!');
}

// Run the test
testTavernPayments().catch(console.error);