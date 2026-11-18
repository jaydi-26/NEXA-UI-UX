import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, Send, Clock, 
  Users, Sparkles, CheckSquare, Upload, Flame, CheckCircle2, Camera, Check, Hand, MapPin, Bell, PhoneCall,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import FloodReportCard from './FloodReportCard';
import DeleteReportButton from './DeleteReportButton';

const FIELD_CHECKS = [
  { key: 'checked', label: 'Sudah cek langsung' },
  { key: 'neighbor', label: 'Dikonfirmasi tetangga / RW' },
  { key: 'unchecked', label: 'Belum bisa dicek' },
];

const FLOW_STEPS = ['Laporan masuk', 'Disetujui RT', 'Kerja bakti', 'Cek hasil', 'Selesai'];

const reportedAt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? `hari ini, ${time} WIB`
    : `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${time} WIB`;
};

const timeAgo = (ts) => {
  const min = Math.floor((Date.now() - ts) / 60000);
  return min < 1 ? 'baru saja' : `${min} menit lalu`;
};

// Kartu laporan di antrean verifikasi
function PendingReportCard({ report, severity, urgentFlood, onReject, onVerify, onApprove, onDelete }) {
  const [fieldCheck, setFieldCheck] = useState(null);
  const mismatch = report.ai_flag === 'Mismatch';
  const pct = Math.round((report.ai_confidence ?? 0) * 100);
  const photo = report.raw_photo_url || report.blurred_photo_url;

  return (
    <div className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${mismatch ? 'border-amber-300' : 'border-amber-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">{report.hazard_type_label}</span>
          <span className="text-sm text-blue-600">{report.rt_code} {report.rw_code} - {report.kelurahan}</span>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
          !report.ai_flag ? 'bg-blue-50 text-blue-600 border-blue-200'
            : mismatch ? 'bg-amber-100 text-amber-700 border-amber-200'
            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
        }`}>
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          {!report.ai_flag ? 'AI: belum dinilai' : `AI: ${mismatch ? 'Tidak cocok' : report.ai_flag}${pct > 0 ? ` (${pct}%)` : ''}`}
        </span>
      </div>

      <div>
        <h4 className="font-bold text-blue-950 text-base leading-snug">{report.description}</h4>
        {report.created_at && <p className="text-xs text-blue-600 mt-1">Dilaporkan {reportedAt(report.created_at)}</p>}
      </div>

      {report.ai_reasoning && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" /> Catatan pemeriksaan foto:
          </div>
          <p className="text-blue-800 mt-1 leading-relaxed">{report.ai_reasoning}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative rounded-xl overflow-hidden border border-blue-100 bg-blue-50 h-36">
          {photo && (
            <img src={photo} alt="Foto laporan" className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
          )}
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-800 text-white text-[11px] font-bold">Foto asli (khusus RT)</span>
        </div>
        <div className="rounded-xl border border-blue-100 p-3 text-sm space-y-1.5">
          <div>
            <div className="text-xs text-blue-600">Alamat</div>
            <div className="font-bold text-blue-950">{report.exact_location?.address || 'Alamat belum diisi'}</div>
          </div>
          <div className="border-t border-blue-100 pt-1.5 text-blue-600">Pelapor: {report.reporter_name || 'Anonim'}</div>
          <div className="text-blue-600">
            Tingkat bahaya (saran){' '}
            <strong className={severity === 'Berat' ? 'text-rose-700' : 'text-amber-700'}>{severity}</strong>
          </div>
        </div>
      </div>

      {urgentFlood && (
        <p className="text-xs font-bold text-rose-700">Banjir sedang terjadi. Hubungi BPBD / Kelurahan atau 112.</p>
      )}
      {mismatch && (
        <p className="text-xs font-semibold text-amber-700">Foto tidak cocok dengan laporan. Cek ulang sebelum mengerahkan warga.</p>
      )}

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
          <DeleteReportButton onDelete={() => onDelete(report.id)} />
          <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => onReject(report.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Tandai tidak akurat
          </button>
          <button
            onClick={() => onVerify(report.id, fieldCheck)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 transition-colors"
          >
            Verifikasi saja
          </button>
          <button
            onClick={() => onApprove(report)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Setuju &amp; ajak kerja bakti
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center text-blue-600">
      <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" aria-hidden="true" />
      <p className="font-semibold text-blue-950">{title}</p>
      <p className="text-sm text-blue-600 mt-1">{text}</p>
      {action}
    </div>
  );
}

export default function RtLeaderDashboard({
  loggedInUser, 
  reports = [], 
  tasks = [], 
  areas = [], 
  users = [],
  onVerifyReport, 
  onDeleteReport,
  onCreateTask, 
  onCompleteTask, 
  onRejectProof,
  onSubmitProof,
  onOpenTelegram,
  onSimulateWebhook,
  onCreateEvacuation
}) {
  const [taskModalReport, setTaskModalReport] = useState(null);
  const [sopPlan, setSopPlan] = useState('');
  const [deadlineMinutes, setDeadlineMinutes] = useState(105);
  const [volunteerCount, setVolunteerCount] = useState(8);
  const [afterPhotoModalTask, setAfterPhotoModalTask] = useState(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [afterPhotoCompressing, setAfterPhotoCompressing] = useState(false);
  const afterCameraInputRef = useRef(null);
  const afterGalleryInputRef = useRef(null);

  const handleAfterPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAfterPhotoCompressing(true);
    try {
      const res = await compressImage(file);
      if (res.dataUrl) {
        setAfterPhotoUrl(res.dataUrl);
      }
    } catch (err) {
      console.warn("Gagal memproses foto:", err);
    } finally {
      setAfterPhotoCompressing(false);
      e.target.value = '';
    }
  };

  // Multi RT Leader Switcher
  const rtLeaders = users.filter(u => u.role === 'RT_Leader');
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const currentLeader = rtLeaders.find(u => u.id === selectedLeaderId) || rtLeaders[0] || {
    id: "user-rt-bambang",
    full_name: "Pak Bambang Supriyadi",
    area_label: "RT 04 / RW 02 Kampung Melayu",
    telegram_subscribe_token: "TOKEN_RT04_KM89",
    rt_rw_id: "area-km-04-02"
  };

  // Filter pending reports needing verification
  const myRtId = loggedInUser?.rt_rw_id;
  const SEVERE_KEYWORDS = ['pinggang', 'dada', 'hanyut', 'terjebak', 'tenggelam', 'leher'];
  const isUrgentFlood = (r) =>
    r.hazard_type === 'Flood' && SEVERE_KEYWORDS.some(k => (r.description || '').toLowerCase().includes(k));
  const effectiveSeverity = (r) => (isUrgentFlood(r) ? 'Berat' : (r.ai_suggested_severity || 'Sedang'));
  const pendingReports = reports
    .filter(r => r.status === 'Pending' && (!myRtId || r.rt_rw_id === myRtId))
    .sort((a, b) => ((b.urgency?.score ?? -1) - (a.urgency?.score ?? -1)) || (isUrgentFlood(b) - isUrgentFlood(a)) || (new Date(b.created_at) - new Date(a.created_at)));
  // Status tugas berasal dari server: In_Progress (warga bekerja) -> Proof_Submitted (menunggu RT cek) -> Completed
  const myTasks = tasks.filter(t => !myRtId || t.rt_rw_id === myRtId);
  const workingTasks = myTasks.filter(t => t.status === 'In_Progress');
  const reviewTasks = myTasks.filter(t => t.status === 'Proof_Submitted');
  const activeTasks = [...workingTasks, ...reviewTasks];
  const completedTasks = myTasks.filter(t => t.status === 'Completed');

  // Laporan yang sudah dikonfirmasi RT
  const CONFIRMED_STATUSES = ['Verified', 'Task_Created', 'Closed'];
  const confirmedReports = reports.filter(r => CONFIRMED_STATUSES.includes(r.status) && (!myRtId || r.rt_rw_id === myRtId));
  const readyToMobilize = confirmedReports.filter(r => r.status === 'Verified' && !r.task_id);
  const floodPending = pendingReports.filter(r => r.urgency);
  const otherPending = pendingReports.filter(r => !r.urgency);
  const inMyArea = (r) => !myRtId || r.rt_rw_id === myRtId;
  const floodActive = reports.some(r => r.urgency && ['Pending', 'Verified', 'Task_Created'].includes(r.status) && inMyArea(r));
  const confirmedFlood = confirmedReports
    .filter(r => r.urgency && r.status !== 'Closed')
    .sort((a, b) => b.urgency.score - a.urgency.score);
  const topFlood = confirmedFlood[0];
  const WATER_CM = { ankle: 15, knee: 60, waist: 90, chest: 120 };
  const requestExtraHelp = () => {
    if (!topFlood || !onCreateEvacuation) return;
    onCreateEvacuation({
      rt_rw_id: topFlood.rt_rw_id,
      water_depth_cm: WATER_CM[topFlood.flood?.water_level] ?? 60,
      has_vulnerable_people: (topFlood.flood?.vulnerable || []).length > 0,
      vulnerable_details: topFlood.description,
      is_night: false
    });
  };

  // Alur pencegahan: langkah yang sedang berjalan (0-based); 5 = semua selesai
  let flowIdx = 0;
  if (reviewTasks.length > 0) flowIdx = 3;
  else if (activeTasks.length > 0) flowIdx = 2;
  else if (confirmedReports.length > 0 && completedTasks.length === 0) flowIdx = 2;
  else if (completedTasks.length > 0) flowIdx = 5;
  else if (reports.length > 0) flowIdx = 1;

  // Langkah yang sedang dilihat. Ikut maju otomatis hanya jika RT sedang melihat langkah aktif.
  const currentStep = Math.min(flowIdx, FLOW_STEPS.length - 1);
  const [viewStep, setViewStep] = useState(currentStep);
  const prevCurrent = useRef(currentStep);
  useEffect(() => {
    setViewStep(v => (v === prevCurrent.current ? currentStep : v));
    prevCurrent.current = currentStep;
  }, [currentStep]);
  const goStep = (i) => setViewStep(Math.max(0, Math.min(FLOW_STEPS.length - 1, i)));
  const activeTab = viewStep <= 1 ? 'REPORTS' : 'COORD';

  const handleOpenTaskCreation = (report) => {
    setTaskModalReport(report);
    setSopPlan(report.ai_suggested_action || '');
    setVolunteerCount(report.recommended_volunteers || 6);
  };

  const handleConfirmTask = (e) => {
    e.preventDefault();
    if (!taskModalReport) return;
    onCreateTask({
      hazard_report_id: taskModalReport.id,
      title: `Pembersihan Gotong Royong: ${taskModalReport.hazard_type_label} - ${taskModalReport.kelurahan}`,
      sop_action_plan: sopPlan,
      deadline_minutes: deadlineMinutes,
      volunteers_count: volunteerCount
    });
    setTaskModalReport(null);
  };

  // Foto hasil diunggah -> masuk ke langkah "Cek hasil", belum dianggap selesai
  // RT ikut turun tangan dan mengunggah bukti sendiri (jalur yang sama dengan warga, disimpan di server)
  const handleConfirmCompleteTask = async (e) => {
    e.preventDefault();
    if (!afterPhotoModalTask || !afterPhotoUrl) return;
    const ok = await onSubmitProof?.(afterPhotoModalTask.id, afterPhotoUrl, '');
    if (!ok) return;
    setAfterPhotoModalTask(null);
    setAfterPhotoUrl('');
    goStep(3);
  };

  // Langkah 6: RT memeriksa bukti. Terima = tugas & laporan ditutup. Minta ulang = kembali ke warga.
  const acceptResult = (task) => {
    onCompleteTask({ taskId: task.id });
  };

  const requestRedo = (task) => {
    const note = window.prompt('Catatan untuk warga (opsional), mis. "Bagian ujung saluran masih tersumbat"', '');
    if (note === null) return;
    onRejectProof?.({ taskId: task.id, note });
    goStep(2);
  };

  const openFinishModal = (task) => setAfterPhotoModalTask(task);

  const resultAside = (
    <aside className="space-y-3">
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-3">
        <div>
          <h3 className="font-bold text-blue-950 text-base">Hasil gotong royong</h3>
          <p className="text-xs text-blue-600">Tampil di Beranda setelah Anda terima</p>
        </div>
        <div className="rounded-xl border border-blue-100 p-4">
          <div className="text-xs text-blue-600">Saluran dibersihkan</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            {reviewTasks.length > 0 && (
              <>
                <span className="text-xl font-bold text-blue-400 line-through">{completedTasks.length}</span>
                <span className="text-blue-400">&rarr;</span>
              </>
            )}
            <span className="text-4xl font-extrabold text-blue-600">{completedTasks.length + (reviewTasks.length > 0 ? 1 : 0)}</span>
            <span className="text-sm font-semibold text-blue-600">titik</span>
          </div>
        </div>
        {reviewTasks.length > 0 && (
          <div className="rounded-xl border border-blue-100 p-4">
            <div className="text-xs text-blue-600">Relawan ikut</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-blue-600">{reviewTasks[0].volunteers_count || 0}</span>
              <span className="text-sm font-semibold text-blue-600">orang</span>
            </div>
          </div>
        )}
        {reviewTasks.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Warga lain bisa melihat hasilnya di Beranda.
          </p>
        )}
      </div>
    </aside>
  );

  // ---------- Isi tiap langkah ----------
  const stepContent = [
    // 0: Laporan masuk
    (
      <div key="s0" className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {floodPending.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-blue-950 text-lg">Laporan banjir masuk</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  {floodPending.length} perlu keputusan
                </span>
              </div>
              {floodPending.map(report => (
                <FloodReportCard
                  key={report.id}
                  report={report}
                  myRtId={myRtId}
                  onConfirm={(id, fieldCheck) => onVerifyReport(id, 'Verified', fieldCheck)}
                  onReject={(id) => onVerifyReport(id, 'Rejected')}
                  onDelete={(id) => onDeleteReport?.(id)}
                />
              ))}
            </section>
          )}

          {(otherPending.length > 0 || floodPending.length === 0) && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-blue-950 text-base">Antrean Verifikasi Laporan Warga</h3>
                {otherPending.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {otherPending.length} menunggu
                  </span>
                )}
              </div>
              {otherPending.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center text-blue-600">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-semibold text-blue-950">Semua laporan sudah diperiksa</p>
                  <p className="text-sm text-blue-600 mt-1">Tidak ada laporan yang menunggu.</p>
                </div>
              ) : (
                otherPending.map(report => (
                  <PendingReportCard
                    key={report.id}
                    report={report}
                    severity={effectiveSeverity(report)}
                    urgentFlood={isUrgentFlood(report)}
                    onReject={(id) => onVerifyReport(id, 'Rejected')}
                    onVerify={(id, fieldCheck) => onVerifyReport(id, 'Verified', fieldCheck)}
                    onApprove={handleOpenTaskCreation}
                    onDelete={(id) => onDeleteReport?.(id)}
                  />
                ))
              )}
            </section>
          )}
        </div>
        {resultAside}
      </div>
    ),

    // 1: Disetujui RT
    (
      <section key="s1" className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-blue-950 text-base">Laporan yang sudah Anda setujui</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            {confirmedReports.length}
          </span>
        </div>
        {confirmedReports.length === 0 ? (
          <EmptyState
            title="Belum ada laporan yang disetujui"
            text="Laporan yang Anda verifikasi atau setujui akan muncul di sini."
            action={pendingReports.length > 0 && (
              <button onClick={() => goStep(0)} className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">
                Buka antrean ({pendingReports.length})
              </button>
            )}
          />
        ) : (
          <div className="space-y-3">
            {confirmedReports.map(report => {
              const ready = report.status === 'Verified' && !report.task_id;
              const closed = report.status === 'Closed';
              return (
                <div key={report.id} className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">{report.hazard_type_label}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        closed ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : ready ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {closed ? 'Selesai' : ready ? 'Belum digerakkan' : 'Kerja bakti berjalan'}
                      </span>
                    </div>
                    <h4 className="font-bold text-blue-950 text-sm mt-1">{report.description}</h4>
                    <p className="text-xs text-blue-600">{report.exact_location?.address || `${report.rt_code} ${report.rw_code} - ${report.kelurahan}`}</p>
                  </div>
                  {ready && (
                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      <DeleteReportButton onDelete={() => onDeleteReport?.(report.id)} />
                      <button
                        onClick={() => handleOpenTaskCreation(report)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Ajak kerja bakti</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    ),

    // 2: Kerja bakti
    (
      <div key="s2" className="space-y-4">
        {topFlood && (
          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <h3 className="font-bold text-blue-950 text-lg">Tindakan RT/RW</h3>
              <p className="text-xs text-blue-600">Warga bergerak lebih dulu</p>
            </div>

            <button
              onClick={() => handleOpenTaskCreation(topFlood)}
              className="w-full flex items-center gap-3 text-left p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-colors"
            >
              <span className="w-11 h-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Hand className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block font-extrabold text-base">Arahkan warga turun tangan</span>
                <span className="block text-xs text-emerald-50 mt-0.5">Warga {topFlood.rt_code} siap membantu</span>
              </span>
            </button>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
              <MapPin className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" aria-hidden="true" />
              <span className="font-bold text-emerald-800">Titik kumpul: Pos Ronda {topFlood.rt_code}</span>
            </div>

            <button
              onClick={requestExtraHelp}
              className="w-full flex items-center gap-3 text-left p-3 rounded-2xl bg-white hover:bg-blue-50 border border-blue-200 transition-colors"
            >
              <span className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block font-bold text-blue-900 text-sm">Minta tambahan Relawan / NGO</span>
                <span className="block text-xs text-blue-600">Jika tenaga warga kurang</span>
              </span>
            </button>

            <button
              onClick={() => onOpenTelegram(currentLeader.telegram_subscribe_token)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-sm font-bold text-blue-800 transition-colors"
            >
              <Bell className="w-4 h-4" aria-hidden="true" /> Kirim pengumuman ke warga
            </button>

            <a href="tel:112" className="flex items-center gap-2 text-sm font-bold text-rose-700 hover:text-rose-800">
              <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" /> Banjir besar? Hubungi BPBD / 112
            </a>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-950 text-base">Tugas kerja bakti</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            {activeTasks.length} aktif
          </span>
        </div>

        {activeTasks.length === 0 ? (
          <EmptyState
            title="Belum ada tugas aktif"
            text="Tugas muncul di sini setelah Anda membagikannya ke warga. Warga yang ikut akan mengunggah bukti."
            action={readyToMobilize.length > 0 && (
              <button onClick={() => goStep(1)} className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">
                {readyToMobilize.length} laporan siap digerakkan
              </button>
            )}
          />
        ) : (
          <div className="space-y-4">
            {activeTasks.map(task => {
              const inReview = task.status === 'Proof_Submitted';
              return (
                <div key={task.id} className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                        Target Pre-Rain BMKG
                      </span>
                      <h4 className="font-bold text-blue-950 text-sm mt-1">{task.title}</h4>
                      <p className="text-sm text-blue-600">{task.exact_address}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200">
                      {inReview ? 'Menunggu dicek' : 'Warga bekerja'}
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-white p-3 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      <div>
                        <strong className="block text-blue-950">Hujan lebat diperkirakan:</strong>
                        <span className="text-xs text-amber-700">{task.rain_forecast_note}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>{task.joined_count || 0}/{task.volunteers_count || 0} warga ikut</span>
                    </div>
                  </div>

                  {(task.joined_names || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {task.joined_names.map((n, i) => (
                        <span key={`${n}-${i}`} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-blue-700 border border-blue-200">{n}</span>
                      ))}
                    </div>
                  )}

                  {task.redo_note && !inReview && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <strong>Diminta ulang:</strong> {task.redo_note}
                    </div>
                  )}

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-800">
                    <strong className="text-blue-950 block mb-1">Langkah kerja bakti</strong>
                    <pre className="whitespace-pre-line font-sans text-sm text-blue-800 leading-relaxed">
                      {task.sop_action_plan}
                    </pre>
                  </div>

                  {inReview ? (
                    <button
                      onClick={() => goStep(3)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-900 font-bold text-sm transition-colors"
                    >
                      Bukti sudah masuk. Cek hasilnya
                    </button>
                  ) : (
                    <button
                      onClick={() => openFinishModal(task)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bukti dari warga belum ada? Unggah foto sendiri</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    ),

    // 3: Cek hasil
    (
      <div key="s3" className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
        <div className="space-y-4 min-w-0">
          {reviewTasks.length === 0 ? (
            <EmptyState
              title="Belum ada hasil yang perlu dicek"
              text="Hasil muncul di sini setelah warga (atau Anda) mengunggah foto bukti saluran bersih."
              action={workingTasks.length > 0 && (
                <button onClick={() => goStep(2)} className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">
                  Ke Kerja bakti ({workingTasks.length} berjalan)
                </button>
              )}
            />
          ) : (
            reviewTasks.map(task => {
              return (
                <div key={task.id} className="bg-white border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">Periksa hasil kerja bakti</span>
                    <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Menunggu Anda</span>
                  </div>
                  <h4 className="font-bold text-blue-950 text-lg leading-snug">{task.title}</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative rounded-xl overflow-hidden border border-blue-100 bg-blue-50 h-40">
                      {task.before_photo_url && (
                        <img src={task.before_photo_url} alt="Foto sebelum dibersihkan" className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-800 text-white text-[11px] font-bold">Sebelum</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-blue-100 bg-blue-50 h-40">
                      <img src={task.proof_photo_url} alt="Foto sesudah dibersihkan" className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-700 text-white text-[11px] font-bold">Sesudah</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" /> {task.joined_count || 0} warga ikut
                    </span>
                    <span className="text-blue-600">
                      Diunggah oleh {task.proof_submitted_by || 'warga'}{task.proof_submitted_at ? `, ${timeAgo(new Date(task.proof_submitted_at).getTime())}` : ''}
                    </span>
                  </div>
                  {task.proof_note && (
                    <p className="text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-2.5">Catatan: {task.proof_note}</p>
                  )}

                  <div className="pt-3 border-t border-blue-100 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => requestRedo(task)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      Minta ulang
                    </button>
                    <button
                      onClick={() => acceptResult(task)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Terima hasil
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {resultAside}
      </div>
    ),

    // 4: Selesai
    (
      <section key="s4" className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-blue-950 text-base">Gotong royong selesai</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            {completedTasks.length}
          </span>
        </div>
        {completedTasks.length === 0 ? (
          <EmptyState
            title="Belum ada kerja bakti yang selesai"
            text="Tugas yang hasilnya sudah Anda terima akan tercatat di sini dan tampil di Beranda."
          />
        ) : (
          <div className="space-y-2">
            {completedTasks.map(t => (
              <div key={t.id} className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <strong className="text-blue-900 block">{t.title}</strong>
                  <span className="text-xs text-emerald-600">Selesai sebelum hujan turun</span>
                </div>
                <span className="shrink-0 text-xs text-blue-600">{t.joined_count ?? t.volunteers_count} warga ikut</span>
              </div>
            ))}
          </div>
        )}
      </section>
    ),
  ];

  return (
    <div className="space-y-6">
      {/* Banner: info wilayah RT */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-blue-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-blue-950">Dasbor Ketua RT</h2>
              <span className="text-sm bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                Verified Leader
              </span>
              {floodActive && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wide bg-rose-600 text-white px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> BANJIR AKTIF
                </span>
              )}
              {rtLeaders.length > 1 && (
                <select
                  value={currentLeader.id}
                  onChange={(e) => setSelectedLeaderId(e.target.value)}
                  className="bg-blue-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-sm text-emerald-700 font-semibold focus:outline-none"
                >
                  {rtLeaders.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.area_label})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-sm text-blue-800 mt-0.5">
              Wilayah: <strong className="text-emerald-700">{currentLeader.full_name}</strong> — <strong>{currentLeader.area_label}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Tab utama: ikut langkah yang sedang dilihat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => activeTab !== 'REPORTS' && goStep(0)}
          aria-current={activeTab === 'REPORTS' ? 'page' : undefined}
          className={`flex items-center gap-3 text-left p-4 rounded-2xl border-2 transition-all ${
            activeTab === 'REPORTS' ? 'bg-blue-50 border-blue-600 shadow-md shadow-blue-500/10' : 'bg-white border-blue-100 hover:border-blue-300'
          }`}
        >
          <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
            activeTab === 'REPORTS' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
          }`}>1</span>
          <span className="flex-1 font-bold text-blue-950 text-base">Lihat Laporan</span>
          {pendingReports.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {pendingReports.length} menunggu
            </span>
          )}
        </button>

        <button
          onClick={() => activeTab !== 'COORD' && goStep(2)}
          aria-current={activeTab === 'COORD' ? 'page' : undefined}
          className={`flex items-center gap-3 text-left p-4 rounded-2xl border-2 transition-all ${
            activeTab === 'COORD' ? 'bg-blue-50 border-blue-600 shadow-md shadow-blue-500/10' : 'bg-white border-blue-100 hover:border-blue-300'
          }`}
        >
          <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
            activeTab === 'COORD' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
          }`}>2</span>
          <span className="flex-1 font-bold text-blue-950 text-base">Koordinasi Warga</span>
          {reviewTasks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {reviewTasks.length} dicek
            </span>
          )}
        </button>
      </div>

      {/* Alur pencegahan (garis waktu vertikal di samping) + isi langkah */}
      <div className="grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[200px_minmax(0,1fr)] gap-4 sm:gap-6 items-start">
        <nav aria-label="Alur pencegahan" className="sticky top-20 bg-white border border-blue-100 rounded-2xl p-2.5 sm:p-4 shadow-sm">
          <div className="hidden sm:block text-xs font-bold text-blue-600 mb-3">Alur pencegahan &middot; sebelum banjir</div>
          <ol>
            {FLOW_STEPS.map((label, i) => {
              const done = i < flowIdx;
              const current = i === flowIdx;
              const viewing = i === viewStep;
              const last = i === FLOW_STEPS.length - 1;
              return (
                <li key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => goStep(i)}
                      aria-label={`Langkah ${i + 1}: ${label}`}
                      aria-current={viewing ? 'step' : undefined}
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                        done ? 'bg-emerald-600 text-white'
                          : current ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                          : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
                      } ${viewing ? 'outline outline-2 outline-offset-2 outline-blue-600' : ''}`}
                    >
                      {done ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
                    </button>
                    {!last && <div className={`w-1 flex-1 min-h-[28px] my-1 rounded-full ${done ? 'bg-emerald-600' : 'bg-blue-100'}`} />}
                  </div>
                  <button
                    onClick={() => goStep(i)}
                    className={`hidden sm:block text-left pt-1 pb-3 text-sm leading-tight ${viewing ? 'font-extrabold' : 'font-semibold'} ${
                      done ? 'text-emerald-700' : current ? 'text-amber-700' : 'text-blue-500'
                    }`}
                  >
                    {label}
                    {current && <span className="block text-[11px] font-medium text-amber-600 mt-0.5">Sedang berjalan</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="space-y-4 min-w-0">
          {/* Navigasi antar langkah */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => goStep(viewStep - 1)}
              disabled={viewStep === 0}
              className="inline-flex items-center gap-1 pl-2 pr-3 py-1.5 rounded-lg border border-blue-200 bg-white text-sm font-semibold text-blue-900 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Kembali
            </button>
            <span className="text-sm text-blue-600">
              Langkah {viewStep + 1} dari {FLOW_STEPS.length}: <strong className="text-blue-950">{FLOW_STEPS[viewStep]}</strong>
            </span>
            <div className="ml-auto flex items-center gap-2">
              {viewStep !== currentStep && (
                <button
                  onClick={() => goStep(currentStep)}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-200 text-xs font-bold text-amber-800 transition-colors"
                >
                  Ke langkah aktif
                </button>
              )}
              <button
                onClick={() => goStep(viewStep + 1)}
                disabled={viewStep === FLOW_STEPS.length - 1}
                className="inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-lg border border-blue-200 bg-white text-sm font-semibold text-blue-900 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Lanjut <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {stepContent[viewStep]}
        </div>
      </div>

      {/* Task Creation Modal */}
      {taskModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 animate-fade-in">
          <div className="w-full max-w-lg bg-gradient-to-b from-blue-50 to-sky-100 border border-blue-200 rounded-2xl shadow-lg p-6 text-blue-900 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-blue-950 text-base">Buat tugas kerja bakti sebelum hujan</h3>
              </div>
              <button onClick={() => setTaskModalReport(null)} className="text-blue-600 hover:text-blue-950 text-sm font-semibold">Tutup</button>
            </div>

            <form onSubmit={handleConfirmTask} className="space-y-3 text-sm">
              <div>
                <label className="text-blue-800 font-semibold block mb-1">Lokasi yang dibersihkan</label>
                <input
                  type="text"
                  readOnly
                  value={taskModalReport.exact_location?.address}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-blue-800 font-semibold block mb-1">Selesai dalam (menit)</label>
                  <input
                    type="number"
                    value={deadlineMinutes}
                    onChange={(e) => setDeadlineMinutes(e.target.value)}
                    className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-950 font-bold text-amber-700"
                  />
                  <span className="text-xs text-blue-600">Estimasi hujan lebat tiba</span>
                </div>

                <div>
                  <label className="text-blue-800 font-semibold block mb-1">Jumlah warga yang dibutuhkan</label>
                  <input
                    type="number"
                    value={volunteerCount}
                    onChange={(e) => setVolunteerCount(e.target.value)}
                    className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-950 font-bold"
                  />
                  <span className="text-xs text-blue-600">Warga digerakkan</span>
                </div>
              </div>

              <div>
                <label className="text-blue-800 font-semibold block mb-1 flex items-center justify-between">
                  <span>Langkah kerja (draf otomatis, bisa diubah)</span>
                  <span className="text-xs text-blue-600">Bisa disesuaikan</span>
                </label>
                <textarea
                  rows={5}
                  value={sopPlan}
                  onChange={(e) => setSopPlan(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-950 font-sans leading-relaxed"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                <Send className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Tugas dikirim otomatis lewat Telegram.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setTaskModalReport(null)}
                  className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-200 text-blue-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!afterPhotoUrl || afterPhotoCompressing}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-white shadow-lg shadow-emerald-600/25"
                >
                  Konfirmasi & Terbitkan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Task & Upload After Photo Modal */}
      {afterPhotoModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-blue-50 to-sky-100 border border-blue-200 rounded-2xl shadow-lg p-6 text-blue-900 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-blue-950 text-base">Unggah foto hasil kerja bakti</h3>
              </div>
              <button onClick={() => setAfterPhotoModalTask(null)} className="text-blue-600 hover:text-blue-950 text-sm font-semibold">Tutup</button>
            </div>

            <form onSubmit={handleConfirmCompleteTask} className="space-y-3 text-sm">
              <p className="text-blue-800">
                Unggah foto saluran yang sudah bersih. Hasilnya Anda cek dulu di langkah Cek hasil sebelum dianggap selesai.
              </p>

              <div className="relative rounded-lg overflow-hidden border border-blue-200 h-36 bg-white">
                {afterPhotoUrl
                  ? <img src={afterPhotoUrl} alt="After cleanup" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs text-blue-500">Belum ada foto</div>}
                <div className="absolute bottom-1 right-1 bg-emerald-50 text-xs text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  {afterPhotoCompressing ? "Mengoptimalkan foto..." : "After Photo Preview"}
                </div>
              </div>

              {/* Hidden file inputs for camera & gallery */}
              <input
                ref={afterCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleAfterPhotoChange}
                className="hidden"
              />
              <input
                ref={afterGalleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleAfterPhotoChange}
                className="hidden"
              />

              <div className="space-y-2">
                <label className="text-blue-800 font-semibold block">Foto saluran setelah bersih</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => afterCameraInputRef.current?.click()}
                    disabled={afterPhotoCompressing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil foto sekarang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => afterGalleryInputRef.current?.click()}
                    disabled={afterPhotoCompressing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-200 border border-blue-200 text-blue-900 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih dari galeri</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setAfterPhotoModalTask(null)}
                  className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-200 text-blue-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-600/25"
                >
                  Kirim untuk dicek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
