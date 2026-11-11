import React, { useState } from 'react';
import { BotConfig, DeterministicKeywordConfig, TelegramUser } from '../../types';
import {
  ShieldAlert,
  Bot,
  Lock,
  MessageSquare,
  Image as ImageIcon,
  Video,
  CheckCircle,
  HelpCircle,
  Key,
  Terminal,
  Send,
  Upload,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface TelegramAdminMenuViewProps {
  botConfig: BotConfig;
  keywordConfig: DeterministicKeywordConfig;
  users: TelegramUser[];
  onSaveBotConfig: (updated: BotConfig) => void;
  onSaveKeywordConfig: (updated: DeterministicKeywordConfig) => void;
}

export const TelegramAdminMenuView: React.FC<TelegramAdminMenuViewProps> = ({
  botConfig,
  keywordConfig,
  users,
  onSaveBotConfig,
  onSaveKeywordConfig,
}) => {
  const [adminId, setAdminId] = useState(botConfig.adminTelegramId || '684920153');
  const [keywordsYesInput, setKeywordsYesInput] = useState(keywordConfig.keywordsYes.join(', '));
  const [keywordsNoInput, setKeywordsNoInput] = useState(keywordConfig.keywordsNo.join(', '));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestMessage = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: adminId }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Mensaje de prueba enviado a Telegram ID ${data.chatId} (Msg ID: ${data.messageId})`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Fallo al enviar mensaje de prueba',
        });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Simulated Telegram Admin Chat Simulator State
  const [activeAdminSubMenu, setActiveAdminSubMenu] = useState<string>('main');
  const [chatLog, setChatLog] = useState<
    { sender: 'bot' | 'admin'; text: string; buttons?: string[] }[]
  >([
    {
      sender: 'admin',
      text: '/admin',
    },
    {
      sender: 'bot',
      text: `👑 *PANEL PRIVADO DE ADMINISTRACIÓN*\n*Juan Carlos | Mines AI 💎*\n\nAcceso concedido para ID: \`${adminId}\`\n\nSelecciona una opción:`,
      buttons: [
        '1. Mensajes',
        '2. Preguntas',
        '3. Respuestas y Condiciones',
        '4. Fotografías',
        '5. Vídeos',
        '6. Tutoriales',
        '7. Usuarios',
        '8. Seguimiento de Registros',
        '9. Enlace de Referencia',
        '10. Configuración',
      ],
    },
  ]);

  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBotConfig({ ...botConfig, adminTelegramId: adminId });
    onSaveKeywordConfig({
      ...keywordConfig,
      keywordsYes: keywordsYesInput.split(',').map((s) => s.trim()).filter(Boolean),
      keywordsNo: keywordsNoInput.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAdminOptionClick = (option: string) => {
    const updated = [
      ...chatLog,
      { sender: 'admin' as const, text: option },
    ];

    if (option.includes('4. Fotografías') || option.includes('5. Vídeos')) {
      updated.push({
        sender: 'bot',
        text: `📸 *MÓDULO DE RECEPCIÓN MULTIMEDIA*\n\nEnvía ahora la fotografía o vídeo en este chat de Telegram.\n\nEl sistema te preguntará:\n1. ¿A qué sección corresponde? (03. Presentación, 07. Testimonios, 11. Guía ID).\n2. El texto del caption.\n\nUna vez enviado, se guardará y asociará automáticamente.`,
        buttons: ['Presentación (Paris)', 'Testimonios (3 capturas)', 'Guía ID (Paso 1, 2, 3)', '⬅️ Volver'],
      });
    } else if (option.includes('8. Seguimiento')) {
      const pendingCount = users.filter((u) => u.accountStatus === 'pendiente_revision').length;
      updated.push({
        sender: 'bot',
        text: `🔍 *SEGUIMIENTO DE REGISTROS*\n\nTotal de usuarios: *${users.length}*\nIDs pendientes de revisión: *${pendingCount}*\n\nÚltimos 3 IDs recibidos:\n` +
          users
            .filter((u) => u.accountId)
            .slice(-3)
            .map((u) => `• ${u.name}: \`${u.accountId}\` [${u.accountStatus.toUpperCase()}]`)
            .join('\n'),
        buttons: ['Revisar siguiente ID', '⬅️ Volver al menú'],
      });
    } else if (option.includes('Volver')) {
      updated.push({
        sender: 'bot',
        text: `👑 *MENÚ PRINCIPAL DE ADMINISTRACIÓN*\nSelecciona una opción:`,
        buttons: [
          '1. Mensajes',
          '2. Preguntas',
          '3. Respuestas y Condiciones',
          '4. Fotografías',
          '5. Vídeos',
          '6. Tutoriales',
          '7. Usuarios',
          '8. Seguimiento de Registros',
          '9. Enlace de Referencia',
          '10. Configuración',
        ],
      });
    } else {
      updated.push({
        sender: 'bot',
        text: `⚙️ Has seleccionado *${option}*.\nPuedes modificar los parámetros respondiendo directamente con el nuevo valor o desde el panel web sincronizado.`,
        buttons: ['⬅️ Volver al menú'],
      });
    }

    setChatLog(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-sky-500/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Menú Privado de Administración desde Telegram (/admin)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ACCESO RESTRINGIDO POR TELEGRAM ID
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Permite al administrador enviar fotos y vídeos directamente al bot por chat privado, cambiar textos, revisar IDs y reiniciar recorridos sin programar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle className="w-4 h-4" />
              Guardado
            </span>
          )}

          <button
            type="button"
            onClick={handleSendTestMessage}
            disabled={isSendingTest}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Enviar mensaje de prueba directo al ADMIN_TELEGRAM_ID"
          >
            <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
            <span>{isSendingTest ? 'Enviando...' : 'Enviar mensaje de prueba'}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            testResult.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <form onSubmit={handleSaveAdminConfig} className="space-y-4">
            {/* Telegram Admin ID Authorizer */}
            <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Identificador de Telegram Autorizado (ADMIN_TELEGRAM_ID)
              </h3>
              <p className="text-xs text-slate-400">
                Solo este ID de usuario podrá ejecutar el comando <code>/admin</code> y recibir el menú privado con permisos de carga multimedia.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ID Numérico de Telegram del Administrador
                </label>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="ej. 684920153"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Deterministic Keywords Config (SÍ / NO) */}
            <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                Diccionario Determinista de Respuestas (Sin IA)
              </h3>
              <p className="text-xs text-slate-400">
                Modifica las palabras clave que el bot reconoce determinísticamente como afirmativas y negativas.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Palabras Clave Afirmativas (SÍ)
                </label>
                <textarea
                  rows={3}
                  value={keywordsYesInput}
                  onChange={(e) => setKeywordsYesInput(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Palabras Clave Negativas (NO)
                </label>
                <textarea
                  rows={3}
                  value={keywordsNoInput}
                  onChange={(e) => setKeywordsNoInput(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Guardar Configuración Administrativa
              </button>
            </div>
          </form>
        </div>

        {/* Right: Simulated Telegram Admin Chat (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Simulación de Chat Privado /admin en Telegram
                </h3>
              </div>
              <button
                onClick={() =>
                  setChatLog([
                    { sender: 'admin', text: '/admin' },
                    {
                      sender: 'bot',
                      text: `👑 *PANEL PRIVADO DE ADMINISTRACIÓN*\n*Juan Carlos | Mines AI 💎*\n\nAcceso concedido para ID: \`${adminId}\`\n\nSelecciona una opción:`,
                      buttons: [
                        '1. Mensajes',
                        '2. Preguntas',
                        '3. Respuestas y Condiciones',
                        '4. Fotografías',
                        '5. Vídeos',
                        '6. Tutoriales',
                        '7. Usuarios',
                        '8. Seguimiento de Registros',
                        '9. Enlace de Referencia',
                        '10. Configuración',
                      ],
                    },
                  ])
                }
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                Reiniciar
              </button>
            </div>

            {/* Chat Box */}
            <div className="rounded-xl bg-[#0e1621] p-3 h-[420px] overflow-y-auto space-y-2.5 border border-slate-800 text-xs font-sans">
              {chatLog.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[88%] ${
                    item.sender === 'admin' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed ${
                      item.sender === 'admin'
                        ? 'bg-[#2b5278] text-white rounded-tr-sm font-semibold'
                        : 'bg-[#182533] text-slate-100 rounded-tl-sm border border-slate-700/40'
                    }`}
                  >
                    <p className="text-[11.5px]">{item.text}</p>
                  </div>

                  {item.buttons && (
                    <div className="grid grid-cols-2 gap-1.5 w-full pt-1.5">
                      {item.buttons.map((bText, bIdx) => (
                        <button
                          key={bIdx}
                          type="button"
                          onClick={() => handleAdminOptionClick(bText)}
                          className="p-1.5 rounded-lg text-[10.5px] font-semibold bg-[#242f3d] hover:bg-[#2e3c4e] text-sky-200 border border-sky-400/20 text-center transition-all cursor-pointer"
                        >
                          {bText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
