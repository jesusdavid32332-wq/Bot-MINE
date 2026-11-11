import React, { useState } from 'react';
import { GeneralConfig } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Settings,
  Shield,
  Key,
  Database,
  HardDrive,
  FileText,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Cpu,
  Terminal,
  ExternalLink,
} from 'lucide-react';

interface GeneralConfigViewProps {
  config: GeneralConfig;
  onSaveConfig: (updated: GeneralConfig) => void;
  onResetAllDemoData: () => void;
}

export const GeneralConfigView: React.FC<GeneralConfigViewProps> = ({
  config,
  onSaveConfig,
  onResetAllDemoData,
}) => {
  const [localConfig, setLocalConfig] = useState<GeneralConfig>({ ...config });
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(localConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    setIsExporting(true);
    const json = StorageService.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `juan_carlos_mines_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-sky-500/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Seguridad, Arquitectura de Servidor & Configuración General
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              POLÍTICA DE PRIVACIDAD ESTRICTA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Por seguridad, las claves maestras y tokens API se configuran exclusivamente en variables de entorno del servidor.
          </p>
        </div>

        <button
          onClick={handleExportBackup}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Descargar Respaldo JSON
        </button>
      </div>

      {/* Backend Integration Environment Variables Architecture Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0c1424] to-[#090f1d] border border-sky-500/30 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Variables de Entorno del Backend Requeridas
            </h3>
            <p className="text-[11px] text-slate-400">
              Nunca expongas estas variables en el navegador ni en repositorios públicos.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* TELEGRAM_BOT_TOKEN */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-300">
                TELEGRAM_BOT_TOKEN
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                REQUERIDO
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Token del bot generado por <strong>@BotFather</strong>. Permite al backend despachar los mensajes secuenciales, enviar fotos, álbumes de imágenes y teclados inline.
            </p>
          </div>

          {/* FIREBASE CLOUD FIRESTORE */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-300">
                FIREBASE CLOUD FIRESTORE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PROVISIÓN ACTIVA EN GOOGLE
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Base de datos Cloud Firestore (Base ID: <code>ai-studio-94df968f-5426-41a0-b427-5a523bcb0f60</code>, Proyecto: <code>jumping-agility-75wls</code>). Persiste las 8 colecciones requeridas con sincronización en tiempo real y deduplicación nativa.
            </p>
          </div>

          {/* WEBHOOK_SECRET */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-300">
                WEBHOOK_SECRET
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                SEGURIDAD ANTI-SPOOFING
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Token secreto validado en la cabecera <code>X-Telegram-Bot-Api-Secret-Token</code> para asegurar que todas las peticiones entrantes provengan exclusivamente de los servidores de Telegram.
            </p>
          </div>

          {/* ADMIN_TELEGRAM_ID */}
          <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-300">
                ADMIN_TELEGRAM_ID
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                ACCESO EXCLUSIVO /ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Identificador numérico de Telegram del administrador (ej. <code>684920153</code>). Únicamente este ID puede desbloquear el menú privado de 10 opciones con el comando <code>/admin</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Google Cloud Run & Webhook Setup Quick Box */}
      <div className="p-5 rounded-2xl bg-[#0c1424] border border-emerald-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Publicación en Google Cloud Run y Webhook de Telegram
          </h3>
        </div>
        <p className="text-xs text-slate-300">
          Esta aplicación se publica directamente desde Google AI Studio mediante el botón <strong>Publish</strong>. La URL generada de Google Cloud Run atiende la aplicación web y el webhook en <code>/api/telegram/webhook</code>.
        </p>
        <p className="text-xs text-slate-400">
          Comando para registrar el Webhook con Telegram una vez configurado tu token:
        </p>
        <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto select-all">
          curl -F &quot;url=https://TU-CLOUD-RUN-URL.run.app/api/telegram/webhook&quot; -F &quot;secret_token=TU_WEBHOOK_SECRET&quot; https://api.telegram.org/botTU_TELEGRAM_BOT_TOKEN/setWebhook
        </div>
      </div>

      {/* Services Health Matrix */}
      <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          Matriz de Estado de Servicios Google
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Telegram Webhook</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              /api/telegram/webhook
            </div>
            <p className="text-[10px] text-slate-400">Deduplicación & Idempotencia</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Motor Determinista</span>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              15 Pasos Activos
            </div>
            <p className="text-[10px] text-slate-400">Sin IA / Cero Gemini</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Base de Datos</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Cloud Firestore
            </div>
            <p className="text-[10px] text-slate-400">8 Colecciones Conectadas</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Archivos Multimedia</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              8 Activos Reales
            </div>
            <p className="text-[10px] text-slate-400">París, Vídeo, 3 Chats, 3 IDs</p>
          </div>
        </div>
      </div>

      {/* Admin Profile & Responsible Gaming */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Perfil Administrativo & Directiva +18
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre del Administrador
              </label>
              <input
                type="text"
                value={localConfig.adminName}
                onChange={(e) => setLocalConfig({ ...localConfig, adminName: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo de Notificaciones
              </label>
              <input
                type="email"
                value={localConfig.adminEmail}
                onChange={(e) => setLocalConfig({ ...localConfig, adminEmail: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Texto de Juego Responsable Oficial (+18)
            </label>
            <textarea
              rows={2}
              value={localConfig.responsibleGamingNotice}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, responsibleGamingNotice: e.target.value })
              }
              className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-slate-200"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-4 h-4" />
                Configuración guardada correctamente.
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all cursor-pointer"
            >
              Guardar Perfil
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone: Reset Demo Data */}
      <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Zona de Restablecimiento del Prototipo
        </h3>
        <p className="text-xs text-slate-300">
          Si modificaste los mensajes, tutoriales o nodos de flujo durante tus pruebas y deseas volver a los valores de demostración iniciales de fábrica, pulsa el botón a continuación.
        </p>

        <button
          onClick={() => {
            if (
              window.confirm(
                '¿Confirmas restablecer todos los mensajes, tutoriales, enlaces y flujos a los datos DEMO iniciales?'
              )
            ) {
              onResetAllDemoData();
            }
          }}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restablecer a Datos Demo Iniciales
        </button>
      </div>
    </div>
  );
};
