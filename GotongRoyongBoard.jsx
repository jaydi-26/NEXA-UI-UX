import React, { useState } from 'react';
import { Flame, Users, Camera, CheckCircle2, Clock, RotateCcw, Timer } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

// Papan gotong royong untuk warga/relawan (langkah 5 alur PREVENT):
// ikut tugas yang dibagikan RT, lalu unggah foto bukti setelah selesai.
function TaskCard({ task, participantName, onJoin, onSubmitProof, horizontal = false, infoOnly = false }) {
  const [name, setName] = useState(participantName || '');
  const [proof, setProof] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const target = task.volunteers_count || 0;
  const joined = task.joined_count || 0;
  const waitingCheck = task.status === 'Proof_Submitted';

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await compressImage(file);
      if (res.dataUrl) setProof(res.dataUrl);
    } catch (err) {
      console.warn('Gagal memproses foto:', err);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const sendProof = async () => {
    if (!proof) return;
    setBusy(true);
    const ok = await onSubmitProof(task.id, proof, note);
    setBusy(false);
    if (ok) { setProof(null); setNote(''); }
  };

  return (
    <div className={`bg-white border border-blue-100 rounded-2xl p-4 shadow-sm ${infoOnly ? 'space-y-3' : horizontal ? 'grid md:grid-cols-2 gap-5 items-start' : 'space-y-3'}`}>
      <div className="space-y-3">
      <div>
        <strong className="text-blue-950 block text-sm">{task.title}</strong>
        <span className="text-xs text-blue-600">{task.kelurahan}</span>
        <span className="block mt-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold">
          {task.rain_forecast_note}
        </span>
      </div>

      <p className="text-xs text-blue-800 bg-blue-50 p-2.5 rounded-lg whitespace-pre-line">{task.sop_action_plan}</p>
      <p className="text-xs text-blue-600">Pakai sarung tangan dan sepatu boot. Berhenti jika hujan atau petir.</p>
      {infoOnly && (
        <p className="text-xs text-blue-600">Diverifikasi: <strong className="text-blue-900">{task.verified_by_name}</strong></p>
      )}
      </div>

      {!infoOnly && (
      <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-blue-600">
        <span>Diverifikasi: <strong className="text-blue-900">{task.verified_by_name}</strong></span>
        <span className="inline-flex items-center gap-1 text-blue-900 font-semibold">
          <Users className="w-3.5 h-3.5" aria-hidden="true" /> {joined}/{target} warga ikut
        </span>
      </div>

      {joined > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.joined_names.map((n, i) => (
            <span key={`${n}-${i}`} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">{n}</span>
          ))}
        </div>
      )}

      {task.redo_note && !waitingCheck && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong>Diminta ulang oleh RT:</strong> {task.redo_note}</span>
        </div>
      )}

      {waitingCheck ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-800">
          <Clock className="w-4 h-4" aria-hidden="true" /> Bukti terkirim, menunggu dicek Ketua RT
        </div>
      ) : !task.joined_by_me ? (
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Nama kamu"
            className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            disabled={!name.trim()}
            onClick={() => onJoin(task.id, name.trim())}
            className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
          >
            Saya ikut
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Kamu sudah ikut. Setelah selesai, unggah foto bukti.
          </div>
          {proof && <img src={proof} alt="Pratinjau foto bukti" className="w-full h-40 object-cover rounded-xl border border-blue-100" />}
          <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-900 font-bold text-sm cursor-pointer transition-colors">
            <Camera className="w-4 h-4" aria-hidden="true" /> {proof ? 'Ganti foto' : 'Ambil / pilih foto saluran bersih'}
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
          {proof && (
            <>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="Catatan singkat (opsional)"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                disabled={busy}
                onClick={sendProof}
                className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {busy ? 'Mengirim...' : 'Kirim bukti ke RT'}
              </button>
            </>
          )}
        </div>
      )}
      </div>
      )}
    </div>
  );
}

export default function GotongRoyongBoard({ tasks = [], participantName, onJoin, onSubmitProof, horizontal = false, infoOnly = false }) {
  const open = tasks.filter(t => ['In_Progress', 'Proof_Submitted'].includes(t.status));
  if (open.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-100">
        <h3 className="font-bold text-blue-950 text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          Kegiatan Gotong Royong Pencegahan Sebelum Hujan
        </h3>
        <span className="inline-flex items-center gap-1.5 text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-300 font-extrabold">
          <Timer className="w-3.5 h-3.5" aria-hidden="true" /> Target Sebelum Hujan BMKG
        </span>
      </div>
      <div className={horizontal ? 'grid gap-4' : 'grid md:grid-cols-2 gap-4'}>
        {open.map(task => (
          <TaskCard key={task.id} task={task} participantName={participantName} onJoin={onJoin} onSubmitProof={onSubmitProof} horizontal={horizontal} infoOnly={infoOnly} />
        ))}
      </div>
    </section>
  );
}
