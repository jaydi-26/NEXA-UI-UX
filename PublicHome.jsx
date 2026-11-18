import React, { useRef, useState, useEffect } from 'react';
import PublicMap from './PublicMap';
import GotongRoyongBoard from './GotongRoyongBoard';
import ReportFeed from './ReportFeed';
import { Camera, BookOpen, X } from 'lucide-react';

// Kartu kaca. Miring mengikuti kursor; tilt dimatikan untuk peta & papan gotong royong agar tidak mengganggu.
function Bubble({ tilt = true, className = '', children, ...rest }) {
  const ref = useRef(null);
  const move = (e) => {
    if (!tilt || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`bubble ${tilt ? '' : 'bubble-lift'} ${className}`} {...rest}>
      {children}
    </div>
  );
}

const LANGKAH = [
  ['Tekan tombol Lapor Bahaya', 'Tombol biru di Beranda. Tidak perlu daftar atau masuk akun.'],
  ['Pilih keadaan saat ini', 'Potensi bahaya (saluran tersumbat, sampah menumpuk, sungai naik, tanggul retak) atau Banjir sekarang (air sudah menggenang atau masuk).'],
  ['Isi form sesuai keadaan', 'Pilih RT, tulis patokan lokasi, pilih apa yang Anda lihat, lalu ambil foto. Untuk banjir sekarang, foto boleh dilewati.'],
  ['Tekan Kirim laporan', 'Foto potensi bahaya diperiksa otomatis. Wajah dan pelat kendaraan di foto disamarkan untuk publik.'],
  ['Pantau di Status Laporan', 'Ketua RT memverifikasi laporan Anda. Laporan yang valid bisa menjadi tugas gotong royong warga.'],
];

function GuideModal({ onClose, onReport }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="bubble w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'rgba(255,255,255,.95)' }}>
        <div className="flex items-start justify-between gap-4">
          <h2 id="guide-title" className="font-display text-2xl text-blue-950">Cara melapor bahaya</h2>
          <button autoFocus onClick={onClose} aria-label="Tutup panduan" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <ol className="mt-5 space-y-4">
          {LANGKAH.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">{i + 1}</span>
              <div><div className="font-bold text-blue-950">{t}</div><p className="text-sm text-blue-800">{d}</p></div>
            </li>
          ))}
        </ol>
        <button onClick={() => { onClose(); onReport?.(); }} className="mt-6 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">Mulai lapor sekarang</button>
      </div>
    </div>
  );
}

export default function PublicHome({
  bpbdPosts = [], bmkgForecast = {},
  areas = [], reports = [], currentRole = 'PUBLIC',
  tasks = [], participantName, onJoin, onSubmitProof, onReport, onOpenHistory,
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const worst = [...bpbdPosts].filter(p => p.siaga_level).sort((a, b) => a.siaga_level - b.siaga_level)[0];
  const postName = worst?.name?.replace(/^Pos Pantau\s+/i, '');

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Kolom kiri: sambutan, tombol lapor & panduan, laporan warga terbaru */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="fade-up fade-up-1 px-1 pt-2">
          <h1 className="font-display text-4xl md:text-5xl xl:text-6xl leading-[1.08] text-blue-950">Welcome to NEXA</h1>
          <p className="mt-2 text-lg font-semibold text-blue-700">Siaga Bareng, Aman Bareng.</p>
        </div>

        <div className="fade-up fade-up-2 grid grid-cols-5 gap-4">
          <button onClick={onReport}
            className="bubble-sm cta-glow col-span-3 flex items-center gap-3 p-4 rounded-[28px] bg-gradient-to-br from-blue-500 to-blue-700 text-white text-left font-extrabold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center"><Camera className="w-6 h-6" aria-hidden="true" /></span>
            <span className="leading-tight text-lg">Lapor Bahaya<span className="block text-xs font-medium text-blue-100">Foto &amp; kirim, tanpa daftar</span></span>
          </button>
          <button onClick={() => setGuideOpen(true)}
            className="bubble-sm col-span-2 flex flex-col items-start justify-center gap-1 p-4 rounded-[28px] bg-slate-400/25 backdrop-blur-xl border border-white/60 text-slate-700 text-left font-bold shadow-inner focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
            <span className="leading-tight">Cara lapor<span className="block text-xs font-medium text-slate-500">Panduan singkat</span></span>
          </button>
        </div>

        <Bubble tilt={false} className="fade-up fade-up-3 p-6 bg-gradient-to-br from-blue-50/80 to-white/40">
          {worst && (
            <div className="text-base text-blue-800">Air di {postName}: <strong>{worst.water_level_cm} cm</strong></div>
          )}
          <div className={worst ? 'mt-5 pt-5 border-t border-blue-100' : ''}>
            <ReportFeed reports={reports} onOpenHistory={onOpenHistory} />
          </div>
        </Bubble>
      </div>

      {/* Kolom kanan: peta, lalu gotong royong */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        <Bubble tilt={false} className="fade-up fade-up-2 p-3">
          <PublicMap areas={areas} reports={reports} currentRole={currentRole} heightClass="h-[340px]" />
          <p className="px-3 pt-2 pb-1 text-xs text-blue-600">Angka = jumlah laporan per RT. Merah: banjir. Kuning: saluran tersumbat.</p>
        </Bubble>

        <Bubble tilt={false} className="fade-up fade-up-3 p-4">
          <GotongRoyongBoard tasks={tasks} participantName={participantName} onJoin={onJoin} onSubmitProof={onSubmitProof} horizontal infoOnly />
        </Bubble>
      </div>

      {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} onReport={onReport} />}
    </div>
  );
}
