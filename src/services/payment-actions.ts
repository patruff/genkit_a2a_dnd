/**
 * Payment Action Handlers for D&D Tavern Agents
 * Integrates Solana payments with existing agent behaviors
 */

import { solanaPaymentService, PaymentTransaction } from './solana-payment.js';
import { phantomWalletService } from './phantom-wallet.js';

export interface PaymentActionResult {
  success: boolean;
  transaction?: PaymentTransaction;
  narrative: string;
  error?: string;
}

export class PaymentActionHandler {
  
  /**
   * Process payment action for Homie paying Bob
   */
  static async processHomiePaysBob(amount: number, reason: string): Promise<PaymentActionResult> {
    try {
      // Validate wallets are connected
      if (!phantomWalletService.validateWalletAction('homie', 'send')) {
        return {
          success: false,
          narrative: "*Homie pats his empty pockets* Blast! My coin purse seems to be... disconnected from the mystical payment realm!",
          error: "Homie's wallet not connected"
        };
      }

      if (!phantomWalletService.validateWalletAction('bob', 'receive')) {
        return {
          success: false,
          narrative: "*Bob scratches his head* Sorry friend, my payment ledger isn't working right now. Try again later?",
          error: "Bob's wallet not connected"
        };
      }

      // Process the payment
      const transaction = await solanaPaymentService.homiePaysBob(amount, reason);
      const narrative = solanaPaymentService.generatePaymentNarrative(transaction);

      return {
        success: true,
        transaction,
        narrative: `${narrative}\n\n*Bob nods approvingly* "Much appreciated, Homie! Your payment of ${amount} SOL has been received."`
      };

    } catch (error) {
      return {
        success: false,
        narrative: `*Homie fumbles with his coin purse* "Uh oh... something went wrong with the payment magic!" ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Process WZA buying beer from Bob
   */
  static async processWzaBuysBeer(beerType: string = 'Mystical Ale'): Promise<PaymentActionResult> {
    try {
      // Validate wallets are connected
      if (!phantomWalletService.validateWalletAction('wza', 'send')) {
        return {
          success: false,
          narrative: "*WZA's eyes dim slightly* The ethereal payment channels seem to be... disrupted. My mystical wallet requires reconnection.",
          error: "WZA's wallet not connected"
        };
      }

      if (!phantomWalletService.validateWalletAction('bob', 'receive')) {
        return {
          success: false,
          narrative: "*Bob polishes a mug nervously* My payment crystal isn't glowing right now, wizard. The tavern's mystical commerce is temporarily unavailable.",
          error: "Bob's wallet not connected"
        };
      }

      // Process the beer purchase
      const transaction = await solanaPaymentService.wzaBuysBeer(beerType);
      const narrative = solanaPaymentService.generatePaymentNarrative(transaction);

      return {
        success: true,
        transaction,
        narrative: `${narrative}\n\n*Bob slides a frothy mug across the bar* "One ${beerType} coming right up! The payment went through perfectly - the blockchain spirits are pleased!"`
      };

    } catch (error) {
      return {
        success: false,
        narrative: `*WZA waves their staff in frustration* "The mystical payment energies are chaotic! ${error.message}"`,
        error: error.message
      };
    }
  }

  /**
   * Process Homie stealing money
   */
  static async processHomieStealsMoney(targetName: string, amount: number): Promise<PaymentActionResult> {
    try {
      // Validate Homie can perform theft
      if (!phantomWalletService.validateWalletAction('homie', 'steal')) {
        return {
          success: false,
          narrative: "*Homie looks at his hands in confusion* My thieving fingers have lost their mystical touch! The blockchain gods have cursed my pickpocketing abilities!",
          error: "Homie cannot perform theft - wallet not configured"
        };
      }

      // Roll for stealth check (D&D style)
      const stealthRoll = Math.floor(Math.random() * 20) + 1;
      const stealthBonus = 6; // Homie's stealth bonus
      const totalStealth = stealthRoll + stealthBonus;

      // Difficulty check (DC 15 for successful theft)
      if (totalStealth < 15) {
        return {
          success: false,
          narrative: `*Homie attempts to pickpocket ${targetName} but fumbles!* (Rolled ${stealthRoll} + ${stealthBonus} = ${totalStealth} vs DC 15) "Blast! They noticed me reaching for their coin purse!"`,
          error: "Stealth check failed"
        };
      }

      // Process the theft
      const transaction = await solanaPaymentService.homieStealsMoney(targetName, amount);
      const narrative = solanaPaymentService.generatePaymentNarrative(transaction);

      return {
        success: true,
        transaction,
        narrative: `*Homie rolls for stealth: ${stealthRoll} + ${stealthBonus} = ${totalStealth} (Success!)*\n\n${narrative}\n\n*Homie grins mischievously* "Like taking candy from a baby... if candy was SOL and babies carried Phantom wallets!"`
      };

    } catch (error) {
      return {
        success: false,
        narrative: `*Homie's theft attempt backfires spectacularly* "The blockchain spirits have turned against me! ${error.message}"`,
        error: error.message
      };
    }
  }

  /**
   * Get wallet status for all characters
   */
  static async getWalletStatus(): Promise<string> {
    try {
      const wallets = solanaPaymentService.getTavernWallets();
      const status = [];

      for (const wallet of wallets) {
        const balance = await solanaPaymentService.getWalletBalance(wallet.agentId.split('-')[0]); // Extract character ID
        const config = phantomWalletService.getWalletConfig(wallet.agentId.split('-')[0]);
        
        status.push(`**${wallet.name}**`);
        status.push(`  💰 Balance: ${balance.toFixed(3)} SOL`);
        status.push(`  🔗 Status: ${config?.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
        status.push(`  🎭 Type: ${wallet.characterType.replace('_', ' ')}`);
        status.push('');
      }

      return status.join('\n');
    } catch (error) {
      return `*The mystical ledger is clouded with confusion* Error reading wallet status: ${error.message}`;
    }
  }

  /**
   * Get recent transaction history
   */
  static getTransactionHistory(): string {
    try {
      const transactions = solanaPaymentService.getTransactionHistory();
      
      if (transactions.length === 0) {
        return "*The tavern's transaction scroll remains blank - no payments have been made yet.*";
      }

      const history = ["**Recent Tavern Transactions:**", ""];
      
      transactions.slice(-10).forEach((tx, index) => {
        const time = new Date(tx.timestamp).toLocaleTimeString();
        const type = tx.transactionType === 'theft' ? '💰' : tx.transactionType === 'purchase' ? '🍺' : '💳';
        
        history.push(`${type} **${time}** - ${tx.fromAgent} → ${tx.toAgent}`);
        history.push(`   Amount: ${tx.amount} SOL | ${tx.message}`);
        if (tx.blockchainTxId) {
          history.push(`   TX: ${tx.blockchainTxId.substring(0, 8)}...`);
        }
        history.push('');
      });

      return history.join('\n');
    } catch (error) {
      return `*The transaction scroll is illegible* Error reading history: ${error.message}`;
    }
  }

  /**
   * Initialize all tavern wallets
   */
  static async initializeTavernPayments(): Promise<string> {
    try {
      await solanaPaymentService.initializeTavernWallets();
      
      // Connect phantom wallets (in a real implementation, these would be actual wallet addresses)
      await phantomWalletService.connectWallet('homie', 'HomieGnomeThief1234567890123456789012345');
      await phantomWalletService.connectWallet('bob', 'BobBartender1234567890123456789012345678');
      await phantomWalletService.connectWallet('wza', 'WZAWizard12345678901234567890123456789012');

      return `🎉 **The Tipsy Gnome Payment System is Now Active!** 🎉

All tavern characters have been equipped with Phantom wallets and are ready for blockchain-based commerce:

${await this.getWalletStatus()}

*The mystical payment energies flow through the tavern, ready to facilitate all manner of transactions, both legitimate and... questionable.*`;

    } catch (error) {
      return `*The payment initialization ritual has failed!* Error: ${error.message}`;
    }
  }
}

// Export action types for use in agent handlers
export const PAYMENT_ACTIONS = {
  HOMIE_PAYS_BOB: 'HOMIE_PAYS_BOB',
  WZA_BUYS_BEER: 'WZA_BUYS_BEER',
  HOMIE_STEALS: 'HOMIE_STEALS',
  CHECK_WALLETS: 'CHECK_WALLETS',
  TRANSACTION_HISTORY: 'TRANSACTION_HISTORY',
  INITIALIZE_PAYMENTS: 'INITIALIZE_PAYMENTS'
} as const;