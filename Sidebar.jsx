import React from 'react';
import {
  Camera, Droplets, Bot, Shield, Users,
  Lock, UserPlus, LogOut, SlidersHorizontal, X, ClipboardList
} from 'lucide-react';

const TONES = {
  blue: {
    active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
    idle: 'text-blue-800 hover:bg-blue-50',
  },
  green: {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
    idle: 'text-blue-800 hover:bg-emerald-100 hover:text-emerald-800',
  },
  red: {
    active: 'bg-rose-600 text-white shadow-lg shadow-rose-500/30',
    idle: 'text-blue-800 hover:bg-rose-100 hover:text-rose-800',
  },
};

function NavItem({ icon: Icon, label, active, onClick, badge, tone = 'blue' }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
        active ? TONES[tone].active : TONES[tone].idle
      }`}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({
  activeKey,
  onNavigate,
  onOpenBot,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  loggedInUser,
  isDemoMode,
  onToggleDemoMode,
  isOpen,
  onClose,
}) {
  const go = (key) => { onNavigate(key); onClose?.(); };

  // Menu pengurus: mode demo menampilkan semua, selain itu hanya sesuai peran yang login
  const staff = [
    { key: 'RT_LEADER', label: 'Dasbor RT/RW', icon: Shield, role: 'RT_Leader', tone: 'green' },
    { key: 'NGO', label: 'Dasbor Evakuasi', icon: Users, role: 'NGO', tone: 'red' },
  ].filter(i => isDemoMode || loggedInUser?.role === i.role);

  return (
    <>
      {/* Latar gelap untuk drawer di HP */}
      {isOpen && <div className="md:hidden fixed inset-0 z-40 bg-blue-950/40" onClick={onClose} />}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 shrink-0 bg-white/80 backdrop-blur-md border-r border-blue-100 flex flex-col transition-transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">N</div>
            <div className="leading-tight">
              <div className="font-extrabold text-blue-950 text-base">SiagaRT</div>
              <div className="text-[11px] text-blue-600">NEXA &middot; Cegah Banjir</div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" aria-label="Tutup menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu utama */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <NavItem icon={Droplets} label="Beranda" active={activeKey === 'HOME'} onClick={() => go('HOME')} />
          <NavItem icon={ClipboardList} label="Status Laporan" active={activeKey === 'STATUS'} onClick={() => go('STATUS')} />
          <NavItem icon={Bot} label="NEXA Bot" active={activeKey === 'BOT'} onClick={() => { onOpenBot(); onClose?.(); }} />

          {staff.length > 0 && (
            <>
              <div className="px-3.5 pt-5 pb-1 text-[11px] font-bold uppercase tracking-wider text-blue-500">Pengurus</div>
              {staff.map(i => (
                <NavItem key={i.key} icon={i.icon} label={i.label} tone={i.tone} active={activeKey === i.key} onClick={() => go(i.key)} />
              ))}
            </>
          )}
        </nav>

        {/* Akun */}
        <div className="shrink-0 border-t border-blue-100 p-3 space-y-2">
          {loggedInUser ? (
            <div className="rounded-xl bg-blue-50 p-3">
              <div className="text-[11px] text-blue-600">Masuk sebagai</div>
              <div className="font-bold text-blue-950 text-sm truncate">{loggedInUser.full_name}</div>
              <button onClick={onLogout} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-950">
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => { onOpenLogin(); onClose?.(); }} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-semibold">
                <Lock className="w-4 h-4" /> Masuk Pengurus
              </button>
              <button onClick={() => { onOpenRegister(); onClose?.(); }} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-blue-700 hover:bg-blue-50 text-sm font-semibold">
                <UserPlus className="w-4 h-4" /> Daftar RT / Relawan
              </button>
            </>
          )}
          <button
            onClick={onToggleDemoMode}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-500 hover:text-blue-800 pt-1"
            title="Tampilkan semua peran untuk demo"
          >
            <SlidersHorizontal className="w-3 h-3" /> Mode demo: {isDemoMode ? 'aktif' : 'mati'}
          </button>
        </div>
      </aside>
    </>
  );
}
