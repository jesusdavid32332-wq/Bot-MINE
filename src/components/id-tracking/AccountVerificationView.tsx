import React, { useState } from 'react';
import { AccountVerificationStatus, TelegramUser } from '../../types';
import { safeText } from '../../utils/safeText';
import { DataService } from '../../services/dataService';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  UserCheck,
  ExternalLink,
  Edit2,
  Lock,
  ArrowRight,
  Send,
  Sparkles,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

interface AccountVerificationViewProps {
  users: TelegramUser[];
  onUpdateUserStatus: (telegramId: string, status: AccountVerificationStatus, notes?: string) => void;
  onRefreshUsers?: () => void;
}

export const AccountVerificationView: React.FC<AccountVerificationViewProps> = ({
  users,
  onUpdateUserStatus,
  onRefreshUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'deposit'>('all');
  const [selectedUser, setSelectedUser] = useState<TelegramUser | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Filter users that have an ID or are in ID pending, deposit pending, or verified stages
  const relevantUsers = users.filter((u) => {
    return (
      Boolean(u.accountId) ||
      u.stage === 'stage_1_id_pending' ||
      u.stage === 'stage_2_id_verified' ||
      u.stage === 'stage_2_awaiting_receipt' ||
      u.stage === 'stage_2_payment_pending' ||
      u.stage === 'stage_2_payment_rejected' ||
      u.stage === 'stage_2_content_sent' ||
      u.stage === 'stage_2_practice_completed' ||
      u.paymentStatus === 'receipt_pending' ||
      u.paymentStatus === 'deposit_notified' ||
      u.accountStatus === 'pending_verification' ||
      u.accountStatus === 'verified' ||
      u.accountStatus === 'rejected' ||
      u.accountStatus === 'id_recibido'
    );
  });

  const isDepositPendingUser = (u: TelegramUser) =>
    u.paymentStatus === 'deposit_notified' ||
    u.paymentStatus === 'receipt_pending' ||
    u.stage === 'stage_2_payment_pending' ||
    u.stage === 'stage_2_awaiting_receipt';

  const filtered = relevantUsers.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.accountId && u.accountId.includes(searchQuery)) ||
      u.telegramId.includes(searchQuery);

    let matchesFilter = true;
    if (filterStage === 'pending') {
      matchesFilter = u.accountStatus === 'pending_verification' || u.accountStatus === 'id_recibido' || u.stage === 'stage_1_id_pending';
    } else if (filterStage === 'verified') {
      matchesFilter = u.accountStatus === 'verified' || u.stage?.startsWith('stage_2') || u.stage?.startsWith('stage_3');
    } else if (filterStage === 'rejected') {
      matchesFilter = u.accountStatus === 'rejected' || u.paymentStatus === 'payment_rejected';
    } else if (filterStage === 'deposit') {
      matchesFilter = isDepositPendingUser(u);
    }

    return matchesSearch && matchesFilter;
  });

  const countPending = relevantUsers.filter(
    (u) => u.accountStatus === 'pending_verification' || u.accountStatus === 'id_recibido' || u.stage === 'stage_1_id_pending'
  ).length;

  const countVerified = relevantUsers.filter(
    (u) => u.accountStatus === 'verified' || u.stage?.startsWith('stage_2') || u.stage?.startsWith('stage_3')
  ).length;

  const countRejected = relevantUsers.filter(
    (u) => u.accountStatus === 'rejected' || u.paymentStatus === 'payment_rejected'
  ).length;

  const countDeposits = relevantUsers.filter(isDepositPendingUser).length;

  const handleOpenReview = (user: TelegramUser) => {
    setSelectedUser(user);
    setAdminNotes(user.notes || '');
    setRejectionReason(user.idRejectedReason || '');
    setActionSuccessNotice(null);
  };

  // 1. ACEPTAR Y VERIFICAR ID (Desencadena Etapa 2 automáticamente)
  const handleAcceptAndVerifyId = async (userToVerify: TelegramUser) => {
    setIsProcessing(true);
    setActionSuccessNotice(null);
    try {
      const res = await DataService.verifyUserId(userToVerify.telegramId, 'Juan Carlos', adminNotes);
      if (res.success && res.user) {
        onUpdateUserStatus(userToVerify.telegramId, 'verified', adminNotes);
        setSelectedUser(res.user);
        setActionSuccessNotice('✅ ID verificado con éxito: Etapa 2 iniciada automáticamente y mensajes entregados al Telegram del usuario.');
        if (onRefreshUsers) onRefreshUsers();
      } else {
        alert(res.message || 'Error al verificar ID');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al procesar la verificación.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. RECHAZAR ID
  const handleRejectId = async (userToReject: TelegramUser) => {
    const reason = rejectionReason.trim() || 'El identificador enviado no concuerda con los registros.';
    setIsProcessing(true);
    setActionSuccessNotice(null);
    try {
      const res = await DataService.rejectUserId(userToReject.telegramId, 'Juan Carlos', reason);
      if (res.success && res.user) {
        onUpdateUserStatus(userToReject.telegramId, 'rejected', reason);
        setSelectedUser(res.user);
        setActionSuccessNotice('⚠️ ID rechazado. Mensaje de notificación enviado al usuario solicitando el ID correcto.');
        if (onRefreshUsers) onRefreshUsers();
      } else {
        alert(res.message || 'Error al rechazar ID');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al rechazar ID.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. CONFIRMAR OPERACIÓN / PAGO
  const handleVerifyPayment = async (userToVerify: TelegramUser) => {
    setIsProcessing(true);
    setActionSuccessNotice(null);
    try {
      const res = await DataService.verifyUserPayment(userToVerify.telegramId, 'Juan Carlos', adminNotes);
      if (res.success && res.user) {
        setSelectedUser(res.user);
        setActionSuccessNotice('💰 Depósito aprobado: Confirmación, 5 rondas ilustrativas y video de orientación entregados al Telegram del usuario.');
        if (onRefreshUsers) onRefreshUsers();
      } else {
        alert(res.message || 'Error al verificar pago');
      }
    } catch (err) {
      console.error(err);
      alert('Error verificando pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3B. RECHAZAR DEPÓSITO / COMPROBANTE
  const handleRejectPayment = async (userToReject: TelegramUser) => {
    const reason = rejectionReason.trim() || 'No pudimos validar tu comprobante de depósito.';
    setIsProcessing(true);
    setActionSuccessNotice(null);
    try {
      const res = await DataService.rejectUserPayment(userToReject.telegramId, 'Juan Carlos', reason);
      if (res.success && res.user) {
        setSelectedUser(res.user);
        setActionSuccessNotice('❌ Depósito rechazado. El usuario fue notificado en Telegram para enviar un nuevo comprobante.');
        if (onRefreshUsers) onRefreshUsers();
      } else {
        alert(res.message || 'Error al rechazar depósito');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al rechazar depósito.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. REINICIAR ETAPA (Para pruebas)
  const handleResetUserStage = async (telegramId: string) => {
    if (!window.confirm('¿Deseas reiniciar la etapa de este usuario a Etapa 1 para realizar una nueva prueba?')) return;
    setIsProcessing(true);
    try {
      const res = await DataService.resetUserStage(telegramId);
      if (res.success && res.user) {
        setSelectedUser(res.user);
        setActionSuccessNotice('🔄 Etapa del usuario reiniciada a Etapa 1.');
        if (onRefreshUsers) onRefreshUsers();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#070d1c] via-[#09152e] to-[#070d1c] border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Control de Verificación de IDs y Transición a Etapa 2
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              REGLA 2 Y 3 ACTIVAS
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            La <strong>Etapa 2</strong> NO comenzará en Telegram hasta que Juan Carlos pulse <strong>«ACEPTAR Y VERIFICAR ID»</strong>. Al pulsar el botón, el bot enviará automáticamente la confirmación y las instrucciones al chat del usuario.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/50 px-3.5 py-2 rounded-xl border border-emerald-500/30 font-medium">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Puerta Administrativa Activa</span>
        </div>
      </div>

      {/* KPI 4 States Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterStage('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === 'pending'
              ? 'bg-[#101c38] border-amber-400 shadow-lg shadow-amber-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">1. Pendientes de ID</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-amber-300 font-mono">{countPending}</span>
          <span className="block text-[11px] text-amber-400/80 mt-1">Esperando tu aceptación</span>
        </div>

        <div
          onClick={() => setFilterStage('verified')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === 'verified'
              ? 'bg-[#101c38] border-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">2. IDs Verificados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-emerald-300 font-mono">{countVerified}</span>
          <span className="block text-[11px] text-emerald-400/80 mt-1">En Etapa 2 o Etapa 3</span>
        </div>

        <div
          onClick={() => setFilterStage('deposit')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === 'deposit'
              ? 'bg-[#101c38] border-sky-400 shadow-lg shadow-sky-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">3. Depósitos Notificados</span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-sky-300 font-mono">{countDeposits}</span>
          <span className="block text-[11px] text-sky-400/80 mt-1">Comprobante por revisar</span>
        </div>

        <div
          onClick={() => setFilterStage('rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === 'rejected'
              ? 'bg-[#101c38] border-red-400 shadow-lg shadow-red-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">4. Rechazados</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-2xl font-bold text-red-300 font-mono">{countRejected}</span>
          <span className="block text-[11px] text-red-400/80 mt-1">Requirieron corregir ID</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#0c1424] rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterStage('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStage === 'all'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({relevantUsers.length})
          </button>
          <button
            onClick={() => setFilterStage('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              filterStage === 'pending'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendientes ({countPending})
          </button>
          <button
            onClick={() => setFilterStage('deposit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              filterStage === 'deposit'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Depósitos ({countDeposits})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID 1xBet, Telegram ID o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0c1424] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4 font-semibold">Usuario Telegram</th>
                <th className="py-3.5 px-4 font-semibold">ID 1xBet Enviado</th>
                <th className="py-3.5 px-4 font-semibold">País</th>
                <th className="py-3.5 px-4 font-semibold">Plan Inicial</th>
                <th className="py-3.5 px-4 font-semibold">Etapa Actual</th>
                <th className="py-3.5 px-4 font-semibold">Estado Verificación</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acción Administrativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    No se encontraron usuarios en esta vista.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isPending =
                    user.accountStatus === 'pending_verification' ||
                    user.accountStatus === 'id_recibido' ||
                    user.stage === 'stage_1_id_pending';
                  const isVerified = user.accountStatus === 'verified' || user.stage?.startsWith('stage_2') || user.stage?.startsWith('stage_3');
                  const hasDepositNotice = isDepositPendingUser(user);

                  return (
                    <tr
                      key={user.telegramId}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => handleOpenReview(user)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{safeText(user.name)}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          ID: {user.telegramId} · @{user.username || 'sin_alias'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.accountId ? (
                          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                            {user.accountId}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No enviado</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {safeText(user.country, user.declaredCountry || 'Sin dato')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium text-[11px]">
                          {user.initialPlanLabel || 'No seleccionado'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                          {user.flowStateLabel || user.stage || user.currentStep}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-400" />
                            PENDIENTE VERIFICACIÓN
                          </span>
                        ) : isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            VERIFICADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                            <XCircle className="w-3 h-3 text-red-400" />
                            RECHAZADO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleAcceptAndVerifyId(user)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                ACEPTAR Y VERIFICAR ID
                              </button>
                              <button
                                onClick={() => handleOpenReview(user)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 cursor-pointer"
                              >
                                Rechazar
                              </button>
                            </>
                          )}

                          {hasDepositNotice && (
                            <button
                              onClick={() => handleVerifyPayment(user)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-md shadow-sky-500/20 cursor-pointer flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              CONFIRMAR PAGO
                            </button>
                          )}

                          {!isPending && !hasDepositNotice && (
                            <button
                              onClick={() => handleOpenReview(user)}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                            >
                              Ver Detalles
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

      {/* Review & Transition Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#0c1424] border border-amber-500/30 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-bold">
                  Auditoría Administrativa de Etapas — Juan Carlos
                </span>
                <h3 className="text-base font-bold text-white">{safeText(selectedUser.name)}</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            {/* Action Success Alert */}
            {actionSuccessNotice && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                {actionSuccessNotice}
              </div>
            )}

            {/* User Core Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Telegram ID:</span>
                <span className="font-mono text-white font-bold">{selectedUser.telegramId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ID de Cuenta 1xBet:</span>
                <span className="font-mono text-amber-300 font-bold text-sm">
                  {selectedUser.accountId || 'Pendiente'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">País:</span>
                <span className="text-slate-200 font-semibold">{selectedUser.country || 'Sin registrar'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Plan Inicial:</span>
                <span className="text-amber-400 font-semibold">{selectedUser.initialPlanLabel || 'Ninguno'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Etapa Actual:</span>
                <span className="font-mono text-sky-300 font-bold text-[11px]">{selectedUser.stage}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Estado de Verificación:</span>
                <span className="font-bold text-white uppercase text-[11px]">{selectedUser.accountStatus}</span>
              </div>
            </div>

            {/* Transition Actions Area */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Acciones Directas del Administrador
              </h4>

              {/* ACTION BUTTON 1: ACEPTAR Y VERIFICAR ID */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">
                      Acción: ACEPTAR Y VERIFICAR ID
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Verifica el ID, fija estado verified y envía automáticamente el mensaje de confirmación e instrucciones de la Etapa 2 a Telegram.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAcceptAndVerifyId(selectedUser)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isProcessing ? 'Procesando y enviando a Telegram...' : 'ACEPTAR Y VERIFICAR ID (INICIAR ETAPA 2)'}
                </button>
              </div>

              {/* ACTION BUTTON 2: RECHAZAR ID */}
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                <span className="text-xs font-bold text-red-300 block">
                  Acción: RECHAZAR ID
                </span>
                <p className="text-[11px] text-slate-300">
                  Envía el mensaje oficial: <em>«No pude confirmar tu ID con la información recibida. Por favor, revisa los números y envíame nuevamente el identificador correcto.»</em>
                </p>
                <input
                  type="text"
                  placeholder="Motivo interno de rechazo (opcional)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleRejectId(selectedUser)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  RECHAZAR ID Y NOTIFICAR AL USUARIO
                </button>
              </div>

              {/* ACTION BUTTON 3: CONFIRMAR OPERACIÓN / PAGO */}
              <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-2">
                <span className="text-xs font-bold text-sky-300 block">
                  Acción: CONFIRMAR O RECHAZAR DEPÓSITO (ETAPA 2)
                </span>
                <p className="text-[11px] text-slate-300">
                  Aprueba manualmente el depósito para liberar las 5 rondas ilustrativas y el video explicativo, o recházalo para solicitar un nuevo comprobante.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleVerifyPayment(selectedUser)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    APROBAR DEPÓSITO Y ENVIAR ORIENTACIÓN
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRejectPayment(selectedUser)}
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    RECHAZAR DEPÓSITO
                  </button>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notas privadas del Administrador:
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Anotaciones privadas sobre este usuario..."
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            {/* Chronological Transition History */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Historial de Transiciones de Etapa:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedUser.stageTransitions && selectedUser.stageTransitions.length > 0 ? (
                  selectedUser.stageTransitions.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-amber-400 font-mono font-semibold">{tr.fromStage}</span>
                        <span className="text-slate-400 mx-1">➔</span>
                        <span className="text-emerald-400 font-mono font-semibold">{tr.toStage}</span>
                        {tr.reason && <div className="text-[10px] text-slate-400">{tr.reason}</div>}
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-mono">
                        <div>{new Date(tr.timestamp).toLocaleString()}</div>
                        <div>Por: {tr.actor} {tr.adminId ? `(${tr.adminId})` : ''}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-500 italic p-2 bg-slate-900/50 rounded-lg">
                    Sin transiciones registradas aún.
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Reset */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleResetUserStage(selectedUser.telegramId)}
                className="text-slate-400 hover:text-amber-400 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar usuario a Etapa 1
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
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
