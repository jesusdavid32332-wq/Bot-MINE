import {
  AutoMessage,
  BotConfig,
  DeterministicKeywordConfig,
  GeneralConfig,
  MediaItem,
  SupportTicket,
  TelegramUser,
  TrackedLink,
  Tutorial,
  UserConversation,
} from '../types';
import {
  INITIAL_BOT_CONFIG,
  INITIAL_CONVERSATIONS,
  INITIAL_GENERAL_CONFIG,
  INITIAL_MEDIA_ITEMS,
  INITIAL_MESSAGES,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_TRACKED_LINKS,
  INITIAL_TUTORIALS,
  INITIAL_USERS,
} from './mockData';
import { DEFAULT_KEYWORD_CONFIG } from './deterministicBotEngine';
import { DataService } from './dataService';

const STORAGE_KEYS = {
  BOT_CONFIG: 'jc_mines_bot_config_v3',
  KEYWORDS: 'jc_mines_keywords_v3',
  MESSAGES: 'jc_mines_messages_v3',
  MEDIA_ITEMS: 'jc_mines_media_v3',
  TUTORIALS: 'jc_mines_tutorials_v3',
  USERS: 'jc_mines_users_v3',
  CONVERSATIONS: 'jc_mines_conversations_v3',
  SUPPORT_TICKETS: 'jc_mines_support_v3',
  TRACKED_LINKS: 'jc_mines_links_v3',
  GENERAL_CONFIG: 'jc_mines_general_config_v3',
};

// In-memory cache
const memoryCache: Record<string, any> = {};

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__storage_test_v3__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const hasLocalStorage = isLocalStorageAvailable();

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    if (hasLocalStorage) {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed !== null && parsed !== undefined) {
          if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
            return defaultValue;
          }
          return parsed as T;
        }
      }
    }
  } catch (err) {
    console.warn(`[StorageService] Fallback to memory for ${key}:`, err);
  }

  if (memoryCache[key] !== undefined) {
    return memoryCache[key] as T;
  }
  return defaultValue;
}

function setStoredItem<T>(key: string, value: T): void {
  memoryCache[key] = value;
  try {
    if (hasLocalStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.warn(`[StorageService] Error saving to localStorage for ${key}:`, err);
  }
}

export const StorageService = {
  getBotConfig: (): BotConfig =>
    getStoredItem(STORAGE_KEYS.BOT_CONFIG, INITIAL_BOT_CONFIG) || INITIAL_BOT_CONFIG,
  saveBotConfig: (config: BotConfig): void => {
    setStoredItem(STORAGE_KEYS.BOT_CONFIG, config);
    DataService.saveBotConfig(config).catch(console.warn);
  },

  getKeywordConfig: (): DeterministicKeywordConfig =>
    getStoredItem(STORAGE_KEYS.KEYWORDS, DEFAULT_KEYWORD_CONFIG) || DEFAULT_KEYWORD_CONFIG,
  saveKeywordConfig: (config: DeterministicKeywordConfig): void => {
    setStoredItem(STORAGE_KEYS.KEYWORDS, config);
    DataService.saveConditions(config).catch(console.warn);
  },

  getMessages: (): AutoMessage[] => {
    const res = getStoredItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    return Array.isArray(res) && res.length > 0 ? res : INITIAL_MESSAGES;
  },
  saveMessages: (messages: AutoMessage[]): void => {
    setStoredItem(STORAGE_KEYS.MESSAGES, messages);
    DataService.saveMessages(messages).catch(console.warn);
  },

  getMediaItems: (): MediaItem[] => {
    const res = getStoredItem(STORAGE_KEYS.MEDIA_ITEMS, INITIAL_MEDIA_ITEMS);
    return Array.isArray(res) && res.length > 0 ? res : INITIAL_MEDIA_ITEMS;
  },
  saveMediaItems: (items: MediaItem[]): void => {
    setStoredItem(STORAGE_KEYS.MEDIA_ITEMS, items);
    DataService.saveMedia(items).catch(console.warn);
  },

  getTutorials: (): Tutorial[] => {
    const res = getStoredItem(STORAGE_KEYS.TUTORIALS, INITIAL_TUTORIALS);
    return Array.isArray(res) && res.length > 0 ? res : INITIAL_TUTORIALS;
  },
  saveTutorials: (tutorials: Tutorial[]): void =>
    setStoredItem(STORAGE_KEYS.TUTORIALS, tutorials),

  getUsers: (): TelegramUser[] => {
    const res = getStoredItem(STORAGE_KEYS.USERS, []);
    return Array.isArray(res) ? res : [];
  },
  saveUsers: (users: TelegramUser[]): void => {
    setStoredItem(STORAGE_KEYS.USERS, users);
    users.forEach((u) => DataService.saveUser(u).catch(console.warn));
  },

  getConversations: (): Record<string, UserConversation> =>
    getStoredItem(STORAGE_KEYS.CONVERSATIONS, {}) || {},
  saveConversations: (conversations: Record<string, UserConversation>): void => {
    setStoredItem(STORAGE_KEYS.CONVERSATIONS, conversations);
  },

  getSupportTickets: (): SupportTicket[] => {
    const res = getStoredItem(STORAGE_KEYS.SUPPORT_TICKETS, []);
    return Array.isArray(res) ? res : [];
  },
  saveSupportTickets: (tickets: SupportTicket[]): void =>
    setStoredItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets),

  getTrackedLinks: (): TrackedLink[] => {
    const res = getStoredItem(STORAGE_KEYS.TRACKED_LINKS, INITIAL_TRACKED_LINKS);
    return Array.isArray(res) && res.length > 0 ? res : INITIAL_TRACKED_LINKS;
  },
  saveTrackedLinks: (links: TrackedLink[]): void =>
    setStoredItem(STORAGE_KEYS.TRACKED_LINKS, links),

  getGeneralConfig: (): GeneralConfig =>
    getStoredItem(STORAGE_KEYS.GENERAL_CONFIG, INITIAL_GENERAL_CONFIG) || INITIAL_GENERAL_CONFIG,
  saveGeneralConfig: (config: GeneralConfig): void => {
    setStoredItem(STORAGE_KEYS.GENERAL_CONFIG, config);
    DataService.saveGeneralConfig(config).catch(console.warn);
  },

  resetAllToDemo: (): void => {
    Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
    if (hasLocalStorage) {
      try {
        Object.values(STORAGE_KEYS).forEach((key) => {
          window.localStorage.removeItem(key);
        });
      } catch (e) {
        console.warn('[StorageService] Error clearing localStorage:', e);
      }
    }
  },

  exportFullBackup: (): string => {
    const backup = {
      timestamp: new Date().toISOString(),
      botConfig: StorageService.getBotConfig(),
      keywordConfig: StorageService.getKeywordConfig(),
      messages: StorageService.getMessages(),
      mediaItems: StorageService.getMediaItems(),
      tutorials: StorageService.getTutorials(),
      users: StorageService.getUsers(),
      conversations: StorageService.getConversations(),
      supportTickets: StorageService.getSupportTickets(),
      trackedLinks: StorageService.getTrackedLinks(),
      generalConfig: StorageService.getGeneralConfig(),
    };
    return JSON.stringify(backup, null, 2);
  },
};
