import { NextResponse } from 'next/server';
import { getMerchantByApiKey, listTransactions } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Bearer token' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const merchant = await getMerchantByApiKey(apiKey);
    if (!merchant) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const txs = await listTransactions(merchant.id, 100);
    const successCount = txs.filter(t => t.status === 'success').length;
    const totalVolume = txs
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return NextResponse.json({
      status: 'success',
      data: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        api_key: merchant.apiKey,
        balance: merchant.balance,
        webhook_url: merchant.webhookUrl,
        total_transactions: txs.length,
        success_transactions: successCount,
        total_volume_idr: totalVolume,
        member_since: merchant.createdAt
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
