#!/usr/bin/env node

import { spawn } from 'child_process';

// Start the MCP server
const server = spawn('npm', ['run', 'mcp:server'], {
    env: {
        ...process.env,
        MONGODB_URI: 'mongodb://localhost:27017',
        NP_DB_NAME: 'nanda_points'
    },
    stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    // Process complete JSON-RPC responses
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop(); // Keep incomplete line for next chunk

    lines.forEach(line => {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                console.log('📥 Response:', JSON.stringify(response, null, 2));
            } catch (e) {
                console.log('📄 Output:', line);
            }
        }
    });
});

server.stderr.on('data', (data) => {
    console.log('❌ Error:', data.toString());
});

// Send MCP initialization request
const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {
            roots: {
                listChanged: true
            },
            sampling: {}
        },
        clientInfo: {
            name: "test-client",
            version: "1.0.0"
        }
    }
};

console.log('📤 Sending initialization request...');
server.stdin.write(JSON.stringify(initRequest) + '\n');

// Wait for initialization, then test tools
setTimeout(() => {
    const toolsRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
    };

    console.log('📤 Requesting tools list...');
    server.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 1000);

// Test getBalance tool
setTimeout(() => {
    const balanceRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
            name: "getBalance",
            arguments: {
                agent_name: "claude-desktop"
            }
        }
    };

    console.log('📤 Testing getBalance...');
    server.stdin.write(JSON.stringify(balanceRequest) + '\n');
}, 2000);

// Clean up after 5 seconds
setTimeout(() => {
    server.kill();
    process.exit(0);
}, 5000);