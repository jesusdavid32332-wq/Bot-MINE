import React, { useState } from 'react';
import { AutoMessage, ContentType, MediaItem, TelegramButton } from '../../types';
import { TelegramPhoneMockup } from '../ui/TelegramPhoneMockup';
import { Modal } from '../ui/Modal';
import {
  Plus,
  Edit2,
  Copy,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Video,
  FileText,
  Link,
  CheckCircle,
  XCircle,
  ExternalLink,
  Sparkles,
  Search,
} from 'lucide-react';

interface MessagesViewProps {
  messages: AutoMessage[];
  mediaItems: MediaItem[];
  onSaveMessages: (updated: AutoMessage[]) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  messages,
  mediaItems,
  onSaveMessages,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<AutoMessage | null>(messages[0] || null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AutoMessage | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Handle reorder
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newMessages = [...messages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newMessages.length) return;

    const temp = newMessages[index];
    newMessages[index] = newMessages[targetIndex];
    newMessages[targetIndex] = temp;

    // Recalculate order index
    newMessages.forEach((m, idx) => {
      m.order = idx + 1;
    });

    onSaveMessages(newMessages);
    if (selectedMessage) {
      const updatedSelected = newMessages.find((m) => m.id === selectedMessage.id);
      if (updatedSelected) setSelectedMessage(updatedSelected);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = (id: string) => {
    const updated = messages.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m));
    onSaveMessages(updated);
    if (selectedMessage?.id === id) {
      setSelectedMessage({ ...selectedMessage, isActive: !selectedMessage.isActive });
    }
  };

  // Duplicate
  const handleDuplicate = (msg: AutoMessage) => {
    const duplicated: AutoMessage = {
      ...msg,
      id: `msg-${Date.now().toString().slice(-4)}`,
      internalName: `${msg.internalName}_COPIA`,
      order: messages.length + 1,
    };
    const updated = [...messages, duplicated];
    onSaveMessages(updated);
    setSelectedMessage(duplicated);
  };

  // Delete
  const handleDelete = (id: string) => {
    if (messages.length <= 1) {
      alert('Debe mantenerse al menos un mensaje en el sistema.');
      return;
    }
    if (!window.confirm('¿Seguro que deseas eliminar este mensaje automático?')) return;
    const updated = messages.filter((m) => m.id !== id);
    onSaveMessages(updated);
    if (selectedMessage?.id === id) {
      setSelectedMessage(updated[0] || null);
    }
  };

  // Open Create
  const handleOpenCreate = () => {
    const newMsg: AutoMessage = {
      id: `msg-${Date.now().toString().slice(-4)}`,
      stepId: 'START',
      nextStepId: 'BIENVENIDA',
      internalName: `M0${messages.length + 1}_NUEVO_MENSAJE`,
      text: 'Escribe aquí el texto que recibirá el usuario en Telegram...',
      contentType: 'text',
      buttons: [],
      condition: 'Al cumplir la condición configurada',
      nextAction: 'Esperar respuesta del usuario',
      isActive: true,
      order: messages.length + 1,
      stageTag: 'Personalizado',
    };
    setEditingMessage(newMsg);
    setIsEditorOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (msg: AutoMessage) => {
    setEditingMessage(JSON.parse(JSON.stringify(msg)));
    setIsEditorOpen(true);
  };

  // Save Modal
  const handleSaveModal = () => {
    if (!editingMessage) return;
    const exists = messages.some((m) => m.id === editingMessage.id);
    let updated: AutoMessage[];
    if (exists) {
      updated = messages.map((m) => (m.id === editingMessage.id ? editingMessage : m));
    } else {
      updated = [...messages, editingMessage];
    }
    onSaveMessages(updated);
    setSelectedMessage(editingMessage);
    setIsEditorOpen(false);
  };

  // Add button to editing message
  const handleAddButton = () => {
    if (!editingMessage) return;
    const newBtn: TelegramButton = {
      id: `btn-${Date.now().toString().slice(-4)}`,
      text: 'Nuevo Botón',
      type: 'url',
      value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
    };
    setEditingMessage({
      ...editingMessage,
      buttons: [...(editingMessage.buttons || []), newBtn],
    });
  };

  // Remove button
  const handleRemoveButton = (btnId: string) => {
    if (!editingMessage) return;
    setEditingMessage({
      ...editingMessage,
      buttons: editingMessage.buttons.filter((b) => b.id !== btnId),
    });
  };

  // Filter messages
  const filteredMessages = messages.filter(
    (m) =>
      m.internalName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.text.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.stageTag.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Gestión de Mensajes Automáticos de Telegram
          </h2>
          <p className="text-xs text-slate-400">
            Controla textos, fotografías, vídeos, teclados de botones y condiciones para cada paso.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar mensaje por nombre o texto..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Mensaje
          </button>
        </div>
      </div>

      {/* Two Column Layout: Message Table on Left, Live Mockup on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Messages List & Controls (7 Cols on XL) */}
        <div className="xl:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="font-semibold text-white">Lista de Mensajes Configurados ({filteredMessages.length})</span>
              <span>Orden secuencial configurable</span>
            </div>

            <div className="space-y-2.5">
              {filteredMessages.map((msg, index) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#101b33] border-sky-400/50 shadow-md shadow-sky-950/40'
                        : 'bg-[#090f1d] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-300">
                            #{msg.order}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {msg.internalName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            {msg.stageTag}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              msg.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {msg.isActive ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2">
                          {msg.text}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {msg.contentType.includes('photo') && <ImageIcon className="w-3 h-3 text-amber-400" />}
                            {msg.contentType.includes('video') && <Video className="w-3 h-3 text-sky-400" />}
                            {msg.contentType === 'text' && <FileText className="w-3 h-3 text-slate-400" />}
                            <span className="capitalize">{msg.contentType.replace('_', ' ')}</span>
                          </span>

                          <span>·</span>
                          <span className="text-slate-400">
                            Botones: <strong>{msg.buttons?.length || 0}</strong>
                          </span>

                          <span>·</span>
                          <span className="text-slate-400 truncate max-w-[200px]">
                            Condición: <em>{msg.condition}</em>
                          </span>
                        </div>
                      </div>

                      {/* Row Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0 bg-slate-900/60 p-1 rounded-lg border border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          title="Subir posición"
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === messages.length - 1}
                          title="Bajar posición"
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(msg)}
                          title="Editar mensaje"
                          className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(msg)}
                          title="Duplicar mensaje"
                          className="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(msg.id)}
                          title={msg.isActive ? 'Desactivar' : 'Activar'}
                          className={`p-1 rounded cursor-pointer ${
                            msg.isActive ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {msg.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          title="Eliminar mensaje"
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Telegram Preview & Details (5 Cols on XL) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Previsualización en Vivo Telegram
                </h3>
                <p className="text-[11px] text-slate-400">
                  Simulación exacta de cómo lo verá el usuario en su teléfono
                </p>
              </div>

              {selectedMessage && (
                <button
                  onClick={() => handleOpenEdit(selectedMessage)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Editar
                </button>
              )}
            </div>

            {selectedMessage ? (
              <div className="flex justify-center py-2">
                <TelegramPhoneMockup
                  title="Juan Carlos | Mines AI 💎"
                  subtitle="bot oficial 1xBet"
                  messageText={selectedMessage.text}
                  mediaUrl={selectedMessage.mediaUrl}
                  mediaType={selectedMessage.mediaType}
                  buttons={selectedMessage.buttons}
                  onButtonClick={(btn) => {
                    alert(`Simulación de botón Telegram: "${btn.text}"\nTipo: ${btn.type}\nValor: ${btn.value}`);
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Selecciona un mensaje de la lista para previsualizarlo.
              </div>
            )}

            {selectedMessage && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Condición de disparo:</span>
                  <span className="font-medium text-amber-300 text-right max-w-[240px]">
                    {selectedMessage.condition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Acción posterior:</span>
                  <span className="font-medium text-sky-300 text-right max-w-[240px]">
                    {selectedMessage.nextAction}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Message Modal */}
      {editingMessage && (
        <Modal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          title={editingMessage.internalName ? `Editar: ${editingMessage.internalName}` : 'Crear Nuevo Mensaje'}
          subtitle="Modifica los textos, medios, botones y condiciones del mensaje de Telegram"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Interno del Mensaje
                </label>
                <input
                  type="text"
                  value={editingMessage.internalName}
                  onChange={(e) =>
                    setEditingMessage({ ...editingMessage, internalName: e.target.value })
                  }
                  placeholder="Ej. M07_NUEVA_ESTRATEGIA"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Etapa / Categoría
                </label>
                <input
                  type="text"
                  value={editingMessage.stageTag}
                  onChange={(e) =>
                    setEditingMessage({ ...editingMessage, stageTag: e.target.value })
                  }
                  placeholder="Ej. Segmentación, Tutorial, Cierre"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Content Type & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Contenido
                </label>
                <select
                  value={editingMessage.contentType}
                  onChange={(e) => {
                    const ct = e.target.value as ContentType;
                    const mediaType = ct.includes('video') ? 'video' : 'photo';
                    setEditingMessage({ ...editingMessage, contentType: ct, mediaType });
                  }}
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="text">Texto simple</option>
                  <option value="photo_caption">Fotografía con descripción</option>
                  <option value="video_caption">Vídeo con descripción</option>
                  <option value="text_buttons">Texto con botones</option>
                  <option value="photo_buttons">Fotografía con botones</option>
                  <option value="video_buttons">Vídeo con botones</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={editingMessage.isActive}
                    onChange={(e) =>
                      setEditingMessage({ ...editingMessage, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500/20 bg-slate-900 border-slate-700"
                  />
                  <span>Mensaje Activo en el flujo</span>
                </label>
              </div>
            </div>

            {/* Media Attachment Selector if content type requires media */}
            {(editingMessage.contentType.includes('photo') || editingMessage.contentType.includes('video')) && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Archivo Multimedia de la Biblioteca
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mediaItems.map((media) => {
                    const isSelected = editingMessage.mediaUrl === media.url;
                    return (
                      <div
                        key={media.id}
                        onClick={() =>
                          setEditingMessage({
                            ...editingMessage,
                            mediaUrl: media.url,
                            mediaType: media.type,
                          })
                        }
                        className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                            : 'bg-[#080d1a] border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded overflow-hidden bg-black shrink-0">
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium truncate">{media.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{media.type}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Text Area */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Texto que recibe el usuario en Telegram
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Soporta formato *negrita*, _cursiva_
                </span>
              </div>
              <textarea
                rows={6}
                value={editingMessage.text}
                onChange={(e) => setEditingMessage({ ...editingMessage, text: e.target.value })}
                placeholder="Escribe el mensaje..."
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
              />
            </div>

            {/* Inline Buttons Builder */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Botones Interactivos en Telegram (Inline Keyboard)
                </span>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 cursor-pointer"
                >
                  + Añadir Botón
                </button>
              </div>

              {editingMessage.buttons && editingMessage.buttons.length > 0 ? (
                <div className="space-y-2">
                  {editingMessage.buttons.map((btn, bIndex) => (
                    <div
                      key={btn.id}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-[#080d1a] rounded-lg border border-slate-800 text-xs"
                    >
                      <input
                        type="text"
                        placeholder="Texto del botón"
                        value={btn.text}
                        onChange={(e) => {
                          const updatedButtons = [...editingMessage.buttons];
                          updatedButtons[bIndex].text = e.target.value;
                          setEditingMessage({ ...editingMessage, buttons: updatedButtons });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
                      />
                      <select
                        value={btn.type}
                        onChange={(e) => {
                          const updatedButtons = [...editingMessage.buttons];
                          updatedButtons[bIndex].type = e.target.value as 'url' | 'callback';
                          setEditingMessage({ ...editingMessage, buttons: updatedButtons });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value="url">Enlace URL</option>
                        <option value="callback">Callback de flujo</option>
                      </select>
                      <input
                        type="text"
                        placeholder={btn.type === 'url' ? 'https://...' : 'id_evento'}
                        value={btn.value}
                        onChange={(e) => {
                          const updatedButtons = [...editingMessage.buttons];
                          updatedButtons[bIndex].value = e.target.value;
                          setEditingMessage({ ...editingMessage, buttons: updatedButtons });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(btn.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No hay botones configurados para este mensaje.
                </p>
              )}
            </div>

            {/* Conditions & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Condición para enviarlo
                </label>
                <input
                  type="text"
                  value={editingMessage.condition}
                  onChange={(e) =>
                    setEditingMessage({ ...editingMessage, condition: e.target.value })
                  }
                  placeholder="Ej. Si responde Colombia"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Acción posterior / Siguiente mensaje
                </label>
                <input
                  type="text"
                  value={editingMessage.nextAction}
                  onChange={(e) =>
                    setEditingMessage({ ...editingMessage, nextAction: e.target.value })
                  }
                  placeholder="Ej. Esperar respuesta o M03_PAIS"
                  className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Guardar Mensaje
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
