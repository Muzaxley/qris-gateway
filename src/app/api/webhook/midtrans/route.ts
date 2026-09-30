import { NextResponse } from 'next/server';
import { 
  getTransactionByMidtransId, 
  updateTransactionStatus, 
  updateMerchantBalance 
} from '@/lib/db';
import crypto from 'crypto';

const FEE_PER_TRANSACTION = parseInt(process.env.FEE_PER_TRANSACTION || '500');
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    // Midtrans Signature Validation
    const expectedHash = crypto
      .createHash('sha512')
      .update(body.order_id + body.status_code + body.gross_amount + MIDTRANS_SERVER_KEY)
      .digest('hex');

    if (body.signature_key && expectedHash !== body.signature_key) {
      console.warn('⚠️ Webhook Signature Mismatch:', body.order_id);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const tx = await getTransactionByMidtransId(body.order_id);

    if (!tx) {
      console.log('ℹ️ Transaction not found for order_id:', body.order_id);
      return NextResponse.json({ message: 'Transaction not found, ignoring' }, { status: 200 });
    }

    if (tx.status !== 'pending') {
      return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 });
    }

    let newStatus: 'success' | 'failed' | 'expired' | 'pending' = 'pending';
    const tStatus = body.transaction_status;

    if (tStatus === 'settlement' || tStatus === 'capture') {
      newStatus = 'success';
    } else if (tStatus === 'expire') {
      newStatus = 'expired';
    } else if (tStatus === 'cancel' || tStatus === 'deny') {
      newStatus = 'failed';
    }

    if (newStatus !== 'pending') {
      await updateTransactionStatus(tx.orderId, newStatus);

      if (newStatus === 'success') {
        // Cut balance fee
        await updateMerchantBalance(tx.merchantId, -FEE_PER_TRANSACTION);
      }

      // Fire callback webhook to developer
      if (tx.callbackUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          
          await fetch(tx.callbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Musaa-QRIS-Gateway/1.0'
            },
            body: JSON.stringify({
              event: 'payment.success',
              order_id: tx.orderId,
              midtrans_order_id: body.order_id,
              status: newStatus,
              amount: tx.amount,
              description: tx.description,
              timestamp: new Date().toISOString()
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          console.log(`✓ Callback delivered to ${tx.callbackUrl} for ${tx.orderId}`);
        } catch (cbErr: any) {
          console.error(`⚠️ Webhook delivery failed for ${tx.orderId}:`, cbErr.message);
        }
      }
    }

    return NextResponse.json({ status: 'ok', order_id: tx.orderId, status_result: newStatus }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
