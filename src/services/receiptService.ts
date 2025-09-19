import { Receipts } from './database';
import { Receipt } from '../models/index';

export async function getReceiptByTx(txId: string): Promise<Receipt | null> {
  return Receipts.findOne({ txId });
}
