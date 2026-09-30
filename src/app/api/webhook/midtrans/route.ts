import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import crypto from 'crypto';
import axios from 'axios';

const FEE_PER_TRANSACTION = parseInt(process.env.FEE_PER_TRANSACTION || '500');

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    
    // Midtrans Signature Validation
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hash = crypto.createHash('sha512').update(body.order_id + body.status_code + body.gross_amount + serverKey).digest('hex');
    
    if (hash !== body.signature_key) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const db = readDB();
    const txIndex = db.transactions.findIndex(t => t.midtransOrderId === body.order_id);
    
    if (txIndex === -1) {
       return NextResponse.json({ message: 'Transaction not found, ignoring' }, { status: 200 });
    }

    const tx = db.transactions[txIndex];
    
    // Only process if currently pending
    if (tx.status !== 'pending') {
       return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 });
    }

    let newStatus: string = tx.status;
    if (body.transaction_status === 'settlement' || body.transaction_status === 'capture') {
       newStatus = 'success';
    } else if (body.transaction_status === 'expire' || body.transaction_status === 'cancel' || body.transaction_status === 'deny') {
       newStatus = 'failed';
    }

    if (newStatus === 'success') {
       // Cut balance
       const mIndex = db.merchants.findIndex(m => m.id === tx.merchantId);
       if (mIndex > -1) {
           db.merchants[mIndex].balance -= FEE_PER_TRANSACTION;
       }
    }

    db.transactions[txIndex].status = newStatus as 'success' | 'failed' | 'pending' | 'expired';
    db.transactions[txIndex].updatedAt = new Date().toISOString();
    writeDB(db);

    // Fire webhook to developer
    if (tx.callbackUrl && newStatus !== 'pending') {
      try {
        await axios.post(tx.callbackUrl, {
           order_id: tx.orderId,
           status: newStatus,
           amount: tx.amount
        });
      } catch (e: any) {
        console.error(`Webhook error for ${tx.orderId}:`, e.message);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
