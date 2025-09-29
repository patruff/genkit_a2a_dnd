/**
 * Solana Payment Service for D&D Tavern
 * Integrates with A2P Protocol MCP Service for blockchain payments
 */

import { SimpleA2PClient } from '@a2p-protocol/mcp-service';
import * as fs from 'fs';
import * as path from 'path';

// Load configuration
const configPath = path.join(process.cwd(), 'config.json');
let config: any = {};

try {
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
  console.log('[Config] Loaded payment configuration from config.json');
} catch (error) {
  console.warn('[Config] Could not load config.json, using default values:', error.message);
  // Default fallback config
  config = {
    wallets: {
      homie: { initialBalance: 0.001, phantomAddress: 'DEFAULT_HOMIE_ADDRESS' },
      bob: { initialBalance: 0.002, phantomAddress: 'DEFAULT_BOB_ADDRESS' },
      wza: { initialBalance: 0.0015, phantomAddress: 'DEFAULT_WZA_ADDRESS' }
    },
    paymentAmounts: {
      beerPrice: 0.0001,
      standardPayment: 0.0002,
      theftAmount: 0.00005
    },
    network: {
      type: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com'
    }
  };
}

export class SolanaPaymentService {
  private client: SimpleA2PClient;
  private wallets: Map<string, TavernWallet> = new Map();
  private transactions: PaymentTransaction[] = [];

  constructor() {
    this.client = new SimpleA2PClient({
      network: config.network?.type || process.env.A2P_NETWORK || 'devnet',
      rpcUrl: config.network?.rpcUrl || process.env.A2P_RPC_URL || 'https://api.devnet.solana.com'
    });
  }

  /**
   * Initialize wallets for all tavern characters
   */
  async initializeTavernWallets(): Promise<void> {
    console.log('[Solana] Initializing tavern character wallets...');

    // Initialize Homie the Gnome Thief
    const homieConfig = config.wallets?.homie || { initialBalance: 0.001 };
    const homieAgent = await this.client.createAgent({
      name: 'Homie the Gnome Thief',
      capabilities: ['stealth', 'lockpicking', 'pickpocketing', 'coin_purse_management'],
      initialBalance: homieConfig.initialBalance // Very low starting amount from config
    });

    this.wallets.set('homie', {
      agentId: homieAgent.id,
      name: 'Homie the Gnome Thief',
      characterType: 'gnome_thief',
      balance: homieConfig.initialBalance,
      publicKey: homieAgent.publicKey,
      phantomAddress: homieConfig.phantomAddress
    });

    // Initialize Bob the Bartender
    const bobConfig = config.wallets?.bob || { initialBalance: 0.002 };
    const bobAgent = await this.client.createAgent({
      name: 'Bob the Bartender',
      capabilities: ['tavern_management', 'drink_mixing', 'payment_processing', 'merchant_services'],
      initialBalance: bobConfig.initialBalance // Very low starting amount from config
    });

    this.wallets.set('bob', {
      agentId: bobAgent.id,
      name: 'Bob the Bartender',
      characterType: 'human_bartender',
      balance: bobConfig.initialBalance,
      publicKey: bobAgent.publicKey,
      phantomAddress: bobConfig.phantomAddress
    });

    // Initialize WZA the Wizard
    const wzaConfig = config.wallets?.wza || { initialBalance: 0.0015 };
    const wzaAgent = await this.client.createAgent({
      name: 'WZA the Wizard',
      capabilities: ['divination', 'mind_reading', 'future_sight', 'magical_payments'],
      initialBalance: wzaConfig.initialBalance // Very low starting amount from config
    });

    this.wallets.set('wza', {
      agentId: wzaAgent.id,
      name: 'WZA the Wizard',
      characterType: 'wizard',
      balance: wzaConfig.initialBalance,
      publicKey: wzaAgent.publicKey,
      phantomAddress: wzaConfig.phantomAddress
    });

    console.log('[Solana] All tavern wallets initialized successfully with very low SOL amounts!');
    console.log(`[Solana] Homie: ${homieConfig.initialBalance} SOL, Bob: ${bobConfig.initialBalance} SOL, WZA: ${wzaConfig.initialBalance} SOL`);
  }
      name: 'Bob the Bartender',
      characterType: 'human_bartender',
      balance: 2.0,
      publicKey: bobAgent.publicKey
    });

    // Initialize WZA the Wizard
    const wzaAgent = await this.client.createAgent({
      name: 'WZA the Wizard',
      capabilities: ['divination', 'mind_reading', 'future_sight', 'magical_payments'],
      initialBalance: 1.5 // Wizard has moderate SOL for magical services and purchases
    });

    this.wallets.set('wza', {
      agentId: wzaAgent.id,
      name: 'WZA the Wizard',
      characterType: 'wizard',
      balance: 1.5,
      publicKey: wzaAgent.publicKey
    });

    console.log('[Solana] All tavern wallets initialized successfully!');
  }

  /**
   * Process a payment from Homie to Bob (e.g., paying for drinks or services)
   */
  async homiePaysBob(amount: number, reason: string): Promise<PaymentTransaction> {
    const homieWallet = this.wallets.get('homie');
    const bobWallet = this.wallets.get('bob');

    if (!homieWallet || !bobWallet) {
      throw new Error('Wallet not found for payment participants');
    }
  /**
   * Process a payment from WZA to Bob (wizard buying beer)
   */
  async wzaBuysBeer(beerType: string = 'Mystical Ale'): Promise<PaymentTransaction> {
    const wzaWallet = this.wallets.get('wza');
    const bobWallet = this.wallets.get('bob');
    const beerPrice = config.paymentAmounts?.beerPrice || 0.0001; // Very low beer price from config

    if (!wzaWallet || !bobWallet) {
      throw new Error('Wallet not found for beer purchase');
    }

    console.log(`[Solana] WZA buys ${beerType} from Bob for ${beerPrice} SOL (very low amount)`);

    const result = await this.client.transferFunds({
      fromAgentId: wzaWallet.agentId,
      toAgentId: bobWallet.agentId,
      amount: beerPrice,
      message: `🍺 Wizard's Beer Purchase: ${beerType}`
    });

    const transaction: PaymentTransaction = {
      id: `wza-beer-${Date.now()}`,
      fromAgent: 'wza',
      toAgent: 'bob',
      amount: beerPrice,
      message: `Purchased ${beerType}`,
      transactionType: 'purchase',
      timestamp: new Date().toISOString(),
      blockchainTxId: result.transactionId
    };

    this.transactions.push(transaction);
    await this.updateWalletBalances();

    return transaction;
  }

    if (!wzaWallet || !bobWallet) {
      throw new Error('Wallet not found for beer purchase');
    }

    console.log(`[Solana] WZA buys ${beerType} from Bob for ${beerPrice} SOL`);

    const result = await this.client.transferFunds({
      fromAgentId: wzaWallet.agentId,
      toAgentId: bobWallet.agentId,
      amount: beerPrice,
      message: `🍺 Wizard's Beer Purchase: ${beerType}`
    });

    const transaction: PaymentTransaction = {
      id: `wza-beer-${Date.now()}`,
      fromAgent: 'wza',
      toAgent: 'bob',
      amount: beerPrice,
      message: `Purchased ${beerType}`,
      transactionType: 'purchase',
      timestamp: new Date().toISOString(),
      blockchainTxId: result.transactionId
    };

    this.transactions.push(transaction);
    await this.updateWalletBalances();

    return transaction;
  }

  /**
   * Process theft by Homie (stealing from other patrons or finding coins)
   */
  async homieStealsMoney(targetName: string, amount?: number): Promise<PaymentTransaction> {
    const homieWallet = this.wallets.get('homie');
    const theftAmount = amount || config.paymentAmounts?.theftAmount || 0.00005; // Very low theft amount from config

    if (!homieWallet) {
      throw new Error('Homie wallet not found for theft operation');
    }

    console.log(`[Solana] Homie steals ${theftAmount} SOL from ${targetName} (very low amount)`);

    // Create a temporary "victim" agent for the theft simulation
    const victimAgent = await this.client.createAgent({
      name: `${targetName} (Tavern Patron)`,
      capabilities: ['tavern_patron'],
      initialBalance: theftAmount + 0.0001 // Ensure victim has enough to be stolen from (very low)
    });

    const result = await this.client.transferFunds({
      fromAgentId: victimAgent.id,
      toAgentId: homieWallet.agentId,
      amount: theftAmount,
      message: `💰 Gnome's Theft: Pickpocketed from ${targetName}`
    });

    const transaction: PaymentTransaction = {
      id: `homie-theft-${Date.now()}`,
      fromAgent: targetName.toLowerCase().replace(' ', '_'),
      toAgent: 'homie',
      amount: theftAmount,
      message: `Stole from ${targetName}`,
      transactionType: 'theft',
      timestamp: new Date().toISOString(),
      blockchainTxId: result.transactionId
    };

    this.transactions.push(transaction);
    await this.updateWalletBalances();

    return transaction;
  }
  /**
   * Get wallet balance for a specific character
   */
  async getWalletBalance(characterId: string): Promise<number> {
    const wallet = this.wallets.get(characterId);
    if (!wallet) {
      throw new Error(`Wallet not found for character: ${characterId}`);
    }

    const balance = await this.client.getBalance(wallet.agentId);
    wallet.balance = balance;
    return balance;
  }

  /**
   * Get wallet configuration from config.json
   */
  getWalletConfig(): any {
    return config.wallets || {};
  }

  /**
   * Get payment amounts configuration from config.json
   */
  getPaymentAmounts(): any {
    return config.paymentAmounts || {};
  }

  /**
   * Get all wallet information
   */
  getTavernWallets(): TavernWallet[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(): PaymentTransaction[] {
    return [...this.transactions];
  }

  /**
   * Update all wallet balances from blockchain
   */
  private async updateWalletBalances(): Promise<void> {
    for (const [characterId, wallet] of this.wallets.entries()) {
      try {
        wallet.balance = await this.client.getBalance(wallet.agentId);
      } catch (error) {
        console.error(`[Solana] Failed to update balance for ${characterId}:`, error);
      }
    }
  }

  /**
   * Get system health and network status
   */
  async getSystemHealth(): Promise<any> {
    return await this.client.healthCheck();
  }

  /**
   * Generate a D&D themed payment narrative
   */
  generatePaymentNarrative(transaction: PaymentTransaction): string {
    const narratives = {
      payment: {
        'homie-bob': [
          `Homie sheepishly slides ${transaction.amount} SOL across the bar to Bob, muttering "For the ale... and maybe forgiveness for that missing spoon."`,
          `With nimble fingers, Homie counts out ${transaction.amount} SOL, placing it carefully on the counter. "Fair payment for fair service, Bob!"`,
          `Homie's coin purse jingles as they extract ${transaction.amount} SOL. "Here's what I owe ye, barkeep. No hard feelings about the... incidents."`
        ]
      },
      purchase: {
        'wza-bob': [
          `WZA's eyes glow softly as ${transaction.amount} SOL materializes on the bar. "One ${transaction.message}, good bartender. The spirits tell me it will be excellent."`,
          `With a mystical gesture, WZA transfers ${transaction.amount} SOL through the ethereal plane directly to Bob's purse. "Magic makes commerce so much more elegant."`,
          `WZA taps their staff, and ${transaction.amount} SOL appears in a shimmer of light. "The future showed me I'd need this drink. Here's payment in advance."`
        ]
      },
      theft: {
        'homie': [
          `In a flash of gnomish dexterity, Homie's fingers dance through the shadows, emerging with ${transaction.amount} SOL from ${transaction.message}. "Finders keepers!"`,
          `Homie's eyes gleam with mischief as ${transaction.amount} SOL mysteriously finds its way from a patron's purse to their own. "The coin wanted to be free!"`,
          `With the stealth of a shadow, Homie liberates ${transaction.amount} SOL from an unsuspecting victim. "Just redistributing wealth... gnome style!"`
        ]
      }
    };

    const key = `${transaction.fromAgent}-${transaction.toAgent}`;
    const typeNarratives = narratives[transaction.transactionType];
    
    if (typeNarratives && typeNarratives[key]) {
      const options = typeNarratives[key];
      return options[Math.floor(Math.random() * options.length)];
    }

    return `${transaction.amount} SOL changes hands in the tavern...`;
  }
}

// Export singleton instance
export const solanaPaymentService = new SolanaPaymentService();