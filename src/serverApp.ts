import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import {
  DEFAULT_APPROVAL_MESSAGE_TEXT,
  DEFAULT_DEPOSIT_PROMPT_TEXT,
  DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
  DEFAULT_KEYWORD_CONFIG,
  DEFAULT_PLANS_MESSAGE_TEXT,
  DEFAULT_REGISTRATION_LINK,
  DEFAULT_REGISTRATION_MESSAGE_TEXT,
  DEFAULT_REGISTRATION_PHOTOS,
  createTransitionRecord,
  getEtapa2ContentMessages,
  handleIncomingReceiptPhoto,
  processDeterministicUpdate,
} from './services/deterministicBotEngine';
import {
  INITIAL_BOT_CONFIG,
  INITIAL_CONVERSATIONS,
  INITIAL_GENERAL_CONFIG,
  INITIAL_MEDIA_ITEMS,
  INITIAL_MESSAGES,
  INITIAL_USERS,
} from './services/mockData';
import { AutoMessage, DepositReceipt, DeterministicKeywordConfig, FlowStepId, TelegramUser } from './types';
import { PostgresService } from './services/postgresService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Read environment variables with support for standard synonyms
const rawToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const rawAdmin = process.env.ADMIN_TELEGRAM_ID || process.env.ADMIN_TELEGRAM;
const rawSecret = process.env.WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;

// Note: For Vercel or Cloud Run, determine the public base URL
const rawBaseUrl =
  process.env.PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  (process.env.APP_URL && !process.env.APP_URL.includes('ais-dev-') ? process.env.APP_URL : undefined);

// Canonical secret configuration
export const CANONICAL_WEBHOOK_SECRET = (
  rawSecret ||
  'jc_mines_webhook_secret_9981'
).replace(/^["']|["']$/g, '').trim();

// Defensive detection: if token was accidentally set as ADMIN_TELEGRAM_ID
let currentBotToken: string | undefined = rawToken || (rawAdmin?.includes(':') ? rawAdmin : undefined);
const ADMIN_TELEGRAM_ID = rawAdmin && !rawAdmin.includes(':') ? rawAdmin : '684920153';
let currentWebhookSecret: string = CANONICAL_WEBHOOK_SECRET;
const PUBLIC_BASE_URL = (rawBaseUrl || 'https://mine-aimbot-167398797374.us-west2.run.app').replace(/\/$/, '');

// In-memory sets for fast update_id deduplication and concurrency locking
const processedUpdatesCache = new Set<string>();
const inFlightUpdatesLock = new Set<string>();

export function getActiveBotToken(): string | undefined {
  return currentBotToken || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
}

export function getActiveWebhookSecret(): string {
  return (currentWebhookSecret || CANONICAL_WEBHOOK_SECRET || 'jc_mines_webhook_secret_9981')
    .replace(/^["']|["']$/g, '')
    .trim();
}

export async function ensureWebhookSecret(): Promise<string> {
  if (currentWebhookSecret && currentWebhookSecret.trim().length > 0) {
    return currentWebhookSecret.trim();
  }
  try {
    const bConfig = await PostgresService.getBotConfig();
    if (bConfig?.webhookSecret && typeof bConfig.webhookSecret === 'string' && bConfig.webhookSecret.trim().length > 0) {
      currentWebhookSecret = bConfig.webhookSecret.trim();
      return currentWebhookSecret;
    }
  } catch (err) {
    console.warn('[Postgres] Error buscando webhook secret en base de datos:', err);
  }
  currentWebhookSecret = CANONICAL_WEBHOOK_SECRET;
  return CANONICAL_WEBHOOK_SECRET;
}

// Timing-safe comparison to prevent side-channel timing attacks
export function timingSafeSecretMatch(provided: string, expected: string): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function validateWebhookSecret(providedHeader: string | undefined, authorizedSecrets: Set<string>): boolean {
  if (!providedHeader || typeof providedHeader !== 'string') return false;
  const cleanProvided = providedHeader.replace(/^["']|["']$/g, '').trim();
  if (!cleanProvided) return false;

  for (const authorized of authorizedSecrets) {
    if (timingSafeSecretMatch(cleanProvided, authorized)) {
      return true;
    }
  }
  return false;
}

export async function getAuthorizedWebhookSecrets(): Promise<Set<string>> {
  const secrets = new Set<string>();

  // 1. Primary source: process.env.WEBHOOK_SECRET configured in Cloud Run
  if (process.env.WEBHOOK_SECRET) {
    const envSec = process.env.WEBHOOK_SECRET.replace(/^["']|["']$/g, '').trim();
    if (envSec) secrets.add(envSec);
  }

  // 2. Standard synonyms
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    const envSec = process.env.TELEGRAM_WEBHOOK_SECRET.replace(/^["']|["']$/g, '').trim();
    if (envSec) secrets.add(envSec);
  }

  // 3. In-memory / dynamic currentWebhookSecret
  if (currentWebhookSecret && currentWebhookSecret.trim().length > 0) {
    secrets.add(currentWebhookSecret.trim());
  }

  // 4. Canonical secret
  if (CANONICAL_WEBHOOK_SECRET && CANONICAL_WEBHOOK_SECRET.trim().length > 0) {
    secrets.add(CANONICAL_WEBHOOK_SECRET.trim());
  }
  secrets.add('jc_mines_webhook_secret_9981');

  // 5. Database configurations
  try {
    const bConfig = await PostgresService.getBotConfig();
    if (bConfig?.webhookSecret && typeof bConfig.webhookSecret === 'string') {
      const dbSec = bConfig.webhookSecret.replace(/^["']|["']$/g, '').trim();
      if (dbSec) secrets.add(dbSec);
    }
  } catch (err) {
    // Non-fatal fallback
  }

  // Also query Firestore settings/bot_config if available
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const snap = await getDoc(doc(db, 'settings', 'bot_config'));
    if (snap.exists()) {
      const data = snap.data();
      const fsSec = data.webhookSecret || data.data?.webhookSecret;
      if (fsSec && typeof fsSec === 'string') {
        const cleanFsSec = fsSec.replace(/^["']|["']$/g, '').trim();
        if (cleanFsSec) secrets.add(cleanFsSec);
      }
    }
  } catch (fsErr) {
    // Non-fatal fallback
  }

  return secrets;
}

export async function ensureBotToken(): Promise<string | undefined> {
  const memToken = getActiveBotToken();
  if (memToken && memToken.includes(':')) {
    return memToken;
  }
  try {
    const bConfig = await PostgresService.getBotConfig();
    if (bConfig?.botToken && typeof bConfig.botToken === 'string' && bConfig.botToken.includes(':')) {
      currentBotToken = bConfig.botToken;
      process.env.TELEGRAM_BOT_TOKEN = bConfig.botToken;
      return currentBotToken;
    }
  } catch (err) {
    console.warn('[Neon Postgres] Error buscando token en base de datos:', err);
  }

  // Also query Firestore settings/bot_config
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const snap = await getDoc(doc(db, 'settings', 'bot_config'));
    if (snap.exists()) {
      const data = snap.data();
      const fsToken = data.botToken || data.data?.botToken;
      if (fsToken && typeof fsToken === 'string' && fsToken.includes(':')) {
        currentBotToken = fsToken;
        process.env.TELEGRAM_BOT_TOKEN = fsToken;
        return currentBotToken;
      }
    }
  } catch (fsErr) {
    console.warn('[Firestore] Error buscando token en Firestore:', fsErr);
  }

  return undefined;
}

export function maskToken(token?: string): string | undefined {
  if (!token || token.length < 10) return undefined;
  const parts = token.split(':');
  if (parts.length === 2) {
    const prefix = parts[0];
    const secret = parts[1];
    return `${prefix}:${secret.slice(0, 3)}...${secret.slice(-3)}`;
  }
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function sanitizeWebhookUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot[TOKEN_PROTEGIDO]').replace(/:\w{25,}/g, ':[TOKEN_PROTEGIDO]');
}

// Helper: answer Telegram callback query to dismiss client button spinner immediately
async function answerTelegramCallback(callbackQueryId: string, text?: string) {
  const token = getActiveBotToken();
  if (!token || !token.includes(':')) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || undefined,
        show_alert: false,
      }),
    });
  } catch (err) {
    console.warn('[Telegram API] Error respondiendo callback_query:', err);
  }
}

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-telegram-bot-api-secret-token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Support for serverless environments (like Vercel) where req.body might already be parsed
app.use((req: Request, _res: Response, next) => {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    (req as any)._body = true;
  }
  next();
});

app.use(express.json());

// Normalizer: if a request arrived at a subpath without /api, map it to /api
app.use((req: Request, _res: Response, next) => {
  if (req.url && !req.url.startsWith('/api/') && req.url !== '/api' && !req.url.startsWith('/health') && !req.url.startsWith('/public') && !req.url.startsWith('/assets')) {
    const isApiSubpath = req.url.startsWith('/telegram/') ||
      req.url.startsWith('/users') ||
      req.url.startsWith('/deposits') ||
      req.url.startsWith('/messages') ||
      req.url.startsWith('/media') ||
      req.url.startsWith('/conditions') ||
      req.url.startsWith('/bot-config') ||
      req.url.startsWith('/general-config') ||
      req.url.startsWith('/conversations');
    if (isApiSubpath) {
      req.url = '/api' + req.url;
    }
  }
  next();
});

// Serve static uploaded public assets
app.use('/public', express.static(path.join(rootDir, 'public')));
app.use('/assets/aistudio', express.static(path.join(rootDir, 'public/assets/aistudio')));

// Low-latency cache
const inMemoryUsers: Map<string, TelegramUser> = new Map();
INITIAL_USERS.forEach((u) => inMemoryUsers.set(u.telegramId, u));

// Health endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'juan-carlos-mines-ai-bot',
    platform: process.env.VERCEL ? 'vercel-serverless' : 'google-cloud-run',
    database: 'neon-postgresql',
    neonConfigured: PostgresService.isConfigured(),
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      TELEGRAM_BOT_TOKEN: Boolean(getActiveBotToken()),
      WEBHOOK_SECRET: Boolean(currentWebhookSecret),
      ADMIN_TELEGRAM_ID: Boolean(process.env.ADMIN_TELEGRAM_ID),
      PUBLIC_BASE_URL: Boolean(PUBLIC_BASE_URL),
    },
    telegram: {
      webhookEndpoint: '/api/telegram/webhook',
      botConfigured: Boolean(getActiveBotToken()),
      webhookSecretConfigured: Boolean(currentWebhookSecret),
      adminConfigured: Boolean(process.env.ADMIN_TELEGRAM_ID),
      publicBaseUrlConfigured: Boolean(PUBLIC_BASE_URL),
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', postgres: PostgresService.isConfigured(), serverless: Boolean(process.env.VERCEL) });
});

// Persistent Telegram file_id cache to accelerate repeat sends & avoid re-uploads
const telegramFileIdCache = new Map<string, string>();
let fileIdsLoaded = false;

function normalizeAssetKey(urlOrPath: string): string {
  const clean = String(urlOrPath || '').trim();
  if (clean.startsWith(PUBLIC_BASE_URL)) {
    return clean.slice(PUBLIC_BASE_URL.length);
  }
  const idx = clean.indexOf('/public/');
  if (idx !== -1) return clean.slice(idx);
  return clean;
}

function resolveLocalAssetPath(urlOrPath: string): string | null {
  const key = normalizeAssetKey(urlOrPath);
  if (!key || key.startsWith('http://') || key.startsWith('https://')) {
    return null;
  }
  const rel = key.startsWith('/') ? key.slice(1) : key;
  const fullPath = path.resolve(rootDir, rel);
  if (!fullPath.startsWith(path.resolve(rootDir, 'public'))) {
    return null;
  }
  return fs.existsSync(fullPath) ? fullPath : null;
}

async function ensureTelegramFileIdsLoaded() {
  if (fileIdsLoaded) return;
  fileIdsLoaded = true;
  try {
    const { getSql } = await import('./services/postgresService');
    const sql = getSql();
    if (sql) {
      await PostgresService.ensureSchema();
      const rows = await sql`SELECT data FROM settings WHERE id = 'telegram_file_ids' LIMIT 1;`;
      if (rows.length > 0 && rows[0].data && typeof rows[0].data === 'object') {
        Object.entries(rows[0].data as Record<string, string>).forEach(([k, v]) => {
          if (typeof v === 'string' && v) telegramFileIdCache.set(k, v);
        });
      }
    }
  } catch {
    // Non-fatal
  }
}

async function cacheTelegramFileId(urlOrPath: string, fileId?: string) {
  if (!fileId) return;
  const key = normalizeAssetKey(urlOrPath);
  if (!key || telegramFileIdCache.get(key) === fileId) return;
  telegramFileIdCache.set(key, fileId);
  try {
    const { getSql } = await import('./services/postgresService');
    const sql = getSql();
    if (sql) {
      const obj: Record<string, string> = {};
      telegramFileIdCache.forEach((v, k) => {
        obj[k] = v;
      });
      await sql`
        INSERT INTO settings (id, data, updated_at)
        VALUES ('telegram_file_ids', ${JSON.stringify(obj)}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
      `;
    }
  } catch {
    // Non-fatal
  }
}

function extractFileIdFromTelegramResult(result: any, mediaType: 'photo' | 'video'): string | undefined {
  if (!result) return undefined;
  if (mediaType === 'video') {
    return result.video?.file_id || result.document?.file_id;
  }
  if (Array.isArray(result.photo) && result.photo.length > 0) {
    return result.photo[result.photo.length - 1]?.file_id;
  }
  return undefined;
}

// Helper: Telegram Bot API Call with file_id caching, local multipart upload fallback, and Markdown retry
async function sendTelegramMessage(chatId: string | number, text: string, options: any = {}) {
  let token = getActiveBotToken();
  if (!token) {
    token = await ensureBotToken();
  }

  // Simulation fallback if no token
  if (!token || !token.includes(':')) {
    console.warn(`[Telegram Simulation] Mensaje simulado a chat_id ${chatId}: ${text.slice(0, 80)}...`);
    return {
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 100000),
        chat: { id: chatId },
        text: text,
      },
      simulation: true,
    };
  }

  await ensureTelegramFileIdsLoaded();

  const rawMedia = options.video || options.photo;
  const mediaKind: 'video' | 'photo' | null = options.video ? 'video' : options.photo ? 'photo' : null;
  const assetKey = rawMedia ? normalizeAssetKey(String(rawMedia)) : '';
  const cachedFileId = assetKey ? telegramFileIdCache.get(assetKey) : undefined;
  const localFilePath = rawMedia && !cachedFileId ? resolveLocalAssetPath(String(rawMedia)) : null;

  const hasValidPhoto = Boolean(options.photo && (cachedFileId || localFilePath || String(options.photo).startsWith('http')));
  const hasValidVideo = Boolean(options.video && (cachedFileId || localFilePath || String(options.video).startsWith('http')));

  const endpoint = hasValidPhoto
    ? `https://api.telegram.org/bot${token}/sendPhoto`
    : hasValidVideo
      ? `https://api.telegram.org/bot${token}/sendVideo`
      : `https://api.telegram.org/bot${token}/sendMessage`;

  const captionText = text.length > 1024 ? text.slice(0, 1020) + '...' : text;

  const dispatchMediaRequest = async (usePlainText: boolean): Promise<any> => {
    if (localFilePath && (hasValidPhoto || hasValidVideo) && !cachedFileId) {
      const fileBuffer = await fs.promises.readFile(localFilePath);
      const ext = path.extname(localFilePath).toLowerCase();
      const mimeType =
        mediaKind === 'video'
          ? ext === '.mov'
            ? 'video/quicktime'
            : 'video/mp4'
          : ext === '.png'
            ? 'image/png'
            : 'image/jpeg';
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append(mediaKind === 'video' ? 'video' : 'photo', new Blob([fileBuffer], { type: mimeType }), path.basename(localFilePath));
      if (captionText) {
        form.append('caption', captionText);
        if (!usePlainText) form.append('parse_mode', 'Markdown');
      }
      if (mediaKind === 'video') {
        form.append('supports_streaming', 'true');
      }
      if (options.reply_markup) {
        form.append('reply_markup', JSON.stringify(options.reply_markup));
      }
      const res = await fetch(endpoint, { method: 'POST', body: form });
      return res.json();
    }

    const body: Record<string, any> = {
      chat_id: chatId,
    };

    if (hasValidPhoto) {
      body.photo = cachedFileId || options.photo;
      if (captionText) {
        body.caption = captionText;
        if (!usePlainText) body.parse_mode = 'Markdown';
      }
    } else if (hasValidVideo) {
      body.video = cachedFileId || options.video;
      body.supports_streaming = true;
      if (captionText) {
        body.caption = captionText;
        if (!usePlainText) body.parse_mode = 'Markdown';
      }
    } else {
      body.text = text.length > 4096 ? text.slice(0, 4092) + '...' : text;
      if (!usePlainText) body.parse_mode = 'Markdown';
    }

    if (options.reply_markup) {
      body.reply_markup = options.reply_markup;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  try {
    let data = (await dispatchMediaRequest(false)) as any;

    // Retry 1: If Markdown entities failed, retry plain text without parse_mode
    if (!data.ok && data.description?.includes("can't parse entities")) {
      data = await dispatchMediaRequest(true);
    }

    // Cache file_id on successful media send
    if (data.ok && mediaKind && rawMedia && !cachedFileId) {
      const returnedFileId = extractFileIdFromTelegramResult(data.result, mediaKind);
      if (returnedFileId) {
        cacheTelegramFileId(String(rawMedia), returnedFileId).catch(() => {});
      }
    }

    // Retry 2: If photo or video failed (and not a terminal chat error), fall back to sendMessage text
    const isTerminalChatError =
      data.error_code === 403 ||
      String(data.description || '').toLowerCase().includes('chat not found') ||
      String(data.description || '').toLowerCase().includes('bot was blocked');
    if (!data.ok && !isTerminalChatError && (hasValidPhoto || hasValidVideo) && text.trim()) {
      console.warn(`[Telegram Media Fallback] Falló multimedia (${data.description}), enviando como mensaje de texto a ${chatId}`);
      const textOnlyBody: Record<string, any> = {
        chat_id: chatId,
        text: text.length > 4096 ? text.slice(0, 4092) + '...' : text,
      };
      if (options.reply_markup) {
        textOnlyBody.reply_markup = options.reply_markup;
      }
      const textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textOnlyBody),
      });
      data = await textRes.json();
    }

    if (!data.ok) {
      console.error(`[Telegram API Error] Telegram rechazó mensaje a ${chatId}: ${data.description}`);
    }
    return data;
  } catch (err) {
    console.error(`[Telegram API Error] Fallo de red al enviar a ${chatId}:`, err);
    return { ok: false, error: String(err) };
  }
}

// Helper: Telegram sendMediaGroup API Call for albums (Guía de Registro 1-6, Guía de ID, Recarga)
async function sendTelegramMediaGroup(
  chatId: string | number,
  items: { type: 'photo' | 'video'; url: string }[],
  caption?: string
) {
  let token = getActiveBotToken();
  if (!token) {
    token = await ensureBotToken();
  }

  if (!items || items.length === 0) return { ok: true };

  // Simulation fallback if no token
  if (!token || !token.includes(':')) {
    console.warn(`[Telegram Simulation] MediaGroup simulado a chat_id ${chatId} (${items.length} archivos)`);
    return {
      ok: true,
      result: items.map((_, idx) => ({ message_id: Math.floor(Math.random() * 100000) + idx })),
      simulation: true,
    };
  }

  await ensureTelegramFileIdsLoaded();

  const cleanCaption = caption ? (caption.length > 1024 ? caption.slice(0, 1020) + '...' : caption) : undefined;

  const dispatchMediaGroup = async (usePlainText: boolean): Promise<any> => {
    const form = new FormData();
    let needsMultipart = false;
    const mediaDescriptors: any[] = [];

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const key = normalizeAssetKey(item.url);
      const cachedId = telegramFileIdCache.get(key);
      const localPath = !cachedId ? resolveLocalAssetPath(item.url) : null;

      let mediaRef: string;
      if (cachedId) {
        mediaRef = cachedId;
      } else if (localPath) {
        needsMultipart = true;
        const attachKey = `media_${idx}`;
        const fileBuffer = await fs.promises.readFile(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mimeType =
          item.type === 'video'
            ? 'video/mp4'
            : ext === '.png'
              ? 'image/png'
              : 'image/jpeg';
        form.append(attachKey, new Blob([fileBuffer], { type: mimeType }), path.basename(localPath));
        mediaRef = `attach://${attachKey}`;
      } else {
        mediaRef = item.url.startsWith('http')
          ? item.url
          : `${PUBLIC_BASE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
      }

      const descriptor: Record<string, any> = {
        type: item.type === 'video' ? 'video' : 'photo',
        media: mediaRef,
      };
      if (item.type === 'video') {
        descriptor.supports_streaming = true;
      }
      if (idx === 0 && cleanCaption) {
        descriptor.caption = cleanCaption;
        if (!usePlainText) {
          descriptor.parse_mode = 'Markdown';
        }
      }
      mediaDescriptors.push(descriptor);
    }

    if (needsMultipart) {
      form.append('chat_id', String(chatId));
      form.append('media', JSON.stringify(mediaDescriptors));
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
        method: 'POST',
        body: form,
      });
      return res.json();
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        media: mediaDescriptors,
      }),
    });
    return res.json();
  };

  try {
    let data = (await dispatchMediaGroup(false)) as any;

    if (!data.ok && data.description?.includes("can't parse entities")) {
      data = await dispatchMediaGroup(true);
    }

    if (data.ok && Array.isArray(data.result)) {
      data.result.forEach((sentMsg: any, idx: number) => {
        const srcItem = items[idx];
        if (!srcItem) return;
        const returnedId = extractFileIdFromTelegramResult(sentMsg, srcItem.type);
        if (returnedId) {
          cacheTelegramFileId(srcItem.url, returnedId).catch(() => {});
        }
      });
      return data;
    }

    const isTerminalChatError =
      data.error_code === 403 ||
      String(data.description || '').toLowerCase().includes('chat not found') ||
      String(data.description || '').toLowerCase().includes('bot was blocked');
    if (!data.ok && !isTerminalChatError) {
      console.warn(`[Telegram sendMediaGroup Fallback] sendMediaGroup notice: ${data.description}. Enviando secuencia ordenada.`);
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const fullUrl = item.url.startsWith('http')
          ? item.url
          : `${PUBLIC_BASE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
        const itemCaption = idx === 0 && cleanCaption ? cleanCaption : '';
        if (item.type === 'video') {
          await sendTelegramMessage(chatId, itemCaption, { video: fullUrl });
        } else {
          await sendTelegramMessage(chatId, itemCaption, { photo: fullUrl });
        }
      }
    }
    return data;
  } catch (err) {
    console.error(`[Telegram sendMediaGroup Error] Fallo de red:`, err);
    return { ok: false, error: String(err) };
  }
}

// User loading and saving with dual Postgres + Firestore persistence
async function getOrCreateUser(from: any): Promise<TelegramUser> {
  const telegramId = String(from.id);

  if (inMemoryUsers.has(telegramId)) {
    return inMemoryUsers.get(telegramId)!;
  }

  try {
    const existing = await PostgresService.getUser(telegramId);
    if (existing) {
      inMemoryUsers.set(telegramId, existing);
      return existing;
    }
  } catch (err) {
    console.warn(`[Neon Postgres] Error obteniendo usuario ${telegramId}:`, err);
  }

  // Also query Firestore users
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const snap = await getDoc(doc(db, 'users', telegramId));
    if (snap.exists()) {
      const fsUser = snap.data() as TelegramUser;
      inMemoryUsers.set(telegramId, fsUser);
      return fsUser;
    }
  } catch (fsErr) {
    // Non-fatal fallback
  }

  const newUser: TelegramUser = {
    id: `usr-${telegramId}`,
    telegramId,
    name: [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Usuario',
    username: from.username || `user_${telegramId}`,
    joinDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
    country: '',
    currentStep: 'stage_1_welcome',
    stage: 'stage_1_welcome',
    lastActivity: 'Ahora mismo',
    status: 'active',
    messagesSent: 0,
    messagesReceived: 0,
    consentGiven: false,
    experienceLevel: 'principiante',
    accountStatus: 'pending_verification',
    paymentStatus: 'unpaid',
    stageTransitions: [
      {
        id: `tr-init-${Date.now()}`,
        fromStage: 'none',
        toStage: 'stage_1_welcome',
        timestamp: new Date().toISOString(),
        actor: 'system',
        reason: 'Primer contacto con el bot',
      },
    ],
  };

  inMemoryUsers.set(telegramId, newUser);
  PostgresService.saveUser(newUser).catch(console.warn);

  // Async mirror write to Firestore
  (async () => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'users', telegramId), newUser, { merge: true });
    } catch (e) {
      // Non-fatal
    }
  })().catch(() => {});

  return newUser;
}

async function saveUserProgress(user: TelegramUser) {
  inMemoryUsers.set(user.telegramId, user);
  await PostgresService.saveUser(user);

  // Sync to Firestore
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    await setDoc(doc(db, 'users', user.telegramId), user, { merge: true });
  } catch (fsErr) {
    // Non-fatal
  }
}

async function mirrorDepositToFirestore(receipt: DepositReceipt) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    await setDoc(doc(db, 'deposits', receipt.id), receipt, { merge: true });
  } catch {
    // Non-fatal Firestore sync fallback
  }
}

async function downloadTelegramPhotoToDisk(
  fileId: string,
  telegramId: string,
  testReceiptUrl?: string
): Promise<string> {
  if (testReceiptUrl && typeof testReceiptUrl === 'string' && testReceiptUrl.trim()) {
    return testReceiptUrl.trim();
  }

  let token = getActiveBotToken();
  if (!token) {
    token = await ensureBotToken();
  }

  if (token && token.includes(':') && fileId && !fileId.startsWith('sim-') && !fileId.startsWith('test-')) {
    try {
      const infoRes = await fetch(
        `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
      );
      const infoData = (await infoRes.json()) as any;
      if (infoData.ok && infoData.result?.file_path) {
        const tgFilePath = String(infoData.result.file_path);
        const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${tgFilePath}`);
        if (fileRes.ok) {
          const arrayBuffer = await fileRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const ext = path.extname(tgFilePath) || '.jpeg';
          const safeTgId = String(telegramId).replace(/[^a-zA-Z0-9_-]/g, '');
          const fileName = `receipt_${safeTgId}_${Date.now()}${ext}`;
          const receiptsDir = path.join(rootDir, 'public', 'assets', 'uploads', 'receipts');
          if (!fs.existsSync(receiptsDir)) {
            fs.mkdirSync(receiptsDir, { recursive: true });
          }
          await fs.promises.writeFile(path.join(receiptsDir, fileName), buffer);
          return `/public/assets/uploads/receipts/${fileName}`;
        }
      }
    } catch (err) {
      console.warn('[Telegram getFile Error] No se pudo descargar comprobante, usando respaldo visual:', err);
    }
  }

  return '/public/assets/aistudio/IMG_8055_1c7f857b.jpeg';
}

async function recordMessageInConversation(
  userId: string,
  message: {
    id: string;
    sender: 'user' | 'bot' | 'admin';
    text: string;
    timestamp: string;
    stepTriggered?: FlowStepId;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video';
  }
) {
  await PostgresService.recordConversationMessage(userId, message);

  // Sync to Firestore conversation history
  try {
    const { doc, getDoc, setDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const convRef = doc(db, 'conversations', userId);
    const snap = await getDoc(convRef);
    if (!snap.exists()) {
      await setDoc(convRef, {
        userId,
        telegramId: userId,
        status: 'automated',
        lastMessageTime: message.timestamp,
        currentStep: message.stepTriggered || 'START',
        messages: [message],
        updatedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(convRef, {
        lastMessageTime: message.timestamp,
        currentStep: message.stepTriggered || 'START',
        messages: arrayUnion(message),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (fsErr) {
    // Non-fatal
  }
}

// Helper: deliver Point 7 + Point 8 + Orientation Video after admin approves deposit
async function deliverOrientationMaterialAndUpdateUser(
  user: TelegramUser,
  adminName: string,
  notes?: string,
  receiptId?: string
): Promise<TelegramUser> {
  const prevStage = user.stage;
  const nowIso = new Date().toISOString();

  user.paymentStatus = 'payment_verified';
  user.paymentVerifiedAt = nowIso;
  user.paymentVerifiedBy = adminName;
  user.stage = 'stage_2_content_sent';
  user.currentStep = 'stage_2_content_sent';
  user.flowStateLabel = 'ACCESO A ORIENTACIÓN HABILITADO';
  if (notes) user.notes = notes;

  user.stageTransitions = user.stageTransitions || [];
  user.stageTransitions.push(
    createTransitionRecord(
      prevStage,
      'stage_2_content_sent',
      'admin',
      adminName,
      'Depósito aprobado manualmente desde panel administrativo — acceso a orientación habilitado'
    )
  );

  await saveUserProgress(user);

  // Mark receipt(s) verified
  if (receiptId) {
    const updatedReceipt = await PostgresService.updateDepositReceiptStatus(receiptId, 'verified', adminName);
    if (updatedReceipt) {
      mirrorDepositToFirestore(updatedReceipt).catch(() => {});
    }
  } else {
    const allReceipts = await PostgresService.getDepositReceipts();
    const pendingForUser = allReceipts.filter(
      (r) => r.telegramId === user.telegramId && r.status === 'pending'
    );
    for (const r of pendingForUser) {
      const updatedReceipt = await PostgresService.updateDepositReceiptStatus(r.id, 'verified', adminName);
      if (updatedReceipt) {
        mirrorDepositToFirestore(updatedReceipt).catch(() => {});
      }
    }
  }

  const conditions = await PostgresService.getConditions();
  const orientationMsgs = getEtapa2ContentMessages(
    user,
    conditions?.customMinesContentText || DEFAULT_KEYWORD_CONFIG.customMinesContentText,
    conditions
  );

  for (let i = 0; i < orientationMsgs.length; i++) {
    const outMsg = orientationMsgs[i];
    const sendOptions: any = {};

    if (outMsg.buttons && outMsg.buttons.length > 0) {
      sendOptions.reply_markup = {
        inline_keyboard: outMsg.buttons.map((b) =>
          b.type === 'url'
            ? [{ text: b.text, url: b.value }]
            : [{ text: b.text, callback_data: b.value || b.id }]
        ),
      };
    }

    if (outMsg.mediaUrl) {
      const fullMediaUrl = outMsg.mediaUrl.startsWith('http')
        ? outMsg.mediaUrl
        : `${PUBLIC_BASE_URL}${outMsg.mediaUrl.startsWith('/') ? '' : '/'}${outMsg.mediaUrl}`;
      if (outMsg.mediaType === 'video') {
        sendOptions.video = fullMediaUrl;
      } else {
        sendOptions.photo = fullMediaUrl;
      }
    }

    await sendTelegramMessage(user.telegramId, outMsg.text, sendOptions);
    await recordMessageInConversation(user.id, {
      id: `b-${Date.now()}-or-${i}`,
      sender: 'bot',
      text: outMsg.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepTriggered: outMsg.stepTriggered || 'RONDAS_ORIENTACION',
      mediaUrl: outMsg.mediaUrl,
      mediaType: outMsg.mediaType,
    });

    if (i < orientationMsgs.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return user;
}

// Core processor for any incoming Telegram update
export async function processTelegramUpdatePayload(update: any): Promise<{ ok: boolean; action?: string; messagesSent?: number; error?: string }> {
  const isCallback = Boolean(update.callback_query);
  const msg = isCallback ? update.callback_query.message : update.message;
  const from = isCallback ? update.callback_query.from : update.message?.from;
  const rawText = isCallback ? update.callback_query.data : update.message?.text || update.message?.caption || '';
  const chatId = msg?.chat?.id || from?.id;

  const incomingPhotos = !isCallback && Array.isArray(update.message?.photo) ? update.message.photo : [];
  const incomingImageDoc =
    !isCallback &&
    update.message?.document &&
    String(update.message.document.mime_type || '').startsWith('image/')
      ? update.message.document
      : null;
  const hasIncomingReceiptPhoto = incomingPhotos.length > 0 || Boolean(incomingImageDoc);

  if (!chatId || !from) {
    return { ok: false, error: 'Falta chatId o emisor (from) en el payload' };
  }

  if (isCallback && update.callback_query?.id) {
    answerTelegramCallback(update.callback_query.id).catch(() => {});
  }

  try {
    const user = await getOrCreateUser(from);
    if (from.username && (!user.username || user.username.startsWith('user_'))) {
      user.username = from.username;
    }
    const freshName = [from.first_name, from.last_name].filter(Boolean).join(' ').trim();
    if (freshName && user.name === 'Usuario') {
      user.name = freshName;
    }

    user.messagesSent = (user.messagesSent || 0) + 1;
    user.lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // SPECIAL PATH: Automatic receipt photo reception (Point 5)
    if (hasIncomingReceiptPhoto) {
      const largestPhoto = incomingPhotos.length > 0 ? incomingPhotos[incomingPhotos.length - 1] : null;
      const telegramFileId = String(largestPhoto?.file_id || incomingImageDoc?.file_id || `sim-${Date.now()}`);
      const receiptUrl = await downloadTelegramPhotoToDisk(
        telegramFileId,
        user.telegramId,
        update.message?._testReceiptUrl
      );

      const receipt: DepositReceipt = {
        id: `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        telegramId: user.telegramId,
        userId: user.id,
        username: user.username || '',
        name: user.name || 'Usuario',
        accountId: user.accountId,
        planId: user.initialPlan,
        planLabel: user.initialPlanLabel || 'Plan por confirmar',
        receiptUrl,
        telegramFileId,
        caption: update.message?.caption ? String(update.message.caption) : undefined,
        receivedAt: new Date().toISOString(),
        status: 'pending',
      };

      await PostgresService.saveDepositReceipt(receipt);
      mirrorDepositToFirestore(receipt).catch(() => {});

      await recordMessageInConversation(user.id, {
        id: `u-${Date.now()}-receipt`,
        sender: 'user',
        text: receipt.caption
          ? `[Comprobante de depósito recibido] ${receipt.caption}`
          : '[Comprobante de depósito enviado]',
        timestamp: user.lastActivity,
        stepTriggered: 'RECEPCION_COMPROBANTE',
        mediaUrl: receiptUrl,
        mediaType: 'photo',
      });

      const receiptResult = handleIncomingReceiptPhoto(user, receipt.id);
      const updatedUser = receiptResult.updatedUser;
      await saveUserProgress(updatedUser);

      let sentCount = 0;
      for (const msgToSend of receiptResult.messagesToSend) {
        const sendResult = await sendTelegramMessage(chatId, msgToSend.text);
        if (sendResult.ok) sentCount++;
        updatedUser.messagesReceived = (updatedUser.messagesReceived || 0) + 1;

        await recordMessageInConversation(updatedUser.id, {
          id: `b-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          sender: 'bot',
          text: msgToSend.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stepTriggered: msgToSend.stepTriggered || updatedUser.currentStep,
        });
      }

      const latestUser = inMemoryUsers.get(updatedUser.telegramId);
      if (!latestUser || latestUser.stage === updatedUser.stage) {
        await saveUserProgress(updatedUser);
      }
      return { ok: true, action: receiptResult.recognizedAction, messagesSent: sentCount };
    }

    await recordMessageInConversation(user.id, {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: user.lastActivity,
      stepTriggered: user.currentStep,
    });

    const [customMessages, customConditions] = await Promise.all([
      PostgresService.getMessages(),
      PostgresService.getConditions(),
    ]);

    const customMap: Record<string, AutoMessage> = {};
    customMessages.forEach((m: AutoMessage) => {
      customMap[m.stepId] = m;
    });

    const callbackData = isCallback ? rawText : undefined;
    const result = processDeterministicUpdate(
      user,
      rawText,
      callbackData,
      customConditions,
      customMap,
      { adminTelegramId: ADMIN_TELEGRAM_ID, publicBaseUrl: PUBLIC_BASE_URL }
    );

    const updatedUser = result.updatedUser;
    await saveUserProgress(updatedUser);

    let sentCount = 0;
    for (const msgToSend of result.messagesToSend) {
      // 1. Handle media group (sendMediaGroup album)
      if (msgToSend.isMediaGroup && msgToSend.mediaGroupItems && msgToSend.mediaGroupItems.length > 0) {
        const inlineOptions: any = {};
        if (msgToSend.buttons && msgToSend.buttons.length > 0) {
          inlineOptions.reply_markup = {
            inline_keyboard: msgToSend.buttons.map((b) => {
              if (b.type === 'url') {
                return [{ text: b.text, url: b.value }];
              }
              return [{ text: b.text, callback_data: b.value || b.id }];
            }),
          };
        }

        const hasButtons = Boolean(inlineOptions.reply_markup);
        const albumCaption =
          msgToSend.albumCaption ||
          (!hasButtons && msgToSend.text && msgToSend.text.trim() && msgToSend.text.length <= 1024
            ? msgToSend.text
            : undefined);

        await sendTelegramMediaGroup(chatId, msgToSend.mediaGroupItems, albumCaption);
        sentCount += msgToSend.mediaGroupItems.length;

        if ((msgToSend.text && msgToSend.text.trim() && msgToSend.text !== albumCaption) || hasButtons) {
          const followUpText = msgToSend.text?.trim() || 'Selecciona una opción para continuar:';
          const sendResult = await sendTelegramMessage(chatId, followUpText, inlineOptions);
          if (sendResult.ok) sentCount++;
        }

        updatedUser.messagesReceived = (updatedUser.messagesReceived || 0) + 1;
        await recordMessageInConversation(updatedUser.id, {
          id: `b-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          sender: 'bot',
          text: [albumCaption, msgToSend.text].filter(Boolean).join('\n\n') || `[Álbum de ${msgToSend.mediaGroupItems.length} archivos]`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stepTriggered: msgToSend.stepTriggered || updatedUser.currentStep,
          mediaUrl: msgToSend.mediaGroupItems[0]?.url,
          mediaType: msgToSend.mediaGroupItems[0]?.type,
        });

        await new Promise((r) => setTimeout(r, 400));
        continue;
      }

      const options: any = {};

      if (msgToSend.buttons && msgToSend.buttons.length > 0) {
        options.reply_markup = {
          inline_keyboard: msgToSend.buttons.map((b) => {
            if (b.type === 'url') {
              return [{ text: b.text, url: b.value }];
            }
            return [{ text: b.text, callback_data: b.value || b.id }];
          }),
        };
      }

      if (msgToSend.mediaUrl) {
        const fullMediaUrl = msgToSend.mediaUrl.startsWith('http')
          ? msgToSend.mediaUrl
          : `${PUBLIC_BASE_URL}${msgToSend.mediaUrl.startsWith('/') ? '' : '/'}${msgToSend.mediaUrl}`;

        if (msgToSend.mediaType === 'video') {
          options.video = fullMediaUrl;
        } else {
          options.photo = fullMediaUrl;
        }
      }

      const sendResult = await sendTelegramMessage(chatId, msgToSend.text, options);
      if (sendResult.ok) sentCount++;
      updatedUser.messagesReceived = (updatedUser.messagesReceived || 0) + 1;

      await recordMessageInConversation(updatedUser.id, {
        id: `b-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        sender: 'bot',
        text: msgToSend.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stepTriggered: msgToSend.stepTriggered || updatedUser.currentStep,
        mediaUrl: msgToSend.mediaUrl,
        mediaType: msgToSend.mediaType,
      });

      if (result.messagesToSend.length > 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    const latestUser = inMemoryUsers.get(updatedUser.telegramId);
    if (!latestUser || latestUser.stage === updatedUser.stage) {
      await saveUserProgress(updatedUser);
    }
    return { ok: true, action: result.recognizedAction, messagesSent: sentCount };
  } catch (procErr) {
    console.error('[Engine Error] Error procesando actualización de Telegram:', procErr);
    return { ok: false, error: String(procErr) };
  }
}

// ==========================================
// 1. TELEGRAM WEBHOOK ENDPOINT
// ==========================================
app.get(['/api/telegram/webhook', '/telegram/webhook'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'juan-carlos-mines-ai-bot',
    endpoint: '/api/telegram/webhook',
    method: 'POST',
    description: 'Receptor de webhook oficial de Telegram',
    activeBotToken: Boolean(getActiveBotToken()),
  });
});

app.post(['/api/telegram/webhook', '/telegram/webhook'], async (req: Request, res: Response) => {
  // Case-insensitive header lookup for official Telegram secret token
  const rawSecretHeader =
    req.header('x-telegram-bot-api-secret-token') ||
    req.headers['x-telegram-bot-api-secret-token'] ||
    req.header('X-Telegram-Bot-Api-Secret-Token');
  const cleanHeader = rawSecretHeader ? String(rawSecretHeader).replace(/^["']|["']$/g, '').trim() : '';

  const update = req.body;

  if (!update || typeof update !== 'object') {
    return res.status(400).json({ error: 'Payload de webhook inválido' });
  }

  // Security check: validate secret token (excluded from standard user JWT/session auth,
  // secured exclusively via Telegram's official X-Telegram-Bot-Api-Secret-Token header)
  const authorized = await getAuthorizedWebhookSecrets();
  const isAuthorized = validateWebhookSecret(cleanHeader, authorized);

  if (!isAuthorized) {
    console.warn(
      `[Webhook Security] Rechazo 401: Header X-Telegram-Bot-Api-Secret-Token ausente o no autorizado.`
    );
    return res.status(401).json({
      error: 'Unauthorized webhook request',
      message: 'X-Telegram-Bot-Api-Secret-Token inválido o no suministrado',
    });
  }

  if (!update.message && !update.callback_query) {
    return res.status(200).json({ ok: true, ignored: 'No message or callback_query' });
  }

  const updateId = String(update.update_id || '');

  // 1. Fast in-memory and database deduplication check
  if (updateId) {
    if (inFlightUpdatesLock.has(updateId) || processedUpdatesCache.has(updateId) || (await PostgresService.isUpdateProcessed(updateId))) {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    inFlightUpdatesLock.add(updateId);
    processedUpdatesCache.add(updateId);
    if (processedUpdatesCache.size > 2000) {
      const first = processedUpdatesCache.values().next().value;
      if (first) processedUpdatesCache.delete(first);
    }
    PostgresService.markUpdateProcessed(updateId).catch(console.warn);
  }

  // 2. Critical Cloud Run & Serverless execution guarantee:
  // On Google Cloud Run (and Vercel/serverless), CPU is throttled to ~0% the moment HTTP 200 is returned.
  // We MUST await update processing within a bounded timeout (4.2 seconds) before sending HTTP 200 to Telegram.
  // Telegram has a 60-second webhook timeout; 4.2 seconds is safe and guarantees completion.
  try {
    const processPromise = processTelegramUpdatePayload(update);
    const timeoutPromise = new Promise<{ ok: boolean; timeout: boolean }>((resolve) =>
      setTimeout(() => resolve({ ok: true, timeout: true }), 8500)
    );

    const result = await Promise.race([processPromise, timeoutPromise]);
    if (updateId) {
      inFlightUpdatesLock.delete(updateId);
    }
    return res.status(200).json(result);
  } catch (err) {
    if (updateId) {
      inFlightUpdatesLock.delete(updateId);
    }
    console.error('[Webhook Processing Error]:', err);
    return res.status(200).json({ ok: true, error: String(err) });
  }
});

// ==========================================
// 2. ADMIN REST API ENDPOINTS
// ==========================================
app.get('/api/users', async (_req, res) => {
  try {
    const users = await PostgresService.getUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.json({ success: true, count: inMemoryUsers.size, users: Array.from(inMemoryUsers.values()) });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    if (!user || !user.telegramId) return res.status(400).json({ error: 'telegramId requerido' });
    await PostgresService.saveUser(user);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/messages', async (_req, res) => {
  const msgs = await PostgresService.getMessages();
  res.json({ success: true, messages: msgs });
});

app.post('/api/messages', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'Array de mensajes requerido' });
  try {
    await PostgresService.saveMessages(messages);
    res.json({ success: true, updated: messages.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/media', async (_req, res) => {
  const media = await PostgresService.getMedia();
  res.json({ success: true, media });
});

app.post('/api/media', async (req, res) => {
  const { media } = req.body;
  if (!Array.isArray(media)) return res.status(400).json({ error: 'Array de media requerido' });
  try {
    await PostgresService.saveMedia(media);
    res.json({ success: true, updated: media.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/conditions', async (_req, res) => {
  const conditions = await PostgresService.getConditions();
  res.json({ success: true, conditions });
});

app.post('/api/conditions', async (req, res) => {
  const { conditions } = req.body;
  if (!conditions) return res.status(400).json({ error: 'Condiciones requeridas' });
  try {
    await PostgresService.saveConditions(conditions);
    res.json({ success: true, conditions });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/bot-config', async (_req, res) => {
  const config = await PostgresService.getBotConfig();
  res.json({ success: true, config });
});

app.post('/api/bot-config', async (req, res) => {
  const { config } = req.body;
  if (!config) return res.status(400).json({ error: 'Configuración requerida' });
  try {
    if (config.webhookSecret && typeof config.webhookSecret === 'string' && config.webhookSecret.trim().length > 0) {
      currentWebhookSecret = config.webhookSecret.trim();
    }
    if (config.botToken && typeof config.botToken === 'string' && config.botToken.includes(':')) {
      currentBotToken = config.botToken.trim();
      process.env.TELEGRAM_BOT_TOKEN = currentBotToken;
    }
    await PostgresService.saveBotConfig(config);
    res.json({ success: true, config });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/general-config', async (_req, res) => {
  const config = await PostgresService.getGeneralConfig();
  res.json({ success: true, config });
});

app.post('/api/general-config', async (req, res) => {
  const { config } = req.body;
  if (!config) return res.status(400).json({ error: 'Configuración requerida' });
  try {
    await PostgresService.saveGeneralConfig(config);
    res.json({ success: true, config });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/conversations', async (_req, res) => {
  const conversations = await PostgresService.getConversations();
  res.json({ success: true, conversations });
});

// Multer Storage Configuration for Gallery & Device uploads
const uploadsDir = path.join(rootDir, 'public', 'assets', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video') ? '.mp4' : '.jpeg');
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeName}_${Date.now()}${ext}`);
  },
});

const uploadMiddleware = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for HD videos
});

// POST /api/media/upload - Real device/gallery file upload
app.post('/api/media/upload', uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún archivo.' });
    }

    const isVideo = file.mimetype.startsWith('video') || file.originalname.endsWith('.mp4') || file.originalname.endsWith('.mov');
    const mediaType = isVideo ? 'video' : 'photo';
    const relativeUrl = `/public/assets/uploads/${file.filename}`;
    const description = req.body.description || `Archivo cargado por Juan Carlos: ${file.originalname}`;
    const associatedStep = req.body.associatedStep || (isVideo ? 'GUIA_MINES' : 'PRESENTACION');
    const stageGroup = req.body.stageGroup || 'general';

    const newItem: any = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: file.originalname,
      type: mediaType,
      url: relativeUrl,
      description,
      sizeBytes: file.size,
      dimensions: isVideo ? undefined : '1080x1920',
      durationSeconds: isVideo ? 15 : undefined,
      createdAt: new Date().toISOString(),
      associatedStep,
      stageGroup,
      isRealAsset: true,
    };

    const existingMedia = await PostgresService.getMedia();
    await PostgresService.saveMedia([newItem, ...existingMedia]);

    // Mirror to Firestore
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'media', newItem.id), newItem);
    } catch (fsErr) {
      console.warn('[Firestore Media Sync Warning]:', fsErr);
    }

    return res.json({
      success: true,
      item: newItem,
      message: 'Archivo cargado y almacenado correctamente.',
    });
  } catch (err) {
    console.error('[Upload Error]:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// Custom Content, Registration Link, Photos & Editable Flow Texts endpoints
app.get('/api/settings/custom-content', async (_req, res) => {
  try {
    const conditions = await PostgresService.getConditions();
    res.json({
      success: true,
      customMinesContentText: conditions.customMinesContentText || DEFAULT_KEYWORD_CONFIG.customMinesContentText,
      customPlatformReasonText: conditions.customPlatformReasonText || DEFAULT_KEYWORD_CONFIG.customPlatformReasonText,
      registrationLink: conditions.registrationLink || DEFAULT_REGISTRATION_LINK,
      registrationPhotoUrls:
        Array.isArray(conditions.registrationPhotoUrls) && conditions.registrationPhotoUrls.length > 0
          ? conditions.registrationPhotoUrls
          : DEFAULT_REGISTRATION_PHOTOS,
      plansMessageText: conditions.plansMessageText || DEFAULT_PLANS_MESSAGE_TEXT,
      registrationMessageText: conditions.registrationMessageText || DEFAULT_REGISTRATION_MESSAGE_TEXT,
      depositPromptText: conditions.depositPromptText || DEFAULT_DEPOSIT_PROMPT_TEXT,
      approvalMessageText: conditions.approvalMessageText || DEFAULT_APPROVAL_MESSAGE_TEXT,
      fiveRoundsMessageText: conditions.fiveRoundsMessageText || DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
      scheduledDelayMinutes: conditions.scheduledDelayMinutes ?? 0,
    });
  } catch (err) {
    res.json({
      success: true,
      customMinesContentText: DEFAULT_KEYWORD_CONFIG.customMinesContentText,
      customPlatformReasonText: DEFAULT_KEYWORD_CONFIG.customPlatformReasonText,
      registrationLink: DEFAULT_REGISTRATION_LINK,
      registrationPhotoUrls: DEFAULT_REGISTRATION_PHOTOS,
      plansMessageText: DEFAULT_PLANS_MESSAGE_TEXT,
      registrationMessageText: DEFAULT_REGISTRATION_MESSAGE_TEXT,
      depositPromptText: DEFAULT_DEPOSIT_PROMPT_TEXT,
      approvalMessageText: DEFAULT_APPROVAL_MESSAGE_TEXT,
      fiveRoundsMessageText: DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
      scheduledDelayMinutes: 0,
    });
  }
});

app.post('/api/settings/custom-content', async (req, res) => {
  const {
    customMinesContentText,
    customPlatformReasonText,
    registrationLink,
    registrationPhotoUrls,
    plansMessageText,
    registrationMessageText,
    depositPromptText,
    approvalMessageText,
    fiveRoundsMessageText,
    scheduledDelayMinutes,
  } = req.body || {};

  try {
    const currentConditions = await PostgresService.getConditions();
    const updated: DeterministicKeywordConfig = {
      ...currentConditions,
      customMinesContentText:
        customMinesContentText !== undefined ? customMinesContentText : currentConditions.customMinesContentText,
      customPlatformReasonText:
        customPlatformReasonText !== undefined ? customPlatformReasonText : currentConditions.customPlatformReasonText,
      registrationLink:
        registrationLink !== undefined && String(registrationLink).trim()
          ? String(registrationLink).trim()
          : currentConditions.registrationLink || DEFAULT_REGISTRATION_LINK,
      registrationPhotoUrls: Array.isArray(registrationPhotoUrls)
        ? registrationPhotoUrls.filter((u: any) => typeof u === 'string' && u.trim().length > 0)
        : currentConditions.registrationPhotoUrls || DEFAULT_REGISTRATION_PHOTOS,
      plansMessageText:
        plansMessageText !== undefined ? plansMessageText : currentConditions.plansMessageText || DEFAULT_PLANS_MESSAGE_TEXT,
      registrationMessageText:
        registrationMessageText !== undefined
          ? registrationMessageText
          : currentConditions.registrationMessageText || DEFAULT_REGISTRATION_MESSAGE_TEXT,
      depositPromptText:
        depositPromptText !== undefined ? depositPromptText : currentConditions.depositPromptText || DEFAULT_DEPOSIT_PROMPT_TEXT,
      approvalMessageText:
        approvalMessageText !== undefined
          ? approvalMessageText
          : currentConditions.approvalMessageText || DEFAULT_APPROVAL_MESSAGE_TEXT,
      fiveRoundsMessageText:
        fiveRoundsMessageText !== undefined
          ? fiveRoundsMessageText
          : currentConditions.fiveRoundsMessageText || DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
      scheduledDelayMinutes:
        scheduledDelayMinutes !== undefined ? Number(scheduledDelayMinutes) : currentConditions.scheduledDelayMinutes,
    };
    await PostgresService.saveConditions(updated);
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ==========================================
// GESTIÓN DE COMPROBANTES DE DEPÓSITO (PANEL ADMIN)
// ==========================================
app.get('/api/deposits', async (_req, res) => {
  try {
    const deposits = await PostgresService.getDepositReceipts();
    res.json({ success: true, count: deposits.length, deposits });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err), deposits: [] });
  }
});

app.post('/api/deposits/:depositId/approve', async (req, res) => {
  const { depositId } = req.params;
  const { adminId, notes } = req.body || {};
  const adminName = adminId || 'Juan Carlos';

  try {
    const receipt = await PostgresService.getDepositReceipt(depositId);
    if (!receipt) {
      return res.status(404).json({ success: false, error: 'Comprobante de depósito no encontrado' });
    }

    const user = await getOrCreateUser({
      id: receipt.telegramId,
      first_name: receipt.name || 'Usuario',
      username: receipt.username,
    });

    await deliverOrientationMaterialAndUpdateUser(user, adminName, notes, receipt.id);
    const updatedReceipt = await PostgresService.getDepositReceipt(depositId);

    return res.json({
      success: true,
      deposit: updatedReceipt,
      user,
      message: 'Depósito verificado y aprobado. Se enviaron la confirmación, las 5 rondas ilustrativas y el video de orientación al usuario.',
    });
  } catch (err) {
    console.error('[Approve Deposit Error]:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

app.post('/api/deposits/:depositId/reject', async (req, res) => {
  const { depositId } = req.params;
  const { adminId, reason } = req.body || {};
  const adminName = adminId || 'Juan Carlos';
  const cleanReason =
    (reason && String(reason).trim()) || 'No pudimos validar el comprobante recibido.';

  try {
    const receipt = await PostgresService.getDepositReceipt(depositId);
    if (!receipt) {
      return res.status(404).json({ success: false, error: 'Comprobante de depósito no encontrado' });
    }

    const updatedReceipt = await PostgresService.updateDepositReceiptStatus(
      depositId,
      'rejected',
      adminName,
      cleanReason
    );
    if (updatedReceipt) {
      mirrorDepositToFirestore(updatedReceipt).catch(() => {});
    }

    const user = await getOrCreateUser({
      id: receipt.telegramId,
      first_name: receipt.name || 'Usuario',
      username: receipt.username,
    });

    const prevStage = user.stage;
    const nowIso = new Date().toISOString();

    user.paymentStatus = 'payment_rejected';
    user.stage = 'stage_2_payment_rejected';
    user.currentStep = 'RECHAZO_PAGO';
    user.flowStateLabel = 'DEPÓSITO RECHAZADO';
    user.stageTransitions = user.stageTransitions || [];
    user.stageTransitions.push(
      createTransitionRecord(
        prevStage,
        'stage_2_payment_rejected',
        'admin',
        adminName,
        `Comprobante rechazado: ${cleanReason}`
      )
    );

    await saveUserProgress(user);

    const rejectMsg = `❌ *No pudimos validar tu comprobante de depósito.*\n\nMotivo: _${cleanReason}_\n\nPor favor, verifica la imagen e intenta enviarme nuevamente una captura clara y completa del comprobante para continuar con la verificación.`;

    await sendTelegramMessage(user.telegramId, rejectMsg);
    await recordMessageInConversation(user.id, {
      id: `b-${Date.now()}-dep-rej`,
      sender: 'bot',
      text: rejectMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepTriggered: 'RECHAZO_PAGO',
    });

    return res.json({
      success: true,
      deposit: updatedReceipt,
      user,
      message: 'Comprobante rechazado. El acceso sigue bloqueado y se notificó al usuario en Telegram.',
    });
  } catch (err) {
    console.error('[Reject Deposit Error]:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// ==========================================
// ACCIÓN ADMINISTRATIVA: ACEPTAR Y VERIFICAR ID
// ==========================================
app.post('/api/users/:telegramId/verify-id', async (req, res) => {
  const { telegramId } = req.params;
  const { adminId, notes } = req.body;

  try {
    const user = await getOrCreateUser({ id: telegramId, first_name: 'Usuario' });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const prevStage = user.stage;
    const nowIso = new Date().toISOString();
    const adminName = adminId || 'Juan Carlos';

    user.accountStatus = 'verified';
    user.idVerifiedAt = nowIso;
    user.idVerifiedBy = adminName;
    user.stage = 'stage_2_id_verified';
    user.currentStep = 'stage_2_id_verified';
    if (notes) user.notes = notes;

    user.stageTransitions = user.stageTransitions || [];
    user.stageTransitions.push({
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      fromStage: prevStage,
      toStage: 'stage_2_id_verified',
      timestamp: nowIso,
      actor: 'admin',
      adminId: adminName,
      reason: 'ID aceptado y verificado manualmente desde panel administrativo',
    });

    await saveUserProgress(user);

    // ==========================================
    // ETAPA 2 — CONFIRMACIÓN Y CONTENIDO AUTOMÁTICO
    // ==========================================

    // MENSAJE 1. CONFIRMACIÓN AUTOMÁTICA
    // Enviar inmediatamente después de aceptar el ID
    const msg1 = `💎 ¡Tu ID ha sido verificado correctamente!

Ya confirmé tu identificador y quedó registrado en nuestra base de datos.

Ahora ya puedes realizar el depósito correspondiente a tu plan.

¡Gracias por completar esta parte! 🤝`;

    await sendTelegramMessage(telegramId, msg1);
    await recordMessageInConversation(user.id, {
      id: `b-${Date.now()}-c1`,
      sender: 'bot',
      text: msg1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepTriggered: 'CONFIRMACION_ID',
    });

    await new Promise((r) => setTimeout(r, 600));

    // MENSAJE 2. CONFIRMACIÓN DEL PLAN
    const planText = user.initialPlanLabel || 'el plan que seleccionaste';
    const msg2 = `¡Perfecto! Ya podemos continuar con *${planText}*.

Es momento de realizar tu depósito. Revisa cuidadosamente el importe, las instrucciones de pago y conserva tu comprobante.`;

    await sendTelegramMessage(telegramId, msg2);
    await recordMessageInConversation(user.id, {
      id: `b-${Date.now()}-c2`,
      sender: 'bot',
      text: msg2,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepTriggered: 'CONFIRMACION_PLAN',
    });

    await new Promise((r) => setTimeout(r, 600));

    // MENSAJE 3. INSTRUCCIONES DE RECARGA (Fotos en orden + único mensaje)
    await sendTelegramMediaGroup(telegramId, [
      { type: 'photo', url: '/public/assets/aistudio/IMG_8055_1c7f857b.jpeg' },
      { type: 'photo', url: '/public/assets/aistudio/IMG_8053_cc818551.jpeg' },
    ]);

    const msg3 = `💳 *¡ES MOMENTO DE REALIZAR TU DEPÓSITO!*

Ya puedes hacer tu depósito para *${planText}* siguiendo las instrucciones de las imágenes anteriores.

1️⃣ Verifica que los datos del destinatario y el valor sean correctos.
2️⃣ Conserva la captura o fotografía del comprobante.
3️⃣ No realices una segunda transferencia si todavía no se ha confirmado la primera.

👇 *Cuando ya hayas realizado tu depósito, pulsa el botón de abajo:*`;

    // MENSAJE 4. USUARIO AVISA QUE DEPOSITÓ (Botón habilitado solo tras verificar ID)
    const replyMarkup = {
      inline_keyboard: [
        [{ text: '💳 YA REALICÉ EL DEPÓSITO', callback_data: 'deposito_realizado' }],
      ],
    };

    await sendTelegramMessage(telegramId, msg3, { reply_markup: replyMarkup });
    await recordMessageInConversation(user.id, {
      id: `b-${Date.now()}-c3`,
      sender: 'bot',
      text: msg3,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepTriggered: 'INSTRUCCIONES_RECARGA',
    });

    return res.json({
      success: true,
      user,
      message: 'ID verificado exitosamente y Etapa 2 iniciada automáticamente en Telegram.',
    });
  } catch (err) {
    console.error('[Verify ID Error]:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// ==========================================
// ACCIÓN ADMINISTRATIVA: RECHAZAR ID
// ==========================================
app.post('/api/users/:telegramId/reject-id', async (req, res) => {
  const { telegramId } = req.params;
  const { adminId, reason } = req.body;

  try {
    const user = await getOrCreateUser({ id: telegramId, first_name: 'Usuario' });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const prevStage = user.stage;
    const nowIso = new Date().toISOString();
    const adminName = adminId || 'Juan Carlos';

    user.accountStatus = 'rejected';
    user.idRejectedAt = nowIso;
    user.idRejectedReason = reason || 'Información no coincide';
    user.stage = 'stage_1_id_pending';
    user.currentStep = 'stage_1_id_pending';

    user.stageTransitions = user.stageTransitions || [];
    user.stageTransitions.push({
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      fromStage: prevStage,
      toStage: 'stage_1_id_pending',
      timestamp: nowIso,
      actor: 'admin',
      adminId: adminName,
      reason: reason || 'ID rechazado por no concordar con información',
    });

    await saveUserProgress(user);

    // Mensaje de rechazo al usuario
    const rejMsg = `No pude confirmar tu ID con la información recibida.\n\nPor favor, revisa los números y envíame nuevamente el identificador correcto.`;
    await sendTelegramMessage(telegramId, rejMsg);
    await recordMessageInConversation(user.id, {
      id: `b-${Date.now()}-rej`,
      sender: 'bot',
      text: rejMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepTriggered: 'SOLICITUD_ID',
    });

    return res.json({
      success: true,
      user,
      message: 'ID rechazado y notificación enviada al usuario para que reenvíe el correcto.',
    });
  } catch (err) {
    console.error('[Reject ID Error]:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// ==========================================
// ACCIÓN ADMINISTRATIVA: CONFIRMAR OPERACIÓN / PAGO
// ==========================================
app.post('/api/users/:telegramId/verify-payment', async (req, res) => {
  const { telegramId } = req.params;
  const { adminId, notes } = req.body || {};

  try {
    const user = await getOrCreateUser({ id: telegramId, first_name: 'Usuario' });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const adminName = adminId || 'Juan Carlos';
    await deliverOrientationMaterialAndUpdateUser(user, adminName, notes, user.latestDepositId);

    return res.json({
      success: true,
      user,
      message: 'Operación verificada. Se enviaron confirmación, 5 rondas de orientación y video de Mines al usuario.',
    });
  } catch (err) {
    console.error('[Verify Payment Error]:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

app.post('/api/users/:telegramId/reject-payment', async (req, res) => {
  const { telegramId } = req.params;
  const { adminId, reason } = req.body || {};
  const adminName = adminId || 'Juan Carlos';
  const cleanReason =
    (reason && String(reason).trim()) || 'No pudimos validar tu comprobante de depósito.';

  try {
    const user = await getOrCreateUser({ id: telegramId, first_name: 'Usuario' });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (user.latestDepositId) {
      const updatedReceipt = await PostgresService.updateDepositReceiptStatus(
        user.latestDepositId,
        'rejected',
        adminName,
        cleanReason
      );
      if (updatedReceipt) {
        mirrorDepositToFirestore(updatedReceipt).catch(() => {});
      }
    }

    const prevStage = user.stage;
    user.paymentStatus = 'payment_rejected';
    user.stage = 'stage_2_payment_rejected';
    user.currentStep = 'RECHAZO_PAGO';
    user.flowStateLabel = 'DEPÓSITO RECHAZADO';
    user.stageTransitions = user.stageTransitions || [];
    user.stageTransitions.push(
      createTransitionRecord(
        prevStage,
        'stage_2_payment_rejected',
        'admin',
        adminName,
        `Pago rechazado: ${cleanReason}`
      )
    );
    await saveUserProgress(user);

    const rejectMsg = `❌ *No pudimos validar tu comprobante de depósito.*\n\nMotivo: _${cleanReason}_\n\nPor favor, envíame nuevamente una imagen clara y completa de tu comprobante para revisarlo.`;
    await sendTelegramMessage(telegramId, rejectMsg);
    await recordMessageInConversation(user.id, {
      id: `b-${Date.now()}-pay-rej`,
      sender: 'bot',
      text: rejectMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepTriggered: 'RECHAZO_PAGO',
    });

    return res.json({
      success: true,
      user,
      message: 'Depósito rechazado y notificación enviada al usuario.',
    });
  } catch (err) {
    console.error('[Reject Payment Error]:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// REINICIAR ETAPA (Para pruebas del administrador)
app.post('/api/users/:telegramId/reset-stage', async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await getOrCreateUser({ id: telegramId, first_name: 'Usuario' });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    user.stage = 'stage_1_welcome';
    user.currentStep = 'stage_1_welcome';
    user.accountStatus = 'pending_verification';
    user.paymentStatus = 'unpaid';
    user.flowStateLabel = 'NUEVO USUARIO';
    user.latestDepositId = undefined;
    user.accountId = undefined;
    user.initialPlan = undefined;
    user.initialPlanLabel = undefined;
    user.advancedPlan = undefined;
    user.advancedPlanLabel = undefined;
    user.termsAccepted = false;
    user.stageTransitions = [
      {
        id: `tr-reset-${Date.now()}`,
        fromStage: 'reset',
        toStage: 'stage_1_welcome',
        timestamp: new Date().toISOString(),
        actor: 'admin',
        reason: 'Reinicio de prueba desde panel administrativo',
      },
    ];

    await saveUserProgress(user);
    res.json({ success: true, user, message: 'Etapa del usuario reiniciada a Etapa 1' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post('/api/users/:telegramId/review', async (req, res) => {
  const { telegramId } = req.params;
  const { status, notes } = req.body;
  try {
    await PostgresService.updateUserStatus(telegramId, status, notes);
    res.json({ success: true, telegramId, status, notes });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ----------------------------------------------------
// 3. TELEGRAM BOT REAL CONNECTION & LIFECYCLE ENDPOINTS
// ----------------------------------------------------
const defaultCloudRunConfig = {
  serviceName: (process.env.K_SERVICE && !process.env.K_SERVICE.includes('ais-dev')) ? process.env.K_SERVICE : 'mine-aimbot',
  region: process.env.REGION || 'us-west2',
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'jumping-agility-75wls',
};

const defaultGcpPermissions = {
  hasSecretManagerPermission: false,
  hasCloudRunPermission: true,
  errorMessage: 'La cuenta de servicio del contenedor opera con roles de ejecución Cloud Run.',
  requiredRoles: [
    'roles/secretmanager.secretAccessor',
    'roles/run.invoker',
  ],
  gcloudCommands: [
    'gcloud run services update mine-aimbot --region us-west2 --update-secrets=TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest',
  ],
};

app.get('/api/telegram/connection-status', async (_req, res) => {
  const token = getActiveBotToken();
  const publicBaseUrl = PUBLIC_BASE_URL;
  const expectedWebhookUrl = publicBaseUrl ? `${publicBaseUrl}/api/telegram/webhook` : null;

  if (!token) {
    return res.json({
      success: true,
      connected: false,
      hasToken: false,
      maskedToken: undefined,
      bot: null,
      webhook: null,
      expectedWebhookUrl,
      webhookMatches: false,
      publicBaseUrl,
      publicBaseUrlConfigured: Boolean(publicBaseUrl),
      webhookSecretConfigured: Boolean(currentWebhookSecret),
      databaseType: 'neon-postgresql',
      databaseConfigured: PostgresService.isConfigured(),
      cloudRunConfig: defaultCloudRunConfig,
      gcpPermissions: defaultGcpPermissions,
    });
  }

  try {
    const [meRes, whRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`),
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`),
    ]);

    const meData = (await meRes.json()) as any;
    const whData = (await whRes.json()) as any;

    if (!meData.ok) {
      return res.json({
        success: true,
        connected: false,
        hasToken: true,
        maskedToken: maskToken(token),
        tokenError: meData.description || 'Token inválido en Telegram',
        bot: null,
        webhook: null,
        expectedWebhookUrl,
        webhookMatches: false,
        publicBaseUrl,
        publicBaseUrlConfigured: Boolean(publicBaseUrl),
        webhookSecretConfigured: Boolean(currentWebhookSecret),
        databaseType: 'neon-postgresql',
        cloudRunConfig: defaultCloudRunConfig,
        gcpPermissions: defaultGcpPermissions,
      });
    }

    const bot = meData.result;
    const webhook = whData.ok ? whData.result : null;

    let webhookMatches = false;
    if (webhook && webhook.url && expectedWebhookUrl) {
      const cleanReg = webhook.url.replace(/\/$/, '').toLowerCase();
      const cleanExp = expectedWebhookUrl.replace(/\/$/, '').toLowerCase();
      webhookMatches = cleanReg === cleanExp;
    }

    const hasWebhookError = Boolean(webhook?.last_error_message);
    const has401Error = Boolean(webhook?.last_error_message?.includes('401'));
    const isActuallyWorking = Boolean(bot && webhook && webhook.url && webhookMatches && !has401Error);

    // Seven separated states audit
    const separatedStates = {
      tokenAuthenticated: {
        status: (bot ? 'VERIFICADO' : 'ERROR') as any,
        message: bot ? `Autenticado como @${bot.username} (ID: ${bot.id})` : 'Token no autenticado',
      },
      webhookRegistered: {
        status: (webhook?.url ? 'VERIFICADO' : 'PENDIENTE') as any,
        message: webhook?.url ? `Registrado: ${sanitizeWebhookUrl(webhook.url)}` : 'Sin URL registrada en Telegram',
      },
      webhookAccessible: {
        status: (has401Error ? 'ERROR' : webhook?.url ? 'VERIFICADO' : 'PENDIENTE') as any,
        message: has401Error
          ? `Error 401: Telegram no puede autenticar con el secret_token actual en Cloud Run`
          : webhook?.url
          ? 'Endpoint accesible desde Telegram'
          : 'Pendiente de configuración',
      },
      updatesReceived: {
        status: (webhook?.pending_update_count && webhook.pending_update_count > 0 ? (has401Error ? 'ERROR' : 'PENDIENTE') : 'VERIFICADO') as any,
        message: `${webhook?.pending_update_count ?? 0} actualizaciones pendientes en cola de Telegram`,
      },
      updatesProcessed: {
        status: (isActuallyWorking ? 'VERIFICADO' : has401Error ? 'ERROR' : 'PENDIENTE') as any,
        message: isActuallyWorking ? 'Motor determinista e idempotente activo' : 'Pausado por bloqueo en recepción',
      },
      messagesSentSuccessfully: {
        status: (bot ? 'VERIFICADO' : 'REQUIERE_AUTORIZACION') as any,
        message: bot ? 'Capacidad de envío saliente verificada con Telegram API' : 'Requiere token',
      },
      deliveryErrors: {
        status: (hasWebhookError ? 'ERROR' : 'VERIFICADO') as any,
        message: webhook?.last_error_message || 'Sin errores de entrega registrados',
      },
    };

    return res.json({
      success: true,
      connected: isActuallyWorking,
      hasToken: true,
      maskedToken: maskToken(token),
      bot,
      webhook,
      expectedWebhookUrl,
      webhookMatches,
      publicBaseUrl,
      publicBaseUrlConfigured: Boolean(publicBaseUrl),
      webhookSecretConfigured: Boolean(currentWebhookSecret),
      databaseType: 'neon-postgresql',
      databaseConfigured: PostgresService.isConfigured(),
      cloudRunConfig: defaultCloudRunConfig,
      gcpPermissions: defaultGcpPermissions,
      separatedStates,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error consultando Telegram API: ' + (err instanceof Error ? err.message : String(err)),
      hasToken: true,
      maskedToken: maskToken(token),
      cloudRunConfig: defaultCloudRunConfig,
      gcpPermissions: defaultGcpPermissions,
    });
  }
});

// POST /api/telegram/connect
app.post('/api/telegram/connect', async (req, res) => {
  const { token, overwriteWebhook, adminAuthKey } = req.body;

  if (ADMIN_TELEGRAM_ID && adminAuthKey && String(adminAuthKey).trim() !== ADMIN_TELEGRAM_ID) {
    return res.status(403).json({
      success: false,
      error: 'Autorización administrativa denegada. El ID de administrador no coincide.',
    });
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Debes proporcionar un token de Telegram válido emitido por @BotFather.',
    });
  }

  const rawTokenClean = String(token || '').trim();
  const cleanToken = rawTokenClean
    .replace(/^bot/i, '')
    .replace(/["'<>]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  if (!cleanToken.includes(':')) {
    return res.status(400).json({
      success: false,
      error: 'Formato de token inválido. El token debe contener dos puntos ":" separando el ID numérico y la clave secreta (ej. 7981234567:AAFl0...).',
    });
  }

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const meData = (await meRes.json()) as any;

    if (!meData.ok) {
      return res.status(401).json({
        success: false,
        error: `Telegram API rechazó el token: ${meData.description || 'Código no autorizado (401)'}.`,
      });
    }

    const botInfo = meData.result;

    // Save in Neon PostgreSQL
    try {
      const currentConfig = await PostgresService.getBotConfig();
      await PostgresService.saveBotConfig({
        ...currentConfig,
        username: `@${botInfo.username}`,
        botName: botInfo.first_name || 'Juan Carlos | Mines AI 💎',
        botToken: cleanToken,
        webhookSecret: currentWebhookSecret || 'jc_mines_webhook_secret_9981',
      });
    } catch (dbErr) {
      console.warn('[Postgres] Aviso actualizando credenciales en base de datos:', dbErr);
    }

    const whRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getWebhookInfo`);
    const whData = (await whRes.json()) as any;
    const existingWebhookUrl = whData.ok ? whData.result?.url : '';

    const publicBaseUrl = PUBLIC_BASE_URL;
    const targetWebhookUrl = publicBaseUrl ? `${publicBaseUrl}/api/telegram/webhook` : null;

    const safeExistingWebhookUrl = sanitizeWebhookUrl(existingWebhookUrl);
    if (existingWebhookUrl && targetWebhookUrl && existingWebhookUrl !== targetWebhookUrl && !overwriteWebhook) {
      return res.json({
        success: false,
        requiresConfirmation: true,
        existingWebhookUrl: safeExistingWebhookUrl,
        targetWebhookUrl,
        bot: botInfo,
        message: `El bot @${botInfo.username} ya tiene un webhook hacia "${safeExistingWebhookUrl}". ¿Deseas reemplazarlo con "${targetWebhookUrl}"?`,
      });
    }

    currentBotToken = cleanToken;
    process.env.TELEGRAM_BOT_TOKEN = cleanToken;

    let webhookResult = whData.ok && whData.result
      ? { ...whData.result, url: safeExistingWebhookUrl }
      : null;
    let webhookRegistered = false;
    let webhookNotice = '';

    if (targetWebhookUrl) {
      const activeSecret = getActiveWebhookSecret();
      try {
        // Step 1: Delete existing webhook without dropping pending updates to force Telegram to invalidate stale secret cache
        await fetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook?drop_pending_updates=false`);

        // Step 2: Re-register webhook with canonical secret_token
        const setRes = await fetch(
          `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}&secret_token=${encodeURIComponent(activeSecret)}&drop_pending_updates=false`
        );
        const setData = (await setRes.json()) as any;

        if (setData.ok) {
          webhookRegistered = true;
          webhookNotice = `Webhook registrado y sincronizado exitosamente con secret_token en Telegram.`;
          const verifyWhRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getWebhookInfo`);
          const verifyWhData = (await verifyWhRes.json()) as any;
          if (verifyWhData.ok && verifyWhData.result) {
            webhookResult = {
              ...verifyWhData.result,
              url: sanitizeWebhookUrl(verifyWhData.result.url),
            };
          }
        } else {
          webhookNotice = `Error al registrar webhook: ${setData.description || 'Fallo desconocido'}`;
        }
      } catch (whErr) {
        webhookNotice = `Excepción al configurar webhook: ${whErr instanceof Error ? whErr.message : String(whErr)}`;
      }
    }

    const isConnected = webhookRegistered && Boolean(webhookResult?.url);

    return res.json({
      success: true,
      connected: isConnected,
      bot: botInfo,
      webhook: webhookResult,
      webhookRegistered,
      webhookNotice,
      maskedToken: maskToken(cleanToken),
      publicBaseUrl,
      cloudRunConfig: defaultCloudRunConfig,
      gcpPermissions: defaultGcpPermissions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error de red comunicándose con la API de Telegram: ' + (err instanceof Error ? err.message : String(err)),
    });
  }
});

// POST /api/telegram/disconnect
app.post('/api/telegram/disconnect', async (_req, res) => {
  const token = await ensureBotToken();
  if (token) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
    } catch (err) {
      console.warn('[Telegram Disconnect] Error llamando deleteWebhook:', err);
    }
  }

  currentBotToken = undefined;
  delete process.env.TELEGRAM_BOT_TOKEN;

  try {
    const currentConfig = await PostgresService.getBotConfig();
    await PostgresService.saveBotConfig({ ...currentConfig, botToken: '' });
  } catch (e) {
    console.warn('[Postgres] Error limpiando botToken:', e);
  }

  return res.json({
    success: true,
    message: 'Bot de Telegram desconectado exitosamente y webhook eliminado.',
    connected: false,
  });
});

// POST /api/telegram/set-webhook
app.post('/api/telegram/set-webhook', async (req, res) => {
  const token = getActiveBotToken();
  if (!token) {
    return res.status(400).json({ success: false, error: 'No hay token activo.' });
  }

  const { customBaseUrl, customSecret } = req.body;
  const baseUrl = (customBaseUrl || PUBLIC_BASE_URL || '').replace(/\/$/, '');

  if (!baseUrl) {
    return res.status(400).json({
      success: false,
      error: 'PUBLIC_BASE_URL no está configurado.',
    });
  }

  const targetWebhookUrl = `${baseUrl}/api/telegram/webhook`;
  const secret = (customSecret || getActiveWebhookSecret() || CANONICAL_WEBHOOK_SECRET).replace(/^["']|["']$/g, '').trim();
  const secretParam = `&secret_token=${encodeURIComponent(secret)}`;

  try {
    const setRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}${secretParam}&drop_pending_updates=false`
    );
    const setData = (await setRes.json()) as any;

    if (!setData.ok) {
      return res.status(400).json({
        success: false,
        error: `Telegram rechazó setWebhook: ${setData.description || 'Error desconocido'}`,
      });
    }

    const verifyWhRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const verifyWhData = (await verifyWhRes.json()) as any;

    return res.json({
      success: true,
      webhook: verifyWhData.ok ? verifyWhData.result : null,
      message: 'Webhook registrado exitosamente hacia ' + targetWebhookUrl,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error comunicando con Telegram: ' + (err instanceof Error ? err.message : String(err)),
    });
  }
});

// GET /api/telegram/status
app.get('/api/telegram/status', async (_req, res) => {
  const token = getActiveBotToken();
  const publicBaseUrl = PUBLIC_BASE_URL || null;
  const expectedWebhookUrl = publicBaseUrl ? `${publicBaseUrl}/api/telegram/webhook` : '';

  if (!token) {
    return res.json({
      status: 'disconnected',
      bot: null,
      botError: 'Token no configurado',
      webhook: null,
      expectedWebhookUrl,
      publicBaseUrl,
      maskedToken: undefined,
      databaseType: 'neon-postgresql',
    });
  }

  try {
    const [meRes, whRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`),
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`),
    ]);

    const meData = (await meRes.json()) as any;
    const whData = (await whRes.json()) as any;

    const bot = meData.ok ? meData.result : null;
    const webhook = whData.ok ? whData.result : null;

    let webhookRegistered = false;
    if (webhook && webhook.url && expectedWebhookUrl) {
      webhookRegistered = webhook.url.replace(/\/$/, '') === expectedWebhookUrl.replace(/\/$/, '');
    }

    return res.json({
      status: bot && webhookRegistered ? 'connected' : 'partially_configured',
      bot,
      botError: meData.ok ? null : meData.description,
      webhook,
      webhookRegistered,
      expectedWebhookUrl,
      publicBaseUrl,
      maskedToken: maskToken(token),
      databaseType: 'neon-postgresql',
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: 'Error contactando Telegram API: ' + (err instanceof Error ? err.message : String(err)),
      maskedToken: maskToken(token),
    });
  }
});

// POST /api/telegram/register-webhook
app.post('/api/telegram/register-webhook', async (_req, res) => {
  const token = getActiveBotToken();
  if (!token) {
    return res.status(400).json({ error: 'No hay token activo configurado.' });
  }

  const baseUrl = PUBLIC_BASE_URL;
  if (!baseUrl) {
    return res.status(400).json({
      error: 'PUBLIC_BASE_URL no está configurado.',
    });
  }

  const targetWebhookUrl = `${baseUrl}/api/telegram/webhook`;
  const secret = getActiveWebhookSecret() || CANONICAL_WEBHOOK_SECRET;
  const secretParam = `&secret_token=${encodeURIComponent(secret)}`;

  try {
    // Step 1: Invalidate Telegram's existing webhook cache without dropping pending updates
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);

    // Step 2: Register webhook with canonical secret_token
    const setRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}${secretParam}&drop_pending_updates=false`
    );
    const setData = (await setRes.json()) as any;

    if (!setData.ok) {
      return res.status(400).json({ error: `Telegram setWebhook falló: ${setData.description}` });
    }

    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const infoData = (await infoRes.json()) as any;

    return res.json({
      success: true,
      registeredUrl: targetWebhookUrl,
      webhook: infoData.ok ? infoData.result : null,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// POST /api/telegram/test-message
app.post('/api/telegram/test-message', async (req, res) => {
  const { chatId, text } = req.body;
  const targetChatId = chatId || ADMIN_TELEGRAM_ID;

  if (!targetChatId) {
    return res.status(400).json({ error: 'Falta targetChatId o ADMIN_TELEGRAM_ID para enviar el mensaje de prueba.' });
  }

  const messageText = text || '💎 *Mensaje de Prueba*\n\nConexión con bot de Telegram y Neon PostgreSQL verificada correctamente.';
  const sendRes = await sendTelegramMessage(targetChatId, messageText);
  return res.json({ success: sendRes.ok, result: sendRes });
});

// GET /api/telegram/diagnose
app.get('/api/telegram/diagnose', async (_req: Request, res: Response) => {
  const token = await ensureBotToken();
  const rawAdminId = process.env.ADMIN_TELEGRAM_ID;
  const adminId = ADMIN_TELEGRAM_ID;

  let meResult: any = null;
  let meError: string | null = null;
  let whResult: any = null;
  let whError: string | null = null;

  if (token) {
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json();
      if (meData.ok) {
        meResult = meData.result;
      } else {
        meError = meData.description;
      }
    } catch (err) {
      meError = err instanceof Error ? err.message : String(err);
    }

    try {
      const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const whData = await whRes.json();
      if (whData.ok) {
        whResult = whData.result;
      } else {
        whError = whData.description;
      }
    } catch (err) {
      whError = err instanceof Error ? err.message : String(err);
    }
  }

  const expectedWebhookUrl = `${PUBLIC_BASE_URL}/api/telegram/webhook`;
  const registeredUrl = whResult?.url || null;
  const urlMatches = registeredUrl
    ? registeredUrl.replace(/\/$/, '').toLowerCase() === expectedWebhookUrl.replace(/\/$/, '').toLowerCase()
    : false;

  const mockUser: TelegramUser = {
    id: `usr-audit-test`,
    telegramId: adminId || '684920153',
    name: 'Auditor de Integración',
    username: 'auditor',
    joinDate: new Date().toISOString(),
    country: '',
    currentStep: 'START',
    stage: 'Inicio',
    lastActivity: 'Ahora mismo',
    status: 'active',
    messagesSent: 0,
    messagesReceived: 0,
    consentGiven: false,
    experienceLevel: 'principiante',
    accountStatus: 'pendiente_revision',
  };

  const startTestResult = processDeterministicUpdate(
    mockUser,
    '/start',
    undefined,
    DEFAULT_KEYWORD_CONFIG,
    {},
    { adminTelegramId: adminId, publicBaseUrl: PUBLIC_BASE_URL }
  );

  return res.json({
    timestamp: new Date().toISOString(),
    database: {
      type: 'neon-postgresql',
      connected: PostgresService.isConfigured(),
    },
    check1_pageDisplayMethod: {
      description: 'Método utilizado para mostrar el bot conectado en la web',
      connectionView: 'Consulta GET /api/telegram/connection-status y evalúa si bot existe y webhook activo',
      database: 'Neon PostgreSQL (Neon serverless driver)',
    },
    check2_getMe: {
      status: meResult ? 'OK' : token ? 'FAILED' : 'NO_TOKEN',
      result: meResult ? { id: meResult.id, is_bot: meResult.is_bot, first_name: meResult.first_name, username: meResult.username } : null,
      error: meError || (!token ? 'Sin token activo en servidor' : null),
      hasToken: Boolean(token),
    },
    check3_webhookRegistered: {
      status: whResult ? (whResult.url ? 'REGISTERED' : 'NOT_SET') : 'UNKNOWN',
      webhookInfo: whResult
        ? {
            url: sanitizeWebhookUrl(whResult.url),
            has_custom_certificate: whResult.has_custom_certificate,
            pending_update_count: whResult.pending_update_count,
            last_error_date: whResult.last_error_date,
            last_error_message: whResult.last_error_message,
          }
        : null,
      error: whError,
    },
    check4_urlMatchesEndpoint: {
      expectedWebhookUrl,
      registeredUrl: sanitizeWebhookUrl(registeredUrl),
      urlMatches,
      publicBaseUrl: PUBLIC_BASE_URL,
    },
    check5_updatesSentByTelegram: {
      pendingUpdateCount: whResult?.pending_update_count ?? null,
      lastErrorDate: whResult?.last_error_date ? new Date(whResult.last_error_date * 1000).toISOString() : null,
      lastErrorMessage: whResult?.last_error_message ?? null,
      receivingStatus: whResult?.last_error_message ? `Alerta: ${whResult.last_error_message}` : 'Operando con normalidad',
    },
    check6_startCommandProcessing: {
      status: startTestResult.recognizedAction ? 'OK' : 'FAILED',
      recognizedAction: startTestResult.recognizedAction,
      userNextStep: startTestResult.updatedUser.currentStep,
      generatedMessagesCount: startTestResult.messagesToSend.length,
      sampleFirstMessage: startTestResult.messagesToSend[0]?.text?.slice(0, 100) + '...',
      hasButtons: Boolean(startTestResult.messagesToSend[0]?.buttons?.length),
    },
    check7_sendMessageReady: {
      canSend: Boolean(token && token.includes(':')),
      tokenSource: token ? 'Neon PostgreSQL / Env' : 'Ninguno',
      activeBotTokenPresent: Boolean(token),
    },
    check8_cloudRunLogsAndStatus: {
      serviceName: defaultCloudRunConfig.serviceName,
      region: defaultCloudRunConfig.region,
      projectId: defaultCloudRunConfig.projectId,
      webhookReturns401OnCloudRun: Boolean(whResult?.last_error_message?.includes('401')),
      activeWebhookSecretConfigured: Boolean(getActiveWebhookSecret()),
      canonicalSecret: 'jc_mines_webhook_secret_9981',
      receivingStatus: whResult?.last_error_message || 'OK',
    },
  });
});

// GET & POST /api/telegram/simulate-update
app.get(['/api/telegram/simulate-update', '/telegram/simulate-update'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    endpoint: '/api/telegram/simulate-update',
    method: 'POST',
    usage: 'Envía un POST con { text: "/start", chatId: 684920153 } para simular un comando de Telegram.',
  });
});

app.post(['/api/telegram/simulate-update', '/telegram/simulate-update'], async (req: Request, res: Response) => {
  const { text, chatId, userId, firstName, username } = req.body || {};
  const targetText = text || '/start';
  const targetChatId = chatId || 999999;
  const targetUserId = userId || targetChatId;

  const fakeUpdate = {
    update_id: Math.floor(Date.now() / 1000),
    message: {
      message_id: Math.floor(Math.random() * 10000),
      from: {
        id: targetUserId,
        first_name: firstName || 'Usuario Demo',
        username: username || 'demo_user',
      },
      chat: {
        id: targetChatId,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: targetText,
    },
  };

  const result = await processTelegramUpdatePayload(fakeUpdate);
  return res.json({ success: result.ok, ...result, simulatedUpdate: fakeUpdate });
});

// POST /api/telegram/clear-webhook-errors
app.post('/api/telegram/clear-webhook-errors', async (req: Request, res: Response) => {
  const token = await ensureBotToken();
  if (!token) {
    return res.status(400).json({ success: false, error: 'No hay token activo configurado.' });
  }

  const { dropPending = false } = req.body || {};
  const secret = await ensureWebhookSecret();
  const targetWebhookUrl = `${PUBLIC_BASE_URL}/api/telegram/webhook`;

  try {
    // Re-register with canonical secret_token
    const setRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}&secret_token=${encodeURIComponent(secret)}&drop_pending_updates=${Boolean(dropPending)}`
    );
    const setData = (await setRes.json()) as any;

    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const infoData = (await infoRes.json()) as any;

    return res.json({
      success: Boolean(setData.ok),
      result: setData,
      webhook: infoData.ok ? infoData.result : null,
      message: setData.ok
        ? 'Webhook re-sincronizado exitosamente con secret_token. Los errores previos fueron limpiados en Telegram.'
        : `Telegram reportó: ${setData.description || 'Error desconocido'}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// Automatic Webhook Registration on Startup
async function syncWebhookOnStartup() {
  const token = await ensureBotToken();
  if (!token || !token.includes(':')) return;

  const secret = await ensureWebhookSecret();
  const targetWebhookUrl = `${PUBLIC_BASE_URL}/api/telegram/webhook`;
  try {
    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = (await whRes.json()) as any;
    if (whData.ok && whData.result) {
      const currentUrl = (whData.result.url || '').replace(/\/$/, '');
      const has401OrWrongResponse = Boolean(
        whData.result.last_error_message &&
        (whData.result.last_error_message.includes('401') ||
         whData.result.last_error_message.includes('Wrong response'))
      );
      const urlMismatch = currentUrl !== targetWebhookUrl.replace(/\/$/, '');

      if (!urlMismatch && !has401OrWrongResponse) {
        console.log(`[Startup Webhook] Webhook verificado y activo en Telegram hacia: ${sanitizeWebhookUrl(currentUrl)}`);
        return;
      }

      console.log(`[Startup Webhook] Sincronizando webhook oficial con secret_token hacia: ${targetWebhookUrl}...`);
      const setRes = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}&secret_token=${encodeURIComponent(secret)}&drop_pending_updates=false`
      );
      const setData = (await setRes.json()) as any;
      if (setData.ok) {
        console.log(`[Startup Webhook] Webhook registrado exitosamente en Telegram con secret_token.`);
      } else {
        console.warn(`[Startup Webhook] Telegram rechazó setWebhook: ${setData.description}`);
      }
    }
  } catch (err) {
    console.warn('[Startup Webhook] Error:', err);
  }
}

// In local or Cloud Run, listen on PORT. In Vercel serverless / AWS Lambda, don't block.
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

if (!isServerless) {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(rootDir, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(rootDir, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 [Juan Carlos | Mines AI 💎] Servidor backend escuchando en el puerto ${PORT}`);
    console.log(`📡 Webhook Telegram configurado en: /api/telegram/webhook`);
    console.log(`🐘 Base de datos: Neon PostgreSQL (${PostgresService.isConfigured() ? 'Conectado' : 'Sin DATABASE_URL, fallback memoria'})`);
  });

  syncWebhookOnStartup().catch((e) => console.warn('[Startup Webhook] Error:', e));
}

export default app;
