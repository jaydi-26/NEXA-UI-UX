import React, { useState } from 'react';
import { 
  Users, HeartHandshake, Anchor, Ambulance, 
  ShieldCheck, CheckCircle2, Droplets, Baby, Plus
} from 'lucide-react';

export default function NgoDashboard({ 
  evacuations = [], 
  areas = [], 
  onHandleEvacuation, 
  onCreateEvacuation 
}) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedEvac, setSelectedEvac] = useState(null);
  const [dispatchNotes, setDispatchNotes] = useState('Dikerahkan 2 Perahu Karet Motorik & 6 Personel SAR ke Posko RT.');
  
  // New Evac Form State
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id || 'area-km-04-02');
  const [waterDepth, setWaterDepth] = useState(75);
  const [hasVulnerable, setHasVulnerable] = useState(true);
  const [vulnerableDetails, setVulnerableDetails] = useState('2 Lansia dan 1 Bayi butuh perahu karet evakuasi');
  const [isNight, setIsNight] = useState(false);

  const handleConfirmDispatch = (e) => {
    e.preventDefault();
    if (!selectedEvac) return;
    onHandleEvacuation({
      id: selectedEvac.id,
      handled_by_ngo_id: 'user-ngo-tagana',
      dispatch_notes: dispatchNotes
    });
    setSelectedEvac(null);
  };

  const handleCreateNewEvac = (e) => {
    e.preventDefault();
    onCreateEvacuation({
      rt_rw_id: selectedAreaId,
      water_depth_cm: waterDepth,
      has_vulnerable_people: hasVulnerable,
      vulnerable_details: vulnerableDetails,
      is_night: isNight
    });
    setShowNewModal(false);
  };

  const pendingEvacs = evacuations.filter(e => e.status !== 'Dispatched');
  const dispatchedEvacs = evacuations.filter(e => e.status === 'Dispatched');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-indigo-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-blue-950">Dasbor Relawan & NGO</h2>
                <span className="text-sm bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-200">
                  Prioritas Evakuasi Banjir
                </span>
              </div>
              <p className="text-sm text-blue-800 mt-0.5">
                Data per RT, tanpa identitas pribadi warga.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat warga yang perlu dievakuasi</span>
          </button>
        </div>
      </div>

      {/* Main Evacuation Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Priority Queue Sorted by Transparent Formula */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-blue-950 text-base">Siapa yang perlu ditolong lebih dulu</h3>
            </div>
            <span className="text-sm text-blue-600">Diurutkan dari yang paling mendesak</span>
          </div>

          <div className="space-y-4">
            {evacuations.map(evac => {
              const isDispatched = evac.status === 'Dispatched';
              const isCritical = evac.priority_score >= 80;

              return (
                <div 
                  key={evac.id}
                  className={`bg-blue-50/80 border rounded-2xl p-5 shadow-sm transition-all ${
                    isCritical 
                      ? 'border-rose-200 shadow-rose-950/20' 
                      : 'border-blue-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-sm font-bold ${
                          isCritical 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          Skor Prioritas: {evac.priority_score} / 100
                        </span>
                        <span className="text-sm text-blue-600 font-semibold">
                          {evac.priority_level}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-blue-950">
                        {evac.kelurahan} ({evac.rt_code} {evac.rw_code})
                      </h4>
                    </div>

                    {isDispatched ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Relawan Ditugaskan ({evac.handled_by_name})
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedEvac(evac)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-600/30 transition-all"
                      >
                        <HeartHandshake className="w-4 h-4" />
                        <span>Kirim bantuan</span>
                      </button>
                    )}
                  </div>

                  {/* Conditions Breakdown: Depth & Vulnerable Group */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-blue-600 block text-xs">Tinggi air</span>
                        <span className="text-base font-extrabold text-blue-950">{evac.water_depth_cm} cm</span>
                        <span className="text-xs text-blue-600 block">
                          ({Math.round(evac.water_depth_cm * 0.45)} poin prioritas dari tinggi air)
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        evac.has_vulnerable_people ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Baby className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-blue-600 block text-xs">Warga yang perlu bantuan khusus</span>
                        <span className="font-bold text-blue-950 block">
                          {evac.has_vulnerable_people ? 'Ada (lansia / balita / sakit)' : 'Tidak Ada'}
                        </span>
                        <span className="text-xs text-rose-700">
                          {evac.has_vulnerable_people ? '+40 poin prioritas' : '+0 poin'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details & Dispatched notes */}
                  <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-blue-950">Situasi Lapangan:</strong>
                      <span>{evac.has_vulnerable_people ? 'Ada warga lansia, balita, atau sakit. Rincian diberikan lewat Ketua RT setelah tim ditugaskan.' : 'Tidak ada laporan warga yang perlu bantuan khusus.'}</span>
                    </div>
                    {isDispatched && evac.dispatch_notes && (
                      <div className="mt-2 pt-2 border-t border-blue-200 text-emerald-700">
                        <strong>Catatan Dispatch NGO:</strong> {evac.dispatch_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: NGO Assets & Guidelines */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-blue-950 text-sm flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-rose-600" />
              <span>Kesiapan tim NGO (data simulasi)</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <strong className="text-blue-950 block">Perahu Karet Motorik (SAR)</strong>
                  <span className="text-blue-600 text-xs">Posko Kalibata & Jatinegara</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                  8 Unit Siap
                </span>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <strong className="text-blue-950 block">Ambulans Gawat Darurat (PMI)</strong>
                  <span className="text-blue-600 text-xs">Siaga Medik & Tabung Oksigen</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                  3 Armada
                </span>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <strong className="text-blue-950 block">Relawan Terlatih Evakuasi Air</strong>
                  <span className="text-blue-600 text-xs">Tagana DKI & TRC Gabungan</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                  28 Personel
                </span>
              </div>
            </div>

            <p className="text-xs text-blue-600">Lokasi hanya per RT. Koordinasi langsung dengan Ketua RT di titik kumpul.</p>
          </div>
        </div>
      </div>

      {/* Dispatch Confirmation Modal */}
      {selectedEvac && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-blue-50 to-sky-100 border border-blue-200 rounded-2xl shadow-lg p-6 text-blue-900 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-blue-950 text-base">Kirim bantuan relawan</h3>
              </div>
              <button onClick={() => setSelectedEvac(null)} className="text-blue-600 hover:text-blue-950 text-sm font-semibold">Tutup</button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-3 text-sm">
              <div>
                <span className="text-blue-600 block mb-1">Wilayah yang dibantu</span>
                <p className="font-bold text-blue-950 text-sm bg-blue-50 p-2 rounded-lg">
                  {selectedEvac.kelurahan} ({selectedEvac.rt_code} {selectedEvac.rw_code}) - Kedalaman {selectedEvac.water_depth_cm} cm
                </p>
              </div>

              <div>
                <label className="text-blue-800 font-semibold block mb-1">Tim dan catatan untuk lapangan</label>
                <textarea
                  rows={3}
                  required
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-950 font-sans leading-relaxed text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setSelectedEvac(null)}
                  className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-200 text-blue-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold text-white shadow-lg shadow-rose-600/25"
                >
                  Kerahkan Bantuan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Input New Emergency Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-blue-50 to-sky-100 border border-blue-200 rounded-2xl shadow-lg p-6 text-blue-900 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <Anchor className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-blue-950 text-base">Catat situasi banjir darurat</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-blue-600 hover:text-blue-950 text-sm font-semibold">Tutup</button>
            </div>

            <form onSubmit={handleCreateNewEvac} className="space-y-3 text-sm">
              <div>
                <label className="text-blue-800 font-semibold block mb-1">Wilayah RT / RW</label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-950"
                >
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.kelurahan} ({a.rt_code} {a.rw_code}) - {a.kecamatan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-blue-800 font-semibold block mb-1">Tinggi air (cm)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={waterDepth}
                  onChange={(e) => setWaterDepth(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-950 font-bold text-amber-700"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-blue-900 font-semibold">
                  <input
                    type="checkbox"
                    checked={hasVulnerable}
                    onChange={(e) => setHasVulnerable(e.target.checked)}
                    className="rounded text-rose-500 focus:ring-0"
                  />
                  <span>Ada warga lansia / balita / sakit</span>
                </label>
                {hasVulnerable && (
                  <input
                    type="text"
                    value={vulnerableDetails}
                    onChange={(e) => setVulnerableDetails(e.target.value)}
                    placeholder="Contoh: 1 lansia stroke butuh tandu, 2 balita"
                    className="w-full bg-white border border-blue-200 rounded p-1.5 text-blue-950 text-sm"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-200 text-blue-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold text-white shadow-lg shadow-rose-600/25"
                >
                  Hitung Skor & Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
