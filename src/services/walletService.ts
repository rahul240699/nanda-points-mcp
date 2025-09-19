import { randomUUID } from "crypto";
import { Wallets } from './database';
import { Wallet, NP } from '../models/index';

export const DEFAULT_SEED_POINTS = 1000; // new agent seed

function nowIso() { return new Date().toISOString(); }

export async function ensureWallet(agent_name: string, seedPoints?: number): Promise<Wallet> {
  const createdAt = nowIso();
  const seedMinor = NP.toMinorUnits(seedPoints ?? DEFAULT_SEED_POINTS);

  let wallet = await Wallets.findOne({ agent_name });
  if (!wallet) {
    const walletId = randomUUID();
    const toInsertWallet: Wallet = {
      walletId,
      agent_name,
      balanceMinor: seedMinor,
      createdAt,
      updatedAt: createdAt
    };
    try {
      await Wallets.insertOne(toInsertWallet);
    } catch (e: any) {
      if (!(e && e.code === 11000)) throw e;
    }
    wallet = await Wallets.findOne({ agent_name });
  }

  return wallet!;
}

export async function getWallet(agent_name: string): Promise<Wallet | null> {
  return Wallets.findOne({ agent_name });
}

export async function getBalanceMinor(agent_name: string): Promise<number> {
  const w = await getWallet(agent_name);
  return w?.balanceMinor ?? 0;
}
