import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const db = readDB();
    const merchant = db.merchants.find(m => m.apiKey === apiKey);

    if (!merchant) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (orderId) {
      const tx = db.transactions.find(t => t.orderId === orderId && t.merchantId === merchant.id);
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      return NextResponse.json({
        status: 'success',
        data: { order_id: tx.orderId, amount: tx.amount, status: tx.status, qris_url: tx.qrisUrl, created_at: tx.createdAt }
      });
    }

    // List all transactions
    const merchantTxs = db.transactions.filter(t => t.merchantId === merchant.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return NextResponse.json({
      status: 'success',
      data: merchantTxs.map(tx => ({
        order_id: tx.orderId,
        amount: tx.amount,
        status: tx.status,
        created_at: tx.createdAt
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
