// JSON message capture and display script for A2A
import fetch from 'node-fetch';
import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

// Ports used by the agents
const AGENT_PORTS = {
  HOMIE: 41245,
  BOB: 41246,
  TAVERN: 41247
};

// Cache for storing captured messages
const capturedMessages = {
  homie: [],
  bob: [],
  tavern: []
};

// Set up proxy servers to intercept communications
const setupProxyServer = (targetPort, proxyPort, agentName) => {
  const server = http.createServer(async (req, res) => {
    // Collect the request body
    let requestBody = '';
    req.on('data', (chunk) => {
      requestBody += chunk.toString();
    });

    req.on('end', async () => {
      // Log the incoming request
      try {
        const requestJson = JSON.parse(requestBody);
        const timestamp = new Date().toISOString();
        const captureEntry = {
          type: 'Request',
          timestamp,
          direction: 'to',
          target: agentName,
          data: requestJson
        };
        capturedMessages[agentName.toLowerCase()].push(captureEntry);
        console.log(`\n${timestamp} - Captured request to ${agentName}:`);
        console.log(JSON.stringify(requestJson, null, 2));
      } catch (e) {
        console.error('Error parsing request JSON:', e);
      }

      // Forward the request to the actual agent
      try {
        const options = {
          method: req.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        };

        const response = await fetch(`http://localhost:${targetPort}${req.url}`, options);
        const responseData = await response.text();

        // Log the response from the agent
        try {
          const responseJson = JSON.parse(responseData);
          const timestamp = new Date().toISOString();
          const captureEntry = {
            type: 'Response',
            timestamp,
            direction: 'from',
            target: agentName,
            data: responseJson
          };
          capturedMessages[agentName.toLowerCase()].push(captureEntry);
          console.log(`\n${timestamp} - Captured response from ${agentName}:`);
          console.log(JSON.stringify(responseJson, null, 2));
        } catch (e) {
          console.error('Error parsing response JSON:', e);
        }

        // Send the response back to the original requester
        res.writeHead(response.status, response.headers);
        res.end(responseData);
      } catch (error) {
        console.error(`Error forwarding request to ${agentName}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error' }));
      }
    });
  });

  server.listen(proxyPort, () => {
    console.log(`Proxy for ${agentName} listening on port ${proxyPort}, forwarding to port ${targetPort}`);
  });

  return server;
};

// Save the captured messages to a file
const saveMessagesToFile = async () => {
  try {
    const filePath = path.join(process.cwd(), 'a2a_message_capture.json');
    await fs.writeFile(filePath, JSON.stringify(capturedMessages, null, 2));
    console.log(`\nSaved captured messages to ${filePath}`);
  } catch (error) {
    console.error('Error saving messages to file:', error);
  }
};

// Main function
const main = async () => {
  console.log('A2A Message Capture Utility');
  console.log('==========================');
  console.log('This utility sets up proxy servers to capture and display all JSON-RPC');
  console.log('messages exchanged between A2A agents.\n');

  // Create proxy servers
  const homieProxy = setupProxyServer(AGENT_PORTS.HOMIE, 51245, 'Homie');
  const bobProxy = setupProxyServer(AGENT_PORTS.BOB, 51246, 'Bob');
  const tavernProxy = setupProxyServer(AGENT_PORTS.TAVERN, 51247, 'Tavern');

  console.log('\nProxy servers are set up. You should now:');
  console.log('1. Start the agent servers normally on their usual ports.');
  console.log('2. Configure your scenario scripts to use the proxy ports instead:');
  console.log('   - Homie: http://localhost:51245');
  console.log('   - Bob: http://localhost:51246');
  console.log('   - Tavern: http://localhost:51247');
  console.log('\nAll JSON-RPC messages will be captured and displayed here.');
  console.log('Press Ctrl+C to stop capturing and save messages to a file.\n');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down message capture...');
    homieProxy.close();
    bobProxy.close();
    tavernProxy.close();
    
    await saveMessagesToFile();
    process.exit(0);
  });
};

main().catch(console.error);