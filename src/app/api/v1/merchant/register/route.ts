import { NextResponse } from 'next/server';
import { getMerchantByEmail, saveMerchant, Merchant } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, webhookUrl } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getMerchantByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ 
        error: 'Email already registered. Use your existing API key or contact admin.' 
      }, { status: 409 });
    }

    const apiKey = `QG-${uuidv4().replace(/-/g, '').substring(0, 24).toUpperCase()}`;
    const newMerchant: Merchant = {
      id: uuidv4(),
      name: name.trim(),
      email: cleanEmail,
      apiKey,
      balance: 10000, // Saldo gratis Rp 10.000 untuk 20x testing transaksi
      webhookUrl: webhookUrl ? webhookUrl.trim() : '',
      createdAt: new Date().toISOString()
    };

    await saveMerchant(newMerchant);

    return NextResponse.json({
      status: 'success',
      message: `Selamat datang, ${newMerchant.name}! Akun merchant aktif dengan saldo uji coba Rp 10.000 (20x free transaction).`,
      data: {
        merchant_id: newMerchant.id,
        name: newMerchant.name,
        email: newMerchant.email,
        api_key: newMerchant.apiKey,
        balance: newMerchant.balance,
        webhook_url: newMerchant.webhookUrl
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Merchant register error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
