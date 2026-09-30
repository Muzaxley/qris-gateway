import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const db = readDB();
    const merchant = db.merchants.find(m => m.apiKey === apiKey);
    if (!merchant) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

    const txCount = db.transactions.filter(t => t.merchantId === merchant.id).length;
    const successTxCount = db.transactions.filter(t => t.merchantId === merchant.id && t.status === 'success').length;

    return NextResponse.json({
      status: 'success',
      data: {
        name: merchant.name,
        email: merchant.email,
        api_key: merchant.apiKey,
        balance: merchant.balance,
        webhook_url: merchant.webhookUrl,
        total_transactions: txCount,
        success_transactions: successTxCount,
        member_since: merchant.createdAt
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
