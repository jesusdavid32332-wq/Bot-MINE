import React from 'react';
import { SectionId } from '../../types';
import { Menu, Play, RefreshCw, Flame, Radio } from 'lucide-react';

interface HeaderProps {
  currentSection: SectionId;
  onOpenMobile: () => void;
  onOpenSimulator: () => void;
  onRefreshData?: () => void;
}

const SECTION_TITLES: Record<SectionId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Ejecutivo',
    subtitle: 'Métricas en tiempo real, embudo de conversión y estado de Cloud Firestore',
  },
  deposits: {
    title: 'Depósitos Pendientes',
    subtitle: 'Verificación manual de comprobantes recibidos en Telegram antes de habilitar orientación',
  },
  'telegram-connection': {
    title: 'Conexión de Telegram',
    subtitle: 'Vinculación de BotFather, validación con Telegram API y estado del Webhook',
  },
  messages: {
    title: 'Mensajes Automáticos',
    subtitle: '15 pasos programados, botones de respuesta rápida y archivos multimedia',
  },
  flow: {
    title: 'Flujo de Conversaciones',
    subtitle: 'Árbol determinista: START → País → Interés → Registro → ID → Tutorial',
  },
  'id-tracking': {
    title: 'Seguimiento de IDs de Cuenta',
    subtitle: 'Revisión y auditoría de identificadores numéricos de 1xBet enviados por usuarios',
  },
  'admin-telegram': {
    title: 'Menú Privado de Telegram (/admin)',
    subtitle: 'Control exclusivo para Juan Carlos mediante Telegram Bot API',
  },
  media: {
    title: 'Fotografías y Vídeos Oficiales',
    subtitle: 'París, tutorial en laptop, capturas testimoniales y guía 1-2-3 para encontrar ID',
  },
  tutorials: {
    title: 'Tutoriales Educativos',
    subtitle: 'Mecánicas de juego Mines 5×5, multiplicadores y advertencias responsables',
  },
  users: {
    title: 'Usuarios de Telegram',
    subtitle: 'Directorio persistido en Cloud Firestore con historial de pasos y respuestas',
  },
  conversations: {
    title: 'Conversaciones en Directo',
    subtitle: 'Auditoría de mensajes enviados y recibidos a través del Webhook oficial',
  },
  support: {
    title: 'Atención y Consultas',
    subtitle: 'Gestión de dudas e incidencias de usuarios durante el recorrido',
  },
  links: {
    title: 'Enlaces Oficiales',
    subtitle: 'Monitoreo de clics al enlace oficial de 1xBet Mines',
  },
  'bot-config': {
    title: 'Configuración del Bot',
    subtitle: 'Identidad en Telegram, token seguro, webhook secret y reglas deterministas',
  },
  'general-config': {
    title: 'Infraestructura & Seguridad',
    subtitle: 'Google Cloud Run, Cloud Firestore y cumplimiento estricto +18',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onOpenMobile,
  onOpenSimulator,
  onRefreshData,
}) => {
  const current = SECTION_TITLES[currentSection] || SECTION_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-[#050914]/95 backdrop-blur-md border-b border-[#152037] px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            aria-label="Abrir menú"
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span className="text-amber-400 font-semibold">Juan Carlos 💎</span>
              <span className="text-slate-600">/</span>
              <span className="text-sky-300 truncate font-mono">{current.title}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {current.title}
            </h1>
          </div>
        </div>

        {/* Right: Cloud Status Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cloud Status Badges (Desktop) */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#091124] border border-[#1b2a4a] text-[11px] font-mono text-emerald-400">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Firestore: Sync OK</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#091124] border border-[#1b2a4a] text-[11px] font-mono text-sky-300">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Cloud Run: Activo</span>
            </div>
          </div>

          {/* Quick simulator launcher */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 via-sky-500/15 to-transparent text-amber-300 hover:from-amber-500/30 hover:to-sky-500/25 border border-amber-400/30 transition-all cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span className="hidden sm:inline">Simular Recorrido</span>
            <span className="sm:hidden">Simulador</span>
          </button>

          {/* Refresh Action */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              title="Refrescar datos en vivo de Firestore"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
