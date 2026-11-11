import React, { useState } from 'react';
import { TelegramUser, UserConversation } from '../../types';
import { safeText } from '../../utils/safeText';
import { Modal } from '../ui/Modal';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface UsersViewProps {
  users: TelegramUser[];
  conversations: Record<string, UserConversation>;
  onSelectUserForChat?: (user: TelegramUser) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  conversations,
  onSelectUserForChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [inspectingUser, setInspectingUser] = useState<TelegramUser | null>(null);

  // Filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.telegramId.includes(searchQuery);
    const matchesCountry = selectedCountry === 'all' || u.country === selectedCountry;
    const matchesStage = selectedStage === 'all' || u.stage === selectedStage;
    return matchesSearch && matchesCountry && matchesStage;
  });

  const uniqueCountries = Array.from(new Set(users.map((u) => u.country)));
  const uniqueStages = Array.from(new Set(users.map((u) => u.stage)));

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#070d1c] via-[#091329] to-[#070d1c] border border-amber-500/25 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Directorio de Usuarios de Telegram
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              CLOUD FIRESTORE EN VIVO
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Registro de usuarios reales, país declarado, progreso del recorrido determinista y ID de cuenta.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privacidad estricta: Sin contraseñas ni datos bancarios (+18)</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Country filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-[#0c1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todos los países</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stage filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-[#0c1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todas las etapas</option>
            {uniqueStages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, @username o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#0c1424] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-[#090f1d]">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">ID Telegram</th>
                <th className="py-3 px-4">País Declarado</th>
                <th className="py-3 px-4">Etapa del Flujo</th>
                <th className="py-3 px-4">Interacciones</th>
                <th className="py-3 px-4">Última Actividad</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Todavía no hay usuarios registrados</h4>
                      <p className="text-xs text-slate-400">
                        Los usuarios aparecerán aquí automáticamente en tiempo real cuando inicien conversación en Telegram (@JuanCarlosMinesAIBot) o envíen mensajes al webhook en Google Cloud Run.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-slate-400 text-xs">
                    No se encontraron usuarios coincidentes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setInspectingUser(user)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                        {safeText(user.name, 'Usuario Telegram')}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {user.username ? `@${safeText(user.username)}` : safeText(user.telegramId)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                      {safeText(user.telegramId)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        {safeText(user.country, 'No especificado')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        {safeText(user.stage || user.currentStep)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                      <span>{user.messagesSent || 0} env.</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span>{user.messagesReceived || 0} rec.</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {safeText(user.lastActivity, 'Reciente')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : user.status === 'waiting_reply'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {user.status === 'active'
                          ? 'Activo'
                          : user.status === 'waiting_reply'
                          ? 'Esperando'
                          : 'Completado'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingUser(user);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0f1a30] hover:bg-amber-500 hover:text-black text-slate-200 transition-colors"
                      >
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Drawer / Modal */}
      {inspectingUser && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingUser(null)}
          title={`Perfil de Usuario: ${inspectingUser.name}`}
          subtitle={`ID Telegram: ${inspectingUser.telegramId} · @${inspectingUser.username}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5">
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">País Voluntario</span>
                <span className="text-xs font-bold text-white">{inspectingUser.country}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Etapa de Conversación</span>
                <span className="text-xs font-bold text-sky-400">{inspectingUser.stage}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Experiencia en Mines</span>
                <span className="text-xs font-bold text-amber-400 capitalize">
                  {inspectingUser.experienceLevel === 'experimentado' ? 'Sí (Avanzado)' : 'No (Principiante)'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ID 1xBet</span>
                <span className="text-xs font-bold text-emerald-400">
                  {inspectingUser.accountId ? `#${inspectingUser.accountId}` : 'Pendiente'}
                </span>
              </div>
            </div>

            {/* Conversation Transcript */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Historial de Conversación con el Bot
                </h4>
                {onSelectUserForChat && (
                  <button
                    onClick={() => {
                      onSelectUserForChat(inspectingUser);
                      setInspectingUser(null);
                    }}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    Abrir en chat en vivo
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {conversations[inspectingUser.id]?.messages?.length ? (
                <div className="p-3 rounded-xl bg-[#090f1d] border border-slate-800 space-y-2.5 max-h-64 overflow-y-auto">
                  {conversations[inspectingUser.id].messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                        m.sender === 'user'
                          ? 'ml-auto bg-sky-950/60 border border-sky-500/20 text-sky-100'
                          : (m.sender as string) === 'gemini'
                          ? 'mr-auto bg-amber-950/40 border border-amber-500/20 text-amber-100'
                          : 'mr-auto bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] opacity-70 mb-1 font-mono">
                        <span className="font-bold uppercase">
                          {m.sender === 'user' ? 'Usuario' : (m.sender as string) === 'gemini' ? 'Gemini AI' : 'Bot Juan Carlos'}
                        </span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{safeText(m.text)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  Sin mensajes registrados aún para este usuario.
                </div>
              )}
            </div>

            {/* Privacy & Responsible Gaming Notice */}
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Protección de privacidad: Este panel no almacena contraseñas, medios de pago ni información financiera sensible. Cumple directivas de juego responsable para mayores de 18 años.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
