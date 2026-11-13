import React from 'react';
import { TelegramButton } from '../../types';
import { ArrowLeft, MoreVertical, Send, CheckCheck, Sparkles, ExternalLink } from 'lucide-react';

interface TelegramPhoneMockupProps {
  title?: string;
  subtitle?: string;
  messageText: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  buttons?: TelegramButton[];
  onButtonClick?: (btn: TelegramButton) => void;
  senderName?: string;
  time?: string;
}

export const TelegramPhoneMockup: React.FC<TelegramPhoneMockupProps> = ({
  title = 'Juan Carlos | Mines AI 💎',
  subtitle = 'bot',
  messageText,
  mediaUrl,
  mediaType = 'photo',
  buttons = [],
  onButtonClick,
  time = '14:24',
}) => {
  return (
    <div className="w-full max-w-[340px] mx-auto rounded-[32px] p-3 bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#070b14] shadow-2xl border border-sky-500/20 text-slate-100 flex flex-col font-sans select-none">
      {/* Phone Notch & Speaker */}
      <div className="flex justify-center items-center pb-2 pt-0.5">
        <div className="w-20 h-3.5 bg-black/60 rounded-full flex items-center justify-center gap-1.5 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          <div className="w-6 h-1 rounded-full bg-slate-800"></div>
        </div>
      </div>

      {/* Telegram App Header */}
      <div className="bg-[#17212b] rounded-t-2xl px-3 py-2.5 flex items-center justify-between border-b border-[#0e1621]">
        <div className="flex items-center gap-2.5">
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <div className="w-8 h-8 rounded-full overflow-hidden bg-sky-950 border border-sky-400/30 shrink-0">
            <img
              src="/src/assets/images/juan_carlos_avatar_1794372721304.jpg"
              alt="Juan Carlos Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate leading-tight flex items-center gap-1">
              {title}
            </h4>
            <span className="text-[10px] text-sky-400/90 block">{subtitle}</span>
          </div>
        </div>
        <MoreVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* Telegram Chat Wallpaper */}
      <div className="bg-[#0e1621] p-3 flex-1 min-h-[360px] flex flex-col justify-end overflow-y-auto space-y-2 relative">
        <div className="text-center my-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-black/30 text-slate-400 font-medium">
            Hoy
          </span>
        </div>

        {/* Bot Message Bubble */}
        <div className="max-w-[92%] bg-[#182533] rounded-2xl rounded-tl-sm p-2.5 text-xs text-slate-100 shadow-md border border-slate-700/30">
          {/* Optional Media */}
          {mediaUrl && (
            <div className="rounded-lg overflow-hidden mb-2 border border-black/40 relative group bg-black/40">
              {mediaType === 'video' ? (
                <div className="relative aspect-video flex items-center justify-center bg-slate-900">
                  <video
                    src={mediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full max-h-48 object-cover rounded"
                  />
                </div>
              ) : (
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="w-full h-auto object-cover max-h-44 rounded"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}

          {/* Formatted Text */}
          <div className="whitespace-pre-wrap leading-relaxed text-[11.5px] text-slate-200 break-words font-normal">
            {messageText}
          </div>

          <div className="flex items-center justify-end gap-1 mt-1 text-[9.5px] text-slate-400 font-mono">
            <span>{time}</span>
            <CheckCheck className="w-3 h-3 text-sky-400" />
          </div>
        </div>

        {/* Telegram Inline Keyboard Buttons */}
        {buttons && buttons.length > 0 && (
          <div className="max-w-[92%] space-y-1.5 pt-0.5">
            {buttons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => onButtonClick && onButtonClick(btn)}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-[#2b5278]/60 hover:bg-[#2b5278] active:scale-[0.98] transition-all text-sky-200 border border-sky-400/20 shadow-sm flex items-center justify-center gap-1.5 text-center cursor-pointer"
              >
                {btn.text}
                {btn.type === 'url' && <ExternalLink className="w-3 h-3 text-sky-300 opacity-80" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Simulated Bottom Telegram Input */}
      <div className="bg-[#17212b] rounded-b-2xl p-2 flex items-center gap-2 border-t border-[#0e1621]">
        <div className="flex-1 bg-[#242f3d] rounded-full px-3 py-1.5 text-[11px] text-slate-400 truncate">
          Escribe un mensaje...
        </div>
        <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
          <Send className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
