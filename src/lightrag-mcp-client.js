// LightRAG MCP Client implementation
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

// Simple logger
const logger = {
  info: (msg) => console.log(chalk.blue(`[INFO] ${msg}`)),
  success: (msg) => console.log(chalk.green(`[SUCCESS] ${msg}`)),
  error: (msg, err) => console.error(chalk.red(`[ERROR] ${msg}`), err ? `\n${err}` : ''),
  debug: (msg) => console.log(chalk.gray(`[DEBUG] ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`[WARN] ${msg}`))
};

/**
 * LightRAG MCP Client
 * 
 * Provides methods for interacting with a LightRAG knowledge repository
 * either directly via API or through MCP.
 */
export class LightRAGClient {
  /**
   * Create a new LightRAG client
   * @param {Object} options Configuration options
   * @param {string} options.apiUrl The base URL of the LightRAG API server
   * @param {string} options.mcpUrl The MCP server URL (if using MCP)
   * @param {boolean} options.useMcp Whether to use MCP or direct API
   * @param {boolean} options.debug Enable debug logging
   */
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'http://localhost:8020';
    this.mcpUrl = options.mcpUrl || 'http://localhost:8080';
    this.useMcp = options.useMcp || false;
    this.debug = options.debug || false;
    this.requestId = 1;
    this.alternateAPIs = [
      'http://localhost:8020',
      'http://127.0.0.1:8020',
      'http://host.docker.internal:8020'
    ];
    this.alternateMCPs = [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://host.docker.internal:8080'
    ];
    
    if (this.debug) {
      logger.info(`LightRAG Client initialized with ${this.useMcp ? 'MCP' : 'direct API'} mode`);
      logger.info(`API URL: ${this.apiUrl}`);
      if (this.useMcp) {
        logger.info(`MCP URL: ${this.mcpUrl}`);
      }
    }
  }

  /**
   * Check if the LightRAG service is available via any method
   * @returns {Promise<boolean>} True if available, false otherwise
   */
  async isAvailable() {
    // First try the configured API URL
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (response.ok) {
        if (this.debug) logger.success(`LightRAG API available at ${this.apiUrl}`);
        return true;
      }
    } catch (error) {
      if (this.debug) logger.debug(`LightRAG API not available at ${this.apiUrl}: ${error.message}`);
    }
    
    // Try alternate API URLs
    for (const url of this.alternateAPIs) {
      if (url === this.apiUrl) continue; // Skip the one we already tried
      
      try {
        const response = await fetch(`${url}/health`);
        if (response.ok) {
          logger.success(`LightRAG API available at alternate URL: ${url}`);
          this.apiUrl = url; // Update to the working URL
          return true;
        }
      } catch (error) {
        if (this.debug) logger.debug(`LightRAG API not available at ${url}: ${error.message}`);
      }
    }
    
    // If direct API isn't available, try MCP
    return this.isMCPAvailable();
  }
  
  /**
   * Check if MCP is available
   * @returns {Promise<boolean>} True if available, false otherwise
   */
  async isMCPAvailable() {
    try {
      // Try the configured MCP URL
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'health-check',
          method: 'list_tools'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!result.error) {
          logger.success(`MCP available at ${this.mcpUrl}`);
          this.useMcp = true;
          return true;
        }
      }
    } catch (error) {
      if (this.debug) logger.debug(`MCP not available at ${this.mcpUrl}: ${error.message}`);
    }
    
    // Try alternate MCP URLs
    for (const url of this.alternateMCPs) {
      if (url === this.mcpUrl) continue; // Skip the one we already tried
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'health-check',
            method: 'list_tools'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (!result.error) {
            logger.success(`MCP available at alternate URL: ${url}`);
            this.mcpUrl = url; // Update to the working URL
            this.useMcp = true;
            return true;
          }
        }
      } catch (error) {
        if (this.debug) logger.debug(`MCP not available at ${url}: ${error.message}`);
      }
    }
    
    // Neither direct API nor MCP are available
    logger.error('LightRAG is not available via any connection method');
    return false;
  }

  /**
   * Insert text into the LightRAG repository
   * @param {string} text Text content to insert
   * @returns {Promise<Object>} Result of the operation
   */
  async insertText(text) {
    if (this.useMcp) {
      try {
        return await this._mcpInsertText(text);
      } catch (error) {
        logger.warn(`MCP insert failed: ${error.message}. Falling back to direct API...`);
        this.useMcp = false;
        return this._directInsertText(text);
      }
    } else {
      try {
        return await this._directInsertText(text);
      } catch (error) {
        logger.warn(`Direct API insert failed: ${error.message}. Trying MCP...`);
        if (await this.isMCPAvailable()) {
          return this._mcpInsertText(text);
        }
        throw error;
      }
    }
  }

  /**
   * Query the LightRAG repository
   * @param {string} query The query text
   * @param {string} mode Retrieval mode: 'hybrid', 'semantic', or 'keyword'
   * @param {boolean} onlyNeedContext Whether to return only context without generation
   * @returns {Promise<Object>} Query results
   */
  async query(query, mode = 'hybrid', onlyNeedContext = false) {
    if (this.useMcp) {
      try {
        return await this._mcpQuery(query, mode, onlyNeedContext);
      } catch (error) {
        logger.warn(`MCP query failed: ${error.message}. Falling back to direct API...`);
        this.useMcp = false;
        return this._directQuery(query, mode, onlyNeedContext);
      }
    } else {
      try {
        return await this._directQuery(query, mode, onlyNeedContext);
      } catch (error) {
        logger.warn(`Direct API query failed: ${error.message}. Trying MCP...`);
        if (await this.isMCPAvailable()) {
          return this._mcpQuery(query, mode, onlyNeedContext);
        }
        // If all methods fail, return a simulated response
        logger.warn('All query methods failed. Returning simulated response.');
        return this._generateSimulatedResponse(query);
      }
    }
  }

  /**
   * Clear the LightRAG repository contents
   * @returns {Promise<Object>} Result of the operation
   */
  async clear() {
    if (this.useMcp) {
      try {
        return await this._mcpClear();
      } catch (error) {
        logger.warn(`MCP clear failed: ${error.message}. Falling back to direct API...`);
        this.useMcp = false;
        return this._directClear();
      }
    } else {
      try {
        return await this._directClear();
      } catch (error) {
        logger.warn(`Direct API clear failed: ${error.message}. Trying MCP...`);
        if (await this.isMCPAvailable()) {
          return this._mcpClear();
        }
        throw error;
      }
    }
  }

  /**
   * Generate a simulated response when both API and MCP fail
   * @private
   */
  _generateSimulatedResponse(query) {
    const responses = {
      // Gem-related queries
      'gem': 'Magical gems like the Blue Sapphire of Netheril contain powerful arcane energy. They often have elemental affinities and can be used as power sources for magical devices or as foci for spellcasting. The Blue Sapphire specifically is rumored to contain the trapped essence of an ancient ice elemental.',
      'sapphire': 'The Blue Sapphire of Netheril is a legendary gem created during the height of the Netherese empire. It glows with an inner blue light and radiates cold. Legend says it can protect its bearer from fire and heat, but may attract the attention of ice elementals.',
      'netheril': 'Netheril was an ancient human empire of Faerûn that flourished in the Savage North. Netherese wizards created many powerful magical artifacts, including enchanted gems that persist to this day, containing fragments of elemental powers.',
      
      // Thief-related queries
      'thief': 'Thieves are often drawn to magical items for their monetary value rather than their arcane properties. A thief like Homie might be unaware of the true power of magical gems, seeing only their market worth. This makes them particularly dangerous, as they might inadvertently release magical energies they cannot control.',
      'steal': 'Those who steal magical artifacts often face unexpected consequences. Protective wards, curses, or the attention of magical entities might follow the theft of powerful items. A savvy wizard can often predict theft attempts through divination.',
      'homie': 'Typical thieves like Homie are skilled in stealth and lockpicking but lack arcane knowledge. They may not recognize magical protections and could trigger harmful effects when attempting to steal enchanted items.',
      
      // Protection-related queries
      'protection': 'Protection spells from the School of Abjuration are ideal for securing valuable items. Alarm spells can notify the owner of intrusion, while Arcane Lock can secure containers. For powerful artifacts, Glyph of Warding can be set to trigger defensive magic if the item is touched by unauthorized individuals.',
      'spell': 'Protective spells include Alarm, Arcane Lock, Glyph of Warding, and Symbol. These can be layered to create comprehensive security for valuable items. Advanced wizards might also use Nystul\'s Magic Aura to disguise these protections, making them harder for thieves to detect.',
      'abjuration': 'Abjuration magic specializes in protection and warding. Abjurers can create magical barriers, dispel hostile magic, and create wards that trigger when specific conditions are met, such as unauthorized handling of a protected item.'
    };
    
    // Check if any keywords match
    const lowerQuery = query.toLowerCase();
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return {
          query,
          data: response,
          source: 'simulated'
        };
      }
    }
    
    // Default response if no keywords match
    return {
      query,
      data: "I have limited knowledge about that specific magical topic. In general, magical artifacts should be handled with care, as they often contain unpredictable energies and may be protected by their creators.",
      source: 'simulated'
    };
  }

  /**
   * Direct API call for inserting text
   * @private
   */
  async _directInsertText(text) {
    try {
      if (this.debug) logger.debug(`Direct API insert: ${text.slice(0, 30)}...`);
      
      const response = await fetch(`${this.apiUrl}/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (this.debug) logger.success('Text inserted successfully');
      return result;
    } catch (error) {
      logger.error('Failed to insert text via direct API', error);
      throw error;
    }
  }

  /**
   * Direct API call for querying
   * @private
   */
  async _directQuery(query, mode = 'hybrid', onlyNeedContext = false) {
    try {
      if (this.debug) logger.debug(`Direct API query: ${query}`);
      
      const response = await fetch(`${this.apiUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          mode,
          only_need_context: onlyNeedContext
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (this.debug) logger.success('Query successful');
      return result;
    } catch (error) {
      logger.error('Failed to query via direct API', error);
      throw error;
    }
  }

  /**
   * Direct API call for clearing the repository
   * @private
   */
  async _directClear() {
    try {
      if (this.debug) logger.debug('Direct API clear repository');
      
      const response = await fetch(`${this.apiUrl}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (this.debug) logger.success('Repository cleared successfully');
      return result;
    } catch (error) {
      logger.error('Failed to clear repository via direct API', error);
      throw error;
    }
  }

  /**
   * MCP call for inserting text
   * @private
   */
  async _mcpInsertText(text) {
    try {
      if (this.debug) logger.debug(`MCP insert: ${text.slice(0, 30)}...`);
      
      const requestId = this.requestId++;
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method: 'call_tool',
          params: {
            name: 'insert_text',
            arguments: { text }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        // Try alternate method names
        return this._mcpInsertTextAlternate(text);
      }
      
      if (this.debug) logger.success('Text inserted successfully via MCP');
      return result.result;
    } catch (error) {
      logger.error('Failed to insert text via MCP', error);
      throw error;
    }
  }
  
  /**
   * Try alternate MCP method names for inserting text
   * @private
   */
  async _mcpInsertTextAlternate(text) {
    const alternateMethodNames = [
      'lightrag/insert',
      'lightrag_insert',
      'insert',
      'rag/insert'
    ];
    
    for (const methodName of alternateMethodNames) {
      try {
        if (this.debug) logger.debug(`Trying alternate MCP method: ${methodName}`);
        
        const requestId = this.requestId++;
        const response = await fetch(this.mcpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            method: 'call_tool',
            params: {
              name: methodName,
              arguments: { text }
            }
          })
        });
        
        if (!response.ok) continue;
        
        const result = await response.json();
        
        if (result.error) continue;
        
        if (this.debug) logger.success(`Text inserted successfully via alternate MCP method: ${methodName}`);
        return result.result;
      } catch (error) {
        if (this.debug) logger.debug(`Failed with alternate method ${methodName}: ${error.message}`);
      }
    }
    
    throw new Error('All MCP insert methods failed');
  }

  /**
   * MCP call for querying
   * @private
   */
  async _mcpQuery(query, mode = 'hybrid', onlyNeedContext = false) {
    try {
      if (this.debug) logger.debug(`MCP query: ${query}`);
      
      const requestId = this.requestId++;
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method: 'call_tool',
          params: {
            name: 'query_rag',
            arguments: {
              query,
              mode,
              only_need_context: onlyNeedContext
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        // Try alternate method names
        return this._mcpQueryAlternate(query, mode, onlyNeedContext);
      }
      
      if (this.debug) logger.success('Query successful via MCP');
      return result.result;
    } catch (error) {
      logger.error('Failed to query via MCP', error);
      throw error;
    }
  }
  
  /**
   * Try alternate MCP method names for querying
   * @private
   */
  async _mcpQueryAlternate(query, mode = 'hybrid', onlyNeedContext = false) {
    const alternateMethodNames = [
      'lightrag/query',
      'lightrag_query',
      'query',
      'rag/query'
    ];
    
    for (const methodName of alternateMethodNames) {
      try {
        if (this.debug) logger.debug(`Trying alternate MCP method: ${methodName}`);
        
        const requestId = this.requestId++;
        const response = await fetch(this.mcpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            method: 'call_tool',
            params: {
              name: methodName,
              arguments: {
                query,
                mode,
                only_need_context: onlyNeedContext
              }
            }
          })
        });
        
        if (!response.ok) continue;
        
        const result = await response.json();
        
        if (result.error) continue;
        
        if (this.debug) logger.success(`Query successful via alternate MCP method: ${methodName}`);
        return result.result;
      } catch (error) {
        if (this.debug) logger.debug(`Failed with alternate method ${methodName}: ${error.message}`);
      }
    }
    
    throw new Error('All MCP query methods failed');
  }

  /**
   * MCP call for clearing the repository
   * @private
   */
  async _mcpClear() {
    try {
      if (this.debug) logger.debug('MCP clear repository');
      
      const requestId = this.requestId++;
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method: 'call_tool',
          params: {
            name: 'clear_rag',
            arguments: {}
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        // Try alternate methods
        const alternateMethodNames = [
          'lightrag/clear',
          'lightrag_clear',
          'clear',
          'rag/clear'
        ];
        
        for (const methodName of alternateMethodNames) {
          try {
            if (this.debug) logger.debug(`Trying alternate MCP method: ${methodName}`);
            
            const altRequestId = this.requestId++;
            const altResponse = await fetch(this.mcpUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: altRequestId,
                method: 'call_tool',
                params: {
                  name: methodName,
                  arguments: {}
                }
              })
            });
            
            if (!altResponse.ok) continue;
            
            const altResult = await altResponse.json();
            
            if (altResult.error) continue;
            
            if (this.debug) logger.success(`Repository cleared via alternate MCP method: ${methodName}`);
            return altResult.result;
          } catch (error) {
            if (this.debug) logger.debug(`Failed with alternate method ${methodName}: ${error.message}`);
          }
        }
        
        throw new Error(`MCP error: ${result.error.message}`);
      }
      
      if (this.debug) logger.success('Repository cleared successfully via MCP');
      return result.result;
    } catch (error) {
      logger.error('Failed to clear repository via MCP', error);
      throw error;
    }
  }
  
  /**
   * Start the MCP server for LightRAG
   * @param {Object} options MCP server options
   * @returns {ChildProcess} The MCP server process
   */
  static startMCPServer(options = {}) {
    const {
      port = 8080,
      apiUrl = 'http://localhost:8020',
      name = 'lightrag'
    } = options;
    
    logger.info("Starting LightRAG MCP Server...");
    
    // Check if we should use Windows paths
    const isWindows = process.platform === 'win32';
    const nodePath = isWindows ? 'C:\\Program Files\\nodejs\\node.exe' : 'node';
    
    try {
      const mcpProcess = spawn('npx', [
        '@modelcontextprotocol/cli',
        'start',
        '--name', name,
        '--port', port.toString(),
        '--env', `LIGHTRAG_API_URL=${apiUrl}`
      ], { 
        stdio: 'inherit',
        shell: true
      });
      
      mcpProcess.on('error', (err) => {
        logger.error('Failed to start MCP server', err);
      });
      
      mcpProcess.on('close', (code) => {
        if (code !== 0) {
          logger.error(`MCP server exited with code ${code}`);
        } else {
          logger.info('MCP server closed');
        }
      });
      
      return mcpProcess;
    } catch (error) {
      logger.error('Error starting MCP server', error);
      return null;
    }
  }
}

// Helper function to load lore files
export async function loadLoreFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    logger.error(`Failed to load lore file: ${filePath}`, error);
    return null;
  }
}

// Default export
export default LightRAGClient;