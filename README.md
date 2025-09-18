# NANDA Points MCP Server (MongoDB)

Modular MCP server for NANDA Points using MongoDB with agent-based transactions. Exposes tools:

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

**Environment Variables:**
- `MONGODB_URI`: MongoDB connection string (default: "mongodb://localhost:27017")
- `NP_DB_NAME`: Database name for NANDA Points (default: "nanda_points")

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

## Claude Desktop MCP Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "nanda-points": {
            "command": "npm",
            "args": [
                "run",
                "dev",
                "--prefix",
                "/ABSOLUTE/PATH/TO/nanda-points-mcp"
            ],
            "env": {
                "MONGODB_URI": "mongodb://localhost:27017",
                "NP_DB_NAME": "nanda_points"
            }
        }
    }
}
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
