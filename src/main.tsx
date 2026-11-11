import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl mb-4">
            💎
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Juan Carlos | Mines AI — Recuperación de Sistema
          </h1>
          <p className="text-sm text-slate-300 max-w-md mb-4">
            Se detectó un inconveniente en la interfaz. Puedes reintentar cargar la aplicación sin perder tus datos o restablecer la caché temporal si persiste.
          </p>
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs font-mono text-red-300 mb-4 max-w-lg overflow-auto">
            {typeof this.state.error?.message === 'string'
              ? this.state.error.message
              : typeof this.state.error === 'object' && this.state.error !== null
              ? (this.state.error as any).message || JSON.stringify(this.state.error)
              : String(this.state.error || 'Error desconocido')}
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Reintentar Recargar
            </button>
            <button
              onClick={() => {
                try {
                  // Only remove app storage keys, do not affect unrelated storage
                  const keysToRemove = [
                    'mines_ai_bot_config',
                    'mines_ai_keywords',
                    'mines_ai_messages',
                    'mines_ai_media',
                    'mines_ai_tutorials',
                    'mines_ai_users',
                    'mines_ai_conversations',
                    'mines_ai_support',
                    'mines_ai_links',
                    'mines_ai_general_config',
                  ];
                  keysToRemove.forEach((k) => localStorage.removeItem(k));
                } catch (e) {
                  // ignore
                }
                window.location.reload();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer border border-slate-700"
            >
              Restablecer Caché Local
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } else {
    console.error('No se encontró el elemento #root en el DOM');
  }
} catch (bootErr) {
  console.error('[Error Crítico de Montaje]', bootErr);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: #030712; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 12px;">💎</div>
        <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Juan Carlos | Mines AI — Recuperación de Arranque</h1>
        <p style="font-size: 13px; color: #94a3b8; max-width: 400px; margin-bottom: 16px;">Ocurrió un error cargando el módulo principal. Pulsa para reiniciar el panel.</p>
        <button onclick="localStorage.clear(); window.location.reload();" style="background: #0284c7; color: white; border: none; padding: 10px 18px; border-radius: 10px; font-weight: bold; cursor: pointer;">
          Reiniciar Panel
        </button>
      </div>
    `;
  }
}
