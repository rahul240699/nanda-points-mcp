import { ObjectId } from 'mongodb';
import { MinorUnits } from './points';

// Wallet (linked by agent_id; NOT embedded on agent facts)
export interface Wallet {
  _id?: ObjectId | string;
  walletId: string; // unique wallet identifier
  agent_id: string; // FK to AgentFacts.agent_id
  balanceMinor: MinorUnits; // >= 0, always in NP minor units
  createdAt: string;
  updatedAt: string;
}