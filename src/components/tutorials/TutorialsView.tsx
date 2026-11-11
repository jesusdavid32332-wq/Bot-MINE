import React, { useState } from 'react';
import { MediaItem, Tutorial } from '../../types';
import { Modal } from '../ui/Modal';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Eye,
  BookOpen,
  Sparkles,
  Layers,
} from 'lucide-react';

interface TutorialsViewProps {
  tutorials: Tutorial[];
  mediaItems: MediaItem[];
  onSaveTutorials: (updated: Tutorial[]) => void;
}

export const TutorialsView: React.FC<TutorialsViewProps> = ({
  tutorials,
  mediaItems,
  onSaveTutorials,
}) => {
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTutorial, setPreviewTutorial] = useState<Tutorial | null>(null);

  const handleToggleActive = (id: string) => {
    const updated = tutorials.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t));
    onSaveTutorials(updated);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Deseas eliminar este tutorial?')) return;
    const updated = tutorials.filter((t) => t.id !== id);
    onSaveTutorials(updated);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newTutorials = [...tutorials];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newTutorials.length) return;

    const temp = newTutorials[index];
    newTutorials[index] = newTutorials[targetIdx];
    newTutorials[targetIdx] = temp;

    newTutorials.forEach((t, i) => {
      t.order = i + 1;
    });

    onSaveTutorials(newTutorials);
  };

  const handleOpenCreate = () => {
    const newTut: Tutorial = {
      id: `tut-${Date.now().toString().slice(-4)}`,
      title: 'Nuevo Tutorial de Mines',
      description: 'Breve resumen introductorio para el usuario...',
      mediaUrl: '/src/assets/images/tutorial_mines_guide_1794372721064.jpg',
      mediaType: 'photo',
      explanatoryText: 'Texto explicativo detallado que se enviará en Telegram...',
      steps: ['Paso 1: Abrir Mines en 1xBet', 'Paso 2: Fijar la apuesta', 'Paso 3: Retirar oportunamente'],
      targetStage: 'principiante',
      order: tutorials.length + 1,
      isActive: true,
      estimatedReadTime: '2 min',
    };
    setEditingTutorial(newTut);
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingTutorial) return;
    const exists = tutorials.some((t) => t.id === editingTutorial.id);
    let updated: Tutorial[];
    if (exists) {
      updated = tutorials.map((t) => (t.id === editingTutorial.id ? editingTutorial : t));
    } else {
      updated = [...tutorials, editingTutorial];
    }
    onSaveTutorials(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-sky-500/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Administrador de Tutoriales y Guías Educativas
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Configura las guías paso a paso y define en qué punto de la conversación se despachan a los usuarios principiantes y experimentados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Tutorial
        </button>
      </div>

      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tutorials.map((tut, index) => (
          <div
            key={tut.id}
            className="rounded-2xl bg-[#0c1424] border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              {/* Media Preview if attached */}
              {tut.mediaUrl && (
                <div
                  className="relative aspect-video bg-black/60 cursor-pointer overflow-hidden group"
                  onClick={() => setPreviewTutorial(tut)}
                >
                  <img
                    src={tut.mediaUrl}
                    alt={tut.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 text-amber-300 uppercase">
                      Orden #{tut.order}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/80 text-white capitalize">
                      {tut.targetStage}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-white leading-snug">{tut.title}</h3>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 ${
                      tut.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {tut.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                  {tut.description}
                </p>

                {/* Steps preview */}
                {tut.steps && tut.steps.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pasos incluidos ({tut.steps.length}):
                    </span>
                    <ul className="space-y-0.5 text-slate-300">
                      {tut.steps.slice(0, 2).map((st, sIdx) => (
                        <li key={sIdx} className="truncate">
                          • {st}
                        </li>
                      ))}
                      {tut.steps.length > 2 && (
                        <li className="text-slate-400 text-[10px]">
                          + {tut.steps.length - 2} pasos más...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveOrder(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  title="Subir orden"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveOrder(index, 'down')}
                  disabled={index === tutorials.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  title="Bajar orden"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTutorial(tut)}
                  className="p-1 rounded text-slate-400 hover:text-sky-300"
                  title="Ver tutorial completo"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingTutorial(JSON.parse(JSON.stringify(tut)));
                    setIsModalOpen(true);
                  }}
                  className="p-1 rounded text-sky-400 hover:text-sky-300"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleActive(tut.id)}
                  className={`p-1 rounded ${tut.isActive ? 'text-emerald-400' : 'text-slate-400'}`}
                  title={tut.isActive ? 'Desactivar' : 'Activar'}
                >
                  {tut.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(tut.id)}
                  className="p-1 rounded text-red-400 hover:text-red-300"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTutorial && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewTutorial(null)}
          title={previewTutorial.title}
          subtitle={`Dirigido a: ${previewTutorial.targetStage.toUpperCase()} · Tiempo estimado: ${previewTutorial.estimatedReadTime}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {previewTutorial.mediaUrl && (
              <div className="rounded-xl overflow-hidden bg-black max-h-56">
                <img
                  src={previewTutorial.mediaUrl}
                  alt={previewTutorial.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Texto Explicativo que recibe el usuario
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                {previewTutorial.explanatoryText}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Pasos de Acción en 1xBet
              </h4>
              <div className="space-y-1.5">
                {previewTutorial.steps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/20 text-xs text-sky-200 flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit/Create Tutorial Modal */}
      {editingTutorial && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTutorial.id ? 'Editar Tutorial' : 'Crear Nuevo Tutorial'}
          subtitle="Define contenido didáctico y etapa del embudo de conversación"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Título del Tutorial</label>
              <input
                type="text"
                value={editingTutorial.title}
                onChange={(e) => setEditingTutorial({ ...editingTutorial, title: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Etapa Objetivo</label>
                <select
                  value={editingTutorial.targetStage}
                  onChange={(e) =>
                    setEditingTutorial({
                      ...editingTutorial,
                      targetStage: e.target.value as 'principiante' | 'avanzado' | 'todos',
                    })
                  }
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="principiante">Principiantes (M05_EXP_PRINCIPIANTE)</option>
                  <option value="avanzado">Avanzados (M04_EXP_AVANZADO)</option>
                  <option value="todos">Todos los usuarios</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Archivo de Soporte</label>
                <select
                  value={editingTutorial.mediaUrl || ''}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, mediaUrl: e.target.value })}
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  {mediaItems.map((m) => (
                    <option key={m.id} value={m.url}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción Breve</label>
              <input
                type="text"
                value={editingTutorial.description}
                onChange={(e) => setEditingTutorial({ ...editingTutorial, description: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Texto Explicativo en Telegram</label>
              <textarea
                rows={4}
                value={editingTutorial.explanatoryText}
                onChange={(e) =>
                  setEditingTutorial({ ...editingTutorial, explanatoryText: e.target.value })
                }
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed"
              />
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
                Guardar Tutorial
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
