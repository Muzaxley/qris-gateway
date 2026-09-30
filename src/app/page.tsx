'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'playground' | 'docs' | 'pricing'>('playground');
  const [playgroundTab, setPlaygroundTab] = useState<'register' | 'create' | 'status'>('register');
  const [codeLang, setCodeLang] = useState<'nodejs' | 'python' | 'php' | 'curl'>('nodejs');

  // Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWebhook, setRegWebhook] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regResult, setRegResult] = useState<any>(null);

  // Payment Create State
  const [apiKey, setApiKey] = useState('');
  const [amount, setAmount] = useState('5000');
  const [description, setDescription] = useState('Deposit Saldo Bot #123');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payResult, setPayResult] = useState<any>(null);

  // Status Check State
  const [statusOrderId, setStatusOrderId] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);

  // Copy helper
  const [copiedText, setCopiedText] = useState('');
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('musaa_qris_apikey');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegResult(null);
    try {
      const res = await fetch('/api/v1/merchant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, webhookUrl: regWebhook })
      });
      const data = await res.json();
      setRegResult(data);
      if (data.status === 'success' && data.data?.api_key) {
        setApiKey(data.data.api_key);
        localStorage.setItem('musaa_qris_apikey', data.data.api_key);
      }
    } catch (err: any) {
      setRegResult({ error: err.message || 'Gagal mendaftar' });
    } finally {
      setRegLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert('Silakan masukkan API Key terlebih dahulu atau daftar di tab Pendaftaran!');
      return;
    }
    setPayLoading(true);
    setPayResult(null);
    try {
      const res = await fetch('/api/v1/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          amount: parseInt(amount),
          description,
          callbackUrl: callbackUrl || undefined
        })
      });
      const data = await res.json();
      setPayResult(data);
      if (data.status === 'success' && data.data?.order_id) {
        setStatusOrderId(data.data.order_id);
      }
    } catch (err: any) {
      setPayResult({ error: err.message || 'Gagal membuat QRIS' });
    } finally {
      setPayLoading(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !statusOrderId) {
      alert('API Key dan Order ID wajib diisi!');
      return;
    }
    setStatusLoading(true);
    setStatusResult(null);
    try {
      const res = await fetch(`/api/v1/payment/status?order_id=${encodeURIComponent(statusOrderId.trim())}`, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        }
      });
      const data = await res.json();
      setStatusResult(data);
    } catch (err: any) {
      setStatusResult({ error: err.message || 'Gagal cek status' });
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* NAVBAR */}
      <header className="border-b border-gray-800/80 bg-[#070b13]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-emerald-500/20">
              M
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-emerald-400 bg-clip-text text-transparent">
                MUSAA.ID
              </span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                QRIS Gateway v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'playground'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Playground & Live Test
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'docs'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              API Docs
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'pricing'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Biaya & Saldo
            </button>
            <a
              href="https://wa.me/6285156084903?text=Halo%20Admin%20MUSAA.ID%2C%20saya%20ingin%20tanya%20seputar%20API%20QRIS%20Gateway"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition shadow-lg shadow-emerald-500/20"
            >
              Hubungi Admin
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-gray-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            ⚡ Instant Dynamic QRIS & Realtime Webhook
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Payment Gateway QRIS Instan untuk <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Bot WhatsApp & Telegram
            </span>
          </h1>
          <p className="mt-5 text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Terima pembayaran otomatis langsung ke bot Anda dalam 3 menit. Tanpa ribet verifikasi berkas PT/CV,
            biaya flat <strong>Rp 500</strong> per transaksi sukses, notifikasi webhook instan, dan gratis saldo promo <strong>Rp 10.000</strong>!
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                setActiveTab('playground');
                setPlaygroundTab('create');
              }}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-base transition shadow-xl shadow-emerald-500/20"
            >
              🔥 Coba Buat QRIS Sekarang
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className="px-6 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-white font-bold text-base border border-gray-700 transition"
            >
              📖 Contoh Integrasi Bot
            </button>
          </div>

          {/* BADGES */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80">
              <div className="text-emerald-400 text-xl font-black">99.9%</div>
              <div className="text-xs text-gray-400 mt-1">Uptime Serverless Vercel</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80">
              <div className="text-emerald-400 text-xl font-black">Flat Rp 500</div>
              <div className="text-xs text-gray-400 mt-1">Hanya Potong Saat Sukses</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80">
              <div className="text-emerald-400 text-xl font-black">&lt; 2 Detik</div>
              <div className="text-xs text-gray-400 mt-1">Kecepatan Webhook Notif</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80">
              <div className="text-emerald-400 text-xl font-black">All E-Wallet</div>
              <div className="text-xs text-gray-400 mt-1">GoPay, Dana, OVO, Bank</div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* PLAYGROUND TAB */}
        {activeTab === 'playground' && (
          <div className="space-y-8">
            <div className="flex border-b border-gray-800 pb-3 gap-2">
              <button
                onClick={() => setPlaygroundTab('register')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  playgroundTab === 'register'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                }`}
              >
                1. Daftar Merchant (Gratis Rp 10.000)
              </button>
              <button
                onClick={() => setPlaygroundTab('create')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  playgroundTab === 'create'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                }`}
              >
                2. Simulator Buat QRIS
              </button>
              <button
                onClick={() => setPlaygroundTab('status')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  playgroundTab === 'status'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                }`}
              >
                3. Cek Status Pembayaran
              </button>
            </div>

            {/* SUBTAB 1: DAFTAR */}
            {playgroundTab === 'register' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-white mb-2">Formulir Pendaftaran Merchant</h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Isi data di bawah untuk mendapatkan API Key dan saldo percobaan Rp 10.000 (bisa untuk 20x request).
                  </p>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Nama Bot / Proyek
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Bot TopUp Free Fire"
                        required
                        className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Email Developer
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="developer@gmail.com"
                        required
                        className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Webhook Callback URL (Opsional)
                      </label>
                      <input
                        type="url"
                        value={regWebhook}
                        onChange={(e) => setRegWebhook(e.target.value)}
                        placeholder="https://bot-anda.com/api/payment-webhook"
                        className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        Alamat URL bot Anda yang akan dipanggil saat pembayaran sukses.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition mt-4 disabled:opacity-50"
                    >
                      {regLoading ? 'Mendaftarkan...' : 'Dapatkan API Key Gratis 🚀'}
                    </button>
                  </form>
                </div>

                <div className="bg-[#050811] border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Response Server
                  </h3>
                  {regResult ? (
                    <div className="space-y-4">
                      {regResult.status === 'success' ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                          <p className="font-bold">🎉 Pendaftaran Berhasil!</p>
                          <p className="mt-1 text-xs">{regResult.message}</p>
                          <div className="mt-3 p-3 rounded-lg bg-black/60 border border-emerald-500/20 font-mono text-xs text-emerald-400 break-all select-all flex justify-between items-center">
                            <span>{regResult.data?.api_key}</span>
                            <button
                              onClick={() => copyToClipboard(regResult.data?.api_key, 'apikey')}
                              className="ml-2 px-2 py-1 bg-emerald-500 text-black rounded text-[10px] font-bold"
                            >
                              {copiedText === 'apikey' ? 'Tersalin!' : 'Salin'}
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-2">
                            API Key telah otomatis disimpan untuk uji coba di tab berikutnya!
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                          ❌ {regResult.error}
                        </div>
                      )}
                      <pre className="p-3 bg-black/80 rounded-xl text-xs font-mono text-gray-300 overflow-x-auto border border-gray-800">
                        {JSON.stringify(regResult, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 text-sm">
                      Silakan isi formulir di sebelah kiri untuk melihat response JSON dan API Key Anda.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 2: CREATE QRIS */}
            {playgroundTab === 'create' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-white mb-2">Simulator Pembuatan QRIS</h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Uji coba endpoint <code className="text-emerald-400 font-mono">POST /api/v1/payment/create</code> secara langsung.
                  </p>

                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Merchant API Key
                      </label>
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="QG-..."
                        required
                        className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-emerald-400 font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Nominal (Rupiah)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="5000"
                        required
                        className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Keterangan Tagihan
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Deposit Saldo Akun #1234"
                        className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Callback Webhook URL (Opsional)
                      </label>
                      <input
                        type="url"
                        value={callbackUrl}
                        onChange={(e) => setCallbackUrl(e.target.value)}
                        placeholder="https://webhook.site/..."
                        className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={payLoading}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition mt-4 disabled:opacity-50"
                    >
                      {payLoading ? 'Memproses QRIS...' : '⚡ Generate QRIS Sekarang'}
                    </button>
                  </form>
                </div>

                <div className="bg-[#050811] border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center">
                  {payResult && payResult.status === 'success' ? (
                    <div className="w-full text-center space-y-4">
                      <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl shadow-emerald-500/10">
                        {payResult.data?.qris_url ? (
                          <img
                            src={payResult.data.qris_url}
                            alt="QRIS Payment"
                            className="w-56 h-56 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-56 h-56 flex items-center justify-center text-gray-500 text-xs">
                            No QR Image
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-2xl font-black text-white font-mono">
                          Rp {parseInt(payResult.data?.amount).toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Order ID: <code className="text-emerald-400">{payResult.data?.order_id}</code>
                        </div>
                        <div className="text-xs text-amber-400 mt-0.5">
                          ⏳ Berlaku selama {payResult.data?.expires_in_minutes || 15} Menit
                        </div>
                      </div>

                      {payResult.data?.deeplink_url && (
                        <a
                          href={payResult.data.deeplink_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition"
                        >
                          📲 Buka Langsung di Aplikasi GoPay
                        </a>
                      )}

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setPlaygroundTab('status');
                            setStatusOrderId(payResult.data.order_id);
                          }}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          🔍 Cek Status Order Ini di Tab Status ➔
                        </button>
                      </div>
                    </div>
                  ) : payResult && payResult.error ? (
                    <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      ❌ {payResult.error}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 text-sm">
                      Klik <strong>Generate QRIS</strong> untuk memunculkan barcode QRIS dinamis di sini.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 3: STATUS CHECK */}
            {playgroundTab === 'status' && (
              <div className="max-w-2xl mx-auto bg-gray-900/80 border border-gray-800 rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold text-white mb-2">Cek Status Pembayaran Realtime</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Periksa apakah pembayaran QRIS sudah selesai dibayar oleh pelanggan atau masih pending.
                </p>

                <form onSubmit={handleCheckStatus} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Order ID
                    </label>
                    <input
                      type="text"
                      value={statusOrderId}
                      onChange={(e) => setStatusOrderId(e.target.value)}
                      placeholder="QG-..."
                      required
                      className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl px-4 py-2.5 text-emerald-400 font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition disabled:opacity-50"
                  >
                    {statusLoading ? 'Mengecek...' : '🔍 Cek Status Transaksi'}
                  </button>
                </form>

                {statusResult && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Hasil Pengecekan
                    </h3>
                    {statusResult.status === 'success' ? (
                      <div className="p-4 rounded-xl bg-[#050811] border border-gray-700/80 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Order ID:</span>
                          <span className="font-mono text-white">{statusResult.data?.order_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nominal:</span>
                          <span className="font-mono text-white">
                            Rp {parseInt(statusResult.data?.amount).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              statusResult.data?.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : statusResult.data?.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-red-500/20 text-red-400 border border-red-500/40'
                            }`}
                          >
                            {statusResult.data?.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        ❌ {statusResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DOCS TAB */}
        {activeTab === 'docs' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">Dokumentasi Integrasi API</h2>
              <p className="text-sm text-gray-400 mt-1">
                Gunakan potongan kode berikut untuk menyambungkan pembayaran QRIS ke dalam script Bot WhatsApp atau Bot Telegram Anda.
              </p>
            </div>

            <div className="flex border-b border-gray-800 pb-2 gap-2">
              {(['nodejs', 'python', 'php', 'curl'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    codeLang === lang
                      ? 'bg-emerald-500 text-black'
                      : 'bg-gray-800/40 text-gray-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {codeLang === 'nodejs' && (
              <div className="bg-[#050811] border border-gray-800 rounded-2xl p-6 relative">
                <div className="text-xs font-mono text-emerald-400 mb-2">// Node.js (Baileys WhatsApp Bot / Telegraf)</div>
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
{`const axios = require('axios');

async function createQRISPayment(amount, description, userChatId) {
  const API_KEY = 'QG-YOUR-API-KEY-HERE';
  
  const response = await axios.post('https://qris-gateway.vercel.app/api/v1/payment/create', {
    amount: amount, // minimal Rp 1.000
    description: description,
    callbackUrl: 'https://your-bot-server.com/payment-webhook'
  }, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });

  const { order_id, qris_url } = response.data.data;
  
  // Kirim gambar QRIS ke chat WhatsApp (Baileys)
  await sock.sendMessage(userChatId, {
    image: { url: qris_url },
    caption: \`⚡ *TAGIHAN QRIS OTOMATIS*\n\nOrder ID: \${order_id}\nNominal: Rp \${amount.toLocaleString()}\n\n_Silakan scan QRIS di atas sebelum 15 menit._\`
  });
}`}
                </pre>
              </div>
            )}

            {codeLang === 'python' && (
              <div className="bg-[#050811] border border-gray-800 rounded-2xl p-6 relative">
                <div className="text-xs font-mono text-emerald-400 mb-2"># Python 3 (Telegram Bot / Requests)</div>
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
{`import requests

API_KEY = "QG-YOUR-API-KEY-HERE"

def buat_qris(nominal, keterangan):
    url = "https://qris-gateway.vercel.app/api/v1/payment/create"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "amount": nominal,
        "description": keterangan,
        "callbackUrl": "https://bot-anda.com/webhook"
    }
    res = requests.post(url, json=payload, headers=headers)
    data = res.json()
    if data.get("status") == "success":
        qris_url = data["data"]["qris_url"]
        order_id = data["data"]["order_id"]
        return order_id, qris_url
    return None, None`}
                </pre>
              </div>
            )}

            {codeLang === 'php' && (
              <div className="bg-[#050811] border border-gray-800 rounded-2xl p-6 relative">
                <div className="text-xs font-mono text-emerald-400 mb-2">// PHP (cURL)</div>
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
{`<?php
$apiKey = "QG-YOUR-API-KEY-HERE";
$payload = [
    "amount" => 15000,
    "description" => "Beli VIP MagnumX",
    "callbackUrl" => "https://mywebsite.com/callback"
];

$ch = curl_init("https://qris-gateway.vercel.app/api/v1/payment/create");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
curl_close($ch);
$result = json_decode($response, true);
echo "QRIS URL: " . $result['data']['qris_url'];
?>`}
                </pre>
              </div>
            )}

            {codeLang === 'curl' && (
              <div className="bg-[#050811] border border-gray-800 rounded-2xl p-6 relative">
                <div className="text-xs font-mono text-emerald-400 mb-2"># Shell / cURL Terminal</div>
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
{`curl -X POST https://qris-gateway.vercel.app/api/v1/payment/create \
  -H "Authorization: Bearer QG-YOUR-API-KEY-HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "description": "Pembayaran Akun",
    "callbackUrl": "https://bot-anda.com/webhook"
  }'`}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white">Struktur Biaya & Deposit</h2>
              <p className="text-sm text-gray-400 mt-2">
                Skema harga paling ramah kantong untuk pengembang bot indie dan UMKM.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-4">
                    UJI COBA DEVELOPER
                  </div>
                  <div className="text-3xl font-black text-white font-mono">Gratis Rp 10.000</div>
                  <p className="text-xs text-gray-400 mt-2">
                    Setiap pendaftaran baru otomatis mendapatkan saldo Rp 10.000 untuk 20x percobaan API.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-gray-300">
                    <li className="flex items-center gap-2">✓ Bebas biaya pendaftaran</li>
                    <li className="flex items-center gap-2">✓ Tanpa syarat NPWP / SIUP</li>
                    <li className="flex items-center gap-2">✓ Full akses semua fitur API & Webhook</li>
                  </ul>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-b from-gray-900 to-[#070b13] border border-emerald-500/30 flex flex-col justify-between shadow-xl shadow-emerald-500/5">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-extrabold mb-4">
                    PRODUKSI FLAT
                  </div>
                  <div className="text-3xl font-black text-white font-mono">Rp 500 <span className="text-sm font-normal text-gray-400">/ transaksi sukses</span></div>
                  <p className="text-xs text-gray-400 mt-2">
                    Saldo deposit dipotong hanya jika pembayaran benar-benar telah lunas di-scan pelanggan.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-gray-300">
                    <li className="flex items-center gap-2">✓ Minimal top up saldo hanya Rp 10.000</li>
                    <li className="flex items-center gap-2">✓ Saldo tidak ada masa kedaluwarsa</li>
                    <li className="flex items-center gap-2">✓ Saldo transaksi user 100% masuk ke rekening Anda</li>
                  </ul>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <a
                    href="https://wa.me/6285156084903?text=Halo%20Admin%20MUSAA.ID%2C%20saya%20mau%20top%20up%20saldo%20QRIS%20Gateway"
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition"
                  >
                    Top Up Saldo via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-800/80 bg-[#04070d] py-10 text-center text-xs text-gray-500 mt-20">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 <strong>MUSAA.ID</strong>. All Rights Reserved. Built for developers by developers.</p>
          <p>
            Dukungan Teknis & Layanan: WhatsApp{' '}
            <a
              href="https://wa.me/6285156084903"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 font-bold hover:underline"
            >
              0851-5608-4903
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
