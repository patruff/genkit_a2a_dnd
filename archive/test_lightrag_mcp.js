// Test script for LightRAG MCP server
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Configuration
const LIGHTRAG_API_URL = 'http://0.0.0.0:8020';
const LIGHTRAG_MCP_PORT = 8080;
const TEST_QUERIES = [
  "What is LightRAG?",
  "How does a RAG system work?",
  "Can you explain vector databases?",
  "What are embeddings in AI?",
  "How to implement a retrieval system?"
];

// Sample text to insert
const SAMPLE_TEXT = `
LightRAG is a lightweight Retrieval-Augmented Generation (RAG) framework designed for efficient and customizable information retrieval.

RAG systems combine retrieval mechanisms with generative AI to produce more accurate, factual, and context-aware responses. They work by:
1. Indexing documents or knowledge sources
2. Converting queries to vector embeddings
3. Retrieving relevant context based on similarity
4. Augmenting prompts with retrieved information
5. Generating responses using an LLM with the enriched context

Vector databases store embeddings - numerical representations of text, images, or other data - optimized for similarity search operations like nearest neighbor queries. They enable efficient retrieval of semantically similar content at scale.

Embeddings are dense vector representations that capture semantic meaning of content, mapping similar concepts close together in high-dimensional space. They form the foundation of modern retrieval systems.

To implement a retrieval system:
1. Choose an embedding model appropriate for your domain
2. Process and chunk documents thoughtfully
3. Create a vector index with a suitable similarity metric
4. Design an effective retrieval strategy (hybrid, reranking, etc.)
5. Optimize prompts to effectively incorporate retrieved context
`;

// Create a logger
const logger = {
  info: (msg) => console.log(chalk.blue(`[INFO] ${msg}`)),
  success: (msg) => console.log(chalk.green(`[SUCCESS] ${msg}`)),
  error: (msg, err) => console.error(chalk.red(`[ERROR] ${msg}`), err || ''),
  highlight: (msg) => console.log(chalk.yellow(`\n${msg}\n`))
};

// Direct API calls to LightRAG server
async function callLightRAGAPI(endpoint, body) {
  try {
    logger.info(`Calling LightRAG API: ${endpoint}`);
    const response = await fetch(`${LIGHTRAG_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    logger.success(`API call successful`);
    return result;
  } catch (error) {
    logger.error(`API call failed: ${error.message}`, error);
    throw error;
  }
}

// Insert text to LightRAG
async function insertText(text) {
  logger.highlight("INSERTING TEXT TO LIGHTRAG");
  try {
    const result = await callLightRAGAPI('/insert', { text });
    logger.success(`Text insertion result: ${result.message}`);
    return result;
  } catch (error) {
    logger.error('Failed to insert text', error);
    throw error;
  }
}

// Query LightRAG
async function queryLightRAG(query, mode = 'hybrid') {
  logger.highlight(`QUERYING LIGHTRAG: "${query}"`);
  try {
    const result = await callLightRAGAPI('/query', { 
      query,
      mode,
      only_need_context: false
    });
    logger.success('Query successful');
    console.log(chalk.cyan('Query: ') + query);
    console.log(chalk.cyan('Response: ') + result.data);
    console.log('\n' + '-'.repeat(80) + '\n');
    return result;
  } catch (error) {
    logger.error('Query failed', error);
    throw error;
  }
}

// Start MCP server for LightRAG
function startLightRAGMCPServer() {
  logger.highlight("STARTING LIGHTRAG MCP SERVER");
  
  const mcpProcess = spawn('npx', [
    '@modelcontextprotocol/cli',
    'start',
    '--name', 'lightrag',
    '--port', LIGHTRAG_MCP_PORT.toString(),
    '--env', `LIGHTRAG_API_URL=${LIGHTRAG_API_URL}`
  ], { stdio: 'inherit' });
  
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
}

// Test MCP LightRAG operations
async function testMCPOperations() {
  logger.highlight("TESTING MCP OPERATIONS");
  
  // Test inserting text via MCP
  try {
    // Implementation would go here - using the actual MCP server for lightrag
    logger.info("This would be implemented using the MCP server");
  } catch (error) {
    logger.error('MCP operation failed', error);
  }
}

// Main function to run tests
async function runTests() {
  try {
    // Check if LightRAG is available
    logger.info('Checking if LightRAG API is available...');
    try {
      const health = await fetch(`${LIGHTRAG_API_URL}/health`);
      if (health.ok) {
        logger.success('LightRAG API is available');
      } else {
        throw new Error(`Health check returned status ${health.status}`);
      }
    } catch (err) {
      logger.error('LightRAG API is not available. Please make sure it\'s running on http://localhost:8020', err);
      return;
    }
    
    // Insert sample text
    await insertText(SAMPLE_TEXT);
    
    // Give a moment for the insertion to be processed
    await new Promise(r => setTimeout(r, 2000));
    
    // Run test queries
    for (const query of TEST_QUERIES) {
      await queryLightRAG(query);
    }
    
    // Test different modes
    logger.info('Testing different retrieval modes...');
    await queryLightRAG('What are embeddings?', 'semantic');
    await queryLightRAG('What are embeddings?', 'keyword');
    
    logger.highlight("ALL TESTS COMPLETED SUCCESSFULLY");
    
    // Construct JSON for MCP use
    const mcpQueryJSON = {
      jsonrpc: "2.0",
      method: "call_tool",
      params: {
        name: "query_rag",
        arguments: {
          query: "What is LightRAG?",
          mode: "hybrid"
        }
      }
    };
    
    const mcpInsertJSON = {
      jsonrpc: "2.0",
      method: "call_tool",
      params: {
        name: "insert_text",
        arguments: {
          text: "LightRAG is a lightweight and efficient Retrieval-Augmented Generation framework."
        }
      }
    };
    
    logger.highlight("MCP JSON EXAMPLES");
    console.log(chalk.cyan("Query JSON:"));
    console.log(JSON.stringify(mcpQueryJSON, null, 2));
    
    console.log(chalk.cyan("\nInsert JSON:"));
    console.log(JSON.stringify(mcpInsertJSON, null, 2));
    
  } catch (error) {
    logger.error('Test run failed', error);
  }
}

// Run the tests
runTests().catch(err => {
  logger.error('Fatal error', err);
  process.exit(1);
});
