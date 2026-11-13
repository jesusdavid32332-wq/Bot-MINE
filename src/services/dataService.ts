// Client-side and server-side unified DataService
// Connects to REST backend endpoints backed by Neon PostgreSQL
import {
  AutoMessage,
  BotConfig,
  DepositReceipt,
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
import {
  DEFAULT_APPROVAL_MESSAGE_TEXT,
  DEFAULT_DEPOSIT_PROMPT_TEXT,
  DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
  DEFAULT_KEYWORD_CONFIG,
  DEFAULT_PLANS_MESSAGE_TEXT,
  DEFAULT_REGISTRATION_LINK,
  DEFAULT_REGISTRATION_MESSAGE_TEXT,
  DEFAULT_REGISTRATION_PHOTOS,
} from './deterministicBotEngine';
import { isErrorObject, sanitizeConversations, sanitizeUsers } from '../utils/safeText';

async function safeFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (isErrorObject(data)) {
      throw new Error((data as any).message || 'Error recibido de API');
    }
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
      const res = await safeFetch<{ success: boolean; users?: TelegramUser[] }>('/api/users');
      if (res && Array.isArray(res.users)) {
        return sanitizeUsers(res.users);
      }
      return [];
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

  // ADMINISTRATIVE TRANSITIONS FOR THE 3-STAGE FLOW
  async verifyUserId(telegramId: string, adminId: string = 'Juan Carlos', notes?: string): Promise<{ success: boolean; user?: TelegramUser; message?: string }> {
    try {
      const res = await fetch(`/api/users/${telegramId}/verify-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, notes }),
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error verificando ID:', err);
      return { success: false, message: String(err) };
    }
  },

  async rejectUserId(telegramId: string, adminId: string = 'Juan Carlos', reason?: string): Promise<{ success: boolean; user?: TelegramUser; message?: string }> {
    try {
      const res = await fetch(`/api/users/${telegramId}/reject-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, reason }),
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error rechazando ID:', err);
      return { success: false, message: String(err) };
    }
  },

  async verifyUserPayment(telegramId: string, adminId: string = 'Juan Carlos', notes?: string): Promise<{ success: boolean; user?: TelegramUser; message?: string }> {
    try {
      const res = await fetch(`/api/users/${telegramId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, notes }),
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error verificando pago:', err);
      return { success: false, message: String(err) };
    }
  },

  async rejectUserPayment(telegramId: string, adminId: string = 'Juan Carlos', reason?: string): Promise<{ success: boolean; user?: TelegramUser; message?: string }> {
    try {
      const res = await fetch(`/api/users/${telegramId}/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, reason }),
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error rechazando pago:', err);
      return { success: false, message: String(err) };
    }
  },

  // DEPOSIT RECEIPTS (Comprobantes de Depósito)
  async getDeposits(): Promise<DepositReceipt[]> {
    try {
      const res = await safeFetch<{ success: boolean; deposits?: DepositReceipt[] }>('/api/deposits');
      return res && Array.isArray(res.deposits) ? res.deposits : [];
    } catch {
      return [];
    }
  },

  async approveDeposit(
    depositId: string,
    adminId: string = 'Juan Carlos',
    notes?: string
  ): Promise<{ success: boolean; deposit?: DepositReceipt; user?: TelegramUser; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, notes }),
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error aprobando comprobante:', err);
      return { success: false, error: String(err) };
    }
  },

  async rejectDeposit(
    depositId: string,
    adminId: string = 'Juan Carlos',
    reason?: string
  ): Promise<{ success: boolean; deposit?: DepositReceipt; user?: TelegramUser; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, reason }),
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error rechazando comprobante:', err);
      return { success: false, error: String(err) };
    }
  },

  async resetUserStage(telegramId: string): Promise<{ success: boolean; user?: TelegramUser }> {
    try {
      const res = await fetch(`/api/users/${telegramId}/reset-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error reiniciando etapa:', err);
      return { success: false };
    }
  },

  // MEDIA UPLOAD FROM DEVICE/GALLERY
  async uploadMediaFile(formData: FormData): Promise<{ success: boolean; item?: MediaItem; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (err) {
      console.error('[DataService] Error subiendo archivo:', err);
      return { success: false, error: String(err) };
    }
  },

  // CUSTOM CONTENT, REGISTRATION LINK, PHOTOS & EDITABLE FLOW MESSAGES
  async getCustomContent(): Promise<{
    customMinesContentText: string;
    customPlatformReasonText: string;
    registrationLink: string;
    registrationPhotoUrls: string[];
    plansMessageText: string;
    registrationMessageText: string;
    depositPromptText: string;
    approvalMessageText: string;
    fiveRoundsMessageText: string;
    scheduledDelayMinutes: number;
  }> {
    try {
      const res = await safeFetch<any>('/api/settings/custom-content');
      return {
        customMinesContentText: res.customMinesContentText || DEFAULT_KEYWORD_CONFIG.customMinesContentText || '',
        customPlatformReasonText: res.customPlatformReasonText || DEFAULT_KEYWORD_CONFIG.customPlatformReasonText || '',
        registrationLink: res.registrationLink || DEFAULT_REGISTRATION_LINK,
        registrationPhotoUrls:
          Array.isArray(res.registrationPhotoUrls) && res.registrationPhotoUrls.length > 0
            ? res.registrationPhotoUrls
            : DEFAULT_REGISTRATION_PHOTOS,
        plansMessageText: res.plansMessageText || DEFAULT_PLANS_MESSAGE_TEXT,
        registrationMessageText: res.registrationMessageText || DEFAULT_REGISTRATION_MESSAGE_TEXT,
        depositPromptText: res.depositPromptText || DEFAULT_DEPOSIT_PROMPT_TEXT,
        approvalMessageText: res.approvalMessageText || DEFAULT_APPROVAL_MESSAGE_TEXT,
        fiveRoundsMessageText: res.fiveRoundsMessageText || DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
        scheduledDelayMinutes: res.scheduledDelayMinutes ?? 0,
      };
    } catch {
      return {
        customMinesContentText: DEFAULT_KEYWORD_CONFIG.customMinesContentText || '',
        customPlatformReasonText: DEFAULT_KEYWORD_CONFIG.customPlatformReasonText || '',
        registrationLink: DEFAULT_REGISTRATION_LINK,
        registrationPhotoUrls: DEFAULT_REGISTRATION_PHOTOS,
        plansMessageText: DEFAULT_PLANS_MESSAGE_TEXT,
        registrationMessageText: DEFAULT_REGISTRATION_MESSAGE_TEXT,
        depositPromptText: DEFAULT_DEPOSIT_PROMPT_TEXT,
        approvalMessageText: DEFAULT_APPROVAL_MESSAGE_TEXT,
        fiveRoundsMessageText: DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
        scheduledDelayMinutes: 0,
      };
    }
  },

  async saveCustomContent(payload: {
    customMinesContentText?: string;
    customPlatformReasonText?: string;
    registrationLink?: string;
    registrationPhotoUrls?: string[];
    plansMessageText?: string;
    registrationMessageText?: string;
    depositPromptText?: string;
    approvalMessageText?: string;
    fiveRoundsMessageText?: string;
    scheduledDelayMinutes?: number;
  }): Promise<void> {
    try {
      await fetch('/api/settings/custom-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[DataService] Error guardando contenido personalizado:', err);
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
      const res = await safeFetch<{ success: boolean; config?: BotConfig }>('/api/bot-config');
      if (res && res.config && !isErrorObject(res.config)) {
        return res.config;
      }
      return INITIAL_BOT_CONFIG;
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
      const res = await safeFetch<{ success: boolean; config?: GeneralConfig }>('/api/general-config');
      if (res && res.config && !isErrorObject(res.config)) {
        return res.config;
      }
      return INITIAL_GENERAL_CONFIG;
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
      const res = await safeFetch<{ success: boolean; conversations?: Record<string, UserConversation> }>('/api/conversations');
      if (res && res.conversations && !isErrorObject(res.conversations)) {
        return sanitizeConversations(res.conversations);
      }
      return INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  },
};

export const dataService = DataService;
