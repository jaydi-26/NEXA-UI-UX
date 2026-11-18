import React, { useState, useEffect } from 'react';
import {
  Check, Truck, ClipboardCheck, RefreshCw, Camera, Shield, Hand, Users, ChevronRight
} from 'lucide-react';

const FLOOD_STEPS = [
  { key: 'sent', label: 'Terkirim' },
  { key: 'ai', label: 'Dianalisis AI' },
  { key: 'accepted', label: 'Diterima' },
  { key: 'onway', label: 'Menuju lokasi' },
  { key: 'done', label: 'Selesai' },
];

const PREVENT_STEPS = [
  { key: 'sent', label: 'Terkirim' },
  { key: 'ai', label: 'Dianalisis AI' },
  { key: 'accepted', label: 'Diterima RT' },
  { key: 'onway', label: 'Kerja bakti' },
  { key: 'review', label: 'Dicek RT' },
  { key: 'done', label: 'Selesai' },
];

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

// Nomor laporan singkat dari tanggal + id, mis. BJR-0316-014
const reportNumber = (r) => {
  const d = new Date(r.created_at);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const tail = String(r.id || '').replace(/\D/g, '').slice(-3).padStart(3, '0');
  return `BJR-${mm}${dd}-${tail}`;
};

// Tahap nyata laporan dari data server.
// Banjir: 0-4. Potensi bahaya (PREVENT): 0-5, ada tahap "Dicek RT" setelah warga mengunggah bukti.
function realStage(report, task, isFlood) {
  if (isFlood) {
    if (report.status === 'Closed' || task?.status === 'Completed') return 4;
    if (task?.status === 'In_Progress' || task?.status === 'Proof_Submitted' || report.status === 'Task_Created') return 3;
    if (report.status === 'Verified') return 2;
    if (report.ai_flag) return 1;
    return 0;
  }
  if (report.status === 'Closed' || task?.status === 'Completed') return 5;
  if (task?.status === 'Proof_Submitted') return 4;
  if (task?.status === 'In_Progress' || report.status === 'Task_Created') return 3;
  if (report.status === 'Verified') return 2;
  if (report.ai_flag) return 1;
  return 0;
}

export default function StatusLaporan({ reports = [], tasks = [], myReportIds = [], onReport }) {
  const mine = myReportIds
    .map(id => reports.find(r => r.id === id))
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const [selectedId, setSelectedId] = useState(null);
  const [demoBoost, setDemoBoost] = useState({}); // id -> tahap simulasi (demo)

  useEffect(() => {
    if (mine.length && !mine.some(r => r.id === selectedId)) setSelectedId(mine[0].id);
  }, [mine.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mine.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center bg-white border border-blue-100 rounded-2xl p-8 shadow-sm space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <ClipboardCheck className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-blue-950">Belum ada laporan</h2>
        <p className="text-sm text-blue-700">Laporan yang Anda kirim dari perangkat ini akan muncul di sini beserta perkembangannya.</p>
        <button
          onClick={onReport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
        >
          <Camera className="w-4 h-4" aria-hidden="true" /> Lapor Bahaya
        </button>
      </div>
    );
  }

  const report = mine.find(r => r.id === selectedId) || mine[0];
  const task = tasks.find(t => t.hazard_report_id === report.id);
  const isFlood = report.report_mode === 'flood_now';
  const steps = isFlood ? FLOOD_STEPS : PREVENT_STEPS;
  const rejected = report.status === 'Rejected';

  const maxStage = steps.length - 1;
  const actual = realStage(report, task, isFlood);
  const stage = Math.min(maxStage, Math.max(actual, demoBoost[report.id] ?? 0));
  const done = stage === maxStage;

  const sub = [
    fmtTime(report.created_at),
    report.ai_flag
      ? (report.ai_flag === 'Valid'
          ? `Urgensi ${(report.urgency_level || (report.ai_suggested_severity === 'Berat' ? 'Tinggi' : 'Sedang'))}`
          : 'Perlu dicek ulang')
      : 'Memeriksa foto',
    isFlood ? 'Warga RT + Tim Relawan' : `Ketua ${report.rt_code || 'RT'}`,
    ...(isFlood
      ? [done ? 'Selesai' : 'Sedang berjalan', done ? 'Selesai' : 'Menunggu']
      : [
          stage > 3 ? 'Selesai dikerjakan' : 'Dikerjakan warga',
          stage > 4 ? 'Hasil diterima' : 'Bukti diperiksa RT',
          done ? 'Selesai' : 'Menunggu',
        ]),
  ];

  const headline = rejected
    ? 'Laporan belum dapat diproses'
    : done
      ? (isFlood ? 'Bantuan sudah tiba' : 'Saluran sudah dibersihkan')
      : !isFlood && stage === 4
        ? 'Ketua RT sedang memeriksa hasil kerja bakti'
      : stage >= 3
        ? (isFlood ? 'Bantuan sedang menuju lokasi Anda' : 'Warga sedang kerja bakti di lokasi')
        : stage === 2
          ? 'Laporan Anda sudah diterima Ketua RT'
          : stage === 1
            ? 'Laporan Anda sedang diperiksa'
            : 'Laporan Anda terkirim';

  const tips = isFlood
    ? ['Matikan listrik di rumah.', 'Naik ke tempat yang lebih tinggi.', 'Siapkan dokumen dan obat.']
    : ['Jauhkan anak-anak dari area saluran.', 'Ingin ikut membantu? Buka Peta lalu pilih "Saya ikut" di Gotong royong.', 'Foto kondisi terbaru bila ada perubahan.'];

  const helpers = [
    { icon: Shield, bold: `Ketua ${report.rt_code || 'RT'}`, rest: stage >= 2 ? ' mengarahkan warga' : ' akan memeriksa laporan' },
    stage >= 3 && (isFlood
      ? { icon: Hand, bold: `${task?.volunteers_count || 12} warga`, rest: ' turun tangan' }
      : (task?.joined_count > 0
          ? { icon: Hand, bold: `${task.joined_count} warga`, rest: ' turun tangan' }
          : { icon: Hand, bold: 'Belum ada warga', rest: ' yang ikut, RT menunggu relawan' })),
    isFlood && stage >= 3 && { icon: Users, bold: 'Tim Relawan A', rest: ' membantu tambahan' },
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Judul */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold text-blue-950">Status Laporan Anda</h2>
          <p className="text-sm text-blue-600 mt-1">
            {report.hazard_type_label} &middot; {report.rt_code} {report.rw_code} {report.kelurahan} &middot; {fmtTime(report.created_at)} WIB
          </p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-white border border-blue-100 text-sm font-bold text-blue-950 shadow-sm">
          No. {reportNumber(report)}
        </span>
      </div>

      {mine.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {mine.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                r.id === report.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
            >
              {reportNumber(r)}
            </button>
          ))}
        </div>
      )}

      {/* Banner status */}
      <div className={`rounded-3xl p-6 text-white flex flex-wrap items-center justify-between gap-4 ${
        rejected ? 'bg-gradient-to-r from-slate-500 to-slate-600' : done ? 'bg-gradient-to-r from-emerald-500 to-emerald-700' : 'bg-gradient-to-r from-blue-500 to-blue-700'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            {done ? <Check className="w-7 h-7" aria-hidden="true" /> : <Truck className="w-7 h-7" aria-hidden="true" />}
          </div>
          <div>
            <h3 className="text-2xl font-extrabold leading-tight">{headline}</h3>
            {isFlood && !rejected && (
              <div className="mt-2 flex gap-2">
                {(report.aid_needs?.length ? report.aid_needs : ['Evakuasi']).map(a => (
                  <span key={a} className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold">{a === 'Obat / medis' ? 'Medis' : a}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {isFlood && !rejected && !done && stage >= 3 && (
          <div className="bg-white text-blue-950 rounded-2xl px-6 py-3 text-center">
            <div className="text-xs text-blue-600">Perkiraan tiba</div>
            <div className="text-3xl font-extrabold text-blue-700">&plusmn; 15 <span className="text-base">menit</span></div>
          </div>
        )}
      </div>

      {/* Pelacak tahap */}
      {!rejected && (
        <div className="bg-white border border-blue-100 rounded-3xl px-4 sm:px-6 py-6 shadow-sm">
          <div className="flex items-start overflow-x-auto pb-1">
            {steps.map((s, i) => {
              const isDone = i < stage || (i === stage && done);
              const isCurrent = i === stage && !done;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center text-center w-28 shrink-0">
                    <span className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDone ? 'bg-emerald-600 text-white'
                        : isCurrent ? 'bg-blue-600 text-white ring-8 ring-blue-100'
                        : 'bg-blue-100 text-blue-400'
                    }`}>
                      {isCurrent && i === 3 ? <Truck className="w-5 h-5" aria-hidden="true" /> : <Check className="w-5 h-5" aria-hidden="true" />}
                    </span>
                    <span className={`mt-2 text-sm font-bold ${isDone || isCurrent ? 'text-blue-950' : 'text-blue-400'}`}>{s.label}</span>
                    <span className={`text-xs ${isCurrent ? 'text-blue-600' : isDone ? 'text-blue-600' : 'text-blue-400'}`}>
                      {isDone || isCurrent ? sub[i] : 'Menunggu'}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-1 flex-1 min-w-[12px] mt-6 rounded-full ${i < stage ? 'bg-emerald-600' : 'bg-blue-100'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {!done && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDemoBoost(b => ({ ...b, [report.id]: Math.min(maxStage, stage + 1) }))}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-950"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" /> Simulasikan langkah berikut (demo)
              </button>
            </div>
          )}
        </div>
      )}

      {rejected && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 text-sm text-blue-800 shadow-sm">
          Ketua RT belum bisa memproses laporan ini. Anda bisa mengirim laporan baru dengan foto yang lebih jelas.
          <button onClick={onReport} className="ml-2 inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-950">
            Lapor lagi <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Info tambahan */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-blue-950 mb-3">Sambil menunggu</h3>
          <ul className="list-disc pl-5 space-y-2 text-blue-800">
            {tips.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-blue-950 mb-3">Yang membantu Anda</h3>
          <ul className="space-y-2.5 text-blue-800">
            {helpers.map(({ icon: Icon, bold, rest }) => (
              <li key={bold} className="flex items-center gap-2.5">
                <Icon className="w-5 h-5 text-blue-950 shrink-0" aria-hidden="true" />
                <span><strong className="text-blue-950">{bold}</strong>{rest}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
