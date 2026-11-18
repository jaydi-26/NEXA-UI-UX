import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

// Tombol hapus dengan konfirmasi di tempat (dua langkah)
export default function DeleteReportButton({ onDelete }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-blue-700 hover:text-rose-700 hover:bg-rose-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" /> Hapus
      </button>
    );
  }
  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-rose-700">Hapus laporan ini?</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-900 font-semibold hover:bg-blue-50"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
      >
        Ya, hapus
      </button>
    </div>
  );
}
