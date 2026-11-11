import React from 'react';
import { TelegramUser } from '../../types';
import { safeText } from '../../utils/safeText';
import {
  Users,
  UserPlus,
  Activity,
  CheckCircle2,
  Clock,
  Send,
  Bot,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  Flame,
  Radio,
  FileCheck,
  Play,
  Layers,
  Sparkles,
  Database,
} from 'lucide-react';
import {
  DashboardIcon3D,
  MessagesIcon3D,
  IdTrackingIcon3D,
  FlowIcon3D,
} from '../ui/Icons3D';

interface DashboardViewProps {
  users: TelegramUser[];
  onSelectUser: (user: TelegramUser) => void;
  onNavigateSection: (section: any) => void;
  onOpenSimulator?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  onSelectUser,
  onNavigateSection,
  onOpenSimulator,
}) => {
  // Real dynamic metrics calculated directly from Cloud Firestore users
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active' || u.status === 'waiting_reply').length;
  const completedUsers = users.filter(
    (u) => u.status === 'completed' || u.currentStep === 'FINALIZACION'
  ).length;
  const idsRegistered = users.filter((u) => Boolean(u.accountId && u.accountId.trim().length > 0)).length;
  const pendingReview = users.filter((u) => u.accountStatus === 'pendiente_revision').length;
  const approvedIds = users.filter((u) => u.accountStatus === 'revisado').length;

  const totalMessagesSent = users.reduce((acc, u) => acc + (u.messagesSent || 0), 0);
  const totalMessagesReceived = users.reduce((acc, u) => acc + (u.messagesReceived || 0), 0);

  // Calculate funnel steps from real users
  const usersWithCountry = users.filter((u) => Boolean(u.country && u.country.trim() !== '')).length;
  const usersWithExperience = users.filter((u) => Boolean(u.experienceLevel)).length;

  return (
    <div className="space-y-6">
      {/* Infrastructure Real-Time Cloud Status Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#060c1c] via-[#091329] to-[#060c1c] border border-amber-500/25 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 via-sky-500/15 to-slate-900 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/20">
            <DashboardIcon3D size={28} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Juan Carlos | Mines AI 💎 — Sistema en Producción
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                CLOUD FIRESTORE CONECTADO
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Panel administrativo conectado a la base de datos Firestore y preparado para recibir el webhook de Telegram Bot API en Google Cloud Run.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => onNavigateSection('telegram-connection')}
            className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all cursor-pointer text-center shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Conectar Telegram
          </button>
          <button
            onClick={() => onNavigateSection('general-config')}
            className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-[#0d1629] hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all cursor-pointer text-center"
          >
            Estado del Servidor
          </button>
        </div>
      </div>

      {/* Dynamic Real KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col justify-between shadow-sm hover:border-sky-500/30 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total usuarios</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {totalUsers}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              Registrados en Firestore
            </span>
          </div>
        </div>

        {/* Active Users */}
        <div className="p-4 rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col justify-between shadow-sm hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Activos en flujo</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-amber-300 font-mono tabular-nums">
              {activeUsers}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              En conversación
            </span>
          </div>
        </div>

        {/* IDs Received */}
        <div className="p-4 rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col justify-between shadow-sm hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">IDs de cuenta</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              {idsRegistered}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              1xBet capturados
            </span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="p-4 rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col justify-between shadow-sm hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pend. revisión</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
              {pendingReview}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              Por auditar
            </span>
          </div>
        </div>

        {/* Flow Completed */}
        <div className="p-4 rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col justify-between shadow-sm hover:border-sky-500/30 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completados</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {completedUsers}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              Tutorial finalizado
            </span>
          </div>
        </div>

        {/* Automated Messages Sent */}
        <div className="p-4 rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col justify-between shadow-sm hover:border-sky-500/30 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Msgs enviados</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Send className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {totalMessagesSent}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              Por Telegram Bot
            </span>
          </div>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Telegram Webhook Card */}
        <div className="p-5 rounded-2xl bg-[#070d1c] border border-[#14213d] flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Bot de Telegram Oficial</h3>
                <p className="text-xs font-mono text-amber-300">@JuanCarlosMinesAIBot</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Motor: <span className="text-emerald-400 font-semibold">15 Pasos Deterministas (Sin Gemini)</span>
            </p>
            <p className="text-xs text-slate-400">
              Webhook listo en <code className="text-sky-300 font-mono">/api/telegram/webhook</code> con deduplicación por update_id y autenticación por secret token.
            </p>
          </div>

          <button
            onClick={() => onNavigateSection('bot-config')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#0f1a30] hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Ajustes Bot
          </button>
        </div>

        {/* Database Status Card */}
        <div className="p-5 rounded-2xl bg-[#070d1c] border border-[#14213d] flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Neon PostgreSQL</h3>
                <p className="text-xs font-mono text-teal-300">Serverless Driver · Compatible con Vercel</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Persistencia: <span className="text-teal-400 font-semibold">Esquema SQL Migrado</span>
            </p>
            <p className="text-xs text-slate-400">
              Tablas activas: <code>users</code>, <code>messages</code>, <code>conversations</code>, <code>media_items</code>, <code>conditions</code>, <code>settings</code>, <code>processed_updates</code>.
            </p>
          </div>

          <button
            onClick={() => onNavigateSection('messages')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#0f1a30] hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Ver Mensajes
          </button>
        </div>
      </div>

      {/* Main Section: Either Professional Empty State OR Real Data Tables */}
      {totalUsers === 0 ? (
        /* PROFESSIONAL EMPTY STATE */
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#070d1c] to-[#040813] border border-[#182745] text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400/20 via-sky-500/15 to-slate-900 border border-amber-400/40 flex items-center justify-center shadow-xl shadow-amber-950/30">
            <DashboardIcon3D size={44} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Todavía no hay usuarios registrados
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tu bot de Telegram está programado y listo. En cuanto los usuarios inicien conversación pulsando <span className="text-amber-400 font-mono">/start</span> o recibas actualizaciones mediante el webhook, sus perfiles e historial se sincronizarán en tiempo real en esta pantalla.
            </p>
          </div>

          {/* System Readiness Checklist */}
          <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1b2b4d] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">15 Mensajes Automáticos</p>
                <p className="text-[11px] text-slate-400">Recorrido determinista configurado</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1b2b4d] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Cloud Firestore Activo</p>
                <p className="text-[11px] text-slate-400">Base de datos de Google conectada</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1b2b4d] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">8 Recursos Multimedia</p>
                <p className="text-[11px] text-slate-400">Fotos de París, guía 1-2-3 y vídeo</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1b2b4d] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Endpoint Webhook Listo</p>
                <p className="text-[11px] text-slate-400">POST /api/telegram/webhook</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateSection('messages')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0d1629] hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Revisar Mensajes del Bot
            </button>
            <button
              onClick={() => onNavigateSection('flow')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0d1629] hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Ver Diagrama de Flujo
            </button>
          </div>
        </div>
      ) : (
        /* REAL USERS & CONVERSION FUNNEL VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Real Funnel Breakdown */}
          <div className="p-5 rounded-2xl bg-[#070d1c] border border-[#14213d] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Embudo de Conversión Real</h3>
              <p className="text-xs text-slate-400 mt-0.5">Progreso medido en usuarios de Firestore</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>1. START / Bienvenida</span>
                  <span className="font-mono text-sky-400">100% ({totalUsers})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>2. País Identificado</span>
                  <span className="font-mono text-sky-400">
                    {totalUsers > 0 ? Math.round((usersWithCountry / totalUsers) * 100) : 0}% ({usersWithCountry})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full"
                    style={{
                      width: `${totalUsers > 0 ? Math.round((usersWithCountry / totalUsers) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>3. Experiencia Registrada</span>
                  <span className="font-mono text-amber-400">
                    {totalUsers > 0 ? Math.round((usersWithExperience / totalUsers) * 100) : 0}% ({usersWithExperience})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{
                      width: `${totalUsers > 0 ? Math.round((usersWithExperience / totalUsers) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>4. ID 1xBet Enviado</span>
                  <span className="font-mono text-emerald-400">
                    {totalUsers > 0 ? Math.round((idsRegistered / totalUsers) * 100) : 0}% ({idsRegistered})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${totalUsers > 0 ? Math.round((idsRegistered / totalUsers) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>5. Recorrido Completado</span>
                  <span className="font-mono text-emerald-300">
                    {totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0}% ({completedUsers})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{
                      width: `${totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Real Users Table */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#070d1c] border border-[#14213d] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Usuarios Recientes</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sincronizados en Cloud Firestore</p>
              </div>
              <button
                onClick={() => onNavigateSection('users')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Ver todos ({totalUsers})
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#182745] text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">ID Telegram</th>
                    <th className="py-2.5 px-3">País</th>
                    <th className="py-2.5 px-3">Paso</th>
                    <th className="py-2.5 px-3">ID Cuenta</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152037]">
                  {users.slice(0, 6).map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => onSelectUser(user)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {safeText(user.name, 'Usuario Telegram')}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {user.username ? `@${safeText(user.username)}` : safeText(user.telegramId)}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{safeText(user.telegramId)}</td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-slate-200">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          {safeText(user.country, 'No especificado')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 font-mono text-[11px]">{safeText(user.currentStep)}</span>
                      </td>
                      <td className="py-3 px-3">
                        {user.accountId ? (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {safeText(user.accountId)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Pendiente</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectUser(user);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#0f1a30] hover:bg-amber-500 hover:text-black text-slate-200 transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
