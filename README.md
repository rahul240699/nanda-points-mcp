# NANDA Points MCP Server (MongoDB)

Modular MCP server for NANDA Points using MongoDB with agent-based transactions and **Streamable HTTP Transport**. Exposes tools:

-   `getBalance(agent_name)` - Get NP balance for an agent (returns error if agent doesn't exist)
-   `initiateTransaction(from, to, amount)` - Transfer NP between agents with immediate receipt payload
-   `getReceipt(txId)` - Get receipt for a transaction ID
-   `setServiceCharge(agent_name, serviceChargePoints)` - Set service charge for an agent

## Architecture

The server uses a modular structure:

-   **Models** (`src/models/`) - TypeScript interfaces for agents, wallets, transactions, receipts
-   **Services** (`src/services/`) - Business logic and database operations
-   **Routes** (`src/routes/`) - API route handlers
-   **MCP Server** (`src/mcp/`) - MCP tool definitions and handlers

## Agent Structure

Agents follow the NANDA agent specification with additional fields:

-   `agent_name` - Unique identifier
-   `walletId` - Links to associated wallet
-   `serviceCharge` - NP points for service charges
-   Full agent metadata (provider, endpoints, capabilities, etc.)

## Setup

### 1. Install Dependencies

```bash
npm i
```

### 2. MongoDB Setup (Required for transactions)

For local development with transactions, run a single-node replica set:

```bash
docker run -d --name mongo -p 27017:27017 mongo:7 --replSet rs0
docker exec mongo mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

### 3. Seed Database

```bash
MONGODB_URI="mongodb://localhost:27017" NP_DB_NAME="nanda_points" npm run seed
```

This creates 11 sample agents with wallets and 1000 NP each.

### 4. Start Server

```bash
MONGODB_URI="mongodb://localhost:27017" NP_DB_NAME="nanda_points" npm run dev
# or for production
MONGODB_URI="mongodb://localhost:27017" NP_DB_NAME="nanda_points" npm start
```

The server will start on `http://localhost:3000` with the following endpoints:
- **MCP Endpoint**: `http://localhost:3000/mcp` (POST/GET)
- **Health Check**: `http://localhost:3000/health` (GET)

**Environment Variables:**
- `MONGODB_URI`: MongoDB connection string (default: "mongodb://localhost:27017")
- `NP_DB_NAME`: Database name for NANDA Points (default: "nanda_points")
- `PORT`: HTTP server port (default: 3000)
- `HOST`: HTTP server host (default: localhost)

### 5. Test the Server

Run the included test client to verify functionality:

```bash
npm run test
```

Custom test options:
```bash
# Test with different agents and amount
npm run test -- --from claude-desktop --to search-agent --amount 100

# Test against different server
npm run test -- --server http://localhost:3001/mcp

# Skip specific tests
npm run test -- --no-transaction --no-receipt
```

## Proxy HTTP with ngrok

To make your local MCP server accessible from the internet (required for Claude Web), use ngrok:

### 1. Start ngrok tunnel

After your MCP server is running on `http://localhost:3000`, open a new terminal and run:

```bash
ngrok http 3000
```

This will output something like:
```
Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:3000
```

### 2. Verify ngrok is working

Test the public endpoints:
```bash
# Check tunnel status
curl http://localhost:4040/api/tunnels

# Test public health endpoint
curl https://your-ngrok-url.ngrok-free.app/health
```

### 3. Get your public MCP endpoint

Your MCP server will be available at:
- **Public MCP Endpoint**: `https://your-ngrok-url.ngrok-free.app/mcp`
- **Public Health Check**: `https://your-ngrok-url.ngrok-free.app/health`

**Note**: ngrok URLs change each time you restart ngrok unless you have a paid account with reserved domains.

## Testing with Claude Web

### 1. Configure MCP Connector in Claude Web

1. Open Claude Web (claude.ai)
2. Go to your workspace settings
3. Navigate to "Connectors" or "MCP Servers"
4. Add a new connector with:
   - **Name**: `NANDA Points`
   - **Type**: `Streamable HTTP`
   - **URL**: `https://your-ngrok-url.ngrok-free.app/mcp`
   - **Description**: `NANDA Points management system for agent transactions`

### 2. Example Prompts for Testing Tools

Once connected, you can test each tool with these example prompts:

#### **getBalance Tool**
```
Check the NP balance for the claude-desktop agent
```
```
What's the current balance for search-agent?
```
```
Show me the balance for all agents: claude-desktop, search-agent, and summarize-agent
```

#### **initiateTransaction Tool**
```
Transfer 100 NP from claude-desktop to search-agent
```
```
Send 50 NANDA Points from search-agent to summarize-agent and show me the receipt
```
```
Make a payment of 25 NP from claude-desktop to ocr-agent
```

#### **getReceipt Tool**
```
Get the receipt for transaction ID: [paste-transaction-id-here]
```
```
Show me the details of the last transaction receipt
```

#### **setServiceCharge Tool**
```
Set the service charge for search-agent to 10 NP
```
```
Update the service charge for summarize-agent to 25 NANDA Points
```
```
Set ocr-agent's service charge to 5 NP
```

#### **Complex Multi-Tool Operations**
```
1. Check the balance for claude-desktop
2. Transfer 75 NP from claude-desktop to vector-agent
3. Set vector-agent's service charge to 15 NP
4. Show me the final balances for both agents
```

```
I want to see a complete transaction flow:
1. Check initial balances for claude-desktop and web-agent
2. Transfer 200 NP from claude-desktop to web-agent
3. Get the transaction receipt
4. Check final balances
5. Set web-agent's service charge to 20 NP
```

### 3. Expected Responses

Each tool returns JSON responses with the following structure:

**getBalance**: Returns agent balance information
```json
{
  "agent_name": "claude-desktop",
  "currency": "NP",
  "scale": 0,
  "balanceMinor": 1000,
  "balancePoints": 1000
}
```

**initiateTransaction**: Returns transaction details with receipt
```json
{
  "txId": "uuid-transaction-id",
  "status": "completed",
  "amountPoints": 100,
  "from": "claude-desktop",
  "to": "search-agent",
  "receipt": { ... }
}
```

**getReceipt**: Returns receipt details
```json
{
  "txId": "uuid-transaction-id",
  "fromAgent": "claude-desktop",
  "toAgent": "search-agent",
  "amountMinor": 100,
  "fromBalanceAfter": 900,
  "toBalanceAfter": 1100
}
```

**setServiceCharge**: Returns updated service charge
```json
{
  "agent_name": "search-agent",
  "serviceCharge": 10
}
```

### 4. Troubleshooting Claude Web Connection

If Claude Web can't connect to your MCP server:

1. **Check ngrok tunnel**: Ensure ngrok is running and the URL is correct
2. **Test health endpoint**: Verify `https://your-ngrok-url.ngrok-free.app/health` returns server info
3. **Check server logs**: Look for connection attempts in your server console
4. **Verify MCP endpoint**: Ensure the URL ends with `/mcp`
5. **Check firewall**: Make sure your local server is accessible

## Usage

### Example Agent Names

-   `claude-desktop` - Payer agent
-   `search-agent` - Search capability agent
-   `summarize-agent` - Summarization agent
-   `extract-agent` - Extraction agent
-   `classify-agent` - Classification agent
-   `translate-agent` - Translation agent
-   `vector-agent` - Vector store agent
-   `ocr-agent` - OCR agent
-   `web-agent` - Web browse agent
-   `sql-agent` - SQL runner agent
-   `image-caption-agent` - Image caption agent

### Error Handling

-   `AGENT_NOT_FOUND` - Agent doesn't exist
-   `SENDER_AGENT_NOT_FOUND` - Sender agent doesn't exist
-   `RECEIVER_AGENT_NOT_FOUND` - Receiver agent doesn't exist
-   `INSUFFICIENT_FUNDS` - Not enough NP for transaction

## Client Integration

### MCP Streamable HTTP Transport

This server uses the **Streamable HTTP transport** (MCP specification 2025-03-26) instead of stdio. Clients can connect to:

**Base URL**: `http://localhost:3000/mcp`

**Session Management**: The server automatically assigns session IDs and supports:
- HTTP POST for client-to-server messages
- HTTP GET for Server-Sent Events (SSE) streaming
- Session resumability and redelivery

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "nanda-points": {
            "type": "streamable-http",
            "url": "http://localhost:3000/mcp"
        }
    }
}
```

**Note**: Ensure the server is running before starting Claude Desktop.

### Legacy stdio Support

For backward compatibility with older MCP clients, you can still run via stdio by modifying the server code to use `StdioServerTransport` instead of `StreamableHTTPServerTransport`.
```

## Development

### Project Structure

```
src/
├── models/           # TypeScript interfaces
│   ├── agent.ts      # Agent facts and NP utilities
│   ├── wallet.ts     # Wallet interface
│   ├── transaction.ts # Transaction interface
│   ├── receipt.ts    # Receipt interface
│   └── index.ts      # Re-exports
├── services/         # Business logic
│   ├── database.ts   # MongoDB connection
│   ├── agentService.ts # Agent operations
│   ├── walletService.ts # Wallet operations
│   ├── transactionService.ts # Transaction logic
│   ├── receiptService.ts # Receipt operations
│   └── index.ts      # Re-exports
├── routes/           # API handlers
│   ├── agentRoutes.ts # Agent route handlers
│   ├── walletRoutes.ts # Wallet route handlers
│   ├── transactionRoutes.ts # Transaction handlers
│   ├── receiptRoutes.ts # Receipt handlers
│   └── index.ts      # Re-exports
├── mcp/             # MCP server
│   └── server.ts    # MCP tool definitions
└── utils/           # Utilities
    └── mongo.ts     # MongoDB connection utilities
```

### Build & Test

```bash
npm run build    # Compile TypeScript
npm start        # Start MCP server
node seed.js     # Seed database with sample data
```
