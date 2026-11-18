import React from 'react';

// Satu lapis ombak: path digambar selebar 2x layar lalu digeser terus-menerus agar mulus
const WAVE_PATH =
  'M0,120 C150,60 300,180 450,120 C600,60 750,180 900,120 C1050,60 1200,180 1350,120 C1500,60 1650,180 1800,120 C1950,60 2100,180 2250,120 C2400,60 2550,180 2700,120 L2700,400 L0,400 Z';

function Layer({ className, fill, opacity, bottom, height }) {
  return (
    <div
      className="absolute left-0 w-full overflow-hidden"
      style={{ bottom, height, opacity }}
    >
      <svg
        className={`wave-layer ${className}`}
        viewBox="0 0 2700 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={WAVE_PATH} fill={fill} />
      </svg>
    </div>
  );
}

// Ombak bergerak di belakang seluruh halaman. Di-blur dan transparan supaya tidak mengganggu bacaan.
export default function WaveBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Wash biru sangat tipis di atas dasar putih */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f3f8ff 55%, #e3eefc 100%)' }} />

      {/* Gelembung cahaya lembut */}
      <div className="blob absolute -top-24 right-[10%] w-[420px] h-[420px] rounded-full bg-sky-300/30 blur-3xl" />
      <div className="blob-slow absolute top-1/3 -left-24 w-[360px] h-[360px] rounded-full bg-blue-300/25 blur-3xl" />

      <div className="absolute inset-x-0 bottom-0 h-[55vh] blur-[6px]">
        <Layer className="wave-a" fill="#93c5fd" opacity={0.35} bottom="-2%" height="75%" />
        <Layer className="wave-b" fill="#60a5fa" opacity={0.28} bottom="-6%" height="62%" />
        <Layer className="wave-c" fill="#3b82f6" opacity={0.22} bottom="-10%" height="48%" />
      </div>
    </div>
  );
}
