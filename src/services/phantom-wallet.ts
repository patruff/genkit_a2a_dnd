/**
 * Phantom Wallet Integration for D&D Tavern Agents
 * Provides wallet connectivity and transaction signing capabilities
 */

export interface PhantomWalletConfig {
  agentId: string;
  characterName: string;
  walletAddress: string;
  isConnected: boolean;
  characterType: 'gnome_thief' | 'human_bartender' | 'wizard';
}

export interface WalletCapabilities {
  canSendPayments: boolean;
  canReceivePayments: boolean;
  canSteal: boolean;
  specialAbilities: string[];
}

export class PhantomWalletService {
  private walletConfigs: Map<string, PhantomWalletConfig> = new Map();
  private capabilities: Map<string, WalletCapabilities> = new Map();

  constructor() {
    this.initializeWalletCapabilities();
  }

  /**
   * Initialize wallet capabilities for each character type
   */
  private initializeWalletCapabilities(): void {
    // Homie the Gnome Thief capabilities
    this.capabilities.set('homie', {
      canSendPayments: true,
      canReceivePayments: true,
      canSteal: true,
      specialAbilities: [
        'pickpocket_transactions',
        'stealth_payments',
        'coin_purse_manipulation',
        'shadow_transfers'
      ]
    });

    // Bob the Bartender capabilities
    this.capabilities.set('bob', {
      canSendPayments: true,
      canReceivePayments: true,
      canSteal: false,
      specialAbilities: [
        'merchant_processing',
        'tavern_payments',
        'bulk_transactions',
        'tip_jar_management'
      ]
    });

    // WZA the Wizard capabilities
    this.capabilities.set('wza', {
      canSendPayments: true,
      canReceivePayments: true,
      canSteal: false,
      specialAbilities: [
        'mystical_payments',
        'future_sight_transactions',
        'ethereal_transfers',
        'divination_fees'
      ]
    });
  }

  /**
   * Connect Phantom wallet for a character
   */
  async connectWallet(characterId: string, walletAddress: string): Promise<PhantomWalletConfig> {
    const characterNames = {
      'homie': 'Homie the Gnome Thief',
      'bob': 'Bob the Bartender',
      'wza': 'WZA the Wizard'
    };

    const characterTypes = {
      'homie': 'gnome_thief' as const,
      'bob': 'human_bartender' as const,
      'wza': 'wizard' as const
    };

    const config: PhantomWalletConfig = {
      agentId: characterId,
      characterName: characterNames[characterId] || characterId,
      walletAddress: walletAddress,
      isConnected: true,
      characterType: characterTypes[characterId] || 'gnome_thief'
    };

    this.walletConfigs.set(characterId, config);
    
    console.log(`[Phantom] Connected wallet for ${config.characterName}: ${walletAddress}`);
    
    return config;
  }

  /**
   * Get wallet configuration for a character
   */
  getWalletConfig(characterId: string): PhantomWalletConfig | null {
    return this.walletConfigs.get(characterId) || null;
  }

  /**
   * Get wallet capabilities for a character
   */
  getWalletCapabilities(characterId: string): WalletCapabilities | null {
    return this.capabilities.get(characterId) || null;
  }

  /**
   * Generate Phantom wallet connection URLs for each character
   */
  generateWalletConnectionUrls(): Record<string, string> {
    const baseUrl = 'https://phantom.app/ul/v1/connect';
    const appUrl = encodeURIComponent('http://localhost:41247'); // Tavern server URL
    
    return {
      homie: `${baseUrl}?app_url=${appUrl}&cluster=devnet&redirect_link=${appUrl}/wallet/connected/homie`,
      bob: `${baseUrl}?app_url=${appUrl}&cluster=devnet&redirect_link=${appUrl}/wallet/connected/bob`,
      wza: `${baseUrl}?app_url=${appUrl}&cluster=devnet&redirect_link=${appUrl}/wallet/connected/wza`
    };
  }

  /**
   * Validate wallet connection for character-specific actions
   */
  validateWalletAction(characterId: string, action: 'send' | 'receive' | 'steal'): boolean {
    const config = this.walletConfigs.get(characterId);
    const capabilities = this.capabilities.get(characterId);

    if (!config || !config.isConnected || !capabilities) {
      return false;
    }

    switch (action) {
      case 'send':
        return capabilities.canSendPayments;
      case 'receive':
        return capabilities.canReceivePayments;
      case 'steal':
        return capabilities.canSteal;
      default:
        return false;
    }
  }

  /**
   * Get all connected wallets
   */
  getAllConnectedWallets(): PhantomWalletConfig[] {
    return Array.from(this.walletConfigs.values()).filter(config => config.isConnected);
  }

  /**
   * Disconnect wallet for a character
   */
  disconnectWallet(characterId: string): boolean {
    const config = this.walletConfigs.get(characterId);
    if (config) {
      config.isConnected = false;
      console.log(`[Phantom] Disconnected wallet for ${config.characterName}`);
      return true;
    }
    return false;
  }

  /**
   * Generate character-specific wallet metadata for A2A cards
   */
  generateWalletMetadata(characterId: string): any {
    const config = this.walletConfigs.get(characterId);
    const capabilities = this.capabilities.get(characterId);

    if (!config || !capabilities) {
      return null;
    }

    return {
      phantom_wallet: {
        enabled: true,
        address: config.walletAddress,
        network: 'devnet',
        capabilities: capabilities.specialAbilities,
        character_type: config.characterType,
        connection_status: config.isConnected ? 'connected' : 'disconnected'
      },
      solana_integration: {
        can_send_payments: capabilities.canSendPayments,
        can_receive_payments: capabilities.canReceivePayments,
        can_perform_theft: capabilities.canSteal,
        special_abilities: capabilities.specialAbilities
      }
    };
  }
}

// Export singleton instance
export const phantomWalletService = new PhantomWalletService();