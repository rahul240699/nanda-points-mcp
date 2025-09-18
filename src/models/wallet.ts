import { NP_CURRENCY, NP_SCALE, type Minor } from './agent.js';

// Wallet (linked by agent_name; NOT embedded on agent facts)
export interface Wallet {
  _id?: any;
  walletId: string; // unique wallet identifier
  agent_name: string; // FK to AgentFacts.agent_name
  currency: typeof NP_CURRENCY;
  scale: typeof NP_SCALE;
  balanceMinor: Minor; // >= 0
  createdAt: string;
  updatedAt: string;
}
