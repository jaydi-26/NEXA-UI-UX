import React, { useState } from 'react';
import { Send, X, Bot, CheckCheck, ShieldCheck, Play } from 'lucide-react';

export default function TelegramSimulatorModal({ 
  isOpen, 
  onClose, 
  messages = [], 
  onSimulateWebhook,
  token = 'TOKEN_RT04_KM89',
  botUsername = 'NexaSiagaBot'
}) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const realDeepLink = `https://t.me/${botUsername}?start=${token}`;

  const handleStartBot = async () => {
    setLoading(true);
    await onSimulateWebhook({
      message: {
        text: `/start ${token}`,
        chat: { id: "87123984" },
        from: { first_name: "Ketua RT" }
      }
    });
    setLoading(false);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);

    await onSimulateWebhook({
      message: {
        text: inputText,
        chat: { id: "87123984" },
        from: { first_name: "Ketua RT" }
      }
    });

    setInputText('');
    setLoading(false);
  };

  const handleQuickCommand = async (cmd) => {
    setLoading(true);
    await onSimulateWebhook({
      message: {
        text: cmd,
        chat: { id: "87123984" },
        from: { first_name: "Ketua RT" }
      }
    });
    setLoading(false);
  };

  const isConnected = messages.length > 0;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end p-0 sm:p-5">
      <div className="bot-pop pointer-events-auto relative w-full sm:max-w-sm bg-blue-50 border border-blue-200 sm:rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col h-[100dvh] sm:h-[560px] sm:max-h-[calc(100vh-2.5rem)] text-blue-900">
        
        {/* Telegram App Header */}
        <div className="bg-gradient-to-r from-blue-100 to-sky-100 p-4 flex items-center justify-between border-b border-blue-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-blue-950 text-sm">NEXA Bot</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 "></span>
              </div>
              <p className="text-[11px] text-blue-700">@{botUsername}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={realDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Lanjut chat di Telegram" aria-label="Buka bot Telegram"
              className="p-1.5 text-blue-600 hover:text-blue-950 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-[11px] bg-blue-100 px-3 py-1.5 border border-blue-200 font-semibold"
            >
              <span className="hidden sm:inline">Telegram</span>
              <Send className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-600 hover:text-blue-950 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telegram Chat Message History */}
        <div className="flex-1 bg-blue-100/60 p-4 overflow-y-auto space-y-3">
          {/* Welcome Intro Banner */}
          <div className="text-center my-2">
            <span className="text-[11px] bg-white text-blue-800 px-3.5 py-1.5 rounded-full border border-blue-100 shadow-sm inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bot lingkungan RT/RW</span>
            </span>
          </div>

          {/* If Not Connected: Show Friendly Start Card */}
          {!isConnected && (
            <div className="p-5 rounded-2xl bg-white border border-blue-200 text-center space-y-3 my-8 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-950">Tes notifikasi Telegram</h4>
                <p className="text-xs text-blue-800 mt-1 max-w-xs mx-auto leading-relaxed">
                  Coba notifikasi bot langsung di layar ini.
                </p>
              </div>

              <button
                onClick={handleStartBot}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? "Menghubungkan..." : "Mulai tes"}</span>
              </button>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, idx) => (
            <div key={idx} className="flex flex-col items-start max-w-[92%] animate-fade-in">
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm border border-blue-100 shadow-md space-y-1.5 text-xs text-blue-900">
                <div className="flex items-center justify-between text-[10px] text-blue-600 font-bold border-b border-blue-200 pb-1 gap-4">
                  <span>{msg.type || "NOTIFIKASI SIAGA"}</span>
                  <span className="text-blue-600 font-normal">
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <pre className="font-sans whitespace-pre-line text-xs text-blue-900 leading-relaxed">
                  {msg.message}
                </pre>

                <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600 pt-1">
                  <span>Terkirim</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input & Friendly Quick Actions */}
        <div className="bg-blue-50 p-3 border-t border-blue-200 space-y-2">
          {/* Quick Preset Buttons (User Friendly, No confusing tokens!) */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => handleQuickCommand('Tes Notifikasi Laporan Warga')}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-700 shrink-0 border border-blue-200 font-medium transition-colors"
            >
              Tes Notifikasi Masuk
            </button>
            <button
              onClick={() => handleQuickCommand('Cek Status Cuaca & Pos Pantau')}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-800 shrink-0 border border-blue-200 transition-colors"
            >
              Cek Pintu Air BPBD
            </button>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik pesan untuk bot..."
              className="flex-1 bg-white border border-blue-200 rounded-xl px-3.5 py-2 text-xs text-blue-950 placeholder-blue-300 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
