#!/usr/bin/env tsx

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Test client for NANDA Points MCP Server using Streamable HTTP transport
 *
 * This client demonstrates:
 * - Connecting to the MCP server via HTTP
 * - Initializing the session
 * - Listing available tools
 * - Calling tools (getBalance, initiateTransaction, etc.)
 * - Proper error handling and cleanup
 */

// Configuration
const SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';
const CLIENT_NAME = 'nanda-points-test-client';
const CLIENT_VERSION = '1.0.0';

// Test configuration
interface TestConfig {
  testBalance: boolean;
  testTransaction: boolean;
  testReceipt: boolean;
  testServiceCharge: boolean;
  fromAgent: string;
  toAgent: string;
  transferAmount: number;
}

const DEFAULT_CONFIG: TestConfig = {
  testBalance: true,
  testTransaction: true,
  testReceipt: true,
  testServiceCharge: true,
  fromAgent: 'claude-desktop',
  toAgent: 'search-agent',
  transferAmount: 50
};

/**
 * Helper function to format and display results
 */
function displayResult(testName: string, result: any, error?: any): void {
  console.log(`\n📊 ${testName}`);
  console.log('=' .repeat(50));

  if (error) {
    console.log('❌ Error:', error.message || error);
    return;
  }

  if (result?.content) {
    result.content.forEach((item: any, index: number) => {
      if (item.type === 'text') {
        try {
          const parsed = JSON.parse(item.text);
          console.log(`${index + 1}. ${JSON.stringify(parsed, null, 2)}`);
        } catch {
          console.log(`${index + 1}. ${item.text}`);
        }
      } else {
        console.log(`${index + 1}. [${item.type}]`, item);
      }
    });
  } else {
    console.log('Result:', JSON.stringify(result, null, 2));
  }
}

/**
 * Test the getBalance tool
 */
async function testGetBalance(client: Client, agentName: string): Promise<any> {
  console.log(`\n🔍 Testing balance for agent: ${agentName}`);

  const result = await client.callTool({
    name: 'getBalance',
    arguments: { agent_name: agentName }
  });

  return result;
}

/**
 * Test the initiateTransaction tool
 */
async function testInitiateTransaction(
  client: Client,
  from: string,
  to: string,
  amount: number
): Promise<any> {
  console.log(`\n💸 Testing transaction: ${from} → ${to} (${amount} NP)`);

  const result = await client.callTool({
    name: 'initiateTransaction',
    arguments: { from, to, amount }
  });

  return result;
}

/**
 * Test the getReceipt tool
 */
async function testGetReceipt(client: Client, txId: string): Promise<any> {
  console.log(`\n🧾 Testing receipt lookup for txId: ${txId}`);

  const result = await client.callTool({
    name: 'getReceipt',
    arguments: { txId }
  });

  return result;
}

/**
 * Test the setServiceCharge tool
 */
async function testSetServiceCharge(
  client: Client,
  agentName: string,
  serviceChargePoints: number
): Promise<any> {
  console.log(`\n⚙️  Testing service charge: ${agentName} → ${serviceChargePoints} NP`);

  const result = await client.callTool({
    name: 'setServiceCharge',
    arguments: { agent_name: agentName, serviceChargePoints }
  });

  return result;
}

/**
 * Main test function
 */
async function runTests(config: TestConfig = DEFAULT_CONFIG): Promise<void> {
  let client: Client | null = null;
  let transport: StreamableHTTPClientTransport | null = null;

  try {
    console.log('🚀 Starting NANDA Points MCP Client Test');
    console.log(`📡 Server URL: ${SERVER_URL}`);
    console.log(`👤 Client: ${CLIENT_NAME} v${CLIENT_VERSION}`);
    console.log('=' .repeat(60));

    // Create client
    client = new Client(
      {
        name: CLIENT_NAME,
        version: CLIENT_VERSION
      },
      {
        capabilities: {}
      }
    );

    // Create transport
    transport = new StreamableHTTPClientTransport(new URL(SERVER_URL));

    // Connect to server
    console.log('\n🔌 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected successfully!');

    // List available tools
    console.log('\n🛠️  Listing available tools...');
    const toolsResult = await client.listTools();
    console.log('Available tools:');
    toolsResult.tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    let txId: string | null = null;

    // Test getBalance
    if (config.testBalance) {
      try {
        const balanceResult = await testGetBalance(client, config.fromAgent);
        displayResult('Get Balance Test', balanceResult);
      } catch (error) {
        displayResult('Get Balance Test', null, error);
      }
    }

    // Test initiateTransaction
    if (config.testTransaction) {
      try {
        const txResult = await testInitiateTransaction(
          client,
          config.fromAgent,
          config.toAgent,
          config.transferAmount
        );
        displayResult('Initiate Transaction Test', txResult);

        // Extract transaction ID for receipt test
        if (txResult?.content?.[0]?.text) {
          try {
            const parsedResult = JSON.parse(txResult.content[0].text);
            txId = parsedResult.txId;
          } catch (e) {
            console.log('⚠️  Could not parse transaction result for txId');
          }
        }
      } catch (error) {
        displayResult('Initiate Transaction Test', null, error);
      }
    }

    // Test getReceipt (if we have a txId from transaction)
    if (config.testReceipt && txId) {
      try {
        const receiptResult = await testGetReceipt(client, txId);
        displayResult('Get Receipt Test', receiptResult);
      } catch (error) {
        displayResult('Get Receipt Test', null, error);
      }
    }

    // Test setServiceCharge
    if (config.testServiceCharge) {
      try {
        const serviceChargeResult = await testSetServiceCharge(
          client,
          config.toAgent,
          25
        );
        displayResult('Set Service Charge Test', serviceChargeResult);
      } catch (error) {
        displayResult('Set Service Charge Test', null, error);
      }
    }

    // Final balance check
    if (config.testBalance) {
      try {
        console.log('\n📈 Final balance check...');
        const finalFromBalance = await testGetBalance(client, config.fromAgent);
        const finalToBalance = await testGetBalance(client, config.toAgent);

        displayResult(`Final Balance - ${config.fromAgent}`, finalFromBalance);
        displayResult(`Final Balance - ${config.toAgent}`, finalToBalance);
      } catch (error) {
        console.log('❌ Error during final balance check:', error);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  } finally {
    // Cleanup
    if (client && transport) {
      try {
        console.log('\n🔌 Disconnecting from server...');
        await client.close();
        console.log('✅ Disconnected successfully!');
      } catch (error) {
        console.error('❌ Error during cleanup:', error);
      }
    }
  }
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  // Parse command line arguments for custom configuration
  const config = { ...DEFAULT_CONFIG };

  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--server':
        process.env.MCP_SERVER_URL = args[++i];
        break;
      case '--from':
        config.fromAgent = args[++i];
        break;
      case '--to':
        config.toAgent = args[++i];
        break;
      case '--amount':
        config.transferAmount = parseInt(args[++i], 10);
        break;
      case '--no-balance':
        config.testBalance = false;
        break;
      case '--no-transaction':
        config.testTransaction = false;
        break;
      case '--no-receipt':
        config.testReceipt = false;
        break;
      case '--no-service-charge':
        config.testServiceCharge = false;
        break;
      case '--help':
        console.log(`
NANDA Points MCP Client Test

Usage: npm run test [options]

Options:
  --server <url>           MCP server URL (default: http://localhost:3000/mcp)
  --from <agent>           From agent name (default: claude-desktop)
  --to <agent>             To agent name (default: search-agent)
  --amount <number>        Transfer amount (default: 50)
  --no-balance             Skip balance tests
  --no-transaction         Skip transaction tests
  --no-receipt             Skip receipt tests
  --no-service-charge      Skip service charge tests
  --help                   Show this help message

Examples:
  npm run test
  npm run test -- --from claude-desktop --to search-agent --amount 100
  npm run test -- --server http://localhost:3001/mcp --no-transaction
        `);
        return;
    }
  }

  await runTests(config);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}