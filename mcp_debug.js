// Debug script for testing MCP communication
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Configuration
// Try both WSL and Windows paths
const MCP_DIRECTORIES = [
  '/mnt/c/Users/patru/anthropicFun',  // WSL path
  'C:\\Users\\patru\\anthropicFun'    // Windows path
];
const MCP_DIRECTORY = MCP_DIRECTORIES[0]; // Default to WSL path
const TEST_FILE_NAME = 'mcp_test.txt';
const TEST_FILE_PATHS = [
  path.join(MCP_DIRECTORY, TEST_FILE_NAME),                // WSL path
  path.join('C:\\Users\\patru\\anthropicFun', TEST_FILE_NAME) // Windows path
];
const TEST_CONTENT = 'This is a test file created by MCP debug script';

// Ensure the target directory exists
try {
  if (!fs.existsSync(MCP_DIRECTORY)) {
    console.log(`Creating directory: ${MCP_DIRECTORY}`);
    fs.mkdirSync(MCP_DIRECTORY, { recursive: true });
  }
} catch (err) {
  console.error(`Failed to ensure directory exists: ${err.message}`);
}

// Create a logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  debug: (msg) => console.log(`[DEBUG] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || '')
};

// Track responses
const pendingRequests = new Map();

// Start the MCP server process
logger.info('Starting MCP server process...');
let mcpProcess;

// Try different commands to start the MCP server
const commands = [
  { cmd: 'npx', args: ['@modelcontextprotocol/server-filesystem', MCP_DIRECTORY] },
  { cmd: 'node', args: ['/usr/lib/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js', MCP_DIRECTORY] },
  { cmd: 'npx', args: ['@modelcontextprotocol/cli', 'server', 'filesystem', MCP_DIRECTORY] }
];

// Try each command until one works
let currentCommandIndex = 0;

function tryNextCommand() {
  if (currentCommandIndex >= commands.length) {
    logger.error('All commands failed. MCP server could not be started.');
    process.exit(1);
  }

  const { cmd, args } = commands[currentCommandIndex];
  logger.info(`Trying command: ${cmd} ${args.join(' ')}`);
  
  mcpProcess = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  
  // Increment for next attempt
  currentCommandIndex++;
  
  // Set up handlers
  mcpProcess.stdout.on('data', handleStdout);
  mcpProcess.stderr.on('data', (data) => {
    const stderr = data.toString();
    logger.debug(`MCP server stderr: ${stderr}`);
    
    // If we get an error about command not found, try the next command
    if (stderr.includes('command not found') || 
        stderr.includes('MODULE_NOT_FOUND') ||
        stderr.includes('Cannot find module')) {
      logger.error('Command failed, trying next option...');
      mcpProcess.kill();
      tryNextCommand();
    }
  });
  
  mcpProcess.on('error', (err) => {
    logger.error('MCP process error:', err);
    if (currentCommandIndex < commands.length) {
      logger.info('Trying next command...');
      tryNextCommand();
    } else {
      logger.error('All commands failed.');
      process.exit(1);
    }
  });
  
  mcpProcess.on('close', (code) => {
    if (code !== 0) {
      logger.error(`MCP process exited with code ${code}`);
      if (currentCommandIndex < commands.length) {
        logger.info('Trying next command...');
        tryNextCommand();
      }
    } else {
      logger.info('MCP process closed successfully');
    }
  });
  
  // Schedule the "connection test"
  setTimeout(() => {
    // Verify the process is still running before proceeding
    if (mcpProcess && !mcpProcess.killed) {
      testMcpConnection();
    }
  }, 1000);
}

// Start with the first command
tryNextCommand();

// Buffer for incomplete responses
let responseBuffer = '';

// Handle stdout data from MCP server
function handleStdout(data) {
  const stdout = data.toString();
  responseBuffer += stdout;
  
  // Process complete lines
  let lineEnd;
  while ((lineEnd = responseBuffer.indexOf('\n')) !== -1) {
    const line = responseBuffer.slice(0, lineEnd).trim();
    responseBuffer = responseBuffer.slice(lineEnd + 1);
    
    if (line) {
      try {
        const response = JSON.parse(line);
        logger.debug(`Received response: ${JSON.stringify(response)}`);
        
        if (response.id && pendingRequests.has(response.id)) {
          const { resolve, reject } = pendingRequests.get(response.id);
          pendingRequests.delete(response.id);
          
          if (response.error) {
            logger.error(`Error in response: ${response.error.message}`);
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        } else {
          logger.debug(`Unhandled response with ID: ${response.id}`);
        }
      } catch (err) {
        logger.error(`Error parsing response: ${line}`, err);
      }
    }
  }
}

// Send request to MCP server
function sendRequest(method, params) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    // Register the pending request
    pendingRequests.set(id, { resolve, reject });
    
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Request timeout for method ${method}`));
      }
    }, 5000);
    
    // Log the request being sent
    logger.debug(`Sending request: ${JSON.stringify(request)}`);
    
    // Send the request
    try {
      mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    } catch (err) {
      clearTimeout(timeout);
      pendingRequests.delete(id);
      reject(err);
    }
  });
}

// Test various MCP methods using the format that worked
async function testMcpMethods() {
  // Determine which path to use based on what worked previously
  const testPath = global.workingPathFormat === 'windows' ? TEST_FILE_PATHS[1] : TEST_FILE_PATHS[0];
  const dirPath = global.workingPathFormat === 'windows' ? MCP_DIRECTORIES[1] : MCP_DIRECTORIES[0];
  
  // Determine which method naming style to use
  const methodPrefix = global.useFilesystemPrefix ? 'filesystem/' : '';
  const readMethod = global.useCamelCase ? 'readFile' : 'read_file';
  const writeMethod = global.useCamelCase ? 'writeFile' : 'write_file';
  const listDirMethod = global.useCamelCase ? 'listDirectory' : 'list_directory';
  
  logger.info(`\n==== Testing Additional Methods with discovered format ====`);
  logger.info(`Using path format: ${global.workingPathFormat}`);
  logger.info(`Method prefix: ${methodPrefix || 'none'}`);
  logger.info(`Method style: ${global.useCamelCase ? 'camelCase' : 'snake_case'}`);
  
  // Define the tests using the discovered format
  const tests = [
    // Test create_directory
    {
      name: `${methodPrefix}${global.useCamelCase ? 'createDirectory' : 'create_directory'}`,
      method: 'call_tool',
      params: {
        name: `${methodPrefix}${global.useCamelCase ? 'createDirectory' : 'create_directory'}`,
        arguments: {
          path: path.join(dirPath, 'mcp_test_dir')
        }
      }
    },
    // Test directory listing
    {
      name: `${methodPrefix}${listDirMethod}`,
      method: 'call_tool',
      params: {
        name: `${methodPrefix}${listDirMethod}`,
        arguments: {
          path: dirPath
        }
      }
    },
    // Test write with different content
    {
      name: `${methodPrefix}${writeMethod} (different content)`,
      method: 'call_tool',
      params: {
        name: `${methodPrefix}${writeMethod}`,
        arguments: {
          path: testPath,
          content: TEST_CONTENT + ' (updated at ' + new Date().toISOString() + ')'
        }
      }
    },
    // Test read after write
    {
      name: `${methodPrefix}${readMethod} (after update)`,
      method: 'call_tool',
      params: {
        name: `${methodPrefix}${readMethod}`,
        arguments: {
          path: testPath
        }
      }
    },
    // Test get file info
    {
      name: `${methodPrefix}${global.useCamelCase ? 'getFileInfo' : 'get_file_info'}`,
      method: 'call_tool',
      params: {
        name: `${methodPrefix}${global.useCamelCase ? 'getFileInfo' : 'get_file_info'}`,
        arguments: {
          path: testPath
        }
      }
    },
    // Test list allowed directories
    {
      name: `${methodPrefix}${global.useCamelCase ? 'listAllowedDirectories' : 'list_allowed_directories'}`,
      method: 'call_tool',
      params: {
        name: `${methodPrefix}${global.useCamelCase ? 'listAllowedDirectories' : 'list_allowed_directories'}`,
        arguments: {}
      }
    }
  ];
  
  // Run all the tests
  for (const test of tests) {
    try {
      logger.info(`Testing method: ${test.name}`);
      const result = await sendRequest(test.method, test.params);
      logger.info(`✅ SUCCESS - ${test.name}:`);
      logger.info(JSON.stringify(result, null, 2));
    } catch (err) {
      logger.error(`❌ FAILED - ${test.name}: ${err.message}`);
    }
    
    // Slight pause between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Create a summary of results
  logger.info('\n====== TEST SUMMARY ======');
  logger.info('These tests help identify which method names and parameters work with the MCP server.');
  logger.info('The correct method names to use in your MCP client are the ones that succeeded above.');
  logger.info('\nBased on the server implementation you shared, the correct method names should be:');
  logger.info('- read_file (not readFile or read-file)');
  logger.info('- write_file (not writeFile or write-file)');
  
  // Cleanup
  logger.info('\nTest complete, shutting down MCP server...');
  if (mcpProcess) {
    mcpProcess.kill();
  }
}

// Initial connection test
async function testMcpConnection() {
  try {
    // First try standard MCP method: list_tools
    logger.info('1️⃣ Trying list_tools method (standard MCP API)...');
    try {
      const listToolsResult = await sendRequest('list_tools', {});
      logger.info('✅ list_tools successful');
      logger.info(JSON.stringify(listToolsResult, null, 2));
      
      // If list_tools worked, we can proceed with the standard MCP API
      await testStandardMcpMethods();
      return;
    } catch (listToolsErr) {
      logger.error(`❌ list_tools failed: ${listToolsErr.message}`);
    }
    
    // Next try RPC call_tool method
    logger.info('2️⃣ Trying call_tool method...');
    // Try for both Windows and WSL paths
    let callToolSuccess = false;
    
    for (const testPath of TEST_FILE_PATHS) {
      try {
        logger.info(`Testing with path: ${testPath}`);
        const result = await sendRequest('call_tool', {
          name: 'write_file',
          arguments: {
            path: testPath,
            content: TEST_CONTENT
          }
        });
        logger.info(`✅ call_tool write_file successful with path: ${testPath}`);
        logger.info(JSON.stringify(result, null, 2));
        callToolSuccess = true;
        
        // Also test read_file
        const readResult = await sendRequest('call_tool', {
          name: 'read_file',
          arguments: {
            path: testPath
          }
        });
        logger.info(`✅ call_tool read_file successful with path: ${testPath}`);
        logger.info(JSON.stringify(readResult, null, 2));
        
        // Store the working path format for future use
        global.workingPathFormat = testPath.includes('\\') ? 'windows' : 'wsl';
        logger.info(`Using path format: ${global.workingPathFormat}`);
        
        // Test more methods with the working path format
        await testMcpMethods();
        return;
      } catch (err) {
        logger.error(`❌ call_tool failed with path ${testPath}: ${err.message}`);
      }
    }
    
    // Try filesystem/ prefix
    logger.info('3️⃣ Trying with filesystem/ prefix...');
    for (const testPath of TEST_FILE_PATHS) {
      try {
        const result = await sendRequest('call_tool', {
          name: 'filesystem/write_file',
          arguments: {
            path: testPath,
            content: TEST_CONTENT
          }
        });
        logger.info(`✅ call_tool filesystem/write_file successful with path: ${testPath}`);
        logger.info(JSON.stringify(result, null, 2));
        
        // Also test read_file
        const readResult = await sendRequest('call_tool', {
          name: 'filesystem/read_file',
          arguments: {
            path: testPath
          }
        });
        logger.info(`✅ call_tool filesystem/read_file successful with path: ${testPath}`);
        logger.info(JSON.stringify(readResult, null, 2));
        
        // Store the working path format for future use
        global.workingPathFormat = testPath.includes('\\') ? 'windows' : 'wsl';
        global.useFilesystemPrefix = true;
        logger.info(`Using path format: ${global.workingPathFormat} with filesystem/ prefix`);
        
        // Test more methods with the working path format
        await testMcpMethods();
        return;
      } catch (err) {
        logger.error(`❌ call_tool filesystem/ prefix failed with path ${testPath}: ${err.message}`);
      }
    }
    
    // If all of the above failed, try camelCase methods
    logger.info('4️⃣ Trying camelCase methods...');
    try {
      // Try both paths
      for (const testPath of TEST_FILE_PATHS) {
        try {
          const result = await sendRequest('call_tool', {
            name: 'writeFile',
            arguments: {
              path: testPath,
              content: TEST_CONTENT
            }
          });
          logger.info(`✅ call_tool writeFile successful with path: ${testPath}`);
          logger.info(JSON.stringify(result, null, 2));
          
          global.workingPathFormat = testPath.includes('\\') ? 'windows' : 'wsl';
          global.useCamelCase = true;
          logger.info(`Using path format: ${global.workingPathFormat} with camelCase methods`);
          
          await testMcpMethods();
          return;
        } catch (err) {
          logger.error(`❌ camelCase failed with path ${testPath}: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`❌ All camelCase attempts failed: ${err.message}`);
    }
    
    // If we reach here, none of the approaches worked with this command
    // Try the next command
    if (currentCommandIndex < commands.length) {
      logger.info('Trying next command for MCP server...');
      mcpProcess.kill();
      tryNextCommand();
    } else {
      logger.error('⛔ All commands and API formats failed. MCP server communication could not be established.');
      logger.info('\n====== SUMMARY ======');
      logger.info('None of the tested methods worked with the MCP server.');
      logger.info('This might indicate:');
      logger.info('1. The MCP server needs a different API format not covered in our tests');
      logger.info('2. The MCP server is not properly installed or configured');
      logger.info('3. There might be path issues between WSL and Windows paths');
      logger.info('\nPlease check the MCP server documentation for the correct API format.');
      process.exit(1);
    }
  } catch (err) {
    logger.error(`❌ Unexpected error in connection test: ${err.message}`);
    
    // Try the next command
    if (currentCommandIndex < commands.length) {
      mcpProcess.kill();
      tryNextCommand();
    } else {
      logger.error('All commands failed. MCP server could not be started.');
      process.exit(1);
    }
  }
}

// Test standard MCP methods (if list_tools worked)
async function testStandardMcpMethods() {
  try {
    logger.info('\n==== Testing Standard MCP API Methods ====');
    // Test with both path formats
    for (const testPath of TEST_FILE_PATHS) {
      try {
        logger.info(`Testing standard MCP with path: ${testPath}`);
        
        // Test writing a file
        const writeResult = await sendRequest('write_file', {
          path: testPath,
          content: TEST_CONTENT
        });
        logger.info(`✅ Direct write_file successful with path: ${testPath}`);
        logger.info(JSON.stringify(writeResult, null, 2));
        
        // Test reading the file
        const readResult = await sendRequest('read_file', {
          path: testPath
        });
        logger.info(`✅ Direct read_file successful with path: ${testPath}`);
        logger.info(JSON.stringify(readResult, null, 2));
        
        // Store the working path format
        global.workingPathFormat = testPath.includes('\\') ? 'windows' : 'wsl';
        logger.info(`Using standard MCP API with path format: ${global.workingPathFormat}`);
        return;
      } catch (err) {
        logger.error(`❌ Standard MCP API failed with path ${testPath}: ${err.message}`);
      }
    }
    
    // If we get here, standard methods didn't work with either path
    logger.info('Standard MCP API methods didn\'t work with either path format.');
    await testMcpMethods(); // Try the other methods
  } catch (err) {
    logger.error(`❌ Error testing standard MCP methods: ${err.message}`);
    await testMcpMethods(); // Try the other methods
  }
}

// Handle Ctrl+C to clean up
process.on('SIGINT', () => {
  logger.info('Interrupted, cleaning up...');
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(0);
});