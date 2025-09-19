import { ensureAgent, getAgent, setAgentServiceCharge } from '../services/agentService';
import { getWallet } from '../services/walletService';
import { AgentFacts, Wallet } from '../models/index';

export async function getAgentWithWallet(agent_name: string): Promise<{ agent: AgentFacts; wallet: Wallet } | null> {
  const agent = await ensureAgent(agent_name);
  if (!agent) {
    return null;
  }
  const wallet = await getWallet(agent_name);
  if (!wallet) {
    return null;
  }
  return { agent, wallet };
}

export { ensureAgent, getAgent, setAgentServiceCharge };
