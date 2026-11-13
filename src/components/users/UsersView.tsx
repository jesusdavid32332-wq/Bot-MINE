import React, { useState } from 'react';
import { TelegramUser, UserConversation } from '../../types';
import { safeText } from '../../utils/safeText';
import { DataService } from '../../services/dataService';
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
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  History,
} from 'lucide-react';

interface UsersViewProps {
  users: TelegramUser[];
  conversations: Record<string, UserConversation>;
  onSelectUserForChat?: (user: TelegramUser) => void;
  onRefreshUsers?: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  conversations,
  onSelectUserForChat,
  onRefreshUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [inspectingUser, setInspectingUser] = useState<TelegramUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.accountId && u.accountId.includes(searchQuery)) ||
      u.telegramId.includes(searchQuery);
    const matchesCountry = selectedCountry === 'all' || u.country === selectedCountry || u.declaredCountry === selectedCountry;
    const matchesStage = selectedStage === 'all' || u.stage === selectedStage;
    return matchesSearch && matchesCountry && matchesStage;
  });

  const uniqueCountries = Array.from(new Set(users.map((u) => u.country || u.declaredCountry).filter(Boolean)));
  const uniqueStages = Array.from(new Set(users.map((u) => u.stage).filter(Boolean)));

  const handleVerifyId = async (user: TelegramUser) => {
    setIsProcessing(true);
    setNotice(null);
    try {
      const res = await DataService.verifyUserId(user.telegramId, 'Juan Carlos');
      if (res.success && res.user) {
        setNotice(`✅ ID de ${user.name} verificado. Etapa 2 iniciada.`);
        setInspectingUser(res.user);
        if (onRefreshUsers) onRefreshUsers();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPayment = async (user: TelegramUser) => {
    setIsProcessing(true);
    setNotice(null);
    try {
      const res = await DataService.verifyUserPayment(user.telegramId, 'Juan Carlos');
      if (res.success && res.user) {
        setNotice(`💰 Depósito verificado para ${user.name}. Contenido Mines enviado.`);
        setInspectingUser(res.user);
        if (onRefreshUsers) onRefreshUsers();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getStageBadgeColor = (stage?: string) => {
    if (!stage) return 'bg-slate-800 text-slate-300';
    if (stage.startsWith('stage_1')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (stage.startsWith('stage_2')) return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    if (stage.startsWith('stage_3')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#070d1c] via-[#09152e] to-[#070d1c] border border-amber-500/25 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Directorio de Usuarios Reales de Telegram
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              AUDITORÍA FIRESTORE
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Control de usuarios individuales con su estado en las 3 etapas, país seleccionado, plan inicial y avanzado, ID de 1xBet y registro cronológico de transiciones.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Privacidad estricta: Estados aislados por usuario</span>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
          {notice}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Country filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-[#0c1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los países ({uniqueCountries.length})</option>
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
            className="bg-[#0c1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas las etapas ({uniqueStages.length})</option>
            {uniqueStages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, Telegram ID o ID 1xBet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0c1424] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4 font-semibold">Usuario</th>
                <th className="py-3.5 px-4 font-semibold">ID 1xBet</th>
                <th className="py-3.5 px-4 font-semibold">País</th>
                <th className="py-3.5 px-4 font-semibold">Plan Inicial</th>
                <th className="py-3.5 px-4 font-semibold">Etapa de Flujo</th>
                <th className="py-3.5 px-4 font-semibold">Verificación</th>
                <th className="py-3.5 px-4 font-semibold">Depósito / Pago</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    No hay usuarios registrados en el sistema todavía.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPending =
                    user.accountStatus === 'pending_verification' ||
                    user.accountStatus === 'id_recibido' ||
                    user.stage === 'stage_1_id_pending';

                  const hasDepositNotice =
                    user.paymentStatus === 'deposit_notified' ||
                    user.paymentStatus === 'receipt_pending' ||
                    user.stage === 'stage_2_payment_pending' ||
                    user.stage === 'stage_2_awaiting_receipt';

                  return (
                    <tr
                      key={user.telegramId}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setInspectingUser(user)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{safeText(user.name)}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {user.telegramId} · @{user.username || 'sin_alias'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.accountId ? (
                          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {user.accountId}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Pendiente</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {safeText(user.country, user.declaredCountry || 'Sin país')}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium text-[11px]">
                        {user.initialPlanLabel || 'Sin plan'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded border ${getStageBadgeColor(
                            user.stage
                          )}`}
                        >
                          {user.flowStateLabel || user.stage || user.currentStep}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.accountStatus === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            VERIFICADO
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            PENDIENTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 font-mono">
                            <XCircle className="w-3.5 h-3.5" />
                            RECHAZADO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {user.paymentStatus === 'payment_verified' ? (
                          <span className="text-emerald-400 font-mono text-[10px] font-bold">
                            ✅ PAGO APROBADO
                          </span>
                        ) : user.paymentStatus === 'receipt_pending' ? (
                          <span className="text-amber-300 font-mono text-[10px] font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                            🟡 COMPROBANTE POR REVISAR
                          </span>
                        ) : user.paymentStatus === 'payment_rejected' ? (
                          <span className="text-red-300 font-mono text-[10px] font-bold bg-red-500/15 px-2 py-0.5 rounded border border-red-500/30">
                            ❌ DEPÓSITO RECHAZADO
                          </span>
                        ) : hasDepositNotice ? (
                          <span className="text-sky-300 font-mono text-[10px] font-bold bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/30">
                            📸 ESPERANDO COMPROBANTE
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[10px]">Sin aviso</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleVerifyId(user)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                            >
                              Verificar ID
                            </button>
                          )}

                          {hasDepositNotice && (
                            <button
                              onClick={() => handleVerifyPayment(user)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20"
                            >
                              Aprobar Pago
                            </button>
                          )}

                          {onSelectUserForChat && (
                            <button
                              onClick={() => onSelectUserForChat(user)}
                              title="Ver chat"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect User Drawer / Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#0c1424] border border-amber-500/30 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-bold">
                  Ficha Detallada de Usuario
                </span>
                <h3 className="text-base font-bold text-white">{safeText(inspectingUser.name)}</h3>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Telegram ID:</span>
                <span className="font-mono text-white font-bold">{inspectingUser.telegramId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ID de Cuenta 1xBet:</span>
                <span className="font-mono text-amber-300 font-bold text-sm">
                  {inspectingUser.accountId || 'No enviado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">País Registrado:</span>
                <span className="text-white font-semibold">{inspectingUser.country || 'Sin registrar'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Plan Inicial:</span>
                <span className="text-amber-400 font-semibold">{inspectingUser.initialPlanLabel || 'Ninguno'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Plan Avanzado (Etapa 3):</span>
                <span className="text-emerald-400 font-semibold">{inspectingUser.advancedPlanLabel || 'Ninguno'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Comisión 10% Aceptada:</span>
                <span className="font-semibold text-white">
                  {inspectingUser.termsAccepted ? '✅ Aceptada' : '❌ No aceptada / Pendiente'}
                </span>
              </div>
            </div>

            {/* Transition Timeline */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Línea de Tiempo de Transiciones (Auditoría):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {inspectingUser.stageTransitions && inspectingUser.stageTransitions.length > 0 ? (
                  inspectingUser.stageTransitions.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-amber-300">{tr.fromStage} ➔ {tr.toStage}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(tr.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tr.reason || 'Transición registrada'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Actor: {tr.actor} {tr.adminId ? `· Admin: ${tr.adminId}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-900 rounded-xl">
                    Sin transiciones registradas aún.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
