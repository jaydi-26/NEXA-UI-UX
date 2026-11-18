import React from 'react';
import { Sparkles, Bell, MapPin, ArrowRight } from 'lucide-react';

// Tingkat prioritas dari data server (urgency_level), cadangan: saran AI.
export const prioritasLaporan = (r) =>
  r.urgency_level || (r.ai_suggested_severity === 'Berat' ? 'Tinggi' : 'Sedang');

export const isBanjir = (r) => r.hazard_type === 'Flood' || r.report_mode === 'flood_now';

export const urutkanTerbaru = (reports = []) =>
  [...reports].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

const PRIO_STYLE = {
  Rendah: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Sedang: 'bg-amber-100 text-amber-800 border-amber-200',
  Tinggi: 'bg-orange-100 text-orange-800 border-orange-200',
  Kritis: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const statusLaporan = (status) => {
  if (status === 'Pending') return { label: 'Menunggu Tindakan', cls: 'text-amber-700' };
  if (status === 'Rejected') return { label: 'Ditolak', cls: 'text-slate-500' };
  return { label: 'Sudah Ditindaklanjuti', cls: 'text-emerald-700' };
};

export default function ReportFeed({ reports = [], onOpenHistory }) {
  const terbaru = urutkanTerbaru(reports).slice(0, 5);

  return (
    <section className="space-y-3" aria-labelledby="feed-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="feed-title" className="font-bold text-blue-950 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
            <span>Laporan Warga Terbaru ({terbaru.length})</span>
          </h3>
          <p className="text-xs text-blue-600 mt-0.5">
            Saluran/sampah diverifikasi RT (pencegahan). Banjir langsung ditangani NGO/Relawan.
          </p>
        </div>
        <button onClick={onOpenHistory}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 underline">
          <Bell className="w-3.5 h-3.5" aria-hidden="true" /> Semua riwayat
        </button>
      </div>

      {terbaru.length === 0 ? (
        <div className="p-5 text-center bg-white/70 rounded-2xl border border-blue-100 text-sm text-blue-700">
          Belum ada laporan masuk. Tekan <strong>Lapor Bahaya</strong> untuk mengirim laporan pertama.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {terbaru.map(r => {
            const banjir = isBanjir(r);
            const prio = prioritasLaporan(r);
            const st = statusLaporan(r.status);
            return (
              <li key={r.id} className="bg-white/80 border border-blue-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${banjir ? 'bg-rose-100 text-rose-900 border-rose-200' : 'bg-blue-100 text-blue-900 border-blue-200'}`}>
                    {r.hazard_type_label || r.hazard_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${PRIO_STYLE[prio] || PRIO_STYLE.Sedang}`}>
                    Prioritas: {prio}
                  </span>
                </div>
                <p className="font-bold text-blue-950 text-sm line-clamp-2">{r.description}</p>
                <p className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />
                  {r.kelurahan} ({r.rt_code} {r.rw_code})
                </p>
                <div className="pt-2 border-t border-blue-100 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-blue-900 inline-flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    {banjir ? 'Koordinasi RT & Relawan' : 'Verifikasi Pencegahan RT'}
                  </span>
                  <span className={`font-extrabold ${st.cls}`}>{st.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
