import React, { useState, useEffect } from 'react';
import { AutoMessage, DeterministicKeywordConfig, TelegramButton, TelegramUser } from '../../types';
import {
  DEFAULT_KEYWORD_CONFIG,
  processDeterministicUpdate,
  handleIncomingReceiptPhoto,
  getEtapa2ActivationMessages,
  getEtapa2ContentMessages,
  createTransitionRecord,
} from '../../services/deterministicBotEngine';
import { DataService } from '../../services/dataService';
import { safeText } from '../../utils/safeText';
import { Modal } from './Modal';
import {
  Send,
  RotateCcw,
  Bot,
  CheckCheck,
  ExternalLink,
  Play,
  CheckCircle,
  XCircle,
  CreditCard,
  Camera,
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
  isMediaGroup?: boolean;
  albumCaption?: string;
  mediaGroupItems?: { type: 'photo' | 'video'; url: string }[];
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
    stage: 'stage_1_welcome',
    lastActivity: 'Ahora',
    status: 'active',
    messagesSent: 0,
    messagesReceived: 0,
    experienceLevel: 'desconocido',
    accountStatus: 'pending_verification',
    paymentStatus: 'unpaid',
    consentGiven: false,
    stageTransitions: [],
  });

  const [chatHistory, setChatHistory] = useState<SimMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [liveConfig, setLiveConfig] = useState<DeterministicKeywordConfig>(DEFAULT_KEYWORD_CONFIG);

  useEffect(() => {
    if (!isOpen) return;
    DataService.getCustomContent()
      .then((c) => {
        setLiveConfig({
          ...DEFAULT_KEYWORD_CONFIG,
          customMinesContentText: c.customMinesContentText || DEFAULT_KEYWORD_CONFIG.customMinesContentText,
          customPlatformReasonText: c.customPlatformReasonText || DEFAULT_KEYWORD_CONFIG.customPlatformReasonText,
          registrationLink: c.registrationLink || DEFAULT_KEYWORD_CONFIG.registrationLink,
          registrationPhotoUrls:
            Array.isArray(c.registrationPhotoUrls) && c.registrationPhotoUrls.length > 0
              ? c.registrationPhotoUrls
              : DEFAULT_KEYWORD_CONFIG.registrationPhotoUrls,
          plansMessageText: c.plansMessageText || DEFAULT_KEYWORD_CONFIG.plansMessageText,
          registrationMessageText: c.registrationMessageText || DEFAULT_KEYWORD_CONFIG.registrationMessageText,
          depositPromptText: c.depositPromptText || DEFAULT_KEYWORD_CONFIG.depositPromptText,
          approvalMessageText: c.approvalMessageText || DEFAULT_KEYWORD_CONFIG.approvalMessageText,
          fiveRoundsMessageText: c.fiveRoundsMessageText || DEFAULT_KEYWORD_CONFIG.fiveRoundsMessageText,
        });
      })
      .catch(() => {});
  }, [isOpen]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleStart = () => {
    const freshUser: TelegramUser = {
      ...currentUser,
      currentStep: 'START',
      stage: 'stage_1_welcome',
      flowStateLabel: 'NUEVO USUARIO',
      accountStatus: 'pending_verification',
      paymentStatus: 'unpaid',
      accountId: undefined,
      initialPlan: undefined,
      initialPlanLabel: undefined,
      advancedPlan: undefined,
      advancedPlanLabel: undefined,
      termsAccepted: undefined,
      stageTransitions: [
        createTransitionRecord('START', 'stage_1_welcome', 'user', undefined, 'Inicio /start'),
      ],
    };
    const result = processDeterministicUpdate(freshUser, '/start', undefined, liveConfig);
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
        isMediaGroup: m.isMediaGroup,
        albumCaption: m.albumCaption,
        mediaGroupItems: m.mediaGroupItems,
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
      stage: 'stage_1_welcome',
      flowStateLabel: 'NUEVO USUARIO',
      accountId: undefined,
      country: 'Sin declarar',
      initialPlan: undefined,
      initialPlanLabel: undefined,
      advancedPlan: undefined,
      advancedPlanLabel: undefined,
      termsAccepted: undefined,
      accountStatus: 'pending_verification',
      paymentStatus: 'unpaid',
      stageTransitions: [],
    });
    setInputText('');
  };

  const handleSendInput = (text: string, callbackValue?: string) => {
    const inputToProcess = (callbackValue || text).trim();
    if (!inputToProcess) return;

    const userMsg: SimMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: now(),
    };

    const result = processDeterministicUpdate(currentUser, text, callbackValue, liveConfig);
    setCurrentUser(result.updatedUser);

    const botMsgs: SimMessage[] = result.messagesToSend.map((m, idx) => ({
      id: `msg-b-${Date.now() + idx + 1}`,
      sender: 'bot',
      text: m.text,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      additionalMediaUrls: m.additionalMediaUrls,
      isMediaGroup: m.isMediaGroup,
      albumCaption: m.albumCaption,
      mediaGroupItems: m.mediaGroupItems,
      buttons: m.buttons,
      timestamp: now(),
    }));

    setChatHistory((prev) => [...prev, userMsg, ...botMsgs]);
    setInputText('');
  };

  const handleSimulateReceiptPhoto = () => {
    const samplePhoto = '/public/assets/aistudio/IMG_8055_1c7f857b.jpeg';
    const userMsg: SimMessage = {
      id: `msg-u-photo-${Date.now()}`,
      sender: 'user',
      text: '📸 [Comprobante de depósito adjunto]',
      mediaUrl: samplePhoto,
      mediaType: 'photo',
      timestamp: now(),
    };
    const result = handleIncomingReceiptPhoto(currentUser, `sim-dep-${Date.now()}`);
    setCurrentUser(result.updatedUser);
    const botMsgs: SimMessage[] = result.messagesToSend.map((m, idx) => ({
      id: `msg-b-rec-${Date.now() + idx + 1}`,
      sender: 'bot',
      text: m.text,
      buttons: m.buttons,
      timestamp: now(),
    }));
    setChatHistory((prev) => [...prev, userMsg, ...botMsgs]);
  };

  // Simulate Admin Actions
  const handleAdminVerifyId = () => {
    const updatedUser: TelegramUser = {
      ...currentUser,
      accountStatus: 'verified',
      idVerifiedAt: new Date().toISOString(),
      idVerifiedBy: 'Juan Carlos (Simulador)',
      stage: 'stage_2_id_verified',
      currentStep: 'stage_2_id_verified',
      stageTransitions: [
        ...(currentUser.stageTransitions || []),
        createTransitionRecord(
          currentUser.stage,
          'stage_2_id_verified',
          'admin',
          'Juan Carlos',
          'ID verificado manualmente desde panel simulador'
        ),
      ],
    };
    setCurrentUser(updatedUser);

    const msgs = getEtapa2ActivationMessages(updatedUser);
    const newSimMsgs: SimMessage[] = msgs.map((m, idx) => ({
      id: `msg-b-etapa2-${Date.now() + idx}`,
      sender: 'bot',
      text: m.text,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      isMediaGroup: m.isMediaGroup,
      mediaGroupItems: m.mediaGroupItems,
      buttons: m.buttons,
      timestamp: now(),
    }));

    setChatHistory((prev) => [...prev, ...newSimMsgs]);
  };

  const handleAdminRejectId = () => {
    const updatedUser: TelegramUser = {
      ...currentUser,
      accountStatus: 'rejected',
      idRejectedAt: new Date().toISOString(),
      idRejectedReason: 'ID no coincide con la plataforma',
      stage: 'stage_1_id_pending',
      currentStep: 'stage_1_id_pending',
    };
    setCurrentUser(updatedUser);

    const rejMsg: SimMessage = {
      id: `msg-b-rej-${Date.now()}`,
      sender: 'bot',
      text: `No pude confirmar tu ID con la información recibida.\n\nPor favor, revisa los números y envíame nuevamente el identificador correcto.`,
      timestamp: now(),
    };
    setChatHistory((prev) => [...prev, rejMsg]);
  };

  const handleAdminVerifyPayment = () => {
    const updatedUser: TelegramUser = {
      ...currentUser,
      paymentStatus: 'payment_verified',
      paymentVerifiedAt: new Date().toISOString(),
      paymentVerifiedBy: 'Juan Carlos (Simulador)',
      stage: 'stage_2_content_sent',
      currentStep: 'stage_2_content_sent',
      flowStateLabel: 'ACCESO A ORIENTACIÓN HABILITADO',
      stageTransitions: [
        ...(currentUser.stageTransitions || []),
        createTransitionRecord(
          currentUser.stage,
          'stage_2_content_sent',
          'admin',
          'Juan Carlos',
          'Depósito aprobado manualmente -> Orientación y 5 rondas habilitadas'
        ),
      ],
    };
    setCurrentUser(updatedUser);

    const msgs = getEtapa2ContentMessages(updatedUser, liveConfig.customMinesContentText, liveConfig);
    const newSimMsgs: SimMessage[] = msgs.map((m, idx) => ({
      id: `msg-b-content-${Date.now() + idx}`,
      sender: 'bot',
      text: m.text,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      buttons: m.buttons,
      timestamp: now(),
    }));

    setChatHistory((prev) => [...prev, ...newSimMsgs]);
  };

  const handleAdminRejectPayment = () => {
    const updatedUser: TelegramUser = {
      ...currentUser,
      paymentStatus: 'payment_rejected',
      stage: 'stage_2_payment_rejected',
      currentStep: 'stage_2_payment_rejected',
      flowStateLabel: 'DEPÓSITO RECHAZADO',
    };
    setCurrentUser(updatedUser);

    const rejMsg: SimMessage = {
      id: `msg-b-pay-rej-${Date.now()}`,
      sender: 'bot',
      text: `❌ *Comprobante no aprobado*\n\nNo logramos validar el comprobante enviado. El acceso al material de orientación sigue bloqueado hasta validar un comprobante legible.\n\n📸 Por favor, envía una nueva fotografía o captura válida de tu depósito en este chat.`,
      timestamp: now(),
    };
    setChatHistory((prev) => [...prev, rejMsg]);
  };

  const isWaitingForAdminId =
    currentUser.stage === 'stage_1_id_pending' || currentUser.accountStatus === 'pending_verification';
  const isWaitingForAdminPayment =
    currentUser.stage === 'stage_2_payment_pending' || currentUser.paymentStatus === 'deposit_notified';


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador Integral de Conversaciones de Juan Carlos (3 Etapas)"
      subtitle="Prueba el recorrido completo: Etapa 1 (Registro e ID) → Verificación Administrativa → Etapa 2 (Recarga y Práctica) → Etapa 3 (Planes Avanzados y Comisión del 10%)"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Status Strip */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Estado de Flujo:</span>
              <span className="font-bold text-sky-400 font-mono text-xs">
                {currentUser.flowStateLabel || currentUser.stage}
              </span>
            </div>

            {currentUser.declaredCountry && currentUser.declaredCountry !== 'Sin declarar' && (
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">País:</span>
                <span className="font-bold text-white text-xs">{currentUser.declaredCountry}</span>
              </div>
            )}

            {currentUser.initialPlanLabel && (
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Plan Inicial:</span>
                <span className="font-bold text-emerald-400 text-xs">{currentUser.initialPlanLabel}</span>
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

            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Estado ID:</span>
              <span
                className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                  currentUser.accountStatus === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : currentUser.accountStatus === 'rejected'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {currentUser.accountStatus === 'verified'
                  ? 'VERIFICADO'
                  : currentUser.accountStatus === 'rejected'
                  ? 'RECHAZADO'
                  : 'PENDIENTE'}
              </span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reiniciar
          </button>
        </div>

        {/* Administrative Action Bar in Simulator (Gates) */}
        {currentUser.stage === 'stage_1_id_pending' && currentUser.accountStatus !== 'verified' && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <h4 className="text-xs font-bold text-amber-300">
                  Compuerta 1: Esperando Aprobación de ID por Juan Carlos
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                La Etapa 2 no se iniciará hasta que aceptes el ID en el panel administrativo.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleAdminRejectId}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rechazar ID
              </button>
              <button
                onClick={handleAdminVerifyId}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Aceptar y Verificar ID (Inicia Etapa 2)
              </button>
            </div>
          </div>
        )}

        {(currentUser.stage === 'stage_2_payment_pending' || currentUser.stage === 'stage_2_awaiting_receipt') && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-sky-500/15 border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-sky-300">
                  Compuerta 2: {currentUser.paymentStatus === 'receipt_pending' ? 'Comprobante Pendiente de Verificación' : 'Esperando Foto o Aprobación Manual'}
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {currentUser.paymentStatus === 'receipt_pending'
                  ? 'El comprobante está en cola manual (🟡 PENDIENTE). Aprueba o rechaza como Juan Carlos.'
                  : 'Simula que el usuario envía la foto del comprobante para probar la verificación manual.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {currentUser.paymentStatus !== 'receipt_pending' && (
                <button
                  onClick={handleSimulateReceiptPhoto}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Enviar Foto Comprobante
                </button>
              )}
              <button
                onClick={handleAdminRejectPayment}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rechazar Depósito
              </button>
              <button
                onClick={handleAdminVerifyPayment}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Aprobar Depósito
              </button>
            </div>
          </div>
        )}

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
                  Pulsa el botón <strong>INICIAR BOT (/start)</strong> para iniciar el flujo de 3 etapas con los videos, álbum de 3 fotos de ID y compuertas de verificación.
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
                      {/* Attached single media */}
                      {m.mediaUrl && !m.isMediaGroup && (
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

                      {/* Media Group (Album of 2, 3, or 6 photos in order) */}
                      {m.isMediaGroup && m.mediaGroupItems && m.mediaGroupItems.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {m.albumCaption && (
                            <p className="text-[11.5px] text-sky-200 font-medium mb-1">{safeText(m.albumCaption)}</p>
                          )}
                          <div className="grid grid-cols-3 gap-1.5">
                            {m.mediaGroupItems.map((item, aIdx) => (
                              <div
                                key={aIdx}
                                className="relative rounded-lg overflow-hidden max-h-32 bg-black border border-slate-700/50"
                              >
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-sky-300 font-mono">
                                  #{aIdx + 1}
                                </span>
                                <img
                                  src={item.url}
                                  alt={`Paso ${aIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.text && <p className="text-[11.5px]">{safeText(m.text)}</p>}
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
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span>Atajos de prueba:</span>
            {[
              { label: 'Colombia 🇨🇴', val: 'pais_colombia' },
              { label: 'PLAN 1 — $15.000', val: 'plan_15000' },
              { label: '✅ Ya completé registro', val: 'continuar_a_guia_mines' },
              { label: 'ID: 1603722093', val: '1603722093' },
              { label: '💳 Ya deposité', val: 'deposito_realizado' },
              { label: '✅ Ya terminé práctica', val: 'practica_terminada' },
              { label: 'PLAN AVANZADO $50.000', val: 'plan_avanzado_50000' },
              { label: 'Acepto 10%', val: 'terminos_aceptar' },
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendInput(preset.label, preset.val)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                "{preset.label}"
              </button>
            ))}
            <button
              type="button"
              onClick={handleSimulateReceiptPhoto}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            >
              📸 Foto Comprobante
            </button>
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
                  : currentUser.stage === 'stage_1_country'
                  ? 'Escribe tu país o pulsa un botón...'
                  : currentUser.stage === 'stage_1_id_pending'
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
