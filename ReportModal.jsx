import React, { useState, useRef } from 'react';
import {
  Camera, CheckCircle2, X, EyeOff, Image as ImageIcon, Loader2,
  AlertTriangle, Droplet, PhoneCall, Minus, Plus, LifeBuoy, Package, Heart, Sailboat
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

const WATER_OPTIONS = [
  { key: 'ankle', title: 'Mata kaki', sub: '< 20 cm' },
  { key: 'knee', title: 'Lutut', sub: '\u00b1 60 cm' },
  { key: 'waist', title: 'Pinggang', sub: '\u00b1 90 cm' },
  { key: 'chest', title: 'Dada ke atas', sub: '> 120 cm' },
];
const VULNERABLE_OPTIONS = ['Lansia', 'Balita', 'Sakit', 'Ibu hamil', 'Disabilitas'];
const ACCESS_OPTIONS = [
  { key: 'easy', title: 'Bisa dilewati' },
  { key: 'hard', title: 'Sulit', sub: 'Arus deras / dalam' },
  { key: 'cut', title: 'Terputus', sub: 'Tidak bisa dilewati' },
];
const AID_OPTIONS = [
  { key: 'Evakuasi', icon: LifeBuoy },
  { key: 'Makanan & air', icon: Package },
  { key: 'Obat / medis', icon: Heart },
  { key: 'Perahu karet', icon: Sailboat },
];

export default function ReportModal({ isOpen, onClose, areas = [], onReportSubmitted, onViewStatus, inline = false, isDemoMode = false }) {
  const [mode, setMode] = useState('potential'); // 'potential' | 'flood_now'
  const [waterLevel, setWaterLevel] = useState(null);
  const [vulnerable, setVulnerable] = useState([]);
  const [access, setAccess] = useState(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [aidNeeds, setAidNeeds] = useState([]);
  const [hazardType, setHazardType] = useState('Clogged_Drain');
  const [description, setDescription] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [photoStats, setPhotoStats] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  if (!isOpen) return null;

  const samplePhotos = [
    {
      label: "Saluran Penuh Sedimen Lumpur (Valid)",
      url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=800&q=80",
      type: "Clogged_Drain",
      desc: "Saluran gorong-gorong tersumbat lumpur padat dan sampah botol plastik."
    },
    {
      label: "Sampah Menumpuk di Mulut Air (Valid)",
      url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
      type: "Trash",
      desc: "Tumpukan kantong kresek dan ranting menyumbat pintu saringan air."
    },
    {
      label: "Foto Jalanan Kering (Uji AI Mismatch)",
      url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
      type: "Flood",
      desc: "Klaim banjir parah setinggi 1 meter padahal jalanan kering."
    }
  ];

  const handleSelectSample = (sample) => {
    setPhotoPreview(sample.url);
    setHazardType(sample.type);
    setDescription(sample.desc);
    setPhotoStats(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const result = await compressImage(file);
      if (result.dataUrl) {
        setPhotoPreview(result.dataUrl);
        setPhotoStats(result);
      }
    } catch (err) {
      console.warn("Gagal memproses foto:", err);
    } finally {
      setCompressing(false);
      // Reset input agar bisa pilih/jepret ulang berkas dengan nama yang sama
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAiResult(null);

    try {
      const area = areas.find(a => a.id === selectedAreaId);
      const floodNow = mode === 'flood_now';
      const payload = {
        report_mode: mode,
        flood: floodNow ? {
          water_level: waterLevel,
          vulnerable,
          access,
          people_count: peopleCount,
          aid_needs: aidNeeds
        } : undefined,
        hazard_type: floodNow ? 'Flood' : selectedCategory.type,
        hazard_type_label: floodNow ? undefined : (hazardType === 'Other' ? otherReason.trim() : (selectedCategory.type === 'Other' ? selectedCategory.title : undefined)),
        description: floodNow ? undefined : description,
        rt_rw_id: area?.id,
        kelurahan: area?.kelurahan,
        rw_code: area?.rw_code,
        rt_code: area?.rt_code,
        exact_address: exactAddress || `Depan Pos Ronda ${area?.rt_code} ${area?.rw_code}`,
        reporter_name: floodNow ? "Anonim" : (reporterName || "Anonim"),
        reporter_phone: reporterPhone || "",
        photo_url_external: photoPreview
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setAiResult(data.ai_analysis);
        if (onReportSubmitted) onReportSubmitted(data.report);
      } else {
        alert("Gagal mengirim laporan: " + data.error);
      }
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const isFlood = mode === 'flood_now';
  const close = () => {
    setAiResult(null); setPhotoPreview(''); setPhotoStats(null); setDescription('');
    setWaterLevel(null); setVulnerable([]); setAccess(null); setPeopleCount(1); setAidNeeds([]);
    onClose();
  };
  const missing = [
    !selectedAreaId && 'RT',
    isFlood && !waterLevel && 'tinggi air',
    isFlood && !access && 'akses jalan',
    !isFlood && !photoPreview && 'foto',
  ].filter(Boolean);
  const canSubmit = !loading && missing.length === 0;
  const pill = (on, tone) => `rounded-xl border text-left transition-colors ${
    on ? (tone === 'rose' ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20' : 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20')
       : 'bg-white border-blue-200 text-blue-900 hover:bg-blue-50'
  }`;
  const input = "w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm text-blue-950 placeholder-blue-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  const label = "text-sm font-semibold text-blue-900 block mb-1.5";

  // type = nilai hazard_type di server; kategori baru memakai 'Other' + label-nya
  const categories = [
    { key: 'Clogged_Drain', type: 'Clogged_Drain', title: 'Saluran Tersumbat', sub: 'Lumpur / sedimen' },
    { key: 'Trash', type: 'Trash', title: 'Tumpukan Sampah', sub: 'Mulut saringan air' },
    { key: 'Flood', type: 'Flood', title: 'Genangan Air', sub: 'Rembesan / luapan' },
    { key: 'River_Rising', type: 'Other', title: 'Sungai Naik', sub: 'Air kali mulai tinggi' },
    { key: 'Embankment', type: 'Other', title: 'Tanggul Retak', sub: 'Tanggul / turap rusak' },
    { key: 'Pump_Gate', type: 'Other', title: 'Pompa / Pintu Air', sub: 'Rusak / tidak jalan' },
    { key: 'Fallen_Tree', type: 'Other', title: 'Pohon Tumbang', sub: 'Menutup aliran air' },
    { key: 'Broken_Drain', type: 'Other', title: 'Selokan Rusak', sub: 'Retak / amblas' },
    { key: 'Other', type: 'Other', title: 'Lainnya', sub: 'Tulis sendiri' },
  ];
  const selectedCategory = categories.find(c => c.key === hazardType) || categories[0];

  const flagStyle = aiResult
    ? (aiResult.ai_flag === 'Valid'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : aiResult.ai_flag === 'Mismatch'
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'bg-rose-50 border-rose-200 text-rose-800')
    : '';

  return (
    <div className={inline ? 'w-full max-w-3xl mx-auto' : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-blue-950/40'} onClick={inline ? undefined : (e) => { if (e.target === e.currentTarget) close(); }}>
      <div className={`relative w-full bg-gradient-to-b from-blue-50 to-sky-100 border border-blue-200 rounded-2xl ${inline ? 'p-5 shadow-sm' : 'max-w-xl max-h-[88vh] flex flex-col overflow-hidden shadow-lg'}`}>
        {/* Header */}
        <div className={`shrink-0 pb-3 border-b border-blue-100 ${inline ? '' : 'px-4 sm:px-5 pt-4 pr-14'}`}>
          <h3 className="text-lg font-bold text-blue-950">Lapor Bahaya</h3>
          <p className="text-sm text-blue-600">Ketua RT setempat akan memeriksa laporan Anda.</p>
        </div>
        {!inline && (
          <button
            type="button"
            onClick={close}
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 border border-blue-200 text-blue-700 shadow-sm hover:text-blue-950 hover:bg-white"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {aiResult ? (
          <div className={`space-y-4 ${inline ? 'py-6' : 'p-4 sm:p-5 overflow-y-auto min-h-0'}`}>
            <div className={`p-4 rounded-xl border ${flagStyle}`}>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-bold text-blue-950">{isFlood ? 'Laporan banjir diterima' : 'Hasil pemeriksaan foto'}</span>
                {!isFlood && (
                  <span className="px-2 py-0.5 rounded bg-white text-sm font-bold uppercase border border-current">
                    {aiResult.ai_flag} ({Math.round(aiResult.ai_confidence * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{aiResult.ai_reasoning}</p>
            </div>

            <p className="flex items-center gap-2 text-sm text-blue-700">
              <EyeOff className="w-4 h-4 shrink-0" />
              Wajah dan pelat kendaraan di foto disamarkan untuk publik.
            </p>

            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="text-sm text-blue-800 mb-2">
                Tingkat bahaya: <strong className="uppercase text-blue-950">{aiResult.ai_suggested_severity}</strong>
              </div>
              <h5 className="text-sm font-bold text-blue-950">Saran tindakan</h5>
              <pre className="text-sm text-blue-900 font-sans whitespace-pre-line mt-1 leading-relaxed">
                {aiResult.ai_suggested_action}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {onViewStatus && (
                <button onClick={() => { close(); onViewStatus(); }} className="px-5 py-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-sm transition-colors">
                  Lihat status laporan
                </button>
              )}
              <button onClick={close} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors">
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={inline ? 'py-5 space-y-5' : 'flex flex-col min-h-0 flex-1'}>
            <div className={inline ? 'space-y-5' : 'flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 space-y-4'}>
            {/* Pilih jenis laporan */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-blue-100/70">
              <button
                type="button"
                onClick={() => setMode('potential')}
                className={`flex flex-wrap items-center justify-center gap-x-2 px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
                  !isFlood ? 'bg-blue-600 text-white shadow-md' : 'text-blue-900 hover:bg-white/60'
                }`}
              >
                <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" aria-hidden="true" /> Potensi bahaya</span>
                <span className="text-[11px] font-medium opacity-90">(belum banjir)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('flood_now')}
                className={`flex flex-wrap items-center justify-center gap-x-2 px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isFlood ? 'bg-rose-600 text-white shadow-md' : 'text-blue-900 hover:bg-white/60'
                }`}
              >
                <span className="flex items-center gap-1.5"><Droplet className="w-4 h-4" aria-hidden="true" /> Banjir sekarang</span>
                <span className="text-[11px] font-medium opacity-90">(butuh bantuan)</span>
              </button>
            </div>

            {isFlood && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700">
                <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
                Nyawa terancam? Hubungi BPBD / Kelurahan atau 112.
              </div>
            )}

            {/* Contoh uji cepat, hanya di mode demo */}
            {isDemoMode && !isFlood && (
              <div className="bg-blue-50 p-3 rounded-xl">
                <span className={label}>Contoh uji cepat (demo)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {samplePhotos.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className="text-left text-xs p-2 rounded-lg bg-white hover:border-blue-500 border border-blue-100 text-blue-900 transition-colors"
                    >
                      <span className="font-semibold block truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Di RT mana?</label>
                <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)} className={`${input} ${!selectedAreaId ? 'border-amber-400' : ''}`}>
                  <option value="" disabled>Pilih RT / kelurahan</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.kelurahan} ({a.rt_code} {a.rw_code}) - {a.kecamatan}
                    </option>
                  ))}
                </select>
                {!selectedAreaId && <p className="mt-1 text-xs font-semibold text-amber-700">Pilih RT dulu supaya laporan sampai ke Ketua RT yang tepat.</p>}
              </div>
              <div>
                <label className={label}>Patokan lokasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Gang Sawo III depan musholla"
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            {!isFlood ? (
              <>
                {/* Kategori */}
                <div>
                  <span className={label}>Apa yang Anda lihat?</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map(c => (
                      <button key={c.key} type="button" onClick={() => setHazardType(c.key)} className={`p-2.5 ${pill(hazardType === c.key)}`}>
                        <span className="block text-sm font-semibold">{c.title}</span>
                        <span className={`block text-xs ${hazardType === c.key ? 'text-blue-100' : 'text-blue-600'}`}>{c.sub}</span>
                      </button>
                    ))}
                  </div>
                  {hazardType === 'Other' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        required
                        maxLength={80}
                        autoFocus
                        placeholder="Tulis apa yang Anda lihat, misal: Tanggul retak, pohon tumbang di kali"
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        className={input}
                        aria-label="Alasan lainnya"
                      />
                    </div>
                  )}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className={label}>Kondisinya</label>
                  <textarea
                    rows={2}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: saluran penuh sampah plastik, air tidak mengalir"
                    className={input}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Tinggi air */}
                <div>
                  <span className={label}>Setinggi apa air?</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WATER_OPTIONS.map(o => (
                      <button key={o.key} type="button" onClick={() => setWaterLevel(o.key)} className={`px-3 py-2 ${pill(waterLevel === o.key, 'rose')}`}>
                        <span className="block text-sm font-bold">{o.title}</span>
                        <span className={`block text-xs ${waterLevel === o.key ? 'text-rose-100' : 'text-blue-600'}`}>{o.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kelompok rentan */}
                <div>
                  <span className={label}>Ada warga yang perlu dibantu khusus?</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {VULNERABLE_OPTIONS.map(v => (
                      <button key={v} type="button" onClick={() => toggle(vulnerable, setVulnerable, v)} aria-pressed={vulnerable.includes(v)} className={`px-3 py-2 text-sm font-bold ${pill(vulnerable.includes(v), 'rose')}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Akses jalan + jumlah jiwa */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <span className={label}>Bagaimana jalan ke lokasi?</span>
                    <div className="grid grid-cols-3 gap-2">
                      {ACCESS_OPTIONS.map(o => (
                        <button key={o.key} type="button" onClick={() => setAccess(o.key)} className={`px-3 py-2 ${pill(access === o.key, 'rose')}`}>
                          <span className="block text-sm font-bold">{o.title}</span>
                          {o.sub && <span className={`block text-[11px] ${access === o.key ? 'text-rose-100' : 'text-blue-600'}`}>{o.sub}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className={label}>Jumlah jiwa</span>
                    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-2 py-2">
                      <button type="button" onClick={() => setPeopleCount(c => Math.max(1, c - 1))} className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center" aria-label="Kurangi">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-bold text-blue-950">{peopleCount}</span>
                      <button type="button" onClick={() => setPeopleCount(c => Math.min(500, c + 1))} className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center" aria-label="Tambah">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bantuan */}
                <div>
                  <span className={label}>Butuh bantuan apa?</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AID_OPTIONS.map(({ key, icon: Icon }) => (
                      <button key={key} type="button" onClick={() => toggle(aidNeeds, setAidNeeds, key)} aria-pressed={aidNeeds.includes(key)} className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold ${pill(aidNeeds.includes(key), 'rose')}`}>
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" /> {key}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Foto + kontak */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className={label}>Foto kondisi {isFlood && <span className="font-normal text-blue-500">(opsional)</span>}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={compressing}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={compressing}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-900 text-sm font-bold transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Dari galeri</span>
                  </button>
                </div>

                {/* Tempat pratinjau foto: muncul setelah foto dipilih */}
                {(photoPreview || compressing) && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden border border-blue-200 bg-blue-50 shrink-0">
                      {photoPreview && <img src={photoPreview} alt="Pratinjau foto" className="w-full h-full object-cover" />}
                      {compressing && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      {photoStats && (
                        <p className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {photoStats.isCompressed ? `${photoStats.compressedSizeKb} KB (dari ${photoStats.originalSizeKb} KB)` : `${photoStats.originalSizeKb} KB`}
                        </p>
                      )}
                      {photoPreview && (
                        <button type="button" onClick={() => { setPhotoPreview(''); setPhotoStats(null); }} className="font-semibold text-blue-700 hover:text-blue-950">
                          Hapus foto
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={isFlood ? '' : 'grid grid-cols-2 gap-3'}>
                {!isFlood && (
                  <div>
                    <label className={label}>Nama <span className="font-normal text-blue-500">(opsional)</span></label>
                    <input type="text" placeholder="Budi" value={reporterName} onChange={(e) => setReporterName(e.target.value)} className={input} />
                  </div>
                )}
                <div>
                  <label className={label}>No. HP <span className="font-normal text-blue-500">(opsional)</span></label>
                  <input type="text" placeholder="0812-xxxx-xxxx" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)} className={input} />
                </div>
              </div>
            </div>

            </div>

            {/* Aksi */}
            <div className={`flex items-center justify-between pt-3 border-t border-blue-100 ${inline ? '' : 'shrink-0 px-4 sm:px-5 pb-4'}`}>
              <span className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Data aman (UU PDP)
              </span>
              <div className="flex items-center gap-2">
                {missing.length > 0 && !loading && (
                  <span className="hidden sm:inline text-xs font-semibold text-amber-700">Belum diisi: {missing.join(', ')}</span>
                )}
                <button type="button" onClick={close} className="px-4 py-2 rounded-xl text-sm font-bold text-blue-700 hover:bg-blue-50">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    isFlood ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? (isFlood ? 'Mengirim...' : 'Memeriksa foto...') : (isFlood ? 'Kirim laporan banjir' : 'Kirim laporan')}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
