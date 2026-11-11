import React, { useState } from 'react';
import { TelegramUser, UserConversation, ChatMessage } from '../../types';
import {
  MessagesSquare,
  Search,
  Send,
  Bot,
  User,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ConversationsIcon3D } from '../ui/Icons3D';

interface ConversationsViewProps {
  users: TelegramUser[];
  conversations: Record<string, UserConversation>;
  onSaveConversations: (updated: Record<string, UserConversation>) => void;
  initialSelectedUserId?: string;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  users,
  conversations,
  onSaveConversations,
  initialSelectedUserId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialSelectedUserId || users[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [manualReply, setManualReply] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'waiting' | 'attended'>('all');

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const userConv: UserConversation = (selectedUser ? conversations[selectedUser.id] : undefined) || {
    userId: selectedUser?.id || '',
    status: 'attended',
    lastMessageTime: 'Reciente',
    currentStep: (selectedUser?.currentStep || 'BIENVENIDA') as any,
    messages: [],
  };

  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReply.trim() || !selectedUser) return;

    const newMsg: ChatMessage = {
      id: `c-manual-${Date.now().toString().slice(-4)}`,
      sender: 'admin',
      text: `[Admin Juan Carlos]: ${manualReply}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedConv: UserConversation = {
      ...userConv,
      status: 'attended',
      messages: [...(userConv.messages || []), newMsg],
    };

    onSaveConversations({
      ...conversations,
      [selectedUser.id]: updatedConv,
    });

    setManualReply('');
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.telegramId.includes(searchQuery);
    const conv = conversations[u.id];
    if (filterState === 'waiting') return conv?.status === 'waiting_response';
    if (filterState === 'attended') return conv?.status === 'attended';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#070d1c] via-[#091329] to-[#070d1c] border border-amber-500/25 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Auditoría de Conversaciones en Directo
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              SINCRONIZACIÓN FIRESTORE
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Supervisión del intercambio de mensajes entre los usuarios y el motor determinista de Telegram.
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#070d1c] to-[#040813] border border-[#182745] text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ConversationsIcon3D size={36} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Todavía no hay conversaciones activas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Las conversaciones aparecerán aquí en vivo en cuanto los usuarios inicien su recorrido en Telegram con @JuanCarlosMinesAIBot.
            </p>
          </div>
        </div>
      ) : (
        /* Two Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-230px)] min-h-[600px]">
          {/* Left: User Chat List (4 Cols) */}
          <div className="lg:col-span-4 h-full rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#182745] space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#040813] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterState('all')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                    filterState === 'all'
                      ? 'bg-amber-400/20 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterState('waiting')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                    filterState === 'waiting'
                      ? 'bg-amber-500/20 text-amber-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  En espera
                </button>
                <button
                  onClick={() => setFilterState('attended')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                    filterState === 'attended'
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Atendidos
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#152037]">
              {filteredUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const conv = conversations[user.id];
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#0e1933] border-l-2 border-amber-400' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{user.name || 'Usuario'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {user.username ? `@${user.username}` : user.telegramId}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-300 font-medium truncate mt-0.5">
                          {user.stage || user.currentStep}
                        </p>
                      </div>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                          conv?.status === 'waiting_response'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {conv?.status === 'waiting_response' ? 'ESPERA' : 'OK'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>{user.country || 'Sin país'}</span>
                      <span>{user.lastActivity || 'Reciente'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Active Chat Viewer (8 Cols) */}
          <div className="lg:col-span-8 h-full rounded-2xl bg-[#070d1c] border border-[#14213d] flex flex-col overflow-hidden">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 bg-[#050914] border-b border-[#182745] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{selectedUser.name || 'Usuario'}</h3>
                      <span className="text-[11px] font-mono text-amber-300">
                        ID: {selectedUser.telegramId}
                      </span>
                      {selectedUser.country && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {selectedUser.country}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paso actual: <span className="text-sky-300 font-mono">{selectedUser.currentStep}</span>
                    </p>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#040711]">
                  {(userConv.messages || []).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-6 text-slate-500 text-xs">
                      No hay mensajes registrados aún en este chat.
                    </div>
                  ) : (
                    userConv.messages.map((msg) => {
                      const isBot = msg.sender === 'bot';
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 max-w-[85%] ${
                            !isBot ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isBot
                                ? 'bg-amber-500/20 text-amber-300'
                                : isAdmin
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isBot ? (
                              <Bot className="w-3.5 h-3.5" />
                            ) : isAdmin ? (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs space-y-1 shadow-sm ${
                              isBot
                                ? 'bg-[#0b1324] border border-[#1b2b4d] text-slate-200 rounded-tl-sm'
                                : isAdmin
                                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-tr-sm'
                                : 'bg-[#152037] text-white rounded-tr-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-mono">
                              <span>{isBot ? 'Juan Carlos (Bot)' : isAdmin ? 'Super Admin' : selectedUser.name}</span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Admin Reply Bar */}
                <form
                  onSubmit={handleSendManual}
                  className="p-3 bg-[#050914] border-t border-[#182745] flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Escribe una respuesta manual al usuario..."
                    value={manualReply}
                    onChange={(e) => setManualReply(e.target.value)}
                    className="flex-1 bg-[#091124] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-colors shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Selecciona un usuario de la lista izquierda
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
