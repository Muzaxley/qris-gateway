import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, webhookUrl } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const db = readDB();
    if (db.merchants.find(m => m.email === email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const apiKey = `QG-${uuidv4().replace(/-/g, '').toUpperCase()}`;
    const newMerchant = {
      id: uuidv4(),
      name,
      email,
      apiKey,
      balance: 10000, // Free trial saldo
      webhookUrl: webhookUrl || '',
      createdAt: new Date().toISOString()
    };

    db.merchants.push(newMerchant);
    writeDB(db);

    return NextResponse.json({
      status: 'success',
      message: `Welcome, ${name}! You have Rp 10,000 free trial balance.`,
      data: {
        api_key: apiKey,
        balance: newMerchant.balance
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
