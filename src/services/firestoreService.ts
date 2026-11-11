import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
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

export const FirestoreService = {
  // Initialize Firestore with default collections if not yet populated
  async initializeDatabaseIfEmpty(): Promise<void> {
    try {
      // Check if system messages collection already exists
      const messagesSnap = await getDocs(query(collection(db, 'messages'), limit(1)));
      if (messagesSnap.empty) {
        console.log('[Firestore] Inicializando plantillas del sistema en Cloud Firestore...');

        // 1. Seed the 15 automated deterministic messages
        for (const msg of INITIAL_MESSAGES) {
          await setDoc(doc(db, 'messages', msg.id), msg);
        }

        // 2. Seed real media assets
        for (const media of INITIAL_MEDIA_ITEMS) {
          await setDoc(doc(db, 'media', media.id), media);
        }

        // 3. Seed deterministic conditions & keywords
        await setDoc(doc(db, 'conditions', 'default'), {
          ...DEFAULT_KEYWORD_CONFIG,
          id: 'default',
        });

        // 4. Seed settings
        await setDoc(doc(db, 'settings', 'bot_config'), {
          id: 'bot_config',
          data: INITIAL_BOT_CONFIG,
          updatedAt: new Date().toISOString(),
        });

        await setDoc(doc(db, 'settings', 'general_config'), {
          id: 'general_config',
          data: INITIAL_GENERAL_CONFIG,
          updatedAt: new Date().toISOString(),
        });

        console.log('[Firestore] Plantillas del sistema inicializadas con éxito (0 usuarios falsos).');
      }
    } catch (err) {
      console.warn('[Firestore] Error durante la inicialización:', err);
    }
  },

  // USERS
  subscribeUsers(callback: (users: TelegramUser[]) => void): () => void {
    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const users = snapshot.docs.map((d) => d.data() as TelegramUser);
          callback(users);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn('[Firestore] Error en snapshot de usuarios:', error);
      }
    );
  },

  async saveUser(user: TelegramUser): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.telegramId), user, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error guardando usuario:', err);
    }
  },

  async updateUserStatus(telegramId: string, status: any, notes?: string): Promise<void> {
    try {
      const payload: Record<string, any> = { accountStatus: status };
      if (notes !== undefined) payload.notes = notes;
      await updateDoc(doc(db, 'users', telegramId), payload);
    } catch (err) {
      console.error('[Firestore] Error actualizando estado de usuario:', err);
    }
  },

  // MESSAGES
  subscribeMessages(callback: (messages: AutoMessage[]) => void): () => void {
    return onSnapshot(
      collection(db, 'messages'),
      (snapshot) => {
        if (!snapshot.empty) {
          const msgs = snapshot.docs
            .map((d) => d.data() as AutoMessage)
            .sort((a, b) => a.order - b.order);
          callback(msgs);
        } else {
          callback(INITIAL_MESSAGES);
        }
      },
      (error) => {
        console.warn('[Firestore] Error en snapshot de mensajes:', error);
      }
    );
  },

  async saveMessages(messages: AutoMessage[]): Promise<void> {
    try {
      for (const msg of messages) {
        await setDoc(doc(db, 'messages', msg.id), msg);
      }
    } catch (err) {
      console.error('[Firestore] Error guardando mensajes:', err);
    }
  },

  // MEDIA
  subscribeMedia(callback: (media: MediaItem[]) => void): () => void {
    return onSnapshot(
      collection(db, 'media'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as MediaItem);
          callback(items);
        } else {
          callback(INITIAL_MEDIA_ITEMS);
        }
      },
      (error) => {
        console.warn('[Firestore] Error en snapshot de multimedia:', error);
      }
    );
  },

  async saveMedia(items: MediaItem[]): Promise<void> {
    try {
      for (const item of items) {
        await setDoc(doc(db, 'media', item.id), item);
      }
    } catch (err) {
      console.error('[Firestore] Error guardando multimedia:', err);
    }
  },

  // CONDITIONS (Keywords)
  subscribeConditions(callback: (config: DeterministicKeywordConfig) => void): () => void {
    return onSnapshot(
      doc(db, 'conditions', 'default'),
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as DeterministicKeywordConfig);
        } else {
          callback(DEFAULT_KEYWORD_CONFIG);
        }
      },
      (error) => {
        console.warn('[Firestore] Error en snapshot de condiciones:', error);
      }
    );
  },

  async saveConditions(config: DeterministicKeywordConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'conditions', 'default'), {
        ...config,
        id: 'default',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Firestore] Error guardando condiciones:', err);
    }
  },

  // SETTINGS (bot_config, general_config)
  subscribeBotConfig(callback: (config: BotConfig) => void): () => void {
    return onSnapshot(
      doc(db, 'settings', 'bot_config'),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          callback(d.data || d);
        } else {
          callback(INITIAL_BOT_CONFIG);
        }
      },
      (error) => {
        console.warn('[Firestore] Error en snapshot de bot_config:', error);
      }
    );
  },

  async saveBotConfig(config: BotConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'bot_config'), {
        id: 'bot_config',
        data: config,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Firestore] Error guardando bot_config:', err);
    }
  },

  subscribeGeneralConfig(callback: (config: GeneralConfig) => void): () => void {
    return onSnapshot(
      doc(db, 'settings', 'general_config'),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          callback(d.data || d);
        } else {
          callback(INITIAL_GENERAL_CONFIG);
        }
      },
      (error) => {
        console.warn('[Firestore] Error en snapshot de general_config:', error);
      }
    );
  },

  async saveGeneralConfig(config: GeneralConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'general_config'), {
        id: 'general_config',
        data: config,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Firestore] Error guardando general_config:', err);
    }
  },

  // CONVERSATIONS
  subscribeConversations(callback: (convs: Record<string, UserConversation>) => void): () => void {
    return onSnapshot(
      collection(db, 'conversations'),
      (snapshot) => {
        if (!snapshot.empty) {
          const res: Record<string, UserConversation> = {};
          snapshot.docs.forEach((d) => {
            res[d.id] = d.data() as UserConversation;
          });
          callback(res);
        } else {
          callback({});
        }
      },
      (error) => {
        console.warn('[Firestore] Error en snapshot de conversaciones:', error);
      }
    );
  },

  async saveConversations(conversations: Record<string, UserConversation>): Promise<void> {
    try {
      for (const [userId, conv] of Object.entries(conversations)) {
        await setDoc(doc(db, 'conversations', userId), conv);
      }
    } catch (err) {
      console.error('[Firestore] Error guardando conversaciones:', err);
    }
  },
};
