import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import midtransClient from 'midtrans-client';

const FEE_PER_TRANSACTION = parseInt(process.env.FEE_PER_TRANSACTION || '500');

// Initialize Midtrans Core API
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxxxxxxxxxxxxxxxxxxx',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxxxxxxxxxxxxxxxxxxx'
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const db = readDB();
    const merchant = db.merchants.find(m => m.apiKey === apiKey);

    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, description, callbackUrl } = body;

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Amount must be at least 1000' }, { status: 400 });
    }

    // Check balance for fee
    if (merchant.balance < FEE_PER_TRANSACTION) {
       return NextResponse.json({ error: `Insufficient balance for fee (Rp ${FEE_PER_TRANSACTION})` }, { status: 400 });
    }

    const orderId = `QG-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    // Create Midtrans Charge
    const parameter = {
      payment_type: "gopay", // GoPay returns QRIS on sandbox/prod
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      item_details: [{
        id: "ITEM1",
        price: amount,
        quantity: 1,
        name: description || "Payment via Gateway"
      }]
    };

    const chargeResponse = await coreApi.charge(parameter);

    if (chargeResponse.status_code !== '201') {
       throw new Error(chargeResponse.status_message);
    }
    
    // Save transaction
    const newTx = {
      id: uuidv4(),
      merchantId: merchant.id,
      orderId: orderId, // Our order ID format
      midtransOrderId: orderId,
      amount: amount,
      description: description,
      status: 'pending' as const,
      qrisUrl: chargeResponse.actions?.find((a: any) => a.name === 'generate-qr-code')?.url || '',
      callbackUrl: callbackUrl || merchant.webhookUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.transactions.push(newTx);
    writeDB(db);

    return NextResponse.json({
      status: 'success',
      data: {
        order_id: newTx.orderId,
        amount: newTx.amount,
        qris_url: newTx.qrisUrl,
        status: newTx.status
      }
    });

  } catch (error: any) {
    console.error('API create payment error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
