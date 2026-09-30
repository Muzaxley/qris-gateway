import { NextResponse } from 'next/server';
import { getMerchantByApiKey, getTransactionByOrderId, listTransactions } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Bearer token' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const merchant = await getMerchantByApiKey(apiKey);

    if (!merchant) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (orderId) {
      const tx = await getTransactionByOrderId(orderId);
      if (!tx || tx.merchantId !== merchant.id) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      return NextResponse.json({
        status: 'success',
        data: {
          order_id: tx.orderId,
          amount: tx.amount,
          status: tx.status,
          description: tx.description,
          qris_url: tx.qrisUrl,
          deeplink_url: tx.deeplinkUrl || null,
          created_at: tx.createdAt,
          updated_at: tx.updatedAt
        }
      });
    }

    // List all transactions
    const merchantTxs = await listTransactions(merchant.id, 50);

    return NextResponse.json({
      status: 'success',
      data: merchantTxs.map(tx => ({
        order_id: tx.orderId,
        amount: tx.amount,
        status: tx.status,
        description: tx.description,
        created_at: tx.createdAt
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
