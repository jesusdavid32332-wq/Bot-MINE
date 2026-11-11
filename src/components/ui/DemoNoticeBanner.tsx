import React, { useState } from 'react';
import { AlertCircle, Terminal, X, ShieldAlert, Cpu } from 'lucide-react';

interface DemoNoticeBannerProps {
  onOpenSettings?: () => void;
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({ onOpenSettings }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#0b1426] border-b border-sky-500/20 px-4 py-2.5 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
            Entorno Demo / Prototipo
          </span>
          <p className="text-slate-300">
            Los datos mostrados son demostrativos. Telegram Bot y Gemini API operan en modo simulación hasta configurar las variables privadas en backend.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-sky-400" />
              TELEGRAM_BOT_TOKEN: <span className="text-amber-400/80">No vinculado</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-sky-400" />
              GEMINI_API_KEY: <span className="text-amber-400/80">Backend local</span>
            </span>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Ver guía de variables
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar aviso demo"
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
