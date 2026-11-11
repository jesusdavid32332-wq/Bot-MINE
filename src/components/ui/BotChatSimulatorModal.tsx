import React, { useState } from 'react';
import { AutoMessage, FlowStepId, TelegramButton, TelegramUser } from '../../types';
import { processDeterministicUpdate } from '../../services/deterministicBotEngine';
import { safeText } from '../../utils/safeText';
import { Modal } from './Modal';
import {
  Send,
  RotateCcw,
  Bot,
  User,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  Play,
} from 'lucide-react';

interface BotChatSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AutoMessage[];
}

interface SimMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  additionalMediaUrls?: string[];
  buttons?: TelegramButton[];
  timestamp: string;
}

export const BotChatSimulatorModal: React.FC<BotChatSimulatorModalProps> = ({
  isOpen,
  onClose,
  messages,
}) => {
  const [currentUser, setCurrentUser] = useState<TelegramUser>({
    id: 'sim-user-01',
    telegramId: '98421045',
    name: 'Usuario Simulador',
    username: 'sim_user',
    joinDate: new Date().toISOString().slice(0, 16),
    country: 'Sin declarar',
    currentStep: 'START',
    stage: 'Inicio',
    lastActivity: 'Ahora',
    status: 'active',
    messagesSent: 0,
    messagesReceived: 0,
    experienceLevel: 'desconocido',
    accountStatus: 'pendiente_revision',
    consentGiven: false,
  });

  const [chatHistory, setChatHistory] = useState<SimMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleStart = () => {
    const freshUser: TelegramUser = {
      ...currentUser,
      currentStep: 'START',
      stage: 'Inicio',
    };
    const result = processDeterministicUpdate(freshUser, '/start');
    setCurrentUser(result.updatedUser);

    const initialMsgs: SimMessage[] = [
      {
        id: `msg-u-${Date.now()}`,
        sender: 'user',
        text: '/start',
        timestamp: now(),
      },
      ...result.messagesToSend.map((m, idx) => ({
        id: `msg-b-${Date.now() + idx + 1}`,
        sender: 'bot' as const,
        text: m.text,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        additionalMediaUrls: m.additionalMediaUrls,
        buttons: m.buttons,
        timestamp: now(),
      })),
    ];

    setChatHistory(initialMsgs);
  };

  const handleReset = () => {
    setChatHistory([]);
    setCurrentUser({
      ...currentUser,
      currentStep: 'START',
      stage: 'Inicio',
      accountId: undefined,
      country: 'Sin declarar',
    });
    setInputText('');
  };

  const handleSendInput = (text: string, callbackValue?: string) => {
    const inputToProcess = (callbackValue || text).trim();
    if (!inputToProcess) return;

    // Add user message
    const userMsg: SimMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: now(),
    };

    const result = processDeterministicUpdate(currentUser, text, callbackValue);
    setCurrentUser(result.updatedUser);

    const botMsgs: SimMessage[] = result.messagesToSend.map((m, idx) => ({
      id: `msg-b-${Date.now() + idx + 1}`,
      sender: 'bot',
      text: m.text,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      additionalMediaUrls: m.additionalMediaUrls,
      buttons: m.buttons,
      timestamp: now(),
    }));

    setChatHistory((prev) => [...prev, userMsg, ...botMsgs]);
    setInputText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador Oficial de Conversaciones Automáticas Telegram"
      subtitle="Recorrido completo: START → BIENVENIDA → PAÍS → PRESENTACIÓN → INTERÉS → EXPERIENCIA → MINES → TESTIMONIOS → REGISTRO → ID → TUTORIAL → FINALIZACIÓN"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Status Strip */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs gap-2">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Etapa Actual:</span>
              <span className="font-bold text-sky-400 font-mono text-xs">
                {currentUser.currentStep} ({currentUser.stage})
              </span>
            </div>

            {currentUser.declaredCountry !== 'Sin declarar' && (
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">País:</span>
                <span className="font-bold text-white text-xs">{currentUser.declaredCountry}</span>
              </div>
            )}

            {currentUser.accountId && (
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">ID Cuenta:</span>
                <span className="font-mono font-bold text-amber-300 text-xs">
                  {currentUser.accountId}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reiniciar
          </button>
        </div>

        {/* Telegram Chat Box */}
        <div className="rounded-2xl bg-[#0e1621] border border-slate-800 p-3 h-[460px] overflow-y-auto space-y-3 flex flex-col justify-start font-sans">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Juan Carlos | Mines AI 💎</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Pulsa el botón <strong>INICIAR BOT (/start)</strong> para iniciar el recorrido de 15 pasos con las fotografías y vídeos reales cargados.
                </p>
              </div>

              <button
                onClick={handleStart}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                INICIAR BOT (/start)
              </button>
            </div>
          ) : (
            <>
              {chatHistory.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[88%] ${
                      isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-[#2b5278] text-white rounded-tr-sm shadow'
                          : 'bg-[#182533] text-slate-100 rounded-tl-sm shadow border border-slate-700/40'
                      }`}
                    >
                      {/* Attached media: photo or video */}
                      {m.mediaUrl && (
                        <div className="rounded-lg overflow-hidden mb-2 max-h-48 bg-black">
                          {m.mediaType === 'video' ? (
                            <video
                              src={m.mediaUrl}
                              controls
                              className="w-full h-auto max-h-48 object-cover rounded"
                            />
                          ) : (
                            <img
                              src={m.mediaUrl}
                              alt="Adjunto"
                              className="w-full h-auto max-h-48 object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      )}

                      {/* Additional media photos if photo group (e.g. Testimonials or 3 Guide photos) */}
                      {m.additionalMediaUrls && m.additionalMediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {m.additionalMediaUrls.map((addUrl, aIdx) => (
                            <div
                              key={aIdx}
                              className="rounded-lg overflow-hidden max-h-32 bg-black border border-slate-700/50"
                            >
                              <img
                                src={addUrl}
                                alt={`Adjunto ${aIdx + 2}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-[11.5px]">{safeText(m.text)}</p>
                      <div className="flex justify-end items-center gap-1 mt-1 text-[9px] text-slate-400 font-mono">
                        <span>{safeText(m.timestamp)}</span>
                        <CheckCheck className="w-3 h-3 text-sky-400" />
                      </div>
                    </div>

                    {/* Inline Telegram Keyboard Buttons */}
                    {m.buttons && m.buttons.length > 0 && (
                      <div className="w-full space-y-1.5 pt-1.5">
                        {m.buttons.map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => {
                              if (btn.type === 'url') {
                                window.open(btn.value, '_blank');
                              } else {
                                handleSendInput(btn.text, btn.value);
                              }
                            }}
                            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#242f3d] hover:bg-[#2e3c4e] text-sky-300 border border-sky-400/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                          >
                            <span>{safeText(btn.text)}</span>
                            {btn.type === 'url' && (
                              <ExternalLink className="w-3 h-3 text-sky-400 opacity-80" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Input Bar & Preset Natural Test phrases */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
            <span>Pruebas rápidas:</span>
            {['Colombia', 'España', 'SÍ, ME INTERESA', 'SÍ, YA LO CONOZCO', '1603722093'].map((preset) => (
              <button
                key={preset}
                onClick={() => handleSendInput(preset)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                "{preset}"
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) handleSendInput(inputText);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder={
                chatHistory.length === 0
                  ? "Pulsa 'Iniciar Bot (/start)' arriba..."
                  : currentUser.currentStep === 'PAIS'
                  ? 'Escribe tu país (ej. Colombia, México, España)...'
                  : currentUser.currentStep === 'SOLICITUD_ID'
                  ? 'Escribe tu ID numérico de cuenta (ej. 1603722093)...'
                  : 'Escribe tu respuesta...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
