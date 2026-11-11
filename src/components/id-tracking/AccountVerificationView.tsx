import React, { useState } from 'react';
import { AccountVerificationStatus, TelegramUser } from '../../types';
import { safeText } from '../../utils/safeText';
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
} from 'lucide-react';

interface AccountVerificationViewProps {
  users: TelegramUser[];
  onUpdateUserStatus: (telegramId: string, status: AccountVerificationStatus, notes?: string) => void;
}

export const AccountVerificationView: React.FC<AccountVerificationViewProps> = ({
  users,
  onUpdateUserStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AccountVerificationStatus>('all');
  const [selectedUser, setSelectedUser] = useState<TelegramUser | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const usersWithAccount = users.filter((u) => u.accountId || u.currentStep === 'RECEPCION_ID' || u.currentStep === 'FINALIZACION');

  const filtered = usersWithAccount.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.accountId && u.accountId.includes(searchQuery)) ||
      u.telegramId.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || u.accountStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const countStatus = (st: AccountVerificationStatus) =>
    users.filter((u) => u.accountStatus === st).length;

  const handleOpenReview = (user: TelegramUser) => {
    setSelectedUser(user);
    setAdminNotes(user.notes || '');
  };

  const handleSaveStatus = (newStatus: AccountVerificationStatus) => {
    if (!selectedUser) return;
    onUpdateUserStatus(selectedUser.telegramId, newStatus, adminNotes);
    setSelectedUser({
      ...selectedUser,
      accountStatus: newStatus,
      notes: adminNotes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#070d1c] via-[#091329] to-[#070d1c] border border-amber-500/25 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Seguimiento y Control de IDs de Cuenta (1xBet)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              AUDITORÍA FIRESTORE EN VIVO
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Distingue entre: <strong>ID recibido</strong>, <strong>Pendiente de revisión</strong>, <strong>Revisado</strong> y <strong>No verificable</strong>. Sin verificaciones inventadas.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Almacenamiento exclusivo con consentimiento (+18)</span>
        </div>
      </div>

      {/* KPI 4 States Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterStatus('id_recibido')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'id_recibido'
              ? 'bg-[#101b33] border-sky-400'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">1. ID Recibido</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono">{countStatus('id_recibido')}</span>
          <span className="block text-[10px] text-slate-400 mt-1">Recién compartido por usuario</span>
        </div>

        <div
          onClick={() => setFilterStatus('pendiente_revision')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'pendiente_revision'
              ? 'bg-[#101b33] border-amber-400'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">2. Pendiente Revisión</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-amber-300 font-mono">
            {countStatus('pendiente_revision')}
          </span>
          <span className="block text-[10px] text-amber-400/80 mt-1">En cola de comprobación</span>
        </div>

        <div
          onClick={() => setFilterStatus('revisado')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'revisado'
              ? 'bg-[#101b33] border-emerald-400'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">3. Revisado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-300 font-mono">
            {countStatus('revisado')}
          </span>
          <span className="block text-[10px] text-emerald-400/80 mt-1">Comprobado por administrador</span>
        </div>

        <div
          onClick={() => setFilterStatus('no_verificable')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'no_verificable'
              ? 'bg-[#101b33] border-red-400'
              : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">4. No Verificable</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-xl font-bold text-red-300 font-mono">
            {countStatus('no_verificable')}
          </span>
          <span className="block text-[10px] text-red-400/80 mt-1">Formato erróneo o sin registro</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#0c1424] rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400'
            }`}
          >
            Todos ({usersWithAccount.length})
          </button>
          <button
            onClick={() => setFilterStatus('pendiente_revision')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'pendiente_revision'
                ? 'bg-amber-500/20 text-amber-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Por Revisar
          </button>
          <button
            onClick={() => setFilterStatus('revisado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'revisado'
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Revisados
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID de cuenta o Telegram..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Table of Accounts */}
      <div className="rounded-2xl bg-[#0c1424] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-[#090f1d]">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">ID Numérico de Cuenta</th>
                <th className="py-3 px-4">País</th>
                <th className="py-3 px-4">Nivel</th>
                <th className="py-3 px-4">Estado de Auditoría</th>
                <th className="py-3 px-4">Notas de Revisión</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usersWithAccount.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Todavía no hay IDs de cuenta registrados</h4>
                      <p className="text-xs text-slate-400">
                        Cuando los usuarios avancen en el flujo hasta el paso 10 y compartan su identificador numérico de 1xBet (ej. 1603722093), aparecerán en esta lista para su auditoría y cambio de estado.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-slate-400 text-xs">
                    No se encontraron registros con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleOpenReview(user)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                      {safeText(user.name)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ID Tel: {safeText(user.telegramId)} · @{safeText(user.username)}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {user.accountId ? (
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {safeText(user.accountId)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">En proceso</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-300">{safeText(user.country)}</td>

                  <td className="py-3 px-4">
                    <span className="capitalize text-slate-300">{safeText(user.experienceLevel)}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        user.accountStatus === 'revisado'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : user.accountStatus === 'pendiente_revision'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : user.accountStatus === 'id_recibido'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {safeText(user.accountStatus).toUpperCase().replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[200px] truncate">
                    {safeText(user.notes, 'Sin notas registradas')}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReview(user);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-200 transition-colors"
                    >
                      Auditar
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1424] border border-sky-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-sky-400 tracking-wider font-semibold">
                  Auditoría Manual de Registro
                </span>
                <h3 className="text-sm font-bold text-white">{safeText(selectedUser.name)}</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">ID Telegram:</span>
                  <span className="font-mono text-white font-bold">{safeText(selectedUser.telegramId)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ID de Cuenta 1xBet:</span>
                  <span className="font-mono text-amber-300 font-bold text-sm">
                    {safeText(selectedUser.accountId, 'Pendiente')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas del Administrador (privado):
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ej. ID validado en panel de afiliados el 10/11..."
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Actualizar Estado de Auditoría:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveStatus('revisado')}
                    className="p-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar Revisado
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStatus('pendiente_revision')}
                    className="p-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Pendiente Revisión
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStatus('id_recibido')}
                    className="p-2 rounded-xl text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ID Recibido
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStatus('no_verificable')}
                    className="p-2 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    No Verificable
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
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
