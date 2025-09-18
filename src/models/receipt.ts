import { type Minor } from './agent.js';

export interface Receipt {
  _id?: any;
  txId: string; // mirrors transaction
  issuedAt: string;
  fromAgent: string; // agent_name of sender
  toAgent: string; // agent_name of receiver
  amountMinor: Minor;
  fromBalanceAfter: Minor;
  toBalanceAfter: Minor;
}
