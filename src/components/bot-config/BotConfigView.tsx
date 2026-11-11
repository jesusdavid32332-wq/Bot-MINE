import React, { useState } from 'react';
import { BotConfig } from '../../types';
import {
  Bot,
  Save,
  CheckCircle,
  AlertTriangle,
  Play,
  Lock,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface BotConfigViewProps {
  config: BotConfig;
  onSaveConfig: (updated: BotConfig) => void;
}

export const BotConfigView: React.FC<BotConfigViewProps> = ({ config, onSaveConfig }) => {
  const [localConfig, setLocalConfig] = useState<BotConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(localConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-sky-500/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Configuración de Identidad y Comportamiento del Bot en Telegram
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              TELEGRAM BOT API READY
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Define el comportamiento de bienvenida inmediata tras pulsar START, respuestas automáticas y políticas de uso +18.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          Guardar Configuración
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identidad en Telegram */}
        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            Identidad en Telegram
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Público del Bot</label>
              <input
                type="text"
                value={localConfig.botName}
                onChange={(e) => setLocalConfig({ ...localConfig, botName: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username Oficial (@)</label>
              <input
                type="text"
                value={localConfig.username}
                onChange={(e) => setLocalConfig({ ...localConfig, username: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-sky-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Estado Operativo</label>
              <select
                value={localConfig.status}
                onChange={(e) => setLocalConfig({ ...localConfig, status: e.target.value as any })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="active">Activo (Responde a usuarios)</option>
                <option value="maintenance">En Mantenimiento</option>
                <option value="paused">Pausado Temporalmente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comportamiento de START y Filosofía Cero Comandos */}
        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Play className="w-4 h-4 text-amber-400" />
            Comportamiento del Evento START (Sin Comandos Adicionales)
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Directiva de Ejecución al pulsar /start
            </label>
            <textarea
              rows={2}
              value={localConfig.startBehavior}
              onChange={(e) => setLocalConfig({ ...localConfig, startBehavior: e.target.value })}
              className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-slate-200"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              * El bot jamás exigirá escribir /registro, /ayuda o comandos técnicos: la navegación avanza por lenguaje natural.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={localConfig.enableInlineKeyboards}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, enableInlineKeyboards: e.target.checked })
                }
                className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
              />
              <span>Habilitar botones inline de Telegram en mensajes clave</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={localConfig.enforceAgeVerification18}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, enforceAgeVerification18: e.target.checked })
                }
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
              />
              <span>Advertencia obligatoria de mayoría de edad (+18)</span>
            </label>
          </div>
        </div>

        {/* Mensajes de Sistema */}
        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Mensajes del Sistema de Telegram
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saludo para Usuario Nuevo
              </label>
              <textarea
                rows={3}
                value={localConfig.newUserGreeting}
                onChange={(e) => setLocalConfig({ ...localConfig, newUserGreeting: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Saludo para Usuario Recurrente
              </label>
              <textarea
                rows={3}
                value={localConfig.recurringUserGreeting}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, recurringUserGreeting: e.target.value })
                }
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mensaje de Despedida
              </label>
              <textarea
                rows={3}
                value={localConfig.farewellMessage}
                onChange={(e) => setLocalConfig({ ...localConfig, farewellMessage: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mensaje de Error de Servidor
              </label>
              <textarea
                rows={3}
                value={localConfig.errorMessage}
                onChange={(e) => setLocalConfig({ ...localConfig, errorMessage: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Juego Responsable y Privacidad */}
        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Aviso de Privacidad y Juego Responsable (+18)
          </h3>
          <textarea
            rows={2}
            value={localConfig.responsibleGamingDisclaimer}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, responsibleGamingDisclaimer: e.target.value })
            }
            className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-slate-200"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle className="w-4 h-4" />
              Configuración de bot actualizada correctamente.
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            Guardar Todos los Cambios
          </button>
        </div>
      </form>
    </div>
  );
};
