import { randomUUID } from "crypto";
import { Agents } from './database.js';
import { AgentFacts } from '../models/index.js';

export const DEFAULT_SERVICE_CHARGE_POINTS = 10;

function nowIso() { return new Date().toISOString(); }

export async function ensureAgent(
  agent_id: string
): Promise<AgentFacts | null> {
  // Only verify if agent exists, don't create if missing
  return await Agents.findOne({ agent_id });
}

export async function getAgent(agent_id: string): Promise<AgentFacts | null> {
  return Agents.findOne({ agent_id });
}

export async function setAgentServiceCharge(agent_id: string, serviceChargePoints: number): Promise<void> {
  await Agents.updateOne({ agent_id }, { $set: { serviceCharge: serviceChargePoints, updated_at: nowIso() } });
}
