import React, { useState } from 'react';
import DeleteReportButton from './DeleteReportButton';
import { Droplet, Users, ArrowRight, MapPin, AlertTriangle, Sparkles, CheckCircle2, ImageIcon, LifeBuoy, Package, Heart, Sailboat } from 'lucide-react';

const LEVELS = [
  { key: 'Rendah', range: '0-39', idle: 'bg-emerald-100 text-emerald-800', active: 'bg-emerald-500 text-white', ring: '#10b981' },
  { key: 'Sedang', range: '40-59', idle: 'bg-amber-100 text-amber-800', active: 'bg-amber-500 text-white', ring: '#f59e0b' },
  { key: 'Tinggi', range: '60-79', idle: 'bg-orange-100 text-orange-800', active: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30', ring: '#f97316' },
  { key: 'Kritis', range: '80-100', idle: 'bg-rose-100 text-rose-800', active: 'bg-rose-600 text-white shadow-lg shadow-rose-500/30', ring: '#e11d48' },
];

const AID_ICON = { 'Evakuasi': LifeBuoy, 'Makanan & air': Package, 'Obat / medis': Heart, 'Perahu karet': Sailboat };

const FIELD_CHECKS = [
  { key: 'checked', label: 'Sudah cek langsung' },
  { key: 'neighbor', label: 'Dikonfirmasi tetangga / RW' },
  { key: 'unchecked', label: 'Belum bisa dicek' },
];

function ScoreRing({ score, color }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-32 h-32 shrink-0" role="img" aria-label={`Skor urgensi ${score} dari 100`}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e0e7ff" strokeWidth="12" opacity="0.6" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, score) / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-blue-950 leading-none">{score}</span>
        <span className="text-xs text-blue-600 mt-1">dari 100</span>
      </div>
    </div>
  );
}

function Bar({ icon: Icon, tint, bar, text, title, pts, max, note }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-bold text-blue-950 text-sm">{title}</span>
          <span className="text-sm text-blue-600"><strong className={text}>{pts}</strong> / {max}</span>
        </div>
        <p className="text-xs text-blue-600">{note}</p>
        <div className="mt-1.5 h-2 rounded-full bg-blue-100 overflow-hidden">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.round((pts / max) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function FloodReportCard({ report, myRtId, onConfirm, onReject, onDelete }) {
  const [fieldCheck, setFieldCheck] = useState(null);
  const u = report.urgency;
  const level = LEVELS.find(l => l.key === u.level) || LEVELS[0];
  const b = u.breakdown;
  const photo = report.raw_photo_url || report.blurred_photo_url;
  const inMyArea = myRtId ? report.rt_rw_id === myRtId : null;
  const peopleCount = report.flood?.people_count;
  const aid = report.flood?.aid_needs || [];

  return (
    <div className="bg-white border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">{report.hazard_type_label}</span>
          <span className="text-sm text-blue-600">{report.rt_code} {report.rw_code} - {report.kelurahan}</span>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${level.idle}`}>
          <Sparkles className="w-3 h-3" aria-hidden="true" /> Urgensi {u.level.toUpperCase()}
        </span>
      </div>

      <div>
        <h4 className="font-bold text-blue-950 text-lg leading-snug">{report.description}</h4>
        <p className="text-xs text-blue-600 mt-1">
          Dilaporkan {new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
          {' \u00b7 '}Pelapor: {report.reporter_name || 'Anonim'}
          {peopleCount ? ` \u00b7 ${peopleCount} jiwa` : ''}
        </p>
        {report.exact_location?.address && (
          <p className="text-xs text-blue-600 mt-0.5">{report.exact_location.address}</p>
        )}
      </div>

      {/* Skor */}
      <div className="rounded-2xl border border-blue-100 p-4 flex flex-col sm:flex-row items-center gap-5">
        <ScoreRing score={u.score} color={level.ring} />
        <div className="flex-1 w-full space-y-3">
          <Bar icon={Droplet} tint="bg-blue-100 text-blue-600" bar="bg-blue-600" text="text-blue-600" title="Tinggi air" pts={b.water.pts} max={b.water.max} note={b.water.note} />
          <Bar icon={Users} tint="bg-rose-100 text-rose-600" bar="bg-rose-600" text="text-rose-600" title="Kelompok rentan" pts={b.vulnerable.pts} max={b.vulnerable.max} note={b.vulnerable.note} />
          <Bar icon={ArrowRight} tint="bg-amber-100 text-amber-600" bar="bg-amber-500" text="text-amber-600" title="Akses jalan" pts={b.access.pts} max={b.access.max} note={b.access.note} />
        </div>
      </div>

      {/* Foto (tempat foto) + bantuan + lokasi */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-blue-100 bg-blue-50 flex items-center justify-center">
          {photo ? (
            <img src={photo} alt="Foto laporan" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
          ) : (
            <span className="flex flex-col items-center text-[10px] text-blue-400 text-center leading-tight px-1">
              <ImageIcon className="w-5 h-5 mb-0.5" aria-hidden="true" /> Belum ada foto
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-bold text-blue-950">Bantuan yang dibutuhkan:</span>
          {aid.length === 0 && <span className="text-sm text-blue-600">Belum dipilih</span>}
          {aid.map(a => {
            const Icon = AID_ICON[a] || LifeBuoy;
            return (
              <span key={a} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">
                <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {a === 'Obat / medis' ? 'Medis' : a}
              </span>
            );
          })}
        </div>
        {inMyArea !== null && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${inMyArea ? 'text-emerald-700' : 'text-amber-700'}`}>
            {inMyArea ? <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> : <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />}
            {inMyArea ? `Lokasi cocok: wilayah ${report.rt_code}` : 'Di luar wilayah Anda'}
          </span>
        )}
      </div>

      {/* Skala level */}
      <div className="grid grid-cols-4 gap-2">
        {LEVELS.map(l => (
          <div key={l.key} className={`rounded-xl py-2.5 text-center ${l.key === u.level ? l.active : l.idle} ${l.key === u.level ? '' : 'opacity-80'}`}>
            <div className="text-xs font-extrabold uppercase">{l.key}</div>
            <div className="text-[11px] font-semibold opacity-90">{l.range}</div>
          </div>
        ))}
      </div>

      {/* Konfirmasi lapangan */}
      <div className="pt-3 border-t border-blue-100 space-y-3">
        <div className="text-sm font-bold text-blue-950">
          Konfirmasi kondisi di lokasi <span className="font-normal text-blue-600">(jika bisa)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FIELD_CHECKS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFieldCheck(fieldCheck === f.key ? null : f.key)}
              aria-pressed={fieldCheck === f.key}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
                fieldCheck === f.key ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200 text-blue-900 hover:bg-blue-50'
              }`}
            >
              {fieldCheck === f.key && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />} {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onDelete ? <DeleteReportButton onDelete={() => onDelete(report.id)} /> : <span />}
          <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => onReject(report.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Tandai tidak akurat
          </button>
          <button
            onClick={() => onConfirm(report.id, fieldCheck)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Konfirmasi laporan
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
