import React, { useState, useEffect } from 'react';
import {
  Send,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Terminal,
  Copy,
  Check,
  Radio,
  Trash2,
  Server,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TelegramConnectionStatus } from '../../types';
import { TelegramConnectIcon3D } from '../ui/Icons3D';

interface TelegramConnectionViewProps {
  adminTelegramId?: string;
}

export const TelegramConnectionView: React.FC<TelegramConnectionViewProps> = ({
  adminTelegramId = '684920153',
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState(adminTelegramId);
  const [status, setStatus] = useState<TelegramConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Overwrite webhook confirmation modal state
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [pendingOverwriteInfo, setPendingOverwriteInfo] = useState<{
    existingUrl: string;
    targetUrl?: string;
    botUsername?: string;
  } | null>(null);

  // Disconnect confirmation modal state
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Helper: safely parse JSON responses without throwing pattern errors on HTML error pages
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(`Servidor devolvió error HTTP ${res.status} (${res.statusText || 'Error de servicio'})`);
      }
      throw new Error(`Respuesta no procesable del servidor (esperado JSON, recibido texto)`);
    }
    return { res, data };
  };

  // Load live connection status from backend
  const loadStatus = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data } = await safeFetchJson('/api/telegram/connection-status');
      if (data && data.success) {
        setStatus(data);
      } else {
        setErrorMessage(data?.error || 'Error al obtener estado de Telegram');
      }
    } catch (err) {
      setErrorMessage(
        'Error de comunicación con el servicio: ' +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2200);
    } catch (e) {
      console.warn('Clipboard write prevented:', e);
    }
  };

  // Submit token to backend for real Telegram API verification
  const handleConnect = async (forceOverwrite = false) => {
    const rawInput = tokenInput.trim();
    if (!rawInput) {
      setErrorMessage('Por favor introduce el token del bot provisto por @BotFather.');
      return;
    }

    // Clean token: strip quotes, spaces, and optional 'bot' prefix
    const cleanToken = rawInput
      .replace(/^bot/i, '')
      .replace(/["'<>]/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    if (!cleanToken.includes(':')) {
      setErrorMessage(
        'El token ingresado no contiene los dos puntos separadores ":". El formato oficial de @BotFather es [ID_NUMERICO]:[HASH_SECRETO] (ejemplo: 7981234567:AAFl0...).'
      );
      return;
    }

    const [botIdPart, secretPart] = cleanToken.split(':');
    if (!/^\d+$/.test(botIdPart)) {
      setErrorMessage(
        `La primera parte del token debe ser numérico (ID de Telegram). Se recibió: "${botIdPart}". Copia el token completo desde @BotFather.`
      );
      return;
    }

    if (!secretPart || secretPart.length < 15) {
      setErrorMessage(
        'La clave secreta del token es demasiado corta. Asegúrate de haber copiado el token completo emitido por @BotFather.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const { res, data } = await safeFetchJson('/api/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: cleanToken,
          overwriteWebhook: forceOverwrite,
          adminAuthKey: (adminAuthInput || adminTelegramId || '').trim(),
        }),
      });

      if (!res.ok || !data.success) {
        setErrorMessage(data?.error || `Fallo de validación del token (HTTP ${res.status})`);
        setIsSubmitting(false);
        return;
      }

      // Check if overwrite confirmation is needed
      if (data.requiresConfirmation) {
        setPendingOverwriteInfo({
          existingUrl: data.existingWebhookUrl,
          targetUrl: data.targetWebhookUrl,
          botUsername: data.bot?.username,
        });
        setShowOverwriteModal(true);
        setIsSubmitting(false);
        return;
      }

      setTokenInput(''); // Clear plain token from memory immediately per security requirements
      setSuccessNotice(
        data.connected
          ? `¡Bot @${data.bot?.username} verificado y conectado exitosamente con Webhook activo!`
          : `Token validado para @${data.bot?.username}. ${data.webhookNotice || ''}`
      );
      setShowOverwriteModal(false);
      setPendingOverwriteInfo(null);
      await loadStatus();
    } catch (err) {
      setErrorMessage(
        'Error enviando solicitud de conexión: ' +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disconnect bot
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const { res, data } = await safeFetchJson('/api/telegram/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok && data?.success) {
        setSuccessNotice('Bot de Telegram desconectado y webhook eliminado correctamente.');
        setShowDisconnectModal(false);
        await loadStatus();
      } else {
        setErrorMessage(data?.error || 'Error al desconectar');
      }
    } catch (err) {
      setErrorMessage('Error al desconectar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Re-register or sync Webhook
  const handleSyncWebhook = async () => {
    setIsSettingWebhook(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const { res, data } = await safeFetchJson('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok && data?.success) {
        setSuccessNotice(data.message || 'Webhook sincronizado exitosamente.');
        await loadStatus();
      } else {
        setErrorMessage(data?.error || 'Error al sincronizar webhook');
      }
    } catch (err) {
      setErrorMessage('Error al sincronizar webhook: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const isConnected = Boolean(status?.connected);
  const hasToken = Boolean(status?.hasToken);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#091224] via-[#0c1833] to-[#060b18] border border-cyan-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <TelegramConnectIcon3D size={44} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Conexión de Telegram
              </h1>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                PRODUCCIÓN
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Vincula y valida en tiempo real tu bot de Telegram con la API oficial, configura el webhook y verifica la seguridad con Google Cloud Secret Manager.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={loadStatus}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            title="Refrescar estado en vivo"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div
            className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold shadow-lg ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : hasToken
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : hasToken
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            />
            <span>
              {isConnected
                ? 'TELEGRAM CONECTADO'
                : hasToken
                ? 'TOKEN VÁLIDO (WEBHOOK PENDIENTE)'
                : 'DESCONECTADO'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-0.5">Atención requerida:</strong>
            <p className="font-mono">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3 text-emerald-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-0.5">Operación exitosa:</strong>
            <p>{successNotice}</p>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Connection Action */}
        <div className="lg:col-span-7 space-y-6">
          {/* Token Connection Box */}
          <div className="p-6 rounded-2xl bg-[#070c18] border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    {hasToken ? 'Actualizar o Reconectar Bot' : 'Vincular Bot de Telegram'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Introduce el token HTTP API generado por <strong>@BotFather</strong>
                  </p>
                </div>
              </div>
              {status?.maskedToken && (
                <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                  Activo: <strong className="text-cyan-300">{status.maskedToken}</strong>
                </span>
              )}
            </div>

            {/* Input Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Token de BotFather</span>
                  <span className="text-[10px] text-amber-400 font-mono font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Privado y cifrado
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#030712] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-mono text-white placeholder-slate-600 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ejemplo: <code className="font-mono text-slate-300">7981234567:AAFl0...</code> (Generado con el comando <code className="font-mono text-cyan-300">/newbot</code> o <code className="font-mono text-cyan-300">/token</code> en Telegram).
                </p>
              </div>

              {/* Admin ID / Authorization Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>ID de Administrador Autorizado (ADMIN_TELEGRAM_ID)</span>
                  <span className="text-[10px] text-purple-400 font-mono font-medium">Control de acceso</span>
                </label>
                <input
                  type="text"
                  value={adminAuthInput}
                  onChange={(e) => setAdminAuthInput(e.target.value)}
                  placeholder="684920153"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#030712] border border-slate-700 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-xs font-mono text-white placeholder-slate-600 transition-all outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Solo el administrador con este ID de Telegram puede autorizar cambios en el bot.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center">
                <button
                  onClick={() => handleConnect(false)}
                  disabled={isSubmitting || !tokenInput.trim()}
                  className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validando con Telegram API...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Validar y conectar
                    </>
                  )}
                </button>

                {hasToken && (
                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    disabled={isDisconnecting}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-white border border-red-500/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Desconectar Telegram
                  </button>
                )}
              </div>
            </div>

            {/* Zero-Leak Security Notice */}
            <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-500/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 space-y-1">
                <strong className="text-white font-semibold block">Garantía de Cero Fugas de Credenciales:</strong>
                <p>
                  El token viaja exclusivamente por HTTPS hacia el backend administrativo. <strong>Nunca</strong> se guarda en <code className="font-mono text-cyan-300">localStorage</code>, ni en la base de datos pública de Firestore, ni se devuelve en claro al navegador.
                </p>
              </div>
            </div>
          </div>

          {/* Webhook Status and Synchronization Card */}
          <div className="p-6 rounded-2xl bg-[#070c18] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Estado del Webhook de Telegram
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verificación en tiempo real reportada por la API de Telegram (<code className="font-mono">getWebhookInfo</code>)
                  </p>
                </div>
              </div>

              {hasToken && (
                <button
                  onClick={handleSyncWebhook}
                  disabled={isSettingWebhook}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSettingWebhook ? 'animate-spin' : ''}`} />
                  Sincronizar Webhook
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Webhook Target URL */}
              <div className="p-3 rounded-xl bg-[#030712] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">URL registrada en Telegram</span>
                  <span className="font-mono text-xs text-slate-200 break-all">
                    {status?.webhook?.url || (
                      <em className="text-slate-500">Ningún webhook activo en Telegram</em>
                    )}
                  </span>
                </div>
                {status?.webhook?.url && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 ml-2">
                    ACTIVO
                  </span>
                )}
              </div>

              {/* Expected URL Comparison */}
              <div className="p-3 rounded-xl bg-[#030712] border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">URL esperada para este servicio</span>
                <span className="font-mono text-xs text-cyan-300 break-all">
                  {status?.expectedWebhookUrl || (
                    <em className="text-amber-400">
                      PUBLIC_BASE_URL no está configurado en el servidor
                    </em>
                  )}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#030712] border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Actualizaciones pendientes</span>
                  <span className="font-mono text-base font-bold text-white">
                    {status?.webhook?.pending_update_count ?? 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#030712] border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">WEBHOOK_SECRET</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      status?.webhookSecretConfigured ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {status?.webhookSecretConfigured ? 'CONFIGURADO' : 'NO DEFINIDO'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#030712] border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Último error Telegram</span>
                  <span
                    className={`font-mono text-xs truncate block ${
                      status?.webhook?.last_error_message ? 'text-red-400' : 'text-slate-400'
                    }`}
                    title={status?.webhook?.last_error_message}
                  >
                    {status?.webhook?.last_error_message || 'Ninguno (OK)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bot Identity & GCP Infrastructure Diagnostic */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bot Real Identity Card */}
          <div className="p-6 rounded-2xl bg-[#070c18] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Identidad del Bot Verificado
              </h3>
            </div>

            {status?.bot ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 to-[#030712] border border-cyan-500/20">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl shrink-0">
                    🤖
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{status.bot.first_name}</h4>
                    <a
                      href={`https://t.me/${status.bot.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold truncate group"
                    >
                      @{status.bot.username}
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#030712] border border-slate-800">
                    <span className="text-slate-400 font-mono">ID de Telegram:</span>
                    <span className="font-mono text-white font-bold">{status.bot.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#030712] border border-slate-800">
                    <span className="text-slate-400 font-mono">Tipo de cuenta:</span>
                    <span className="font-mono text-emerald-400 font-bold">Bot Oficial Verificado</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#030712] border border-slate-800">
                    <span className="text-slate-400 font-mono">Unirse a grupos:</span>
                    <span className="font-mono text-slate-300">
                      {status.bot.can_join_groups ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-[#030712] border border-dashed border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
                  <Send className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-400">
                  Ningún bot verificado aún.
                </p>
                <p className="text-[11px] text-slate-500">
                  Introduce el token de @BotFather en el formulario de la izquierda para consultar y validar la identidad en tiempo real.
                </p>
              </div>
            )}
          </div>

          {/* Google Cloud Secret Manager & Cloud Run Diagnostic Card */}
          <div className="p-6 rounded-2xl bg-[#070c18] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Infraestructura Cloud Run
                </h3>
              </div>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                jumping-agility-75wls
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#030712] border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Servicio Cloud Run</span>
                <div className="flex items-center justify-between">
                  <code className="text-white font-mono font-bold">
                    {status?.cloudRunConfig.serviceName || 'mine-aimbot'}
                  </code>
                  <span className="font-mono text-[10px] text-slate-400">
                    Región: <strong className="text-slate-200">{status?.cloudRunConfig.region || 'us-west2'}</strong>
                  </span>
                </div>
              </div>

              {/* Secret Manager Real Diagnostic */}
              <div className="p-3 rounded-xl bg-[#030712] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    Acceso a Secret Manager
                  </span>
                  <span
                    className={`font-mono text-[9px] px-2 py-0.5 rounded font-bold ${
                      status?.gcpPermissions.hasSecretManagerPermission
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {status?.gcpPermissions.hasSecretManagerPermission
                      ? 'CONECTADO'
                      : 'AUTORIZACIÓN MANUAL REQUERIDA'}
                  </span>
                </div>

                {!status?.gcpPermissions.hasSecretManagerPermission && (
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Diagnóstico real de permisos de Google Cloud:</span>
                    </div>
                    <p className="text-slate-300 font-mono text-[10px]">
                      {status?.gcpPermissions.errorMessage ||
                        'La cuenta de servicio del contenedor no cuenta con roles administrativos para invocar directamente la API de Secret Manager desde el sandbox.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Ready-to-copy gcloud commands */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Comandos gcloud para vincular el secreto en producción:
                </span>
                <div className="space-y-1.5 font-mono text-[10px]">
                  {status?.gcpPermissions.gcloudCommands.map((cmd, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#02050e] border border-slate-800 flex items-center justify-between group hover:border-cyan-500/30 transition-colors"
                    >
                      <code className="text-slate-300 truncate max-w-[280px]" title={cmd}>
                        {cmd}
                      </code>
                      <button
                        onClick={() => copyToClipboard(cmd, `cmd-${idx}`)}
                        className="p-1 rounded text-slate-400 hover:text-white shrink-0 ml-2 cursor-pointer"
                        title="Copiar comando"
                      >
                        {copiedCmd === `cmd-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Overwrite Webhook */}
      {showOverwriteModal && pendingOverwriteInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#091124] border border-amber-500/30 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">¿Sobrescribir Webhook Existente?</h3>
                <p className="text-[11px] text-slate-400">Confirmación administrativa de seguridad</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#040814] border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300">
                El bot <strong className="text-white">@{pendingOverwriteInfo.botUsername}</strong> ya está recibiendo mensajes en otro endpoint:
              </p>
              <div className="p-2 rounded bg-black/50 border border-slate-800 font-mono text-[11px] text-amber-300 break-all">
                {pendingOverwriteInfo.existingUrl}
              </div>
              <p className="text-slate-400 text-[11px]">
                Si confirmas, Telegram dirigirá todos los mensajes hacia la nueva URL:
              </p>
              <div className="p-2 rounded bg-black/50 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all">
                {pendingOverwriteInfo.targetUrl}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowOverwriteModal(false);
                  setPendingOverwriteInfo(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConnect(true)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Sí, sobrescribir y conectar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Disconnect Telegram */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#091124] border border-red-500/30 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">¿Desconectar Bot de Telegram?</h3>
                <p className="text-[11px] text-slate-400">Acción reversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Al desconectar, se eliminará el webhook registrado en los servidores de Telegram y el bot dejará de procesar mensajes entrantes hasta que vuelvas a validar un token.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/20"
              >
                {isDisconnecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Confirmar Desconexión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
