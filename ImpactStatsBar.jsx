import React from 'react';

export default function ImpactStatsBar({ metrics = {} }) {
  const items = [
    { label: 'Saluran dibersihkan', value: metrics.completed_mitigations || 15, unit: 'titik' },
    { label: 'Warga terbantu', value: (metrics.estimated_residents_protected || 4800).toLocaleString('id-ID'), unit: 'jiwa' },
    { label: 'Relawan ikut', value: metrics.total_volunteers_mobilized || 93, unit: 'orang' },
  ];

  return (
    <section className="fade-up fade-up-3">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-bold text-blue-950">Hasil gotong royong</h3>
        <span className="text-xs text-blue-600">Data simulasi</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map(i => (
          <div key={i.label} className="lift bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-blue-600">{i.label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-blue-700">{i.value}</span>
              <span className="text-sm text-blue-600">{i.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
