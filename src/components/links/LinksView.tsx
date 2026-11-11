import React, { useState } from 'react';
import { TrackedLink } from '../../types';
import { Modal } from '../ui/Modal';
import {
  Link2,
  ExternalLink,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  MousePointerClick,
  ShieldAlert,
  Save,
  Plus,
} from 'lucide-react';

interface LinksViewProps {
  links: TrackedLink[];
  onSaveLinks: (updated: TrackedLink[]) => void;
}

export const LinksView: React.FC<LinksViewProps> = ({ links, onSaveLinks }) => {
  const [editingLink, setEditingLink] = useState<TrackedLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggleActive = (id: string) => {
    const updated = links.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l));
    onSaveLinks(updated);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveModal = () => {
    if (!editingLink) return;
    const exists = links.some((l) => l.id === editingLink.id);
    let updated: TrackedLink[];
    if (exists) {
      updated = links.map((l) => (l.id === editingLink.id ? editingLink : l));
    } else {
      updated = [...links, editingLink];
    }
    onSaveLinks(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: Domain Verification Warning */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-amber-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Administrador de Enlaces & Campañas de Afiliación
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                DOMINIO EXTERNO PENDIENTE DE VERIFICACIÓN
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              El dominio <strong>1xbet-col.com</strong> está configurado para la comunidad, pero no se presenta como dominio oficial hasta su comprobación técnica de DNS y certificado SSL.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const newLink: TrackedLink = {
              id: `link-${Date.now().toString().slice(-4)}`,
              platform: '1xBet',
              url: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
              name: 'Nuevo Enlace de Campaña',
              associatedStep: 'INFO_REGISTRO',
              associatedMessageName: 'M04_EXP_AVANZADO',
              clicksCount: 0,
              isActive: true,
              isVerified: false,
              verificationNotes: 'Pendiente de comprobación.',
            };
            setEditingLink(newLink);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Enlace
        </button>
      </div>

      {/* Links Cards */}
      <div className="space-y-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{link.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-950 text-sky-300 border border-sky-400/20">
                      {link.platform}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        link.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {link.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Asignado a: <strong className="text-slate-300">{link.associatedMessageName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(link.url, link.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === link.id ? '¡Copiado!' : 'Copiar URL'}
                </button>
                <button
                  onClick={() => {
                    setEditingLink(JSON.parse(JSON.stringify(link)));
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleToggleActive(link.id)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    link.isActive
                      ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {link.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* URL Display */}
            <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-sky-300 break-all select-all">
                {link.url}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-400 hover:text-white p-1 shrink-0"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Verification Status & Telegram Button Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Left: Domain verification status */}
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5 text-[11px]">
                  <ShieldAlert className="w-4 h-4" />
                  Estado de Auditoría del Dominio
                </span>
                <p className="text-slate-300">{link.verificationNotes}</p>
                <p className="text-[11px] text-slate-400">
                  Total de clics registrados: <strong className="font-mono text-amber-300">{link.clicksCount}</strong> (Simulado DEMO)
                </p>
              </div>

              {/* Right: Button Preview in Telegram */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                  Previsualización del Botón en Telegram
                </span>
                <div className="py-2 px-4 rounded-lg bg-[#2b5278] text-sky-100 font-semibold text-xs flex items-center justify-center gap-2 shadow-md border border-sky-400/20 max-w-xs mx-auto">
                  <span>🎰 Acceder a 1xBet Mines</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Link Modal */}
      {editingLink && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Editar Enlace de Campaña"
          subtitle="Modifica la URL de afiliación, plataforma y mensaje asignado"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Campaña</label>
              <input
                type="text"
                value={editingLink.name}
                onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Plataforma</label>
              <input
                type="text"
                value={editingLink.platform}
                onChange={(e) => setEditingLink({ ...editingLink, platform: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Completa</label>
              <input
                type="url"
                value={editingLink.url}
                onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mensaje Asignado</label>
              <input
                type="text"
                value={editingLink.associatedMessageName}
                onChange={(e) =>
                  setEditingLink({ ...editingLink, associatedMessageName: e.target.value })
                }
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeLink"
                checked={editingLink.isActive}
                onChange={(e) => setEditingLink({ ...editingLink, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
              />
              <label htmlFor="activeLink" className="text-xs text-slate-300 font-medium">
                Enlace Activo y Despachable
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white"
              >
                Guardar Enlace
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
