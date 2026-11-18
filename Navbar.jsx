import React from 'react';
import { CloudRain, Bell } from 'lucide-react';

export function useRainCountdown(bmkgForecast) {
  const [countdownText, setCountdownText] = React.useState('Memuat...');

  React.useEffect(() => {
    const update = () => {
      const targetTimeStr = bmkgForecast?.active_warning?.expected_heavy_rain;
      if (!targetTimeStr) {
        setCountdownText('60 mnt');
        return;
      }
      const targetMs = new Date(targetTimeStr).getTime();
      const diffSec = Math.floor((targetMs - Date.now()) / 1000);

      if (diffSec <= 0) {
        setCountdownText('Sudah tiba');
        return;
      }

      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      const pad = (n) => String(n).padStart(2, '0');

      if (h > 0) {
        setCountdownText(`${pad(h)}:${pad(m)}:${pad(s)}`);
      } else {
        setCountdownText(`00:${pad(m)}:${pad(s)}`);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [bmkgForecast]);
  return countdownText;
}

const jamWib = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')} WIB`;
};

export default function Navbar({ bmkgForecast, onOpenMenu, showBmkg = true, onOpenHistory, historyCount = 0 }) {
  const countdownText = useRainCountdown(bmkgForecast);
  const activeWarning = bmkgForecast?.active_warning;
  const rainTime = jamWib(activeWarning?.expected_heavy_rain);
  const headline = activeWarning?.headline || "Waspada hujan sedang-lebat di Jakarta";

  return (
    <header className={`sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-blue-100`}>
      <div className="h-14 px-4 flex items-center gap-3">
        <button onClick={onOpenMenu} className="md:hidden p-2 -ml-2 rounded-lg text-blue-700 hover:bg-blue-50" aria-label="Buka menu">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <div className={`flex-1 min-w-0 items-center gap-2 text-sm ${showBmkg ? 'flex' : 'hidden'}`}>
          <span className="font-bold text-amber-700 shrink-0">BMKG</span>
          <span className="text-blue-900 truncate">{headline}</span>
        </div>

        <div className={`shrink-0 items-center gap-1.5 ${showBmkg ? 'flex' : 'hidden'} bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg text-xs text-blue-800`}>
          <CloudRain className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Hujan lebat{rainTime ? ` ${rainTime}` : ''}:</span>
          <strong className="font-mono text-blue-950">{countdownText}</strong>
        </div>

        {/* Pendorong agar lonceng tetap di kanan saat info BMKG disembunyikan (Beranda) */}
        {!showBmkg && <div className="flex-1" />}

        {/* Lonceng: Riwayat Bencana (seluruh riwayat laporan) */}
        <button
          onClick={onOpenHistory}
          className="relative shrink-0 p-2 rounded-xl text-blue-700 hover:bg-blue-50 transition-colors"
          aria-label={`Riwayat Bencana${historyCount ? `, ${historyCount} catatan` : ''}`}
          title="Riwayat Bencana"
        >
          <Bell className={`w-5 h-5 ${historyCount > 0 ? 'bell-ring' : ''}`} aria-hidden="true" />
          {historyCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-extrabold leading-none">
              {historyCount > 99 ? '99+' : historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
