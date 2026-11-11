import React, { useState } from 'react';
import { MediaItem } from '../../types';
import { Modal } from '../ui/Modal';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Download,
  CheckCircle,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface MediaViewProps {
  mediaItems: MediaItem[];
  onSaveMedia: (updated: MediaItem[]) => void;
}

export const MediaView: React.FC<MediaViewProps> = ({ mediaItems, onSaveMedia }) => {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // New Media Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'photo' | 'video'>('photo');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('/src/assets/images/mines_board_preview_1794372720270.jpg');

  // Filter items
  const filtered = mediaItems.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este archivo multimedia?')) return;
    const updated = mediaItems.filter((item) => item.id !== id);
    onSaveMedia(updated);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: MediaItem = {
      id: `med-${Date.now().toString().slice(-4)}`,
      name: newItemName.endsWith('.jpg') || newItemName.endsWith('.mp4') ? newItemName : `${newItemName}.${newItemType === 'photo' ? 'jpg' : 'mp4'}`,
      type: newItemType,
      url: newItemUrl,
      description: newItemDescription,
      sizeBytes: newItemType === 'photo' ? 450000 : 3800000,
      dimensions: newItemType === 'photo' ? '1920x1080' : undefined,
      durationSeconds: newItemType === 'video' ? 30 : undefined,
      createdAt: new Date().toISOString(),
      associatedStep: 'INFO_MINES',
      isRealAsset: false,
      associatedMessageIds: [],
      isDemo: true,
    };

    onSaveMedia([newItem, ...mediaItems]);
    setIsUploadOpen(false);
    setNewItemName('');
    setNewItemDescription('');
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const updated = mediaItems.map((m) => (m.id === editingItem.id ? editingItem : m));
    onSaveMedia(updated);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-sky-500/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Biblioteca Multimedia Oficial (Fotografías y Vídeos)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ARCHIVOS DEMO IDENTIFICADOS
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Los archivos registrados aquí están disponibles para ser adjuntados directamente en los mensajes automáticos y tutoriales del bot.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          Subir Archivo
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#0c1424] rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({mediaItems.length})
          </button>
          <button
            onClick={() => setFilterType('photo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterType === 'photo'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Fotografías ({mediaItems.filter((i) => i.type === 'photo').length})
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterType === 'video'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Vídeos ({mediaItems.filter((i) => i.type === 'video').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-[#0c1424] border border-slate-800 overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container */}
              <div
                className="relative aspect-video bg-black/50 overflow-hidden cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm uppercase flex items-center gap-1">
                    {item.type === 'video' ? <Video className="w-3 h-3 text-sky-400" /> : <ImageIcon className="w-3 h-3 text-amber-400" />}
                    {item.type}
                  </span>
                  {item.isDemo && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/80 text-black font-bold">
                      DEMO
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewItem(item);
                    }}
                    className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                    }}
                    className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meta details */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate flex-1" title={item.name}>
                    {item.name}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {(item.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                  <span>
                    Asociado a: {item.associatedMessageIds?.length || 0} mensaje(s)
                  </span>
                  <span>{item.dimensions || `${item.durationSeconds || 0}s`}</span>
                </div>
              </div>
            </div>

            {/* Footer row actions */}
            <div className="p-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                onClick={() => setEditingItem(item)}
                className="text-slate-400 hover:text-sky-300 p-1 flex items-center gap-1 text-[11px]"
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-400/70 hover:text-red-300 p-1 flex items-center gap-1 text-[11px]"
              >
                <Trash2 className="w-3 h-3" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Lightbox Modal */}
      {previewItem && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          title={`Vista Previa: ${previewItem.name}`}
          subtitle={`${previewItem.type.toUpperCase()} · ${previewItem.dimensions || ''}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh] border border-slate-800">
              <img
                src={previewItem.url}
                alt={previewItem.name}
                className="w-full h-auto max-h-[60vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p><strong>Descripción:</strong> {previewItem.description}</p>
              <p className="font-mono text-[11px] text-slate-400">
                Ruta física de activo: {previewItem.url}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Media Modal */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title="Editar Detalles de Archivo Multimedia"
          maxWidth="max-w-lg"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Archivo</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
              <textarea
                rows={3}
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload New Item Modal */}
      {isUploadOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsUploadOpen(false)}
          title="Subir Nuevo Archivo Multimedia a la Biblioteca"
          subtitle="Formato DEMO con previsualización inmediata para el bot de Telegram"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreateNew} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre del Archivo
              </label>
              <input
                type="text"
                required
                placeholder="ej. tutorial_retiros_1xbet.jpg"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Archivo</label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as 'photo' | 'video')}
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="photo">Fotografía (JPG / PNG)</option>
                  <option value="video">Vídeo (MP4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Activo Demo Asignado</label>
                <select
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  <option value="/src/assets/images/mines_board_preview_1794372720270.jpg">
                    mines_board_preview.jpg
                  </option>
                  <option value="/src/assets/images/tutorial_mines_guide_1794372721064.jpg">
                    tutorial_mines_guide.jpg
                  </option>
                  <option value="/src/assets/images/juan_carlos_avatar_1794372721304.jpg">
                    juan_carlos_avatar.jpg
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción del Archivo</label>
              <textarea
                rows={3}
                placeholder="Indica qué muestra el archivo y para qué mensaje o tutorial se usará..."
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white"
              >
                Registrar Archivo
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
