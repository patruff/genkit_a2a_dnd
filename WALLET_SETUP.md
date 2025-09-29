# D&D Tavern Solana Payment Configuration

## Quick Setup Guide

### 1. Configure Wallet Addresses

Edit the `config.json` file in the root directory and replace the placeholder addresses with your actual Phantom wallet addresses:

```json
{
  "wallets": {
    "homie": {
      "phantomAddress": "YOUR_HOMIE_PHANTOM_WALLET_ADDRESS_HERE"
    },
    "bob": {
      "phantomAddress": "YOUR_BOB_PHANTOM_WALLET_ADDRESS_HERE"  
    },
    "wza": {
      "phantomAddress": "YOUR_WZA_PHANTOM_WALLET_ADDRESS_HERE"
    }
  }
}
```

### 2. Very Low SOL Amounts

The system is configured with very low SOL amounts for safe testing:

- **Initial Balances:**
  - Homie: 0.001 SOL
  - Bob: 0.002 SOL  
  - WZA: 0.0015 SOL

- **Transaction Amounts:**
  - Beer Price: 0.0001 SOL
  - Standard Payment: 0.0002 SOL
  - Theft Amount: 0.00005 SOL
  - Tip Amount: 0.00001 SOL

### 3. Getting Phantom Wallet Addresses

1. Open your Phantom wallet
2. Click on your wallet name at the top
3. Click "Copy Address" 
4. Paste the address into the appropriate field in `config.json`

### 4. Network Configuration

The system uses Solana Devnet by default for safe testing:
- Network: `devnet`
- RPC URL: `https://api.devnet.solana.com`

### 5. Running Tests

After configuring wallet addresses, run the payment tests:

```bash
node test_tavern_payments.js
```

## Safety Features

- ✅ Very low SOL amounts (fractions of a penny)
- ✅ Devnet network for testing
- ✅ Easy configuration via JSON file
- ✅ No hardcoded wallet addresses in code

## Configuration Options

You can modify these values in `config.json`:

- `wallets.*.initialBalance` - Starting SOL amount for each character
- `paymentAmounts.beerPrice` - Cost of beer purchases
- `paymentAmounts.standardPayment` - Default payment amount
- `paymentAmounts.theftAmount` - Amount stolen in theft actions
- `network.type` - Solana network (devnet/mainnet)
- `network.rpcUrl` - RPC endpoint URL

## Troubleshooting

- **"Wallet not connected" errors**: Make sure you've replaced the placeholder addresses in `config.json`
- **Network errors**: Verify your internet connection and RPC URL
- **Balance errors**: Ensure wallets have sufficient SOL for transactions (amounts are very small)