import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PublicMap from './components/PublicMap';
import ReportModal from './components/ReportModal';
import RtLeaderDashboard from './components/RtLeaderDashboard';
import NgoDashboard from './components/NgoDashboard';
import WaveBackground from './components/WaveBackground';
import TelegramSimulatorModal from './components/TelegramSimulatorModal';
import RegisterModal from './components/RegisterModal';
import LoginModal from './components/LoginModal';
import ImpactStatsBar from './components/ImpactStatsBar';
import PublicHome from './components/PublicHome';
import StatusLaporan from './components/StatusLaporan';
import GotongRoyongBoard from './components/GotongRoyongBoard';
import HistoryModal from './components/HistoryModal';
import { Camera, CheckCircle, MapPin } from 'lucide-react';

// Identitas perangkat untuk warga/relawan yang ikut kerja bakti (tanpa login)
const getParticipant = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('nexa_participant') || 'null');
    if (saved?.id) return saved;
  } catch { /* abaikan */ }
  const fresh = { id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, name: '' };
  try { localStorage.setItem('nexa_participant', JSON.stringify(fresh)); } catch { /* abaikan */ }
  return fresh;
};

export default function App() {
  const [currentRole, setCurrentRole] = useState('PUBLIC'); // 'PUBLIC' | 'RT_LEADER' | 'NGO' | 'SIMULATOR'
  const [areas, setAreas] = useState([]);
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [evacuations, setEvacuations] = useState([]);
  const [bpbdPosts, setBpbdPosts] = useState([]);
  const [bmkgForecast, setBmkgForecast] = useState({});
  const [ruleStatus, setRuleStatus] = useState(null);
  const [telegramMessages, setTelegramMessages] = useState([]);
  const [stats, setStats] = useState({});
  const [botUsername, setBotUsername] = useState('NexaSiagaBot');
  const [users, setUsers] = useState([]);
  // ID laporan yang dikirim dari perangkat ini (untuk halaman Status Laporan)
  const [myReportIds, setMyReportIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexa_my_reports') || '[]'); } catch { return []; }
  });

  // Modals & Auth State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false); // Default: Mode Publik Bersih (Produksi)
  const [activeTelegramToken, setActiveTelegramToken] = useState('TOKEN_RT04_KM89');
  const [page, setPage] = useState(null); // null | 'HOME' | 'MAP' | 'STATUS' | 'REPORT' (null = dasbor sesuai peran)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLoginSuccess = (user, token) => {
    setLoggedInUser(user);
    setPage(null);
    if (token) {
      localStorage.setItem('nexa_auth_token', token);
      localStorage.setItem('nexa_user', JSON.stringify(user));
    }
    if (user.role === 'RT_Leader') {
      setCurrentRole('RT_LEADER');
      if (user.telegram_subscribe_token) {
        setActiveTelegramToken(user.telegram_subscribe_token);
      }
      showToast(`Selamat datang di Dasbor RT, ${user.full_name}!`);
    } else if (user.role === 'NGO') {
      setCurrentRole('NGO');
      showToast(`Selamat datang di Dasbor Evakuasi, ${user.full_name}!`);
    } else if (user.role === 'Admin') {
      setCurrentRole('SIMULATOR');
      showToast(`Selamat datang di Pusdalops!`);
    }
    fetchData(token, user.role);
  };

  const handleNavigate = (key) => {
    if (key === 'REPORT') {
      setIsReportModalOpen(true);
    } else if (key === 'HOME' || key === 'STATUS') {
      setPage(key);
    } else {
      setPage(null);
      setCurrentRole(key);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexa_auth_token');
    localStorage.removeItem('nexa_user');
    setLoggedInUser(null);
    setPage(null);
    setCurrentRole('PUBLIC');
    showToast("Anda sudah keluar.");
    fetchData(null, 'PUBLIC');
  };

  // Restore authenticated session on initial mount
  useEffect(() => {
    const token = localStorage.getItem('nexa_auth_token');
    const savedUserStr = localStorage.getItem('nexa_user');
    if (token && savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        setLoggedInUser(savedUser);
        if (savedUser.role === 'RT_Leader') setCurrentRole('RT_LEADER');
        else if (savedUser.role === 'NGO') setCurrentRole('NGO');
        else if (savedUser.role === 'Admin') setCurrentRole('SIMULATOR');
      } catch (e) {
        localStorage.removeItem('nexa_auth_token');
        localStorage.removeItem('nexa_user');
      }
    }
  }, []);

  // Fetch all core system data with UU PDP token protection
  const fetchData = async (overrideToken, overrideRole) => {
    try {
      const token = overrideToken !== undefined ? overrideToken : localStorage.getItem('nexa_auth_token');
      const role = overrideRole !== undefined ? overrideRole : currentRole;
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

      const shouldFetchVerified = Boolean(token && (role === 'RT_LEADER' || role === 'NGO' || role === 'SIMULATOR'));

      const [
        areasRes, 
        reportsRes, 
        tasksRes, 
        evacsRes, 
        ruleRes, 
        bpbdRes, 
        bmkgRes, 
        tgRes, 
        statsRes,
        botInfoRes,
        usersRes
      ] = await Promise.all([
        fetch('/api/areas').then(r => r.json()),
        fetch(shouldFetchVerified ? '/api/reports/verified' : '/api/reports/public', { headers: authHeaders }).then(r => r.json()),
        fetch(`/api/tasks?participant_id=${encodeURIComponent(getParticipant().id)}`).then(r => r.json()),
        fetch('/api/evacuations').then(r => r.json()),
        fetch('/api/rule-engine/status').then(r => r.json()),
        fetch('/api/bpbd/posts').then(r => r.json()),
        fetch('/api/bmkg/weather').then(r => r.json()),
        fetch('/api/telegram/messages').then(r => r.json()),
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/telegram/info').then(r => r.json()).catch(() => ({ bot_username: 'NexaSiagaBot' })),
        fetch('/api/auth/users', { headers: authHeaders }).then(r => r.json()).catch(() => ({ users: [] }))
      ]);

      if (areasRes.success) setAreas(areasRes.areas);
      if (reportsRes.success) setReports(reportsRes.reports);
      if (tasksRes.success) setTasks(tasksRes.tasks);
      if (evacsRes.success) setEvacuations(evacsRes.evacuations);
      if (ruleRes.success) setRuleStatus(ruleRes);
      if (bpbdRes.success) setBpbdPosts(bpbdRes.posts);
      if (bmkgRes.success) setBmkgForecast(bmkgRes.forecast);
      if (tgRes.success) setTelegramMessages(tgRes.messages);
      if (statsRes.success) setStats(statsRes.metrics);
      if (botInfoRes?.bot_username) setBotUsername(botInfoRes.bot_username);
      if (usersRes?.users) setUsers(usersRes.users);
    } catch (err) {
      console.error("Error fetching NEXA data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10 seconds for real-time responsiveness
    return () => clearInterval(interval);
  }, [currentRole]);

  // Actions (Protected with Stakeholder Auth Headers)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('nexa_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const handleVerifyReport = async (reportId, status, fieldCheck) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, field_check: fieldCheck })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memverifikasi laporan");
      showToast(status === 'Verified' ? "Laporan diverifikasi." : "Laporan ditolak.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        throw new Error("Server belum mengenali perintah hapus. Restart server (npm run dev) lalu coba lagi.");
      }
      if (!res.ok) throw new Error(data.error || "Gagal menghapus laporan");
      showToast("Laporan dihapus.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTask = async (taskPayload) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tugas gotong royong");
      showToast("Tugas gotong royong diterbitkan dan notifikasi Telegram terkirim.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Langkah 6: RT menerima hasil (server hanya mau menutup tugas yang sudah punya bukti)
  const handleCompleteTask = async ({ taskId }) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyelesaikan tugas");
      showToast("Hasil diterima. Saluran berhasil dibersihkan sebelum hujan.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Langkah 6 (alternatif): RT meminta dikerjakan ulang
  const handleRejectProof = async ({ taskId, note }) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/reject-proof`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal meminta pengerjaan ulang");
      showToast("Tugas dikembalikan ke warga untuk dikerjakan ulang.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Langkah 5a: warga/relawan menyatakan ikut kerja bakti
  const handleJoinTask = async (taskId, name) => {
    const me = getParticipant();
    try {
      const res = await fetch(`/api/tasks/${taskId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, participant_id: me.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bergabung ke tugas");
      try { localStorage.setItem('nexa_participant', JSON.stringify({ ...me, name })); } catch { /* abaikan */ }
      showToast("Terima kasih, kamu tercatat ikut kerja bakti.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Langkah 5b: unggah foto bukti (oleh warga yang ikut, atau RT sendiri). Mengembalikan true jika berhasil.
  const handleSubmitProof = async (taskId, proofPhotoDataUrl, note) => {
    const me = getParticipant();
    try {
      const res = await fetch(`/api/tasks/${taskId}/proof`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ proof_photo_url: proofPhotoDataUrl, note, participant_id: me.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah bukti");
      showToast("Bukti terkirim. Menunggu dicek Ketua RT.");
      fetchData();
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleHandleEvacuation = async ({ id, handled_by_ngo_id, dispatch_notes }) => {
    try {
      const res = await fetch(`/api/evacuations/${id}/handle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ handled_by_ngo_id, dispatch_notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengerahkan armada SAR");
      showToast("Relawan dan tim SAR dikerahkan ke lokasi.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateEvacuation = async (payload) => {
    try {
      const res = await fetch('/api/evacuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Situasi darurat dicatat.");
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSimulateRuleEngine = async (params) => {
    try {
      const res = await fetch('/api/rule-engine/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Simulasi selesai dievaluasi.");
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSimulateTelegramWebhook = async (payload) => {
    try {
      const token = localStorage.getItem('nexa_auth_token');
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-simulator-request': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pesan Telegram terkirim ke RT.");
        fetchData();
      } else {
        alert(data.message || data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Rule Engine disembunyikan dulu: peran Admin diarahkan ke Beranda
  const baseKey = page ?? ((currentRole === 'PUBLIC' || currentRole === 'SIMULATOR') ? 'HOME' : currentRole);
  const activeKey = isReportModalOpen ? 'REPORT' : (isTelegramModalOpen ? 'BOT' : baseKey);

  return (
    <div className="relative min-h-screen text-blue-900 flex font-sans">
      <WaveBackground />
      <Sidebar
        activeKey={activeKey}
        onNavigate={handleNavigate}
        onOpenBot={() => setIsTelegramModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
        onLogout={handleLogout}
        loggedInUser={loggedInUser}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-16 right-4 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        <Navbar
          bmkgForecast={bmkgForecast}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={reports.length + evacuations.length}
        />

        <main className={`flex-1 w-full mx-auto px-4 md:px-8 py-6 pb-28 md:pb-8 ${baseKey === 'HOME' ? 'max-w-[1500px]' : 'max-w-6xl'}`}>

          {/* Beranda (peta & gotong royong sudah digabung di sini) */}
          {baseKey === 'HOME' && (
            <PublicHome
              bpbdPosts={bpbdPosts}
              bmkgForecast={bmkgForecast}
              areas={areas}
              reports={reports}
              currentRole={currentRole}
              tasks={tasks}
              participantName={getParticipant().name}
              onJoin={handleJoinTask}
              onSubmitProof={handleSubmitProof}
              onReport={() => setIsReportModalOpen(true)}
              onOpenHistory={() => setIsHistoryOpen(true)}
            />
          )}

          {/* Status Laporan */}
          {baseKey === 'STATUS' && (
            <StatusLaporan
              reports={reports}
              tasks={tasks}
              myReportIds={myReportIds}
              onReport={() => setIsReportModalOpen(true)}
            />
          )}

          {/* Dasbor RT */}
          {baseKey === 'RT_LEADER' && (
            <RtLeaderDashboard
              loggedInUser={loggedInUser}
              reports={reports}
              tasks={tasks}
              areas={areas}
              users={users}
              onVerifyReport={handleVerifyReport}
              onDeleteReport={handleDeleteReport}
              onCreateTask={handleCreateTask}
              onCompleteTask={handleCompleteTask}
              onRejectProof={handleRejectProof}
              onSubmitProof={handleSubmitProof}
              onOpenTelegram={(token) => {
                if (token) setActiveTelegramToken(token);
                setIsTelegramModalOpen(true);
              }}
              onSimulateWebhook={handleSimulateTelegramWebhook}
              onCreateEvacuation={handleCreateEvacuation}
            />
          )}

          {/* Dasbor NGO */}
          {baseKey === 'NGO' && (
            <NgoDashboard
              evacuations={evacuations}
              areas={areas}
              onHandleEvacuation={handleHandleEvacuation}
              onCreateEvacuation={handleCreateEvacuation}
            />
          )}
        </main>

        {/* Tombol lapor di HP */}
        {(
          <div className="md:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-white/90 backdrop-blur-md border-t border-blue-100">
            <button onClick={() => setIsReportModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/30 transition-colors">
              <Camera className="w-5 h-5" aria-hidden="true" /> Lapor bahaya
            </button>
          </div>
        )}

        <ReportModal
          isOpen={isReportModalOpen}
          isDemoMode={isDemoMode}
          onClose={() => setIsReportModalOpen(false)}
          onViewStatus={() => setPage('STATUS')}
          areas={areas}
          onReportSubmitted={(newReport) => {
            if (newReport?.id) {
              const next = [newReport.id, ...myReportIds.filter(id => id !== newReport.id)].slice(0, 20);
              setMyReportIds(next);
              try { localStorage.setItem('nexa_my_reports', JSON.stringify(next)); } catch (e) { /* abaikan */ }
            }
            showToast("Laporan terkirim dan sedang diperiksa.");
            fetchData();
          }}
        />

        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          reports={reports}
          evacuations={evacuations}
          bpbdPosts={bpbdPosts}
          bmkgForecast={bmkgForecast}
        />

        <TelegramSimulatorModal
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          messages={telegramMessages}
          onSimulateWebhook={handleSimulateTelegramWebhook}
          token={activeTelegramToken}
          botUsername={botUsername}
        />

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          areas={areas}
          onRegistered={(newUser) => {
            showToast(`Berhasil mendaftar: ${newUser.full_name}.`);
            fetchData();
          }}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        <footer className="border-t border-blue-100 bg-white/80 backdrop-blur-md py-4 px-4 md:px-8 text-xs text-blue-600 flex flex-wrap items-center justify-between gap-2">
          <span>NEXA SiagaRT &middot; Data: BMKG &amp; BPBD DKI Jakarta &middot; Sesuai UU PDP</span>
          <a href="tel:112" className="font-semibold text-rose-600 hover:text-rose-700">Darurat: 112</a>
        </footer>
      </div>
    </div>
  );
}
