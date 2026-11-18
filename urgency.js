// Skor urgensi laporan banjir (0-100), dihitung dari aturan, bukan dari foto.
//   Tinggi air      : maks 45
//   Kelompok rentan : maks 40
//   Akses jalan     : maks 15
// Level: Rendah 0-39, Sedang 40-59, Tinggi 60-79, Kritis 80-100

const WATER = {
  ankle: { pts: 9,  note: '< 20 cm, setinggi mata kaki' },
  knee:  { pts: 27, note: '60 cm, setinggi lutut' },
  waist: { pts: 36, note: '90 cm, setinggi pinggang' },
  chest: { pts: 45, note: '> 120 cm, setinggi dada ke atas' },
};

const VULNERABLE = { Lansia: 20, Balita: 20, Sakit: 15, 'Ibu hamil': 15, Disabilitas: 15 };

const ACCESS = {
  easy: { pts: 3,  note: 'Bisa dilewati' },
  hard: { pts: 11, note: 'Sulit dilewati' },
  cut:  { pts: 15, note: 'Terputus, tidak bisa dilewati' },
};

const AID = ['Evakuasi', 'Makanan & air', 'Obat / medis', 'Perahu karet'];

export function sanitizeFloodDetail(raw = {}) {
  const water_level = WATER[raw.water_level] ? raw.water_level : null;
  const access = ACCESS[raw.access] ? raw.access : null;
  if (!water_level || !access) return null;
  const vulnerable = (Array.isArray(raw.vulnerable) ? raw.vulnerable : []).filter(v => v in VULNERABLE);
  const aid_needs = (Array.isArray(raw.aid_needs) ? raw.aid_needs : []).filter(a => AID.includes(a));
  const people_count = Math.min(500, Math.max(1, parseInt(raw.people_count, 10) || 1));
  return { water_level, vulnerable: [...new Set(vulnerable)], access, people_count, aid_needs: [...new Set(aid_needs)] };
}

export function computeFloodUrgency(d) {
  const water = WATER[d.water_level].pts;
  const vulnerable = Math.min(40, d.vulnerable.reduce((sum, v) => sum + VULNERABLE[v], 0));
  const access = ACCESS[d.access].pts;
  const score = water + vulnerable + access;
  const level = score >= 80 ? 'Kritis' : score >= 60 ? 'Tinggi' : score >= 40 ? 'Sedang' : 'Rendah';
  const joined = d.vulnerable.map(v => v.toLowerCase());
  return {
    score,
    level,
    breakdown: {
      water: { pts: water, max: 45, note: WATER[d.water_level].note },
      vulnerable: {
        pts: vulnerable,
        max: 40,
        note: joined.length ? `Ada ${joined.length > 1 ? joined.slice(0, -1).join(', ') + ' dan ' + joined[joined.length - 1] : joined[0]}` : 'Tidak ada kelompok rentan',
      },
      access: { pts: access, max: 15, note: ACCESS[d.access].note },
    },
  };
}

export function buildFloodDescription(d) {
  const water = { ankle: 'setinggi mata kaki', knee: 'setinggi lutut', waist: 'setinggi pinggang', chest: 'setinggi dada atau lebih' }[d.water_level];
  const who = d.vulnerable.length ? `, ada ${d.vulnerable.map(v => v.toLowerCase()).join(' dan ')}` : '';
  const road = { easy: 'Jalan masih bisa dilewati.', hard: 'Jalan sulit dilewati.', cut: 'Jalan terputus.' }[d.access];
  return `Banjir ${water}${who}. ${road}`;
}

export function buildFloodAiResult(d, urgency) {
  const severity = urgency.level === 'Kritis' || urgency.level === 'Tinggi' ? 'Berat' : urgency.level === 'Sedang' ? 'Sedang' : 'Ringan';
  return {
    ai_flag: 'Valid',
    ai_confidence: 0.9,
    ai_reasoning: `Urgensi ${urgency.level.toUpperCase()} (${urgency.score}/100), dihitung dari tinggi air, kelompok rentan, dan akses jalan.`,
    ai_suggested_severity: severity,
    ai_suggested_action: urgency.level === 'Kritis' || urgency.level === 'Tinggi'
      ? 'Hubungi BPBD / Kelurahan atau 112.\nDahulukan evakuasi kelompok rentan.\nMatikan listrik dan naik ke tempat yang lebih tinggi.'
      : 'Pantau ketinggian air.\nSiapkan tas darurat dan dokumen.\nHubungi Ketua RT bila air naik.',
    recommended_volunteers: Math.max(4, Math.min(20, Math.ceil(d.people_count * 1.5))),
    privacy_masked: true,
    processed_by: 'Skor urgensi NEXA',
  };
}

export const FIELD_CHECKS = ['checked', 'neighbor', 'unchecked'];
