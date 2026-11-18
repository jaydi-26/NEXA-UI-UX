import React, { useState } from 'react';
import { UserPlus, Shield, HeartHandshake, X, CheckCircle2 } from 'lucide-react';

export default function RegisterModal({ isOpen, onClose, areas = [], onRegistered }) {
  const [activeTab, setActiveTab] = useState('RT'); // 'RT' | 'VOLUNTEER'
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // RT Form
  const [rtName, setRtName] = useState('');
  const [rtPhone, setRtPhone] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kota, setKota] = useState('Jakarta Timur');
  const [rwCode, setRwCode] = useState('');
  const [rtCode, setRtCode] = useState('');

  // Volunteer Form
  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volRole, setVolRole] = useState('Resident'); // 'Resident' | 'NGO'
  const [volOrg, setVolOrg] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  if (!isOpen) return null;

  const handleRegisterRT = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-rt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: rtName,
          phone_number: rtPhone,
          kelurahan,
          kecamatan,
          kota,
          rw_code: rwCode,
          rt_code: rtCode
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessData({
          type: 'RT',
          title: `Ketua ${data.area.rt_code} ${data.area.rw_code} ${data.area.kelurahan} Berhasil Terdaftar!`,
          token: data.user.telegram_subscribe_token,
          message: "Wilayah Anda sudah aktif dan siap menerima laporan warga."
        });
        if (onRegistered) onRegistered(data.user);
      } else {
        alert(data.error || "Gagal mendaftarkan RT.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVolunteer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: volName,
          phone_number: volPhone,
          role: volRole,
          organization_name: volOrg,
          rt_rw_id: selectedAreaId
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessData({
          type: 'VOLUNTEER',
          title: `Selamat Bergabung, ${data.user.full_name}!`,
          token: null,
          message: volRole === 'NGO'
            ? "Akun NGO / Tim Rescue Anda aktif untuk mengakses dasbor prioritas evakuasi banjir (Tahap 2)."
            : "Anda terdaftar sebagai Relawan Warga Siaga RT untuk gotong royong mitigasi sebelum hujan tiba."
        });
        if (onRegistered) onRegistered(data.user);
      } else {
        alert(data.error || "Gagal mendaftar.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-blue-50 to-sky-100 border border-blue-200 rounded-3xl shadow-lg p-6 text-blue-900 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-blue-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 border border-blue-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-950">Daftar di SiagaRT</h3>
              <p className="text-sm text-blue-600">Bergabung menjaga lingkungan dari banjir</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-blue-600 hover:text-blue-950 rounded-lg hover:bg-blue-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          /* Success Screen */
          <div className="py-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-blue-950">{successData.title}</h4>
            <p className="text-sm text-blue-800 max-w-md mx-auto leading-relaxed">{successData.message}</p>

            {successData.token && (
              <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 text-sm text-left space-y-1">
                <span className="text-blue-600 block text-xs">Token Deep-Link Telegram RT Anda:</span>
                <span className="font-mono font-bold text-blue-700 text-sm block">{successData.token}</span>
                <p className="text-xs text-blue-600 mt-1">
                  Buka tab Ketua RT dan klik <strong>Hubungkan ke Telegram</strong> untuk mengaktifkan notifikasi otomatis ke HP Anda.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setSuccessData(null);
                onClose();
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              Selesai & Mulai Gunakan
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Tab Selection */}
            <div className="grid grid-cols-2 gap-2 bg-blue-50 p-1.5 rounded-2xl border border-blue-200">
              <button
                type="button"
                onClick={() => setActiveTab('RT')}
                className={`py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'RT'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-blue-600 hover:text-blue-950'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Saya Ketua RT</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('VOLUNTEER')}
                className={`py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'VOLUNTEER'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-blue-600 hover:text-blue-950'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Saya warga / relawan / NGO</span>
              </button>
            </div>

            {/* TAB 1: DAFTAR RT BARU */}
            {activeTab === 'RT' && (
              <form onSubmit={handleRegisterRT} className="space-y-3 text-sm">
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    Untuk <strong>Ketua RT yang wilayahnya belum terdaftar</strong>.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Nama lengkap Ketua RT</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pak H. Suryono"
                      value={rtName}
                      onChange={(e) => setRtName(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Nomor HP (WhatsApp)</label>
                    <input
                      type="text"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={rtPhone}
                      onChange={(e) => setRtPhone(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Nomor RT</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 06"
                      value={rtCode}
                      onChange={(e) => setRtCode(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Nomor RW</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 04"
                      value={rwCode}
                      onChange={(e) => setRwCode(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Kelurahan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Cipinang"
                      value={kelurahan}
                      onChange={(e) => setKelurahan(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Kecamatan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pulogadung"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Kota Administrasi</label>
                    <select
                      value={kota}
                      onChange={(e) => setKota(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Jakarta Timur">Jakarta Timur</option>
                      <option value="Jakarta Selatan">Jakarta Selatan</option>
                      <option value="Jakarta Pusat">Jakarta Pusat</option>
                      <option value="Jakarta Barat">Jakarta Barat</option>
                      <option value="Jakarta Utara">Jakarta Utara</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {loading ? "Mendaftarkan..." : "Daftarkan RT"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: DAFTAR WARGA BIASA / NGO */}
            {activeTab === 'VOLUNTEER' && (
              <form onSubmit={handleRegisterVolunteer} className="space-y-3 text-sm">
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <HeartHandshake className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>
                    Untuk warga, mahasiswa, karang taruna, dan organisasi relawan.
                  </span>
                </div>

                <div>
                  <label className="text-blue-800 font-semibold block mb-1">Anda mendaftar sebagai</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVolRole('Resident')}
                      className={`p-2 rounded-xl border text-sm font-semibold ${
                        volRole === 'Resident'
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}
                    >
                      Warga (kerja bakti)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVolRole('NGO')}
                      className={`p-2 rounded-xl border text-sm font-semibold ${
                        volRole === 'NGO'
                          ? 'bg-rose-100 border-rose-500 text-rose-700'
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}
                    >
                      Organisasi / NGO
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Anda atau Koordinator"
                      value={volName}
                      onChange={(e) => setVolName(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Nomor HP (WhatsApp)</label>
                    <input
                      type="text"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={volPhone}
                      onChange={(e) => setVolPhone(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {volRole === 'NGO' ? (
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">Nama organisasi / komunitas</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tagana Rawajati / KSR PMI Unit 04"
                      value={volOrg}
                      onChange={(e) => setVolOrg(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-blue-800 font-semibold block mb-1">RT tempat Anda tinggal</label>
                    <select
                      value={selectedAreaId}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950 text-sm focus:outline-none focus:border-rose-500"
                    >
                      <option value="" disabled>Pilih RT tujuan</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.kelurahan} ({a.rt_code} {a.rw_code}) - {a.kecamatan}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all"
                  >
                    {loading ? "Menyimpan..." : "Daftar Jadi Relawan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
