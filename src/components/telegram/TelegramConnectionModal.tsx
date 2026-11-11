import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send,
  Link2,
  Bot,
  ShieldCheck,
  ExternalLink,
  Radio,
  Server,
  Terminal,
} from 'lucide-react';

interface TelegramConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminTelegramId?: string;
}

interface TelegramStatusData {
  status: 'connected' | 'needs_registration' | 'secret_mismatch' | 'disconnected' | 'error';
  bot?: {
    id: number;
    firstName: string;
    username: string;
    canJoinGroups: boolean;
  } | null;
  botError?: string | null;
  env: {
    TELEGRAM_BOT_TOKEN: boolean;
    WEBHOOK_SECRET: boolean;
    ADMIN_TELEGRAM_ID: boolean;
    PUBLIC_BASE_URL: boolean;
  };
  publicBaseUrl: string | null;
  expectedWebhookUrl: string;
  currentWebhookUrl: string | null;
  pendingUpdateCount: number;
  lastErrorMessage: string | null;
  lastErrorDate: number | null;
  secretMismatch: boolean;
  endpointAccessible: boolean;
}

export const TelegramConnectionModal: React.FC<TelegramConnectionModalProps> = ({
  isOpen,
  onClose,
  adminTelegramId = '684920153',
}) => {
  const [data, setData] = useState<TelegramStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testChatId, setTestChatId] = useState(adminTelegramId);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Error en respuesta del servidor (HTTP ${res.status}): ${text.slice(0, 150) || res.statusText}`);
    }
    return { res, json };
  };

  const fetchStatus = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const { json } = await safeFetchJson('/api/telegram/status');
      setData(json);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Error comprobando estado: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegisterWebhook = async () => {
    setIsRegistering(true);
    setFeedback(null);
    try {
      const { json } = await safeFetchJson('/api/telegram/register-webhook', { method: 'POST' });
      if (json?.success) {
        setFeedback({
          type: 'success',
          message: `¡Webhook registrado con éxito en Telegram! URL: ${json.registeredUrl}`,
        });
        await fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: json?.error || 'Error al registrar el webhook en Telegram.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Fallo de conexión: ${err.message}` });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSendTestMessage = async () => {
    setIsSendingTest(true);
    setFeedback(null);
    try {
      const { json } = await safeFetchJson('/api/telegram/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: testChatId }),
      });
      if (json?.success) {
        setFeedback({
          type: 'success',
          message: `Mensaje de prueba enviado exitosamente a Chat ID ${json.chatId} (Message ID: ${json.messageId}).`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: json?.error || 'Error enviando mensaje de prueba.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Fallo al enviar mensaje: ${err.message}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Conectado — Webhook Activo
          </span>
        );
      case 'needs_registration':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Configurado — Requiere Registrar Webhook
          </span>
        );
      case 'secret_mismatch':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            Secreto No Coincide (401 en Servidor)
          </span>
        );
      case 'disconnected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            Desconectado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            Error de Conexión
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#070b14] border border-[#1b2a4a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#152037] bg-[#050914]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Conexión con Telegram Bot API</h2>
                {getStatusBadge(data?.status)}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Juan Carlos | Mines AI 💎 — Sincronización en Producción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : feedback.type === 'error'
                  ? 'bg-red-950/40 border-red-500/40 text-red-200'
                  : 'bg-sky-950/40 border-sky-500/40 text-sky-200'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {feedback.type === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
              {feedback.type === 'info' && <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
              <div className="flex-1">{feedback.message}</div>
            </div>
          )}

          {/* 1. Bot Profile Card */}
          {data?.bot && (
            <div className="p-4 rounded-xl bg-[#091124] border border-[#1b2a4a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
                  💎
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {data.bot.firstName}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      ID: {data.bot.id}
                    </span>
                  </div>
                  <a
                    href={`https://t.me/${data.bot.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-0.5"
                  >
                    @{data.bot.username}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Bot Token Válido
                </span>
              </div>
            </div>
          )}

          {/* 2. Environment Variables Checklist */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Variables de Entorno en el Servidor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#050914] border border-[#152037] flex items-center justify-between">
                <span className="text-slate-300">TELEGRAM_BOT_TOKEN</span>
                {data?.env.TELEGRAM_BOT_TOKEN ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3.5 h-3.5" /> Falta
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-[#050914] border border-[#152037] flex items-center justify-between">
                <span className="text-slate-300">WEBHOOK_SECRET</span>
                {data?.env.WEBHOOK_SECRET ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3.5 h-3.5" /> Falta
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-[#050914] border border-[#152037] flex items-center justify-between">
                <span className="text-slate-300">ADMIN_TELEGRAM_ID</span>
                {data?.env.ADMIN_TELEGRAM_ID ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> Por defecto
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-[#050914] border border-[#152037] flex items-center justify-between">
                <span className="text-slate-300">PUBLIC_BASE_URL</span>
                {data?.env.PUBLIC_BASE_URL ? (
                  <span className="flex items-center gap-1 text-emerald-400 truncate max-w-[140px]" title={data.publicBaseUrl || ''}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Configurado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3.5 h-3.5" /> Falta
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Webhook Status Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              Estado del Webhook en Telegram
            </h3>
            <div className="p-3.5 rounded-xl bg-[#050914] border border-[#152037] space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-400">URL Registrada en Telegram:</span>
                <span className="font-mono text-slate-200 break-all sm:text-right">
                  {data?.currentWebhookUrl || <span className="text-amber-400">Ninguna (webhook desactivado)</span>}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">URL Objetivo de Producción:</span>
                <span className="font-mono text-sky-300 break-all sm:text-right">
                  {data?.expectedWebhookUrl || 'https://mine-aimbot-167398797374.us-west2.run.app/api/telegram/webhook'}
                </span>
              </div>

              {data?.pendingUpdateCount !== undefined && (
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">Actualizaciones pendientes en cola:</span>
                  <span className="font-mono text-slate-300">{data.pendingUpdateCount}</span>
                </div>
              )}

              {data?.secretMismatch && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 mt-2 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Advertencia: Discrepancia de WEBHOOK_SECRET en Cloud Run
                  </div>
                  <p className="text-[11px] text-red-300/90 leading-relaxed">
                    El servicio en Cloud Run devolvió <code>401 Unauthorized</code> al probar la cabecera secreta.
                    Asegúrate de actualizar la variable <code>WEBHOOK_SECRET</code> en Cloud Run con el mismo secreto antes de registrar el webhook.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Test Message Card */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" />
              Prueba de Envío Directo (Web → Telegram)
            </h3>
            <div className="p-3.5 rounded-xl bg-[#050914] border border-[#152037] flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Chat ID de destino (por defecto tu ID de administrador):
                </label>
                <input
                  type="text"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                  placeholder="ej. 684920153"
                  className="w-full px-3 py-2 bg-[#091124] border border-[#1b2a4a] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <button
                onClick={handleSendTestMessage}
                disabled={isSendingTest || !data?.env.TELEGRAM_BOT_TOKEN}
                className="w-full sm:w-auto mt-2 sm:mt-5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/20"
              >
                {isSendingTest ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Enviar Mensaje de Prueba</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#152037] bg-[#050914] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Comprobar Estado</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              onClick={handleRegisterWebhook}
              disabled={isRegistering || !data?.env.TELEGRAM_BOT_TOKEN || !data?.env.WEBHOOK_SECRET}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isRegistering ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              <span>Registrar Webhook Oficial</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
