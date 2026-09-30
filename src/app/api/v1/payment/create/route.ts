import { NextResponse } from 'next/server';
import { getMerchantByApiKey, saveTransaction, updateMerchantBalance, Transaction } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const FEE_PER_TRANSACTION = parseInt(process.env.FEE_PER_TRANSACTION || '500');
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_IS_PROD = process.env.MIDTRANS_IS_PRODUCTION !== 'false';
const BASE_SNAP_URL = MIDTRANS_IS_PROD ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
const AUTH_BASIC = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const merchant = await getMerchantByApiKey(apiKey);

    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { amount, description, callbackUrl } = body;

    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 1000) {
      return NextResponse.json({ error: 'Amount must be at least Rp 1,000' }, { status: 400 });
    }

    // Check balance for fee
    if ((merchant.balance || 0) < FEE_PER_TRANSACTION) {
      return NextResponse.json({ 
        error: `Insufficient balance for fee (Saldo tersisa: Rp ${merchant.balance?.toLocaleString('id-ID')}, dibutuhkan: Rp ${FEE_PER_TRANSACTION}). Silakan top up saldo merchant Anda.` 
      }, { status: 400 });
    }

    const orderId = `QG-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

    // 1. Create Snap Transaction
    let qrisUrl = '';
    let deeplinkUrl = '';
    let midtransId = orderId;

    try {
      const snapRes = await fetch(`${BASE_SNAP_URL}/snap/v1/transactions`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${AUTH_BASIC}`
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: numAmount
          },
          item_details: [{
            id: 'ITEM1',
            price: numAmount,
            quantity: 1,
            name: description ? description.substring(0, 50) : 'Payment via QRIS Gateway'
          }],
          customer_details: {
            first_name: merchant.name || 'Merchant Customer',
            email: merchant.email || 'customer@gateway.id'
          },
          expiry: { unit: 'minutes', duration: 15 }
        })
      });

      const snapData = await snapRes.json();

      if (snapData.token) {
        // Direct Pay via GoPay / QRIS
        const payRes = await fetch(`${BASE_SNAP_URL}/snap/v1/transactions/${snapData.token}/pay`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Source': 'snap-js',
            'Authorization': `Basic ${AUTH_BASIC}`
          },
          body: JSON.stringify({ payment_type: 'gopay' })
        });
        const payData = await payRes.json();
        qrisUrl = payData.qr_code_url || '';
        deeplinkUrl = payData.deeplink_url || '';
        midtransId = payData.transaction_id || orderId;
      }
    } catch (midtransErr: any) {
      console.error('[Midtrans Error]:', midtransErr.message);
    }

    // Fallback QR code generator if Midtrans direct image is unavailable
    if (!qrisUrl) {
      qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`ORDER_${orderId}_AMOUNT_${numAmount}`)}`;
    }

    const newTx: Transaction = {
      id: uuidv4(),
      merchantId: merchant.id,
      orderId: orderId,
      midtransOrderId: midtransId,
      amount: numAmount,
      description: description || 'QRIS Gateway Payment',
      status: 'pending',
      qrisUrl: qrisUrl,
      deeplinkUrl: deeplinkUrl,
      callbackUrl: callbackUrl || merchant.webhookUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveTransaction(newTx);

    return NextResponse.json({
      status: 'success',
      data: {
        order_id: newTx.orderId,
        amount: newTx.amount,
        qris_url: newTx.qrisUrl,
        deeplink_url: newTx.deeplinkUrl || null,
        description: newTx.description,
        status: newTx.status,
        expires_in_minutes: 15,
        created_at: newTx.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('API create payment error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
