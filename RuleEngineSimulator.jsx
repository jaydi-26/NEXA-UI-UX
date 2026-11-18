import React, { useState } from 'react';
import { 
  Cpu, AlertTriangle, CheckCircle, Gauge, CloudRain
} from 'lucide-react';

export default function RuleEngineSimulator({ 
  ruleStatus, 
  bpbdPosts = [], 
  bmkgForecast = {}, 
  onSimulate, 
  onRefresh 
}) {
  const [selectedAreaId, setSelectedAreaId] = useState('area-km-04-02');
  const [isSimulating, setIsSimulating] = useState(false);

  // Find evaluated result for selected area
  const areaEvaluation = ruleStatus?.areas?.find(a => a.area_id === selectedAreaId) || ruleStatus?.areas?.[0];

  const handleToggleBpbd = async (val) => {
    setIsSimulating(true);
    await onSimulate({ toggle_bpbd_siaga: val, area_id: selectedAreaId });
    setIsSimulating(false);
  };

  const handleToggleBmkg = async (val) => {
    setIsSimulating(true);
    await onSimulate({ toggle_bmkg_warning: val, area_id: selectedAreaId });
    setIsSimulating(false);
  };

  const handleInjectReports = async () => {
    setIsSimulating(true);
    await onSimulate({ inject_verified_reports: true, area_id: selectedAreaId });
    setIsSimulating(false);
  };

  const cond1 = areaEvaluation?.conditions?.condition_1_bpbd;
  const cond2 = areaEvaluation?.conditions?.condition_2_bmkg;
  const cond3 = areaEvaluation?.conditions?.condition_3_internal;
  const trueCount = areaEvaluation?.true_conditions_count ?? 0;
  const isTriggered = areaEvaluation?.is_triggered ?? false;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600 border border-purple-200">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-blue-950">Simulasi peringatan dini banjir</h2>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold border border-purple-200">
                  Khusus demo
                </span>
              </div>
              <p className="text-xs text-blue-800 mt-0.5">
                Peringatan dikeluarkan jika minimal <strong>2 dari 3 kondisi</strong> terpenuhi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-blue-600">Pilih wilayah</label>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-blue-950"
            >
              {ruleStatus?.areas?.map(a => (
                <option key={a.area_id} value={a.area_id}>
                  {a.kelurahan} ({a.rt_code} {a.rw_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2-of-3 Condition Visualizer Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isTriggered 
          ? 'bg-rose-50 border-rose-200 shadow-lg shadow-rose-950/30' 
          : 'bg-white border-blue-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-blue-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-blue-600">Status peringatan wilayah</span>
              <strong className="text-blue-950 text-base">{areaEvaluation?.kelurahan} ({areaEvaluation?.rt_code} {areaEvaluation?.rw_code})</strong>
            </div>
            <p className="text-xs text-blue-800 mt-1">{areaEvaluation?.notification_message}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-blue-600 block">Syarat terpenuhi</span>
              <span className={`text-xl font-black ${
                isTriggered ? 'text-rose-600' : 'text-blue-800'
              }`}>
                {trueCount} / 3 Kondisi
              </span>
            </div>

            <div className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg ${
              isTriggered 
                ? 'bg-rose-600 text-white shadow-rose-600/30 ' 
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {isTriggered ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
              <span>{isTriggered ? 'TRIGGER AKTIF (KIRIM NOTIFIKASI RT)' : 'STATUS NORMAL'}</span>
            </div>
          </div>
        </div>

        {/* The 3 Conditions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          
          {/* Condition 1: BPBD Pos Pantau */}
          <div className={`p-4 rounded-xl border transition-all ${
            cond1?.satisfied 
              ? 'bg-amber-50 border-amber-200 text-amber-700' 
              : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Syarat 1: tinggi air sungai</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                cond1?.satisfied ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
              }`}>
                {cond1?.satisfied ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-blue-950 mb-1">Pos pantau berstatus Siaga 3, 2, atau 1</h4>
            <p className="text-xs leading-relaxed mb-3">{cond1?.explanation}</p>
            
            <div className="pt-2 border-t border-blue-200 flex gap-2">
              <button
                disabled={isSimulating}
                onClick={() => handleToggleBpbd(true)}
                className="flex-1 py-1 px-2 rounded bg-amber-100 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] border border-amber-200"
              >
                Set Siaga 2 (Bahaya)
              </button>
              <button
                disabled={isSimulating}
                onClick={() => handleToggleBpbd(false)}
                className="flex-1 py-1 px-2 rounded bg-blue-50 hover:bg-blue-200 text-blue-800 font-semibold text-[11px] border border-blue-200"
              >
                Set Normal
              </button>
            </div>
          </div>

          {/* Condition 2: BMKG CAP API */}
          <div className={`p-4 rounded-xl border transition-all ${
            cond2?.satisfied 
              ? 'bg-blue-50 border-blue-200 text-blue-800' 
              : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Syarat 2: peringatan cuaca BMKG</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                cond2?.satisfied ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-600'
              }`}>
                {cond2?.satisfied ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-blue-950 mb-1">Peringatan hujan lebat BMKG di kecamatan</h4>
            <p className="text-xs leading-relaxed mb-3">{cond2?.explanation}</p>
            
            <div className="pt-2 border-t border-blue-200 flex gap-2">
              <button
                disabled={isSimulating}
                onClick={() => handleToggleBmkg(true)}
                className="flex-1 py-1 px-2 rounded bg-blue-100 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200"
              >
                Set Warning Aktif
              </button>
              <button
                disabled={isSimulating}
                onClick={() => handleToggleBmkg(false)}
                className="flex-1 py-1 px-2 rounded bg-blue-50 hover:bg-blue-200 text-blue-800 font-semibold text-[11px] border border-blue-200"
              >
                Matikan Warning
              </button>
            </div>
          </div>

          {/* Condition 3: Internal Verified Reports */}
          <div className={`p-4 rounded-xl border transition-all ${
            cond3?.satisfied 
              ? 'bg-rose-50 border-rose-200 text-rose-700' 
              : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Syarat 3: laporan warga</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                cond3?.satisfied ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-600'
              }`}>
                {cond3?.satisfied ? 'TRUE' : 'FALSE'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-blue-950 mb-1">3 laporan banjir atau lebih dari warga (2 jam terakhir)</h4>
            <p className="text-xs leading-relaxed mb-3">{cond3?.explanation}</p>
            
            <div className="pt-2 border-t border-blue-200">
              <button
                disabled={isSimulating}
                onClick={handleInjectReports}
                className="w-full py-1 px-2 rounded bg-rose-100 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200"
              >
                + Suntik 3 Laporan Verified Simulasi
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* BPBD Pos Pantau Live Board */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-950 text-base">Tinggi air di pintu air Jakarta</h3>
          </div>
          <span className="text-xs text-blue-600">Diperbarui setiap 15 menit</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {bpbdPosts.map(post => {
            const isSiaga = post.siaga_level <= 3;
            return (
              <div 
                key={post.id}
                className={`p-3 rounded-xl border ${
                  isSiaga ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <strong className="text-blue-950 font-bold block">{post.name}</strong>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    post.siaga_level === 1 ? 'bg-rose-600 text-white' :
                    post.siaga_level === 2 ? 'bg-orange-600 text-blue-950' :
                    post.siaga_level === 3 ? 'bg-amber-500 text-blue-950 font-extrabold' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {post.status}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-blue-600 text-[11px]">Tinggi air</span>
                  <span className="text-base font-extrabold text-blue-950">{post.water_level_cm} cm</span>
                </div>

                <p className="text-[10px] text-blue-600 mt-1 truncate">
                  Aliran: {post.flow_destination}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* BMKG Weather Forecast Intervals */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-950 text-base">Prakiraan cuaca 3 jam ke depan (BMKG)</h3>
          </div>
          <span className="text-xs text-blue-600">{bmkgForecast.station || "Kemayoran"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {bmkgForecast.intervals?.map((slot, idx) => (
            <div key={idx} className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-blue-600">
                <span className="font-semibold text-blue-700">{slot.time_slot}</span>
                <span className="text-blue-950 font-bold">{slot.temperature}</span>
              </div>
              <h4 className="text-sm font-bold text-blue-950">{slot.weather}</h4>
              <div className="flex items-center justify-between text-[11px] text-blue-600 pt-1 border-t border-blue-200">
                <span>Peluang Hujan: <strong className="text-amber-700">{slot.rain_probability}</strong></span>
                <span>Kecepatan Angin: {slot.wind_speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
