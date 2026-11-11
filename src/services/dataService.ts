// Client-side and server-side unified DataService
// Connects to REST backend endpoints backed by Neon PostgreSQL
import {
  AutoMessage,
  BotConfig,
  DeterministicKeywordConfig,
  GeneralConfig,
  MediaItem,
  TelegramUser,
  UserConversation,
} from '../types';
import {
  INITIAL_BOT_CONFIG,
  INITIAL_CONVERSATIONS,
  INITIAL_GENERAL_CONFIG,
  INITIAL_MEDIA_ITEMS,
  INITIAL_MESSAGES,
} from './mockData';
import { DEFAULT_KEYWORD_CONFIG } from './deterministicBotEngine';

async function safeFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

export const DataService = {
  // USERS
  async getUsers(): Promise<TelegramUser[]> {
    try {
      const res = await safeFetch<{ success: boolean; users: TelegramUser[] }>('/api/users');
      return res.users || [];
    } catch {
      return [];
    }
  },

  async saveUser(user: TelegramUser): Promise<void> {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      console.warn('[DataService] Error guardando usuario:', e);
    }
  },

  async updateUserStatus(telegramId: string, status: any, notes?: string): Promise<void> {
    try {
      await fetch(`/api/users/${telegramId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
    } catch (e) {
      console.warn('[DataService] Error actualizando estado de usuario:', e);
    }
  },

  // MESSAGES
  async getMessages(): Promise<AutoMessage[]> {
    try {
      const res = await safeFetch<{ success: boolean; messages: AutoMessage[] }>('/api/messages');
      return res.messages && res.messages.length > 0 ? res.messages : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  },

  async saveMessages(messages: AutoMessage[]): Promise<void> {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
    } catch (e) {
      console.warn('[DataService] Error guardando mensajes:', e);
    }
  },

  // MEDIA
  async getMedia(): Promise<MediaItem[]> {
    try {
      const res = await safeFetch<{ success: boolean; media: MediaItem[] }>('/api/media');
      return res.media && res.media.length > 0 ? res.media : INITIAL_MEDIA_ITEMS;
    } catch {
      return INITIAL_MEDIA_ITEMS;
    }
  },

  async saveMedia(media: MediaItem[]): Promise<void> {
    try {
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media }),
      });
    } catch (e) {
      console.warn('[DataService] Error guardando multimedia:', e);
    }
  },

  // CONDITIONS
  async getConditions(): Promise<DeterministicKeywordConfig> {
    try {
      const res = await safeFetch<{ success: boolean; conditions: DeterministicKeywordConfig }>('/api/conditions');
      return res.conditions || DEFAULT_KEYWORD_CONFIG;
    } catch {
      return DEFAULT_KEYWORD_CONFIG;
    }
  },

  async saveConditions(conditions: DeterministicKeywordConfig): Promise<void> {
    try {
      await fetch('/api/conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions }),
      });
    } catch (e) {
      console.warn('[DataService] Error guardando condiciones:', e);
    }
  },

  // BOT CONFIG
  async getBotConfig(): Promise<BotConfig> {
    try {
      const res = await safeFetch<{ success: boolean; config: BotConfig }>('/api/bot-config');
      return res.config || INITIAL_BOT_CONFIG;
    } catch {
      return INITIAL_BOT_CONFIG;
    }
  },

  async saveBotConfig(config: BotConfig): Promise<void> {
    try {
      await fetch('/api/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
    } catch (e) {
      console.warn('[DataService] Error guardando bot config:', e);
    }
  },

  // GENERAL CONFIG
  async getGeneralConfig(): Promise<GeneralConfig> {
    try {
      const res = await safeFetch<{ success: boolean; config: GeneralConfig }>('/api/general-config');
      return res.config || INITIAL_GENERAL_CONFIG;
    } catch {
      return INITIAL_GENERAL_CONFIG;
    }
  },

  async saveGeneralConfig(config: GeneralConfig): Promise<void> {
    try {
      await fetch('/api/general-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
    } catch (e) {
      console.warn('[DataService] Error guardando general config:', e);
    }
  },

  // CONVERSATIONS
  async getConversations(): Promise<Record<string, UserConversation>> {
    try {
      const res = await safeFetch<{ success: boolean; conversations: Record<string, UserConversation> }>('/api/conversations');
      return res.conversations || INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  },
};
