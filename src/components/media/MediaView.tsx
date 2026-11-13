import React, { useState, useRef } from 'react';
import { MediaItem } from '../../types';
import { DataService } from '../../services/dataService';
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
  Play,
  Smartphone,
  HardDrive,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface MediaViewProps {
  mediaItems: MediaItem[];
  onSaveMedia: (updated: MediaItem[]) => void;
}

export const MediaView: React.FC<MediaViewProps> = ({ mediaItems, onSaveMedia }) => {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [filterStage, setFilterStage] = useState<'all' | 'etapa_1' | 'etapa_2' | 'etapa_3'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);

  // Real Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Filter items
  const filtered = mediaItems.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStage =
      filterStage === 'all' ||
      item.stageGroup === filterStage ||
      (!item.stageGroup && filterStage === 'etapa_1');
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStage && matchesSearch;
  });

  // Handle direct file upload from iPhone, Android or PC with real progress
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(10);
    setUploadSuccessNotice(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `Cargado desde dispositivo: ${file.name}`);
    formData.append('stageGroup', filterStage === 'all' ? 'etapa_1' : filterStage);

    try {
      // Use XMLHttpRequest for real upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/media/upload');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        setUploadProgress(100);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.item) {
              onSaveMedia([data.item, ...mediaItems]);
              setUploadSuccessNotice(`✅ Archivo «${file.name}» cargado y almacenado correctamente en el servidor.`);
              setTimeout(() => setUploadSuccessNotice(null), 6000);
            } else {
              setUploadError(data.error || 'Error al guardar el archivo en el servidor.');
            }
          } catch (err) {
            setUploadError('Error decodificando respuesta del servidor.');
          }
        } else {
          setUploadError(`Fallo de subida: Código HTTP ${xhr.status}`);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setUploadError('Error de red al subir el archivo desde tu dispositivo.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      xhr.send(formData);
    } catch (err) {
      setIsUploading(false);
      setUploadError(String(err));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Replace a specific media file
  const handleTriggerReplace = (item: MediaItem) => {
    setReplacingItemId(item.id);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !replacingItemId) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `Reemplazo de archivo ${replacingItemId}`);

    try {
      const res = await DataService.uploadMediaFile(formData);
      setIsUploading(false);
      setUploadProgress(100);
      if (res.success && res.item) {
        const updated = mediaItems.map((m) =>
          m.id === replacingItemId
            ? {
                ...m,
                name: res.item!.name,
                url: res.item!.url,
                sizeBytes: res.item!.sizeBytes,
                type: res.item!.type,
              }
            : m
        );
        onSaveMedia(updated);
        setUploadSuccessNotice(`✅ Archivo reemplazado con éxito por «${file.name}».`);
        setTimeout(() => setUploadSuccessNotice(null), 5000);
      } else {
        alert(res.error || 'Error al reemplazar');
      }
    } catch (err) {
      setIsUploading(false);
      alert('Error de conexión al reemplazar archivo.');
    } finally {
      setReplacingItemId(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este archivo multimedia de la biblioteca?')) return;
    const updated = mediaItems.filter((item) => item.id !== id);
    onSaveMedia(updated);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1e3b] to-[#0d1629] border border-sky-500/25 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-sky-400" />
              Gestor Multimedia de Fotos y Videos de Juan Carlos
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              CARGA DIRECTA DE DISPOSITIVO
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Selecciona directamente desde la <strong>Galería de tu iPhone</strong>, <strong>Archivos de iPhone</strong>, <strong>Galería Android</strong> o tu <strong>Computador</strong>. Sin requerir enlaces manuales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept="image/*,video/*"
            className="hidden"
          />
          <input
            type="file"
            ref={replaceFileInputRef}
            onChange={handleReplaceFileSelected}
            accept="image/*,video/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? `Subiendo (${uploadProgress}%)...` : 'Subir desde Galería / Archivos'}
          </button>
        </div>
      </div>

      {/* Upload Progress Bar Alert */}
      {isUploading && (
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-sky-300 font-semibold">
            <span>Almacenando archivo en el servidor...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success / Error Alerts */}
      {uploadSuccessNotice && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{uploadSuccessNotice}</span>
          <button onClick={() => setUploadSuccessNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Stages Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0c1424] rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterStage('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStage === 'all'
                ? 'bg-sky-500/20 text-sky-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({mediaItems.length})
          </button>
          <button
            onClick={() => setFilterStage('etapa_1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStage === 'etapa_1'
                ? 'bg-sky-500/20 text-sky-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Etapa 1 (Registro & ID)
          </button>
          <button
            onClick={() => setFilterStage('etapa_2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStage === 'etapa_2'
                ? 'bg-sky-500/20 text-sky-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Etapa 2 (Recarga & Práctica)
          </button>
          <button
            onClick={() => setFilterStage('etapa_3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStage === 'etapa_3'
                ? 'bg-sky-500/20 text-sky-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Etapa 3 (Acompañamiento)
          </button>
        </div>

        {/* Media Type & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#0c1424] rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                filterType === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('photo')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                filterType === 'photo' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Fotos
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                filterType === 'video' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Videos
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar archivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Media Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group bg-[#0c1424] border border-slate-800/80 hover:border-sky-500/40 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col"
          >
            {/* Thumbnail Viewport */}
            <div
              onClick={() => setPreviewItem(item)}
              className="relative aspect-video bg-black/60 flex items-center justify-center cursor-pointer overflow-hidden group-hover:opacity-95 transition-opacity"
            >
              {item.type === 'video' ? (
                <>
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-sky-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-sky-300 font-bold">
                    VIDEO
                  </span>
                </>
              ) : (
                <>
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-emerald-300 font-bold">
                    FOTO
                  </span>
                </>
              )}
            </div>

            {/* Content Details */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h4 className="text-xs font-bold text-white truncate" title={item.name}>
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {item.description || 'Sin descripción'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatFileSize(item.sizeBytes)}</span>
                <span className="text-sky-400 uppercase font-semibold">
                  {item.stageGroup || item.associatedStep}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  Ver
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerReplace(item)}
                  title="Reemplazar archivo desde galería"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  title="Eliminar de la biblioteca"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/30 hover:text-red-300 text-slate-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal for Photos and Videos */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0c1424] border border-sky-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                  Vista Previa en Tiempo Real
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-md">{previewItem.name}</h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <div className="p-4 bg-black/80 flex items-center justify-center max-h-[60vh] overflow-hidden">
              {previewItem.type === 'video' ? (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="max-h-[55vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="max-h-[55vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="p-4 bg-[#09101d] border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                <span>Tipo: {previewItem.type === 'video' ? 'Video MP4 / MOV' : 'Fotografía JPEG'}</span>
                <span>Tamaño: {formatFileSize(previewItem.sizeBytes)}</span>
              </div>
              <p className="text-slate-400 text-xs">{previewItem.description}</p>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                Ruta local: {previewItem.url}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
