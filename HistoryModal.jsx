import React, { useEffect } from 'react';
import { Bell, X, AlertTriangle, Droplets, Clock } from 'lucide-react';
import { prioritasLaporan, isBanjir, urutkanTerbaru, statusLaporan } from './ReportFeed';

const tgl = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(':', '.');
};

// Riwayat bencana: cuaca & pos air, evakuasi, dan SELURUH laporan warga.
export default function HistoryModal({ isOpen, onClose, reports = [], evacuations = [], bpbdPosts = [], bmkgForecast = {} }) {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const semua = urutkanTerbaru(reports);
  const headline = bmkgForecast?.active_warning?.headline || 'Waspada hujan sedang-lebat di Jakarta';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="history-title" onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="bubble w-full max-w-3xl max-h-[88vh] flex flex-col p-6" style={{ backgroundColor: 'rgba(255,255,255,.95)' }}>
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Bell className="w-6 h-6" aria-hidden="true" /></span>
            <div>
              <h2 id="history-title" className="font-display text-2xl text-blue-950">Riwayat Bencana</h2>
              <p className="text-xs text-blue-600">Peringatan cuaca, laporan warga, dan evakuasi relawan/NGO</p>
            </div>
          </div>
          <button autoFocus onClick={onClose} aria-label="Tutup riwayat" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase"><AlertTriangle className="w-4 h-4" aria-hidden="true" /> Cuaca & pos air terkini</div>
            <p className="text-sm font-bold text-blue-950">{headline}</p>
            {bpbdPosts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-blue-800 font-semibold">
                {bpbdPosts.slice(0, 3).map(p => (
                  <span key={p.id} className="bg-white px-2.5 py-1 rounded-lg border border-amber-200">{p.name}: <strong>{p.status} ({p.water_level_cm} cm)</strong></span>
                ))}
              </div>
            )}
          </div>

          <section className="space-y-2.5">
            <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-2"><Droplets className="w-4 h-4 text-rose-600" aria-hidden="true" /> Banjir & evakuasi ({evacuations.length})</h3>
            {evacuations.length === 0 && <p className="text-xs text-blue-600">Belum ada catatan evakuasi.</p>}
            {evacuations.map(ev => (
              <div key={ev.id} className="p-3.5 rounded-2xl bg-white border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-blue-950 text-sm">{ev.kelurahan} ({ev.rt_code} {ev.rw_code})</strong>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold">
                      Tinggi air: {ev.water_depth_cm !== null && ev.water_depth_cm !== undefined && ev.water_depth_cm !== '' ? `${ev.water_depth_cm} cm` : 'belum diketahui'}
                    </span>
                  </div>
                  {ev.vulnerable_details && <p className="text-blue-800">{ev.vulnerable_details}</p>}
                  {ev.dispatch_notes && <p className="text-emerald-700 font-semibold">Tindakan: {ev.dispatch_notes}</p>}
                </div>
                <span className={`px-3 py-1 rounded-lg font-extrabold ${ev.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {ev.status === 'Dispatched' ? `Ditangani${ev.handled_by_name ? ` (${ev.handled_by_name})` : ''}` : 'Menunggu evakuasi'}
                </span>
              </div>
            ))}
          </section>

          <section className="space-y-2.5">
            <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" aria-hidden="true" /> Semua laporan warga ({semua.length})</h3>
            {semua.length === 0 && <p className="text-xs text-blue-600">Belum ada laporan.</p>}
            {semua.map(r => {
              const st = statusLaporan(r.status);
              return (
                <div key={r.id} className="p-3.5 rounded-2xl bg-white border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 min-w-0 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-extrabold ${isBanjir(r) ? 'text-rose-700' : 'text-blue-950'}`}>{r.hazard_type_label || r.hazard_type}</span>
                      <span className="text-blue-700 font-semibold">• {r.kelurahan} ({r.rt_code} {r.rw_code})</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">Prioritas: {prioritasLaporan(r)}</span>
                    </div>
                    <p className="text-blue-800 break-words">{r.description}</p>
                    {r.created_at && <p className="text-blue-500">{tgl(r.created_at)}</p>}
                  </div>
                  <span className={`font-extrabold ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </section>
        </div>

        <button onClick={onClose} className="mt-2 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">Tutup</button>
      </div>
    </div>
  );
}
