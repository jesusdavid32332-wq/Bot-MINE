import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import dotenv from 'dotenv';
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

dotenv.config();

class MemoryStorageStore {
  users = new Map<string, TelegramUser>();
  messages = new Map<string, AutoMessage>();
  media = new Map<string, MediaItem>();
  conditions = new Map<string, any>();
  settings = new Map<string, any>();
  conversations = new Map<string, UserConversation>();
  tutorials = new Map<string, Tutorial>();
  trackedLinks = new Map<string, TrackedLink>();
  supportTickets = new Map<string, SupportTicket>();
  processedUpdates = new Set<string>();

  constructor() {
    INITIAL_USERS.forEach((u) => this.users.set(u.telegramId, u));
    INITIAL_MESSAGES.forEach((m) => this.messages.set(m.id, m));
    INITIAL_MEDIA_ITEMS.forEach((m) => this.media.set(m.id, m));
    this.conditions.set('default', { ...DEFAULT_KEYWORD_CONFIG, id: 'default' });
    this.settings.set('bot_config', INITIAL_BOT_CONFIG);
    this.settings.set('general_config', INITIAL_GENERAL_CONFIG);
    INITIAL_TUTORIALS.forEach((t) => this.tutorials.set(t.id, t));
    INITIAL_TRACKED_LINKS.forEach((l) => this.trackedLinks.set(l.id, l));
    INITIAL_SUPPORT_TICKETS.forEach((s) => this.supportTickets.set(s.id, s));
    Object.entries(INITIAL_CONVERSATIONS).forEach(([uid, conv]) => this.conversations.set(uid, conv));
  }
}

const memoryStore = new MemoryStorageStore();
let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRESQL_URL
  );
}

export function getSql(): NeonQueryFunction<false, false> | null {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;
  if (!cachedSql) {
    try {
      cachedSql = neon(dbUrl);
    } catch (err) {
      console.warn('[PostgresService] Error inicializando cliente Neon:', err);
      return null;
    }
  }
  return cachedSql;
}

let isDbInitialized = false;

export const PostgresService = {
  isConfigured(): boolean {
    return Boolean(getDatabaseUrl());
  },

  async ensureSchema(): Promise<boolean> {
    const sql = getSql();
    if (!sql) return false;
    if (isDbInitialized) return true;

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
            telegram_id VARCHAR(64) PRIMARY KEY,
            id VARCHAR(64) NOT NULL,
            name VARCHAR(255) DEFAULT '',
            username VARCHAR(255) DEFAULT '',
            current_step VARCHAR(64) NOT NULL DEFAULT 'START',
            stage VARCHAR(64) NOT NULL DEFAULT 'Inicio',
            declared_country VARCHAR(100),
            experience_level VARCHAR(64),
            account_id VARCHAR(100),
            account_status VARCHAR(64) NOT NULL DEFAULT 'pendiente_revision',
            notes TEXT DEFAULT '',
            messages_sent INTEGER NOT NULL DEFAULT 0,
            messages_received INTEGER NOT NULL DEFAULT 0,
            raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(64) PRIMARY KEY,
            step_id VARCHAR(64) NOT NULL,
            internal_name VARCHAR(255) NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0,
            content_type VARCHAR(64) NOT NULL DEFAULT 'text',
            text TEXT NOT NULL,
            buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
            media_url TEXT,
            condition TEXT,
            next_step_id VARCHAR(64),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS conversations (
            user_id VARCHAR(64) PRIMARY KEY,
            telegram_id VARCHAR(64) NOT NULL,
            status VARCHAR(64) NOT NULL DEFAULT 'automated',
            last_message_time VARCHAR(64),
            current_step VARCHAR(64),
            messages JSONB NOT NULL DEFAULT '[]'::jsonb,
            raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS media_items (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(32) NOT NULL DEFAULT 'photo',
            url TEXT NOT NULL,
            description TEXT DEFAULT '',
            associated_step VARCHAR(64),
            raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS conditions (
            id VARCHAR(64) PRIMARY KEY,
            raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(64) PRIMARY KEY,
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS processed_updates (
            update_id VARCHAR(128) PRIMARY KEY,
            processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Seed messages if empty
      const existingMsgs = await sql`SELECT id FROM messages LIMIT 1;`;
      if (existingMsgs.length === 0) {
        for (const msg of INITIAL_MESSAGES) {
          await sql`
            INSERT INTO messages (id, step_id, internal_name, order_index, content_type, text, buttons, media_url, condition, next_step_id, is_active, raw_data)
            VALUES (${msg.id}, ${msg.stepId}, ${msg.internalName}, ${msg.order}, ${msg.contentType}, ${msg.text}, ${JSON.stringify(msg.buttons || [])}, ${msg.mediaUrl || null}, ${msg.condition || ''}, ${msg.nextStepId}, ${msg.isActive !== false}, ${JSON.stringify(msg)})
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }

      // Seed settings if empty
      const existingSettings = await sql`SELECT id FROM settings WHERE id = 'bot_config' LIMIT 1;`;
      if (existingSettings.length === 0) {
        await sql`
          INSERT INTO settings (id, data)
          VALUES ('bot_config', ${JSON.stringify(INITIAL_BOT_CONFIG)})
          ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
          INSERT INTO settings (id, data)
          VALUES ('general_config', ${JSON.stringify(INITIAL_GENERAL_CONFIG)})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed conditions if empty
      const existingConditions = await sql`SELECT id FROM conditions WHERE id = 'default' LIMIT 1;`;
      if (existingConditions.length === 0) {
        await sql`
          INSERT INTO conditions (id, raw_data)
          VALUES ('default', ${JSON.stringify(DEFAULT_KEYWORD_CONFIG)})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed media if empty
      const existingMedia = await sql`SELECT id FROM media_items LIMIT 1;`;
      if (existingMedia.length === 0) {
        for (const media of INITIAL_MEDIA_ITEMS) {
          await sql`
            INSERT INTO media_items (id, name, type, url, description, associated_step, raw_data)
            VALUES (${media.id}, ${media.name}, ${media.type}, ${media.url}, ${media.description || ''}, ${media.associatedStep || null}, ${JSON.stringify(media)})
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }

      isDbInitialized = true;
      console.log('[PostgresService] Esquema de Neon PostgreSQL verificado.');
      return true;
    } catch (err) {
      console.warn('[PostgresService] Error verificando/creando esquema en Neon:', err);
      return false;
    }
  },

  // USERS
  async getUsers(): Promise<TelegramUser[]> {
    const sql = getSql();
    if (!sql) return Array.from(memoryStore.users.values());
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT * FROM users ORDER BY updated_at DESC;`;
      if (rows.length === 0) return Array.from(memoryStore.users.values());
      return rows.map((r: any) => {
        const raw = r.raw_data || {};
        return {
          id: r.id || `usr-${r.telegram_id}`,
          telegramId: r.telegram_id,
          name: r.name || 'Usuario',
          username: r.username || '',
          currentStep: r.current_step,
          stage: r.stage || 'Inicio',
          declaredCountry: r.declared_country || undefined,
          experienceLevel: r.experience_level || 'principiante',
          accountId: r.account_id || undefined,
          accountStatus: r.account_status,
          notes: r.notes || '',
          messagesSent: Number(r.messages_sent || 0),
          messagesReceived: Number(r.messages_received || 0),
          consentGiven: Boolean(raw.consentGiven),
          country: raw.country || '',
          joinDate: raw.joinDate || (r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()),
          lastActivity: raw.lastActivity || 'Reciente',
          status: raw.status || 'active',
          ...raw,
        } as TelegramUser;
      });
    } catch (err) {
      console.warn('[PostgresService] Error obteniendo usuarios:', err);
      return Array.from(memoryStore.users.values());
    }
  },

  async getUser(telegramId: string): Promise<TelegramUser | null> {
    const sql = getSql();
    if (!sql) return memoryStore.users.get(telegramId) || null;
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT * FROM users WHERE telegram_id = ${telegramId} LIMIT 1;`;
      if (rows.length === 0) return memoryStore.users.get(telegramId) || null;
      const r = rows[0];
      const raw = r.raw_data || {};
      return {
        id: r.id || `usr-${r.telegram_id}`,
        telegramId: r.telegram_id,
        name: r.name || 'Usuario',
        username: r.username || '',
        currentStep: r.current_step,
        stage: r.stage || 'Inicio',
        declaredCountry: r.declared_country || undefined,
        experienceLevel: r.experience_level || 'principiante',
        accountId: r.account_id || undefined,
        accountStatus: r.account_status,
        notes: r.notes || '',
        messagesSent: Number(r.messages_sent || 0),
        messagesReceived: Number(r.messages_received || 0),
        consentGiven: Boolean(raw.consentGiven),
        country: raw.country || '',
        joinDate: raw.joinDate || (r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()),
        lastActivity: raw.lastActivity || 'Reciente',
        status: raw.status || 'active',
        ...raw,
      } as TelegramUser;
    } catch (err) {
      console.warn('[PostgresService] Error obteniendo usuario:', err);
      return memoryStore.users.get(telegramId) || null;
    }
  },

  async saveUser(user: TelegramUser): Promise<void> {
    memoryStore.users.set(user.telegramId, user);
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      await sql`
        INSERT INTO users (
          telegram_id, id, name, username, current_step, stage,
          declared_country, experience_level, account_id, account_status,
          notes, messages_sent, messages_received, raw_data, updated_at
        ) VALUES (
          ${user.telegramId}, ${user.id || `usr-${user.telegramId}`}, ${user.name || ''},
          ${user.username || ''}, ${user.currentStep || 'START'}, ${user.stage || 'Inicio'},
          ${user.declaredCountry || null}, ${user.experienceLevel || 'principiante'},
          ${user.accountId || null}, ${user.accountStatus || 'pendiente_revision'},
          ${user.notes || ''}, ${user.messagesSent || 0}, ${user.messagesReceived || 0},
          ${JSON.stringify(user)}, CURRENT_TIMESTAMP
        )
        ON CONFLICT (telegram_id) DO UPDATE SET
          name = EXCLUDED.name,
          username = EXCLUDED.username,
          current_step = EXCLUDED.current_step,
          stage = EXCLUDED.stage,
          declared_country = EXCLUDED.declared_country,
          experience_level = EXCLUDED.experience_level,
          account_id = EXCLUDED.account_id,
          account_status = EXCLUDED.account_status,
          notes = EXCLUDED.notes,
          messages_sent = EXCLUDED.messages_sent,
          messages_received = EXCLUDED.messages_received,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP;
      `;
    } catch (err) {
      console.warn('[PostgresService] Error guardando usuario:', err);
    }
  },

  async updateUserStatus(telegramId: string, status: any, notes?: string): Promise<void> {
    const memUser = memoryStore.users.get(telegramId);
    if (memUser) {
      memUser.accountStatus = status;
      if (notes !== undefined) memUser.notes = notes;
      memoryStore.users.set(telegramId, memUser);
    }
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      if (notes !== undefined) {
        await sql`
          UPDATE users
          SET account_status = ${status}, notes = ${notes}, updated_at = CURRENT_TIMESTAMP
          WHERE telegram_id = ${telegramId};
        `;
      } else {
        await sql`
          UPDATE users
          SET account_status = ${status}, updated_at = CURRENT_TIMESTAMP
          WHERE telegram_id = ${telegramId};
        `;
      }
    } catch (err) {
      console.warn('[PostgresService] Error actualizando estado de usuario:', err);
    }
  },

  // MESSAGES
  async getMessages(): Promise<AutoMessage[]> {
    const sql = getSql();
    if (!sql) return Array.from(memoryStore.messages.values()).sort((a, b) => a.order - b.order);
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT * FROM messages ORDER BY order_index ASC;`;
      if (rows.length === 0) return INITIAL_MESSAGES;
      return rows.map((r: any) => {
        const raw = r.raw_data || {};
        return {
          id: r.id,
          stepId: r.step_id,
          internalName: r.internal_name,
          order: Number(r.order_index || 0),
          contentType: r.content_type,
          text: r.text,
          buttons: r.buttons || [],
          mediaUrl: r.media_url || undefined,
          condition: r.condition || '',
          nextStepId: r.next_step_id || 'END',
          isActive: Boolean(r.is_active),
          stageTag: raw.stageTag || 'Paso',
          ...raw,
        } as AutoMessage;
      });
    } catch (err) {
      console.warn('[PostgresService] Error obteniendo mensajes:', err);
      return Array.from(memoryStore.messages.values());
    }
  },

  async saveMessages(messages: AutoMessage[]): Promise<void> {
    messages.forEach((m) => memoryStore.messages.set(m.id, m));
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      for (const msg of messages) {
        await sql`
          INSERT INTO messages (id, step_id, internal_name, order_index, content_type, text, buttons, media_url, condition, next_step_id, is_active, raw_data, updated_at)
          VALUES (
            ${msg.id}, ${msg.stepId}, ${msg.internalName}, ${msg.order}, ${msg.contentType}, ${msg.text},
            ${JSON.stringify(msg.buttons || [])}, ${msg.mediaUrl || null}, ${msg.condition || ''},
            ${msg.nextStepId}, ${msg.isActive !== false}, ${JSON.stringify(msg)}, CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            step_id = EXCLUDED.step_id,
            internal_name = EXCLUDED.internal_name,
            order_index = EXCLUDED.order_index,
            content_type = EXCLUDED.content_type,
            text = EXCLUDED.text,
            buttons = EXCLUDED.buttons,
            media_url = EXCLUDED.media_url,
            condition = EXCLUDED.condition,
            next_step_id = EXCLUDED.next_step_id,
            is_active = EXCLUDED.is_active,
            raw_data = EXCLUDED.raw_data,
            updated_at = CURRENT_TIMESTAMP;
        `;
      }
    } catch (err) {
      console.warn('[PostgresService] Error guardando mensajes:', err);
    }
  },

  // SETTINGS (bot_config, general_config)
  async getBotConfig(): Promise<BotConfig> {
    const sql = getSql();
    if (!sql) return memoryStore.settings.get('bot_config') || INITIAL_BOT_CONFIG;
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT data FROM settings WHERE id = 'bot_config' LIMIT 1;`;
      if (rows.length > 0 && rows[0].data) {
        const d = rows[0].data;
        return (d.data || d) as BotConfig;
      }
      return INITIAL_BOT_CONFIG;
    } catch (err) {
      console.warn('[PostgresService] Error leyendo bot_config:', err);
      return memoryStore.settings.get('bot_config') || INITIAL_BOT_CONFIG;
    }
  },

  async saveBotConfig(config: BotConfig): Promise<void> {
    memoryStore.settings.set('bot_config', config);
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      await sql`
        INSERT INTO settings (id, data, updated_at)
        VALUES ('bot_config', ${JSON.stringify(config)}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = CURRENT_TIMESTAMP;
      `;
    } catch (err) {
      console.warn('[PostgresService] Error guardando bot_config:', err);
    }
  },

  async getGeneralConfig(): Promise<GeneralConfig> {
    const sql = getSql();
    if (!sql) return memoryStore.settings.get('general_config') || INITIAL_GENERAL_CONFIG;
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT data FROM settings WHERE id = 'general_config' LIMIT 1;`;
      if (rows.length > 0 && rows[0].data) {
        const d = rows[0].data;
        return (d.data || d) as GeneralConfig;
      }
      return INITIAL_GENERAL_CONFIG;
    } catch (err) {
      console.warn('[PostgresService] Error leyendo general_config:', err);
      return memoryStore.settings.get('general_config') || INITIAL_GENERAL_CONFIG;
    }
  },

  async saveGeneralConfig(config: GeneralConfig): Promise<void> {
    memoryStore.settings.set('general_config', config);
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      await sql`
        INSERT INTO settings (id, data, updated_at)
        VALUES ('general_config', ${JSON.stringify(config)}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = CURRENT_TIMESTAMP;
      `;
    } catch (err) {
      console.warn('[PostgresService] Error guardando general_config:', err);
    }
  },

  // CONDITIONS
  async getConditions(): Promise<DeterministicKeywordConfig> {
    const sql = getSql();
    if (!sql) return memoryStore.conditions.get('default') || DEFAULT_KEYWORD_CONFIG;
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT raw_data FROM conditions WHERE id = 'default' LIMIT 1;`;
      if (rows.length > 0 && rows[0].raw_data) {
        return rows[0].raw_data as DeterministicKeywordConfig;
      }
      return DEFAULT_KEYWORD_CONFIG;
    } catch (err) {
      console.warn('[PostgresService] Error obteniendo condiciones:', err);
      return memoryStore.conditions.get('default') || DEFAULT_KEYWORD_CONFIG;
    }
  },

  async saveConditions(config: DeterministicKeywordConfig): Promise<void> {
    memoryStore.conditions.set('default', config);
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      await sql`
        INSERT INTO conditions (id, raw_data, updated_at)
        VALUES ('default', ${JSON.stringify(config)}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP;
      `;
    } catch (err) {
      console.warn('[PostgresService] Error guardando condiciones:', err);
    }
  },

  // MEDIA
  async getMedia(): Promise<MediaItem[]> {
    const sql = getSql();
    if (!sql) return Array.from(memoryStore.media.values());
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT * FROM media_items ORDER BY created_at ASC;`;
      if (rows.length === 0) return INITIAL_MEDIA_ITEMS;
      return rows.map((r: any) => {
        const raw = r.raw_data || {};
        return {
          id: r.id,
          name: r.name,
          type: r.type,
          url: r.url,
          description: r.description || '',
          associatedStep: r.associated_step || 'START',
          sizeBytes: raw.sizeBytes || 1024,
          isRealAsset: raw.isRealAsset !== false,
          createdAt: raw.createdAt || new Date().toISOString(),
          ...raw,
        } as MediaItem;
      });
    } catch (err) {
      console.warn('[PostgresService] Error obteniendo media:', err);
      return Array.from(memoryStore.media.values());
    }
  },

  async saveMedia(items: MediaItem[]): Promise<void> {
    items.forEach((m) => memoryStore.media.set(m.id, m));
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      for (const m of items) {
        await sql`
          INSERT INTO media_items (id, name, type, url, description, associated_step, raw_data, updated_at)
          VALUES (
            ${m.id}, ${m.name}, ${m.type}, ${m.url}, ${m.description || ''}, ${m.associatedStep || null}, ${JSON.stringify(m)}, CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            url = EXCLUDED.url,
            description = EXCLUDED.description,
            associated_step = EXCLUDED.associated_step,
            raw_data = EXCLUDED.raw_data,
            updated_at = CURRENT_TIMESTAMP;
        `;
      }
    } catch (err) {
      console.warn('[PostgresService] Error guardando media:', err);
    }
  },

  // CONVERSATIONS
  async getConversations(): Promise<Record<string, UserConversation>> {
    const sql = getSql();
    if (!sql) {
      const res: Record<string, UserConversation> = {};
      memoryStore.conversations.forEach((val, key) => (res[key] = val));
      return res;
    }
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT * FROM conversations;`;
      const res: Record<string, UserConversation> = {};
      rows.forEach((r: any) => {
        const raw = r.raw_data || {};
        res[r.user_id] = {
          userId: r.user_id,
          status: r.status || 'automated',
          lastMessageTime: r.last_message_time || new Date().toLocaleTimeString(),
          currentStep: r.current_step || 'START',
          messages: r.messages || [],
          ...raw,
        } as UserConversation;
      });
      return res;
    } catch (err) {
      console.warn('[PostgresService] Error obteniendo conversaciones:', err);
      const res: Record<string, UserConversation> = {};
      memoryStore.conversations.forEach((val, key) => (res[key] = val));
      return res;
    }
  },

  async saveConversations(conversations: Record<string, UserConversation>): Promise<void> {
    Object.entries(conversations).forEach(([uid, conv]) => memoryStore.conversations.set(uid, conv));
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      for (const [userId, conv] of Object.entries(conversations)) {
        await sql`
          INSERT INTO conversations (user_id, telegram_id, status, last_message_time, current_step, messages, raw_data, updated_at)
          VALUES (
            ${userId}, ${userId}, ${conv.status || 'automated'},
            ${conv.lastMessageTime || new Date().toLocaleTimeString()},
            ${conv.currentStep || 'START'}, ${JSON.stringify(conv.messages || [])},
            ${JSON.stringify(conv)}, CURRENT_TIMESTAMP
          )
          ON CONFLICT (user_id) DO UPDATE SET
            status = EXCLUDED.status,
            last_message_time = EXCLUDED.last_message_time,
            current_step = EXCLUDED.current_step,
            messages = EXCLUDED.messages,
            raw_data = EXCLUDED.raw_data,
            updated_at = CURRENT_TIMESTAMP;
        `;
      }
    } catch (err) {
      console.warn('[PostgresService] Error guardando conversaciones:', err);
    }
  },

  async recordConversationMessage(telegramId: string, message: any): Promise<void> {
    const conv = memoryStore.conversations.get(telegramId) || {
      userId: telegramId,
      status: 'automated' as const,
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentStep: 'START' as const,
      messages: [],
    };
    conv.messages = [...conv.messages, message];
    conv.lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    memoryStore.conversations.set(telegramId, conv);

    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      await sql`
        INSERT INTO conversations (user_id, telegram_id, status, last_message_time, current_step, messages, raw_data, updated_at)
        VALUES (
          ${telegramId}, ${telegramId}, ${conv.status}, ${conv.lastMessageTime}, ${conv.currentStep},
          ${JSON.stringify(conv.messages)}, ${JSON.stringify(conv)}, CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) DO UPDATE SET
          messages = EXCLUDED.messages,
          last_message_time = CURRENT_TIMESTAMP,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP;
      `;
    } catch (err) {
      console.warn('[PostgresService] Error guardando mensaje en conversación:', err);
    }
  },

  // PROCESSED UPDATES (Deduplication)
  async isUpdateProcessed(updateId: string | number): Promise<boolean> {
    const idStr = String(updateId);
    if (memoryStore.processedUpdates.has(idStr)) return true;
    const sql = getSql();
    if (!sql) return false;
    try {
      await this.ensureSchema();
      const rows = await sql`SELECT update_id FROM processed_updates WHERE update_id = ${idStr} LIMIT 1;`;
      return rows.length > 0;
    } catch (err) {
      console.warn('[PostgresService] Error verificando update_id:', err);
      return false;
    }
  },

  async markUpdateProcessed(updateId: string | number): Promise<void> {
    const idStr = String(updateId);
    memoryStore.processedUpdates.add(idStr);
    const sql = getSql();
    if (!sql) return;
    try {
      await this.ensureSchema();
      await sql`
        INSERT INTO processed_updates (update_id, processed_at)
        VALUES (${idStr}, CURRENT_TIMESTAMP)
        ON CONFLICT (update_id) DO NOTHING;
      `;
    } catch (err) {
      console.warn('[PostgresService] Error marcando update_id como procesado:', err);
    }
  },
};
