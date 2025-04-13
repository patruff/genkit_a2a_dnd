// MCP Client for the Wizard Scenario
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  debug: (msg) => console.log(`[DEBUG] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || '')
};

export class MCPProcess {
  constructor(definition, name) {
    this.definition = definition;
    this.name = name;
    this.process = null;
    this.callbacks = new Map();
    this.responseBuffer = '';
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        // Spawn the process
        const env = { ...process.env, ...(this.definition.env || {}) };
        
        logger.info(`Starting MCP process ${this.name} with command: ${this.definition.command} ${this.definition.args?.join(' ') || ''}`);
        
        this.process = spawn(
          this.definition.command,
          this.definition.args || [],
          { env, stdio: ['pipe', 'pipe', 'pipe'] }
        );

        // Track if process has already exited
        let hasExited = false;

        // Handle responses
        this.process.stdout.on('data', (data) => {
          this.handleResponse(data.toString());
        });

        // Handle errors
        this.process.stderr.on('data', (data) => {
          const errText = data.toString();
          logger.debug(`MCP ${this.name} stderr: ${errText}`);
          
          // If this is a 'command not found' like error, we might want to suggest an alternative
          if (errText.includes('command not found') || 
              errText.includes('MODULE_NOT_FOUND') ||
              errText.includes('Cannot find module')) {
            logger.error(`MCP ${this.name} command not found or module missing. Try installing it with: npm install -g @modelcontextprotocol/server-filesystem`);
          }
        });

        this.process.on('error', (err) => {
          logger.error(`MCP ${this.name} process error:`, err);
          hasExited = true;
          reject(err);
        });

        this.process.on('close', (code) => {
          logger.info(`MCP ${this.name} process exited with code ${code}`);
          hasExited = true;
          this.process = null;
          
          // Only reject if this happens during startup
          if (code !== 0) {
            reject(new Error(`MCP ${this.name} process exited with code ${code}`));
          }
        });

        // Give the process a moment to start
        setTimeout(() => {
          // If process already exited, don't try to ping
          if (hasExited) {
            return;
          }
          
          // Check if process is still running
          if (!this.process) {
            logger.error(`MCP ${this.name} process not running`);
            reject(new Error(`MCP ${this.name} process not running`));
            return;
          }
          
          // Send a ping to check if the process is ready
          this.sendRequest('list_tools', {})
            .then(() => {
              logger.info(`MCP ${this.name} is ready`);
              resolve();
            })
            .catch(err => {
              logger.error(`Failed to initialize MCP ${this.name}:`, err);
              reject(err);
            });
        }, 1000); // Give it a bit more time
      } catch (err) {
        logger.error(`Failed to start MCP ${this.name}:`, err);
        reject(err);
      }
    });
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      logger.info(`Stopped MCP process: ${this.name}`);
    }
  }

  handleResponse(data) {
    this.responseBuffer += data;
    
    // Process complete response lines
    let lineEnd;
    while ((lineEnd = this.responseBuffer.indexOf('\n')) !== -1) {
      const line = this.responseBuffer.slice(0, lineEnd).trim();
      this.responseBuffer = this.responseBuffer.slice(lineEnd + 1);
      
      if (line) {
        try {
          const response = JSON.parse(line);
          if (response.id && this.callbacks.has(response.id)) {
            const { resolve, reject } = this.callbacks.get(response.id);
            this.callbacks.delete(response.id);
            
            if (response.error) {
              reject(new Error(response.error.message || 'MCP error'));
            } else {
              resolve(response.result);
            }
          } else {
            logger.debug(`Unhandled MCP response: ${line}`);
          }
        } catch (err) {
          logger.error(`Error parsing MCP response: ${line}`, err);
        }
      }
    }
  }

  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error(`MCP ${this.name} process not running`));
        return;
      }
      
      const id = uuidv4();
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };
      
      // Register callback
      this.callbacks.set(id, { resolve, reject });
      
      // Set timeout
      const timeout = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`Request timed out for MCP ${this.name}`));
        }
      }, 10000);
      
      // Send request
      try {
        this.process.stdin.write(JSON.stringify(request) + '\n');
        logger.debug(`Sent request to MCP ${this.name}: ${JSON.stringify(request)}`);
      } catch (err) {
        clearTimeout(timeout);
        this.callbacks.delete(id);
        reject(err);
      }
    });
  }

  async callTool(toolName, args) {
    try {
      return await this.sendRequest('call_tool', {
        name: toolName,
        arguments: args
      });
    } catch (err) {
      logger.error(`Error calling tool ${toolName}:`, err);
      throw err;
    }
  }

  async listTools() {
    try {
      return await this.sendRequest('list_tools', {});
    } catch (err) {
      logger.error('Error listing tools:', err);
      throw err;
    }
  }
}

export class MCPRegistry {
  constructor() {
    this.mcps = new Map();
    this.processes = new Map();
  }

  registerMCP(name, definition) {
    this.mcps.set(name, definition);
    logger.info(`Registered MCP: ${name}`);
  }

  getMCP(name) {
    return this.mcps.get(name);
  }

  async startMCP(name) {
    const definition = this.getMCP(name);
    if (!definition) {
      throw new Error(`MCP not found: ${name}`);
    }
    
    if (this.processes.has(name)) {
      logger.info(`MCP ${name} already running`);
      return this.processes.get(name);
    }
    
    const process = new MCPProcess(definition, name);
    await process.start();
    this.processes.set(name, process);
    return process;
  }

  async stopMCP(name) {
    if (this.processes.has(name)) {
      await this.processes.get(name).stop();
      this.processes.delete(name);
      logger.info(`Stopped MCP: ${name}`);
    }
  }

  async stopAll() {
    for (const name of this.processes.keys()) {
      await this.stopMCP(name);
    }
  }

  loadFromConfig(config) {
    if (!config || !config.mcpServers) {
      throw new Error('Invalid MCP configuration');
    }
    
    for (const [name, definition] of Object.entries(config.mcpServers)) {
      this.registerMCP(name, definition);
    }
    
    logger.info(`Loaded ${this.mcps.size} MCPs from config`);
  }

  listMCPs() {
    return Array.from(this.mcps.keys());
  }
}

// Helper functions for the filesystem MCP
export async function readFutureFile(mcpProcess, path) {
  try {
    logger.info(`Reading future file: ${path}`);
    
    // Try direct method first
    try {
      logger.debug('Trying direct read_file method...');
      const result = await mcpProcess.sendRequest('read_file', { path });
      logger.debug(`Direct read_file result: ${JSON.stringify(result)}`);
      if (result.content && result.content.length > 0) {
        return result.content[0].text;
      }
    } catch (directErr) {
      logger.debug(`Direct read_file failed: ${directErr.message}`);
      
      // Try with call_tool if direct method fails
      logger.debug('Trying call_tool for read_file...');
      const result = await mcpProcess.callTool('read_file', { path });
      if (result.content && result.content.length > 0) {
        return result.content[0].text;
      }
    }
    
    return "The future is unclear";
  } catch (err) {
    logger.error(`Error reading future file: ${path}`, err);
    throw err;
  }
}

export async function writeFutureFile(mcpProcess, path, content) {
  try {
    logger.info(`Writing future file: ${path} with content: ${content}`);
    
    // Try direct method first
    try {
      logger.debug('Trying direct write_file method...');
      await mcpProcess.sendRequest('write_file', { path, content });
      return true;
    } catch (directErr) {
      logger.debug(`Direct write_file failed: ${directErr.message}`);
      
      // Try with call_tool if direct method fails
      logger.debug('Trying call_tool for write_file...');
      await mcpProcess.callTool('write_file', { path, content });
      return true;
    }
  } catch (err) {
    logger.error(`Error writing future file: ${path}`, err);
    throw err;
  }
}

// Load MCP configuration
export async function loadMCPRegistry(configPath) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const registry = new MCPRegistry();
    registry.loadFromConfig(config);
    return registry;
  } catch (err) {
    logger.error('Error loading MCP config:', err);
    throw err;
  }
}