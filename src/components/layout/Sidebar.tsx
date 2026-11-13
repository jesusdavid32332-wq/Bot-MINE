import React from 'react';
import { SectionId } from '../../types';
import {
  Global3DDefs,
  DashboardIcon3D,
  MessagesIcon3D,
  FlowIcon3D,
  IdTrackingIcon3D,
  TelegramAdminIcon3D,
  MediaIcon3D,
  TutorialsIcon3D,
  UsersIcon3D,
  ConversationsIcon3D,
  SupportIcon3D,
  LinksIcon3D,
  BotConfigIcon3D,
  GeneralConfigIcon3D,
  TelegramConnectIcon3D,
  DepositsIcon3D,
} from '../ui/Icons3D';
import { ShieldCheck, Flame, Radio } from 'lucide-react';

interface SidebarProps {
  currentSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  usersCount?: number;
  messagesCount?: number;
  trackedIdsCount?: number;
  pendingDepositsCount?: number;
}

interface MenuItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badgeKey?: 'users' | 'messages' | 'ids' | 'deposits' | 'fixed';
  badgeStatic?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon3D },
  { id: 'deposits', label: 'Depósitos pendientes', icon: DepositsIcon3D, badgeKey: 'deposits' },
  { id: 'telegram-connection', label: 'Conexión de Telegram', icon: TelegramConnectIcon3D, badgeKey: 'fixed', badgeStatic: 'BOT' },
  { id: 'messages', label: 'Mensajes automáticos', icon: MessagesIcon3D, badgeKey: 'messages' },
  { id: 'flow', label: 'Flujo de conversaciones', icon: FlowIcon3D },
  { id: 'id-tracking', label: 'Seguimiento de IDs', icon: IdTrackingIcon3D, badgeKey: 'ids' },
  { id: 'admin-telegram', label: 'Menú Admin Telegram', icon: TelegramAdminIcon3D, badgeKey: 'fixed', badgeStatic: '/admin' },
  { id: 'media', label: 'Fotografías y vídeos', icon: MediaIcon3D, badgeKey: 'fixed', badgeStatic: '8' },
  { id: 'tutorials', label: 'Tutoriales', icon: TutorialsIcon3D, badgeKey: 'fixed', badgeStatic: '2' },
  { id: 'users', label: 'Usuarios', icon: UsersIcon3D, badgeKey: 'users' },
  { id: 'conversations', label: 'Conversaciones', icon: ConversationsIcon3D },
  { id: 'support', label: 'Soporte', icon: SupportIcon3D },
  { id: 'links', label: 'Enlaces', icon: LinksIcon3D },
  { id: 'bot-config', label: 'Configuración del bot', icon: BotConfigIcon3D },
  { id: 'general-config', label: 'Configuración general', icon: GeneralConfigIcon3D },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isMobileOpen,
  onCloseMobile,
  usersCount = 0,
  messagesCount = 15,
  trackedIdsCount = 0,
  pendingDepositsCount = 0,
}) => {
  const getBadgeContent = (item: MenuItem) => {
    if (item.badgeKey === 'users') return usersCount > 0 ? String(usersCount) : undefined;
    if (item.badgeKey === 'messages') return String(messagesCount);
    if (item.badgeKey === 'ids') return trackedIdsCount > 0 ? String(trackedIdsCount) : undefined;
    if (item.badgeKey === 'deposits') return pendingDepositsCount > 0 ? String(pendingDepositsCount) : undefined;
    if (item.badgeKey === 'fixed') return item.badgeStatic;
    return undefined;
  };

  return (
    <>
      <Global3DDefs />

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#050914] border-r border-[#152037] flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#152037]/90 flex items-center justify-between bg-gradient-to-b from-[#091124] to-[#050914]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 via-sky-500/15 to-slate-950 border border-amber-400/40 flex items-center justify-center shadow-xl shadow-amber-950/30">
                <span className="text-2xl filter drop-shadow">💎</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#050914] shadow-sm"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">Juan Carlos</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 shadow-sm">
                  MINES AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Panel Administrativo</p>
            </div>
          </div>
        </div>

        {/* Real-time Infrastructure Cloud Pills */}
        <div className="px-3 pt-3 pb-2">
          <div className="p-2.5 rounded-2xl bg-[#091124]/90 border border-[#1b2a4a] space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Firebase Firestore
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                CONECTADO
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                Google Cloud Run
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                WEBHOOK LISTO
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Módulos del Sistema
          </div>
          {MENU_ITEMS.map((item) => {
            const Icon3D = item.icon;
            const isActive = currentSection === item.id;
            const badge = getBadgeContent(item);
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-transparent text-amber-200 border-l-2 border-amber-400 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">
                    <Icon3D size={20} />
                  </div>
                  <span className={`truncate ${isActive ? 'font-semibold text-white' : ''}`}>
                    {item.label}
                  </span>
                </div>
                {badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      isActive
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-[#0f172a] text-slate-400 border border-slate-800 group-hover:text-slate-200'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Super Admin Profile */}
        <div className="p-3 border-t border-[#152037] bg-[#030610]">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#091124]/60 border border-[#1b2a4a]">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-amber-400/30 shadow-sm">
              <img
                src="/public/assets/aistudio/IMG_7992_53256945.jpeg"
                alt="Juan Carlos"
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Juan Carlos</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Super Admin</span>
                <span>·</span>
                <span className="text-amber-400 font-semibold">+18</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
