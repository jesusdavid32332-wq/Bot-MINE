import React, { useState } from 'react';
import { DepositReceipt, DepositReceiptStatus, TelegramUser } from '../../types';
import { DataService } from '../../services/dataService';
import { safeText } from '../../utils/safeText';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ZoomIn,
  X,
  MessageSquare,
  ShieldCheck,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface DepositVerificationViewProps {
  deposits: DepositReceipt[];
  users: TelegramUser[];
  onRefreshAll: () => void;
  onSelectUserForChat?: (user: TelegramUser) => void;
}

export const DepositVerificationView: React.FC<DepositVerificationViewProps> = ({
  deposits,
  users,
  onRefreshAll,
  onSelectUserForChat,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | DepositReceiptStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [zoomedReceipt, setZoomedReceipt] = useState<DepositReceipt | null>(null);
  const [rejectModalReceipt, setRejectModalReceipt] = useState<DepositReceipt | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const countPending = deposits.filter((d) => d.status === 'pending').length;
  const countVerified = deposits.filter((d) => d.status === 'verified').length;
  const countRejected = deposits.filter((d) => d.status === 'rejected').length;

  const awaitingPhotoUsers = users.filter(
    (u) =>
      u.stage === 'stage_2_awaiting_receipt' ||
      u.flowStateLabel === 'COMPROBANTE PENDIENTE'
  );

  const filteredDeposits = deposits.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.username && d.username.toLowerCase().includes(q)) ||
      (d.telegramId && d.telegramId.includes(q)) ||
      (d.accountId && d.accountId.includes(q)) ||
      (d.planLabel && d.planLabel.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApproveDeposit = async (receipt: DepositReceipt) => {
    setProcessingId(receipt.id);
    setActionNotice(null);
    try {
      const res = await DataService.approveDeposit(receipt.id, 'Juan Carlos');
      if (res.success) {
        setActionNotice({
          type: 'success',
          text: `✅ Depósito de ${safeText(receipt.name)} aprobado. Se enviaron la confirmación, las 5 rondas de orientación y el video de Mines a Telegram.`,
        });
        onRefreshAll();
      } else {
        setActionNotice({
          type: 'error',
          text: res.error || res.message || 'No se pudo aprobar el comprobante.',
        });
      }
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: 'Error de conexión al aprobar el depósito.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDeposit = async (receipt: DepositReceipt) => {
    setProcessingId(receipt.id);
    setActionNotice(null);
    try {
      const reason =
        rejectionReason.trim() || 'La imagen del comprobante no es legible o no coincide.';
      const res = await DataService.rejectDeposit(receipt.id, 'Juan Carlos', reason);
      if (res.success) {
        setActionNotice({
          type: 'success',
          text: `❌ Comprobante de ${safeText(receipt.name)} rechazado. Se notificó al usuario en Telegram para que envíe un nuevo comprobante.`,
        });
        setRejectModalReceipt(null);
        setRejectionReason('');
        onRefreshAll();
      } else {
        setActionNotice({
          type: 'error',
          text: res.error || res.message || 'No se pudo rechazar el comprobante.',
        });
      }
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: 'Error de conexión al rechazar el comprobante.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#070d1c] via-[#0a1833] to-[#070d1c] border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              💳 DEPÓSITOS PENDIENTES — Verificación Manual de Comprobantes
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              CERO AUTO-APROBACIÓN
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Todo comprobante recibido por Telegram queda en estado <strong>🟡 PENDIENTE DE VERIFICACIÓN</strong>. El acceso al material de orientación y las 5 rondas solo se libera cuando Juan Carlos pulsa <strong>«✅ APROBAR DEPÓSITO»</strong>.
          </p>
        </div>

        <button
          onClick={onRefreshAll}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar Lista
        </button>
      </div>

      {/* Feedback Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          <span>{actionNotice.text}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterStatus('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'pending'
              ? 'bg-[#101c38] border-amber-400 shadow-lg shadow-amber-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">🟡 Pendientes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-amber-300 font-mono">{countPending}</span>
          <span className="block text-[11px] text-amber-400/80 mt-1">Por verificar</span>
        </div>

        <div
          onClick={() => setFilterStatus('verified')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'verified'
              ? 'bg-[#101c38] border-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">✅ Verificados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-emerald-300 font-mono">{countVerified}</span>
          <span className="block text-[11px] text-emerald-400/80 mt-1">Orientación enviada</span>
        </div>

        <div
          onClick={() => setFilterStatus('rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'rejected'
              ? 'bg-[#101c38] border-red-400 shadow-lg shadow-red-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">❌ Rechazados</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-2xl font-bold text-red-300 font-mono">{countRejected}</span>
          <span className="block text-[11px] text-red-400/80 mt-1">Acceso bloqueado</span>
        </div>

        <div
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-[#101c38] border-sky-400 shadow-lg shadow-sky-500/10'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Recibidos</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-sky-300 font-mono">{deposits.length}</span>
          <span className="block text-[11px] text-sky-400/80 mt-1">Historial completo</span>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0c1424] rounded-xl border border-slate-800">
          {[
            { id: 'pending', label: `Pendientes (${countPending})` },
            { id: 'verified', label: `Verificados (${countVerified})` },
            { id: 'rejected', label: `Rechazados (${countRejected})` },
            { id: 'all', label: `Todos (${deposits.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, @usuario, Telegram ID o plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Awaiting Screenshot Users Notice */}
      {awaitingPhotoUsers.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#091224] border border-sky-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
            <ImageIcon className="w-4 h-4 text-sky-400" />
            <span>Usuarios que avisaron depósito y aún no envían la foto ({awaitingPhotoUsers.length}):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {awaitingPhotoUsers.map((u) => (
              <div
                key={u.telegramId}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2"
              >
                <span className="font-semibold text-white">{safeText(u.name)}</span>
                <span className="font-mono text-sky-400">@{u.username || u.telegramId}</span>
                {u.initialPlanLabel && (
                  <span className="text-amber-300 font-medium">· {u.initialPlanLabel}</span>
                )}
                {onSelectUserForChat && (
                  <button
                    onClick={() => onSelectUserForChat(u)}
                    className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
                  >
                    Ver chat
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipts Grid */}
      {filteredDeposits.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#0c1424] border border-slate-800 text-center space-y-2">
          <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            No hay comprobantes en esta vista
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cuando un usuario envíe una fotografía o captura de comprobante en Telegram, aparecerá aquí automáticamente para su revisión manual.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDeposits.map((receipt) => {
            const isPending = receipt.status === 'pending';
            const isVerified = receipt.status === 'verified';
            const isProcessing = processingId === receipt.id;
            const matchedUser = users.find((u) => u.telegramId === receipt.telegramId);

            return (
              <div
                key={receipt.id}
                className={`p-4 rounded-2xl bg-[#0c1424] border shadow-lg flex flex-col sm:flex-row gap-4 transition-all ${
                  isPending
                    ? 'border-amber-500/40'
                    : isVerified
                    ? 'border-emerald-500/30'
                    : 'border-red-500/30'
                }`}
              >
                {/* Receipt Image Preview */}
                <div
                  onClick={() => setZoomedReceipt(receipt)}
                  className="relative w-full sm:w-40 h-52 sm:h-auto min-h-[180px] rounded-xl overflow-hidden bg-black border border-slate-800 shrink-0 cursor-pointer group"
                >
                  <img
                    src={receipt.receiptUrl}
                    alt={`Comprobante de ${safeText(receipt.name)}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-semibold flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" />
                      Ampliar
                    </span>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">
                          {safeText(receipt.name, 'Usuario Telegram')}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400">
                          @{receipt.username || 'sin_alias'} · ID TG: {receipt.telegramId}
                        </p>
                      </div>

                      {isPending ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                          🟡 PENDIENTE DE VERIFICACIÓN
                        </span>
                      ) : isVerified ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          ✅ VERIFICADO
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-300 border border-red-500/30 shrink-0">
                          ❌ RECHAZADO
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Plan Seleccionado:</span>
                        <span className="font-semibold text-amber-300">
                          {receipt.planLabel || 'No seleccionado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Recibido:</span>
                        <span className="font-mono text-slate-200">
                          {formatTimestamp(receipt.receivedAt)}
                        </span>
                      </div>
                      {receipt.accountId && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">ID Cuenta 1xBet:</span>
                          <span className="font-mono font-bold text-sky-300">{receipt.accountId}</span>
                        </div>
                      )}
                      {receipt.reviewedBy && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">Revisado por:</span>
                          <span className="text-slate-200 font-medium">{receipt.reviewedBy}</span>
                        </div>
                      )}
                    </div>

                    {receipt.caption && (
                      <p className="text-[11px] text-slate-300 italic bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        Nota usuario: "{receipt.caption}"
                      </p>
                    )}

                    {receipt.status === 'rejected' && receipt.rejectionReason && (
                      <div className="text-[11px] text-red-300 bg-red-950/30 px-2.5 py-1.5 rounded-lg border border-red-500/30 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Motivo: {receipt.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApproveDeposit(receipt)}
                          disabled={isProcessing}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isProcessing ? 'Procesando...' : '✅ APROBAR DEPÓSITO'}
                        </button>
                        <button
                          onClick={() => {
                            setRejectModalReceipt(receipt);
                            setRejectionReason('');
                          }}
                          disabled={isProcessing}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          ❌ RECHAZAR DEPÓSITO
                        </button>
                      </>
                    )}

                    {receipt.status === 'rejected' && (
                      <button
                        onClick={() => handleApproveDeposit(receipt)}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Re-aprobar Depósito
                      </button>
                    )}

                    {matchedUser && onSelectUserForChat && (
                      <button
                        onClick={() => onSelectUserForChat(matchedUser)}
                        className="py-2 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        Ver Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Resolution Image Zoom Modal */}
      {zoomedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setZoomedReceipt(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0c1424] border border-slate-700 rounded-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Comprobante — {safeText(zoomedReceipt.name)}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  @{zoomedReceipt.username || zoomedReceipt.telegramId} · {zoomedReceipt.planLabel}
                </p>
              </div>
              <button
                onClick={() => setZoomedReceipt(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-black flex items-center justify-center">
              <img
                src={zoomedReceipt.receiptUrl}
                alt="Comprobante ampliado"
                className="max-w-full max-h-[68vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {zoomedReceipt.status === 'pending' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    const target = zoomedReceipt;
                    setZoomedReceipt(null);
                    setRejectModalReceipt(target);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 cursor-pointer"
                >
                  ❌ RECHAZAR DEPÓSITO
                </button>
                <button
                  onClick={() => {
                    const target = zoomedReceipt;
                    setZoomedReceipt(null);
                    handleApproveDeposit(target);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
                >
                  ✅ APROBAR DEPÓSITO
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0c1424] border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Rechazar Comprobante de Depósito
              </h3>
              <button
                onClick={() => setRejectModalReceipt(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Usuario: <strong>{safeText(rejectModalReceipt.name)}</strong> (@
              {rejectModalReceipt.username || rejectModalReceipt.telegramId}). El acceso a las rondas seguirá bloqueado y el bot le pedirá enviar un comprobante válido.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo del rechazo (se enviará al usuario):
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej. La imagen está borrosa o no muestra el valor completo del depósito."
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectModalReceipt(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={processingId === rejectModalReceipt.id}
                onClick={() => handleRejectDeposit(rejectModalReceipt)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white cursor-pointer disabled:opacity-50"
              >
                {processingId === rejectModalReceipt.id ? 'Enviando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
