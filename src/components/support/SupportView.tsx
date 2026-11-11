import React, { useState } from 'react';
import { SupportTicket } from '../../types';
import { Modal } from '../ui/Modal';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  User,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface SupportViewProps {
  tickets: SupportTicket[];
  onSaveTickets: (updated: SupportTicket[]) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ tickets, onSaveTickets }) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [replyText, setReplyText] = useState('');

  const CANNED_RESPONSES = [
    'Hola. En Colombia puedes recargar tu cuenta 1xBet de manera instantánea mediante Nequi o PSE sin comisiones adicionales.',
    'Recuerda que en Mines los resultados son generados por un algoritmo aleatorio. La mejor estrategia es jugar con 3 minas y retirar al 3er acierto.',
    'Tu retiro puede tardar entre 15 minutos y 2 horas dependiendo del método bancario seleccionado. 1xBet opera 24/7.',
  ];

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;

    const newReply = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      sender: 'admin' as const,
      text: replyText.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      status: 'resolved',
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      replies: [...selectedTicket.replies, newReply],
    };

    const updatedTickets = tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t));
    onSaveTickets(updatedTickets);
    setSelectedTicket(updatedTicket);
    setReplyText('');
  };

  const handleUpdateStatus = (ticketId: string, status: 'open' | 'in_progress' | 'resolved') => {
    const updated = tickets.map((t) => (t.id === ticketId ? { ...t, status } : t));
    onSaveTickets(updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  };

  const filtered = tickets.filter((t) => filterStatus === 'all' || t.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-sky-500/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Centro de Soporte y Solicitudes de Asistencia
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Gestiona preguntas de usuarios, inquietudes sobre depósitos en 1xBet y respuestas oficiales del equipo de Juan Carlos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            {tickets.filter((t) => t.status === 'open').length} tickets pendientes
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0c1424] rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filterStatus === 'all' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Todos ({tickets.length})
        </button>
        <button
          onClick={() => setFilterStatus('open')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filterStatus === 'open' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Abiertos ({tickets.filter((t) => t.status === 'open').length})
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filterStatus === 'in_progress' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400'
          }`}
        >
          En Proceso ({tickets.filter((t) => t.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setFilterStatus('resolved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filterStatus === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Resueltos ({tickets.filter((t) => t.status === 'resolved').length})
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTicket(t)}
            className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white">{t.subject}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                    t.status === 'open'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : t.status === 'in_progress'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {t.status === 'open' ? 'ABIERTO' : t.status === 'in_progress' ? 'EN PROCESO' : 'RESUELTO'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Prioridad: {t.priority.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-1">{t.question}</p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="text-sky-300">{t.userName} (@{t.userUsername})</span>
                <span>·</span>
                <span className="font-mono">{t.createdAt}</span>
                <span>·</span>
                <span>Respuestas: {t.replies?.length || 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <select
                value={t.status}
                onChange={(e) => handleUpdateStatus(t.id, e.target.value as any)}
                className="bg-[#080d1a] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              >
                <option value="open">Abierto</option>
                <option value="in_progress">En proceso</option>
                <option value="resolved">Resuelto</option>
              </select>

              <button
                onClick={() => setSelectedTicket(t)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 transition-colors"
              >
                Atender
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Reply Modal */}
      {selectedTicket && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket #${selectedTicket.id}: ${selectedTicket.subject}`}
          subtitle={`Usuario: ${selectedTicket.userName} (@${selectedTicket.userUsername})`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Original question */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Consulta del Usuario
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{selectedTicket.question}</p>
            </div>

            {/* Replies thread */}
            {selectedTicket.replies?.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                  Historial de Respuestas ({selectedTicket.replies.length})
                </span>
                {selectedTicket.replies.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-100 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-sky-300">
                        {rep.sender === 'admin' ? 'Juan Carlos (Soporte)' : 'Usuario'}
                      </span>
                      <span>{rep.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{rep.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Canned Responses Helper */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Plantillas de Respuesta Rápida:
              </span>
              <div className="space-y-1">
                {CANNED_RESPONSES.map((cr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(cr)}
                    className="w-full text-left p-2 rounded-lg bg-[#080d1a] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors truncate block"
                  >
                    "{cr}"
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Respuesta del Administrador
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe la respuesta oficial que recibirá el usuario en Telegram..."
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <select
                value={selectedTicket.status}
                onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                className="bg-[#080d1a] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              >
                <option value="open">Estado: Abierto</option>
                <option value="in_progress">Estado: En proceso</option>
                <option value="resolved">Estado: Resuelto</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar Respuesta
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
