import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 text-black">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl overflow-hidden p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">API QRIS Gateway</h1>
        <p className="text-gray-600 text-center">
          Solusi payment gateway instant untuk developer Bot Telegram & WhatsApp.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">🚀 Cara Pakai (Untuk Developer)</h2>
          
          <div className="space-y-4">
            <div>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold mb-1">1. DAFTAR</span>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`curl -X POST /api/v1/merchant/register \\
-H "Content-Type: application/json" \\
-d '{"name":"Bot Pulsa","email":"bot@email.com"}'`}
              </pre>
              <p className="text-xs text-gray-500 mt-1">Dapatkan <code className="bg-gray-100 px-1 rounded">api_key</code> dan saldo gratis Rp 10.000 dari response di atas.</p>
            </div>

            <div>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold mb-1">2. BUAT QRIS</span>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`curl -X POST /api/v1/payment/create \\
-H "Authorization: Bearer QG-API-KEY-ANDA" \\
-H "Content-Type: application/json" \\
-d '{"amount":50000,"description":"Deposit Saldo","callbackUrl":"https://bot-anda.com/webhook"}'`}
              </pre>
              <p className="text-xs text-gray-500 mt-1">Sistem kami akan memotong saldo Anda Rp 500 dan merespons URL QRIS yang bisa di-scan user.</p>
            </div>

            <div>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold mb-1">3. TERIMA CALLBACK</span>
              <p className="text-sm text-gray-700">Jika user membayar QRIS, kami mengirim POST ke <code className="bg-gray-100 px-1 rounded">callbackUrl</code> bot Anda:</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`{
  "order_id": "QG-173822-ABCD",
  "amount": 50000,
  "status": "success"
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          Dikembangkan oleh MUSAA.ID
        </div>
      </div>
    </div>
  );
}
