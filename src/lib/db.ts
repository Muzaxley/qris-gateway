// src/lib/db.ts - Global Persistent Database via Firebase RTDB REST API
// Works 100% on Vercel Serverless, Edge, and Local Development.

const FIREBASE_BASE_URL = process.env.FIREBASE_DATABASE_URL || 
  'https://bizaru-magnumx-default-rtdb.asia-southeast1.firebasedatabase.app/qris_gateway';

export interface Merchant {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  balance: number;
  webhookUrl: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  merchantId: string;
  orderId: string;
  midtransOrderId: string;
  amount: number;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  qrisUrl: string;
  deeplinkUrl?: string;
  callbackUrl: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory cache for ultra-fast local dev fallback
const localMemory: {
  merchants: Record<string, Merchant>;
  apiKeys: Record<string, string>; // apiKey -> merchantId
  transactions: Record<string, Transaction>;
  midtransIndex: Record<string, string>; // midtransOrderId -> orderId
} = {
  merchants: {},
  apiKeys: {},
  transactions: {},
  midtransIndex: {}
};

export async function getMerchantByApiKey(apiKey: string): Promise<Merchant | null> {
  if (!apiKey) return null;
  try {
    const cleanKey = apiKey.trim();
    const indexRes = await fetch(`${FIREBASE_BASE_URL}/api_keys/${encodeURIComponent(cleanKey)}.json`, {
      cache: 'no-store'
    });
    const merchantId = await indexRes.json();
    if (merchantId && typeof merchantId === 'string') {
      const mRes = await fetch(`${FIREBASE_BASE_URL}/merchants/${merchantId}.json`, {
        cache: 'no-store'
      });
      const merchant = await mRes.json();
      if (merchant) return merchant;
    }

    const allRes = await fetch(`${FIREBASE_BASE_URL}/merchants.json`, { cache: 'no-store' });
    const allData = await allRes.json();
    if (allData && typeof allData === 'object') {
      for (const key of Object.keys(allData)) {
        if (allData[key]?.apiKey === cleanKey) {
          return allData[key];
        }
      }
    }
  } catch (err) {
    console.warn('[DB] Firebase getMerchantByApiKey fallback to memory:', err);
  }

  const mId = localMemory.apiKeys[apiKey];
  return mId ? localMemory.merchants[mId] || null : null;
}

export async function getMerchantByEmail(email: string): Promise<Merchant | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const allRes = await fetch(`${FIREBASE_BASE_URL}/merchants.json`, { cache: 'no-store' });
    const allData = await allRes.json();
    if (allData && typeof allData === 'object') {
      for (const key of Object.keys(allData)) {
        if (allData[key]?.email?.toLowerCase() === cleanEmail) {
          return allData[key];
        }
      }
    }
  } catch (err) {
    console.warn('[DB] Firebase getMerchantByEmail fallback to memory:', err);
  }

  for (const m of Object.values(localMemory.merchants)) {
    if (m.email.toLowerCase() === cleanEmail) return m;
  }
  return null;
}

export async function saveMerchant(merchant: Merchant): Promise<void> {
  try {
    await Promise.all([
      fetch(`${FIREBASE_BASE_URL}/merchants/${merchant.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merchant)
      }),
      fetch(`${FIREBASE_BASE_URL}/api_keys/${encodeURIComponent(merchant.apiKey)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merchant.id)
      })
    ]);
  } catch (err) {
    console.warn('[DB] Firebase saveMerchant fallback to memory:', err);
  }

  localMemory.merchants[merchant.id] = merchant;
  localMemory.apiKeys[merchant.apiKey] = merchant.id;
}

export async function updateMerchantBalance(merchantId: string, deltaBalance: number): Promise<number | null> {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/merchants/${merchantId}.json`, { cache: 'no-store' });
    const merchant: Merchant = await res.json();
    if (merchant) {
      merchant.balance = Math.max(0, (merchant.balance || 0) + deltaBalance);
      await fetch(`${FIREBASE_BASE_URL}/merchants/${merchantId}/balance.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merchant.balance)
      });
      return merchant.balance;
    }
  } catch (err) {
    console.warn('[DB] Firebase updateMerchantBalance fallback to memory:', err);
  }

  if (localMemory.merchants[merchantId]) {
    localMemory.merchants[merchantId].balance = Math.max(0, (localMemory.merchants[merchantId].balance || 0) + deltaBalance);
    return localMemory.merchants[merchantId].balance;
  }
  return null;
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  try {
    await Promise.all([
      fetch(`${FIREBASE_BASE_URL}/transactions/${tx.orderId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      }),
      fetch(`${FIREBASE_BASE_URL}/midtrans_index/${encodeURIComponent(tx.midtransOrderId)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx.orderId)
      })
    ]);
  } catch (err) {
    console.warn('[DB] Firebase saveTransaction fallback to memory:', err);
  }

  localMemory.transactions[tx.orderId] = tx;
  localMemory.midtransIndex[tx.midtransOrderId] = tx.orderId;
}

export async function getTransactionByOrderId(orderId: string): Promise<Transaction | null> {
  if (!orderId) return null;
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/transactions/${orderId}.json`, { cache: 'no-store' });
    const tx = await res.json();
    if (tx) return tx;
  } catch (err) {
    console.warn('[DB] Firebase getTransactionByOrderId fallback to memory:', err);
  }
  return localMemory.transactions[orderId] || null;
}

export async function getTransactionByMidtransId(midtransOrderId: string): Promise<Transaction | null> {
  if (!midtransOrderId) return null;
  try {
    const idxRes = await fetch(`${FIREBASE_BASE_URL}/midtrans_index/${encodeURIComponent(midtransOrderId)}.json`, {
      cache: 'no-store'
    });
    const orderId = await idxRes.json();
    if (orderId && typeof orderId === 'string') {
      return await getTransactionByOrderId(orderId);
    }
    const directTx = await getTransactionByOrderId(midtransOrderId);
    if (directTx) return directTx;
  } catch (err) {
    console.warn('[DB] Firebase getTransactionByMidtransId fallback to memory:', err);
  }
  const oId = localMemory.midtransIndex[midtransOrderId] || midtransOrderId;
  return localMemory.transactions[oId] || null;
}

export async function updateTransactionStatus(
  orderId: string, 
  status: 'pending' | 'success' | 'failed' | 'expired'
): Promise<Transaction | null> {
  const updatedAt = new Date().toISOString();
  try {
    await fetch(`${FIREBASE_BASE_URL}/transactions/${orderId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updatedAt })
    });
    return await getTransactionByOrderId(orderId);
  } catch (err) {
    console.warn('[DB] Firebase updateTransactionStatus fallback to memory:', err);
  }

  if (localMemory.transactions[orderId]) {
    localMemory.transactions[orderId].status = status;
    localMemory.transactions[orderId].updatedAt = updatedAt;
    return localMemory.transactions[orderId];
  }
  return null;
}

export async function listTransactions(merchantId: string, limit = 50): Promise<Transaction[]> {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/transactions.json`, { cache: 'no-store' });
    const all = await res.json();
    if (all && typeof all === 'object') {
      const list = Object.values(all) as Transaction[];
      return list
        .filter(t => t.merchantId === merchantId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    }
  } catch (err) {
    console.warn('[DB] Firebase listTransactions fallback to memory:', err);
  }

  return Object.values(localMemory.transactions)
    .filter(t => t.merchantId === merchantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
