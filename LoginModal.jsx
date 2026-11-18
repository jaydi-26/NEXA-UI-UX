import React, { useState } from 'react';
import { Lock, X, KeyRound, CheckCircle2, ArrowRight, Phone, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('RT_LEADER'); // 'RT_LEADER' | 'NGO' | 'ADMIN'
  const [identifier, setIdentifier] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Preset demo accounts for quick one-click testing
  const presetAccounts = [
    { role: 'RT_LEADER', label: 'Pak Bambang (Ketua RT 04 Kampung Melayu)', id: '0812-9843-1102' },
    { role: 'RT_LEADER', label: 'Ibu Nuraini (Ketua RT 03 Bidara Cina)', id: '0813-8821-4491' },
    { role: 'NGO', label: 'PMI Jakarta Timur (Tim TRC Evakuasi)', id: '021-8192411' },
    { role: 'NGO', label: 'Tagana DKI Unit SAR', id: '021-3901122' },
    { role: 'ADMIN', label: 'Pusdalops BPBD DKI Jakarta', id: '112' }
  ];

  const handleSelectPreset = (acc) => {
    setSelectedRole(acc.role);
    setIdentifier(acc.id);
    setPinCode('1234');
    setErrorMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          pin: pinCode.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk. Periksa nomor HP dan PIN.");
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-blue-50 to-sky-100 border border-blue-200 rounded-3xl shadow-lg p-6 text-blue-900 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-blue-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 border border-blue-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-950">Masuk untuk pengurus</h3>
              <p className="text-sm text-blue-600">Untuk Ketua RT, tim NGO, dan petugas BPBD</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-blue-600 hover:text-blue-950 rounded-lg hover:bg-blue-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fill Preset Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Akun contoh (khusus demo)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presetAccounts.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(acc)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  identifier === acc.id
                    ? 'bg-blue-100 border-blue-500 text-blue-700 font-bold'
                    : 'bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-950 hover:bg-blue-100'
                }`}
              >
                {acc.label.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5 text-sm pt-1">
          <div>
            <label className="text-blue-800 font-semibold block mb-1">
              Nomor HP Terdaftar / ID Akun:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nomor HP yang terdaftar"
                className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm pl-8 focus:outline-none focus:border-blue-500"
              />
              <Phone className="w-4 h-4 text-blue-500 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="text-blue-800 font-semibold block mb-1">PIN</label>
            <div className="relative">
              <input
                type="password"
                required
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Masukkan PIN"
                className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm pl-8 font-mono tracking-widest focus:outline-none focus:border-blue-500"
              />
              <KeyRound className="w-4 h-4 text-blue-500 absolute left-2.5 top-3" />
            </div>
            <span className="text-xs text-blue-600 mt-1 block">
              * PIN inisialisasi default seluruh pengurus adalah: <strong className="text-blue-700">1234</strong>
            </span>
          </div>

          {errorMsg && (
            <p className="text-sm text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-shake">
              {errorMsg}
            </p>
          )}

          {/* UU PDP Notice */}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs text-blue-800 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sesuai UU PDP</span>
            </div>
            <p className="text-blue-600">
              Data pelapor hanya terbuka setelah login.
            </p>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-100 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memeriksa...</span>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
