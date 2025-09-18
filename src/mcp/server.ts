import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { NP_CURRENCY, NP_SCALE, toMinor, toPoints } from "../models/index.js";
import { initMongo } from "../services/index.js";
import { getAgentWithWallet, getAgent, setAgentServiceCharge } from "../routes/agentRoutes.js";
import { getBalanceMinor } from "../routes/walletRoutes.js";
import { transfer } from "../routes/transactionRoutes.js";
import { getReceiptByTx } from "../routes/receiptRoutes.js";

await initMongo();

const server = new McpServer({ name: "nanda-points", version: "0.2.0" });

server.registerTool(
  "getBalance",
  {
    title: "Get Balance (NP)",
    description: "Returns NP balance for an agent. Returns error if agent does not exist.",
    inputSchema: { agent_name: z.string().min(1) }
  },
  async ({ agent_name }) => {
    const agentWithWallet = await getAgentWithWallet(agent_name);
    if (!agentWithWallet) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "AGENT_NOT_FOUND", agent_name }, null, 2) }] };
    }
    const balMinor = await getBalanceMinor(agent_name);
    const payload = { agent_name, currency: NP_CURRENCY, scale: NP_SCALE, balanceMinor: balMinor, balancePoints: toPoints(balMinor) };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "initiateTransaction",
  {
    title: "Initiate Transaction (NP)",
    description: "Transfer NP from one agent to another and record ledger + receipt. Returns error if either agent does not exist.",
    inputSchema: { from: z.string().min(1), to: z.string().min(1), amount: z.number().int().positive() }
  },
  async ({ from, to, amount }) => {
    const fromAgent = await getAgentWithWallet(from);
    const toAgent = await getAgentWithWallet(to);
    
    if (!fromAgent) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "SENDER_AGENT_NOT_FOUND", agent_name: from }, null, 2) }] };
    }
    if (!toAgent) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "RECEIVER_AGENT_NOT_FOUND", agent_name: to }, null, 2) }] };
    }
    
    try {
      const { tx, receipt, payload } = await transfer(from, to, toMinor(amount));
      const result = { 
        txId: tx.txId, 
        status: tx.status, 
        amountPoints: amount, 
        currency: tx.currency, 
        scale: tx.scale, 
        from: tx.fromAgent, 
        to: tx.toAgent, 
        createdAt: tx.createdAt, 
        receipt,
        payload // Receipt sent immediately to payer
      };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ error: String(err?.message || err) }, null, 2) }] };
    }
  }
);

server.registerTool(
  "getReceipt",
  { title: "Get Receipt", description: "Return receipt for a transaction id.", inputSchema: { txId: z.string().min(1) } },
  async ({ txId }) => {
    const r = await getReceiptByTx(txId);
    return { content: [{ type: "text", text: JSON.stringify(r ?? { error: "NOT_FOUND" }, null, 2) }] };
  }
);

server.registerTool(
  "setServiceCharge",
  { title: "Set Service Charge (NP)", description: "Set per-call service charge (points) on agent facts. Returns error if agent does not exist.", inputSchema: { agent_name: z.string().min(1), serviceChargePoints: z.number().int().nonnegative() } },
  async ({ agent_name, serviceChargePoints }) => {
    const agent = await getAgent(agent_name);
    if (!agent) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "AGENT_NOT_FOUND", agent_name }, null, 2) }] };
    }
    await setAgentServiceCharge(agent_name, serviceChargePoints);
    const updated = await getAgent(agent_name);
    return { content: [{ type: "text", text: JSON.stringify({ agent_name, serviceCharge: updated?.serviceCharge }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
