# 🏰 D&D Tavern Solana Payment Integration 💰

This enhancement adds **Solana blockchain payments** with **Phantom wallet integration** to The Tipsy Gnome tavern system, allowing the AI agents to conduct real cryptocurrency transactions while maintaining their D&D character personas.

## 🎭 Character Payment Capabilities

### 🧙‍♂️ Homie the Gnome Thief
- **Payment Skills**: Can send SOL payments to Bob for drinks and services
- **Pickpocketing**: Uses blockchain "theft" mechanics to steal SOL from NPCs
- **Stealth Checks**: D&D-style dice rolls determine theft success
- **Phantom Wallet**: Equipped with stealth payment capabilities
- **Special Abilities**: 
  - `pickpocket_transactions` - Stealthy SOL transfers
  - `stealth_payments` - Hidden payment channels
  - `coin_purse_manipulation` - Wallet management
  - `shadow_transfers` - Anonymous transactions

### 🍺 Bob the Bartender  
- **Merchant Services**: Accepts SOL payments for tavern goods and services
- **Payment Processing**: Secure transaction handling for all customers
- **Tip Jar**: Digital tip collection system
- **Phantom Wallet**: Configured for merchant operations
- **Special Abilities**:
  - `merchant_processing` - Business transaction handling
  - `tavern_payments` - Service payment acceptance
  - `bulk_transactions` - Multiple payment processing
  - `tip_jar_management` - Gratuity collection

### 🔮 WZA the Wizard
- **Mystical Payments**: Sends SOL through "ethereal channels"
- **Beer Purchases**: Buys mystical ales and potions with SOL
- **Divination Services**: Accepts payment for fortune telling
- **Phantom Wallet**: Enhanced with magical payment abilities
- **Special Abilities**:
  - `mystical_payments` - Magical SOL transfers
  - `future_sight_transactions` - Predictive payments
  - `ethereal_transfers` - Cross-dimensional transactions
  - `divination_fees` - Service payment collection

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Complete Tavern System
```bash
npm run tavern:start
```

This will launch:
- 🏰 Tavern Server (localhost:41247)
- 🍺 Bob the Bartender (localhost:41246) 
- 🧙‍♂️ Homie the Gnome Thief (localhost:41245)
- 🔮 WZA the Wizard (localhost:41248)
- 💰 Solana MCP Payment Service

### 3. Test Payment Features
```bash
npm run tavern:test
```

## 💳 Payment Examples

### Homie Pays Bob
```javascript
// Send request to Homie's agent
{
  "method": "tasks/send",
  "params": {
    "message": {
      "role": "user", 
      "parts": [{"text": "Homie, pay Bob 0.15 SOL for the ale and bread!"}]
    }
  }
}
```

**Response**: *"Homie sheepishly slides 0.15 SOL across the bar to Bob, muttering 'For the ale... and maybe forgiveness for that missing spoon.'"*

### WZA Buys Beer
```javascript
// Send request to WZA's agent
{
  "method": "tasks/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [{"text": "WZA, buy a Starlight Ale from Bob using your mystical payment powers!"}]
    }
  }
}
```

**Response**: *"WZA's eyes glow softly as 0.1 SOL materializes on the bar. 'One Starlight Ale, good bartender. The spirits tell me it will be excellent.'"*

### Homie's Pickpocketing
```javascript
// Send request to Homie's agent
{
  "method": "tasks/send", 
  "params": {
    "message": {
      "role": "user",
      "parts": [{"text": "Homie, steal some coins from that sleeping merchant in the corner!"}]
    }
  }
}
```

**Response**: *"Homie rolls for stealth: 18 + 6 = 24 (Success!) In a flash of gnomish dexterity, Homie's fingers dance through the shadows, emerging with 0.2 SOL from the merchant's purse. 'Finders keepers!'"*

## 🔧 Technical Architecture

### Solana Integration
- **Network**: Devnet (configurable to mainnet)
- **MCP Service**: A2P Protocol integration
- **Wallet Type**: Phantom wallet compatibility
- **Payment Processing**: Real blockchain transactions

### Agent Card Updates
All agents now include:
```json
{
  "phantom_wallet": {
    "enabled": true,
    "network": "devnet", 
    "capabilities": ["character_specific_abilities"],
    "character_type": "gnome_thief|human_bartender|wizard"
  },
  "solana_integration": {
    "can_send_payments": true,
    "can_receive_payments": true, 
    "can_perform_theft": true, // Only for Homie
    "special_abilities": ["list_of_abilities"]
  }
}
```

### Payment Actions
- `HOMIE_PAYS_BOB` - Gnome pays bartender
- `WZA_BUYS_BEER` - Wizard purchases ale
- `HOMIE_STEALS` - Pickpocketing with stealth checks
- `CHECK_WALLETS` - View all wallet balances
- `TRANSACTION_HISTORY` - Recent payment log
- `INITIALIZE_PAYMENTS` - Setup payment system

## 🎮 D&D Game Mechanics

### Stealth Checks for Theft
- **Dice Roll**: 1d20 + Homie's stealth bonus (+6)
- **Difficulty Class**: 15 for successful pickpocketing
- **Success**: SOL is transferred to Homie's wallet
- **Failure**: Theft attempt fails with narrative explanation

### Pricing Structure
- **Ale**: 0.1 SOL
- **Wine**: 0.15 SOL  
- **Meal**: 0.25 SOL
- **Room**: 0.5 SOL/night
- **Divination**: Variable SOL based on service

## 🔐 Security Features

### Wallet Validation
- Connection status verification
- Action permission checking
- Character-specific capability validation

### Transaction Safety
- Real blockchain verification
- Error handling with D&D narratives
- Balance validation before transfers

### Theft Mechanics
- Dice-based success determination
- Temporary victim wallet creation
- Secure transfer protocols

## 📊 Monitoring & Analytics

### Wallet Status
```bash
# Check all character wallet balances
curl -X POST http://localhost:41247 \
  -H "Content-Type: application/json" \
  -d '{"method":"tasks/send","params":{"message":{"role":"user","parts":[{"text":"[ACTION: CHECK_WALLETS]"}]}}}'
```

### Transaction History
```bash
# View recent tavern transactions
curl -X POST http://localhost:41247 \
  -H "Content-Type: application/json" \
  -d '{"method":"tasks/send","params":{"message":{"role":"user","parts":[{"text":"[ACTION: TRANSACTION_HISTORY]"}]}}}'
```

## 🌐 Environment Configuration

### Solana Network Settings
```bash
# Development (default)
export A2P_NETWORK="devnet"
export A2P_RPC_URL="https://api.devnet.solana.com"

# Production (when ready)
export A2P_NETWORK="mainnet-beta" 
export A2P_RPC_URL="https://api.mainnet-beta.solana.com"
```

### MCP Configuration
The system uses `tavern_mcp_config.json` for MCP server configuration:
```json
{
  "mcpServers": {
    "a2p-solana": {
      "command": "node",
      "args": ["node_modules/@a2p-protocol/mcp-service/dist/SimpleA2PMCPServer.js"],
      "env": {
        "A2P_NETWORK": "devnet",
        "A2P_RPC_URL": "https://api.devnet.solana.com"
      }
    }
  }
}
```

## 🎯 Usage Scenarios

### 1. Tavern Commerce
- Customers pay for drinks and food with SOL
- Bob processes payments and provides receipts
- Tips are collected in digital tip jar

### 2. Magical Services  
- WZA offers divination for SOL payments
- Future sight consultations with blockchain verification
- Mystical payment channels for ethereal transactions

### 3. Thievery & Adventure
- Homie pickpockets NPCs using stealth mechanics
- Stolen SOL is added to Homie's wallet
- D&D dice rolls determine success/failure

### 4. Social Interactions
- Characters discuss their wealth and transactions
- Payment history creates ongoing narratives
- Blockchain events become part of the story

## 🛠️ Development

### Adding New Payment Types
1. Extend `PaymentActionHandler` class
2. Add new action constants to `PAYMENT_ACTIONS`
3. Update agent prompts to recognize new actions
4. Test with the payment test script

### Custom Wallet Capabilities
1. Modify `PhantomWalletService.initializeWalletCapabilities()`
2. Add new special abilities to character types
3. Update agent cards with new capabilities
4. Implement corresponding action handlers

## 🎉 Features Summary

✅ **Phantom Wallet Integration** - All characters have blockchain wallets  
✅ **Real SOL Transactions** - Actual Solana blockchain payments  
✅ **D&D Themed Narratives** - Payments integrated into roleplay  
✅ **Stealth-Based Theft** - Dice roll mechanics for pickpocketing  
✅ **Merchant Services** - Bob accepts payments for tavern goods  
✅ **Mystical Payments** - WZA's magical transaction abilities  
✅ **Transaction History** - Complete payment logging and tracking  
✅ **Wallet Management** - Balance checking and status monitoring  
✅ **MCP Integration** - Model Context Protocol for tool access  
✅ **Error Handling** - Graceful failures with character responses  

The Tipsy Gnome tavern is now a fully functional blockchain-powered D&D experience where AI agents conduct real cryptocurrency transactions while maintaining their fantasy personas! 🏰✨