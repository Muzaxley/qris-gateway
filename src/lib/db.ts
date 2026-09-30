// lib/db.ts - Simple JSON file database (Vercel Edge compatible, no Prisma needed)
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join('/tmp', 'qris-gateway-db.json');

interface Merchant {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  balance: number;
  webhookUrl: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  merchantId: string;
  orderId: string;
  amount: number;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  qrisUrl: string;
  callbackUrl: string;
  midtransOrderId: string;
  createdAt: string;
  updatedAt: string;
}

interface DB {
  merchants: Merchant[];
  transactions: Transaction[];
}

function readDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    const empty: DB = { merchants: [], transactions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export { readDB, writeDB };
export type { DB, Merchant, Transaction };
