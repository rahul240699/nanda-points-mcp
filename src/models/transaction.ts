import { NP_CURRENCY, NP_SCALE, type Minor } from './agent.js';

export interface Txn {
  _id?: any; // Mongo _id
  txId: string; // uuid string
  fromAgent: string; // agent_name of sender
  toAgent: string; // agent_name of receiver
  amountMinor: Minor;
  currency: typeof NP_CURRENCY;
  scale: typeof NP_SCALE;
  createdAt: string;
  status: "completed" | "rejected";
  error?: string | null;
}
