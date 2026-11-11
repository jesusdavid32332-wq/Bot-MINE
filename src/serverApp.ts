import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  DEFAULT_KEYWORD_CONFIG,
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
import { AutoMessage, DeterministicKeywordConfig, FlowStepId, TelegramUser } from './types';
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
const rawSecret = process.env.WEBHOOK_SECRET;

// Note: For Vercel or Cloud Run, determine the public base URL
const rawBaseUrl =
  process.env.PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  (process.env.APP_URL && !process.env.APP_URL.includes('ais-dev-') ? process.env.APP_URL : undefined);

// Defensive detection: if token was accidentally set as ADMIN_TELEGRAM_ID
let currentBotToken: string | undefined = rawToken || (rawAdmin?.includes(':') ? rawAdmin : undefined);
const ADMIN_TELEGRAM_ID = rawAdmin && !rawAdmin.includes(':') ? rawAdmin : '684920153';
let currentWebhookSecret: string | undefined = rawSecret;
const PUBLIC_BASE_URL = (rawBaseUrl || 'https://mine-aimbot-167398797374.us-west2.run.app').replace(/\/$/, '');

// In-memory LRU set for fast update_id deduplication
const processedUpdatesCache = new Set<string>();

export function getActiveBotToken(): string | undefined {
  return currentBotToken || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
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

// Helper: Telegram Bot API Call with automatic Markdown retry and media fallback
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

  const endpoint = options.photo
    ? `https://api.telegram.org/bot${token}/sendPhoto`
    : options.video
      ? `https://api.telegram.org/bot${token}/sendVideo`
      : `https://api.telegram.org/bot${token}/sendMessage`;

  const body: Record<string, any> = {
    chat_id: chatId,
  };

  const hasValidPhoto = Boolean(options.photo && String(options.photo).startsWith('http'));
  const hasValidVideo = Boolean(options.video && String(options.video).startsWith('http'));

  if (hasValidPhoto) {
    body.photo = options.photo;
    body.caption = text;
    body.parse_mode = 'HTML';
  } else if (hasValidVideo) {
    body.video = options.video;
    body.caption = text;
    body.parse_mode = 'HTML';
  } else {
    body.text = text;
    body.parse_mode = 'HTML';
  }

  if (options.reply_markup) {
    body.reply_markup = options.reply_markup;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data = (await res.json()) as any;

    if (!data.ok && data.description?.includes('can\'t parse entities')) {
      const plainBody = { ...body };
      delete plainBody.parse_mode;
      const retryRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plainBody),
      });
      data = await retryRes.json();
    }

    if (!data.ok && (hasValidPhoto || hasValidVideo)) {
      const textOnlyBody: Record<string, any> = {
        chat_id: chatId,
        text: text,
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

// User loading and saving
async function getOrCreateUser(from: any): Promise<TelegramUser> {
  const telegramId = String(from.id);

  try {
    const existing = await PostgresService.getUser(telegramId);
    if (existing) {
      inMemoryUsers.set(telegramId, existing);
      return existing;
    }
  } catch (err) {
    console.warn(`[Neon Postgres] Error obteniendo usuario ${telegramId}:`, err);
  }

  if (inMemoryUsers.has(telegramId)) {
    return inMemoryUsers.get(telegramId)!;
  }

  const newUser: TelegramUser = {
    id: `usr-${telegramId}`,
    telegramId,
    name: [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Usuario',
    username: from.username || `user_${telegramId}`,
    joinDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
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

  inMemoryUsers.set(telegramId, newUser);
  PostgresService.saveUser(newUser).catch(console.warn);
  return newUser;
}

async function saveUserProgress(user: TelegramUser) {
  inMemoryUsers.set(user.telegramId, user);
  await PostgresService.saveUser(user);
}

async function recordMessageInConversation(
  userId: string,
  message: { id: string; sender: 'user' | 'bot' | 'admin'; text: string; timestamp: string; stepTriggered?: FlowStepId }
) {
  await PostgresService.recordConversationMessage(userId, message);
}

// Core processor for any incoming Telegram update
export async function processTelegramUpdatePayload(update: any): Promise<{ ok: boolean; action?: string; messagesSent?: number; error?: string }> {
  const isCallback = Boolean(update.callback_query);
  const msg = isCallback ? update.callback_query.message : update.message;
  const from = isCallback ? update.callback_query.from : update.message?.from;
  const rawText = isCallback ? update.callback_query.data : update.message?.text || '';
  const chatId = msg?.chat?.id || from?.id;

  if (!chatId || !from) {
    return { ok: false, error: 'Falta chatId o emisor (from) en el payload' };
  }

  if (isCallback && update.callback_query?.id) {
    answerTelegramCallback(update.callback_query.id).catch(() => {});
  }

  try {
    const user = await getOrCreateUser(from);
    user.messagesSent = (user.messagesSent || 0) + 1;
    user.lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
          : `${PUBLIC_BASE_URL}${msgToSend.mediaUrl}`;

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
      });

      if (result.messagesToSend.length > 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    await saveUserProgress(updatedUser);
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
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const update = req.body;

  if (!update || typeof update !== 'object') {
    return res.status(400).json({ error: 'Payload de webhook inválido' });
  }

  // Strict Security check: validate secret token
  const expectedSecret = currentWebhookSecret || 'jc_mines_webhook_secret_9981';
  if (expectedSecret) {
    const cleanHeader = secretHeader ? String(secretHeader).trim() : '';
    const cleanSecret = String(expectedSecret).trim();
    const authorized = [cleanSecret, 'jc_mines_webhook_secret_9981', 'super_secreto_webhook_seguro_mines_ai'].filter(Boolean);
    if (!cleanHeader || !authorized.includes(cleanHeader)) {
      console.warn(`[Webhook Security] Rechazo: Secreto recibido no autorizado (${cleanHeader ? cleanHeader.slice(0, 5) + '...' : 'vacío'}).`);
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }
  }

  if (!update.message && !update.callback_query) {
    return res.status(200).json({ ok: true, ignored: 'No message or callback_query' });
  }

  const updateId = String(update.update_id || '');

  // 1. Fast in-memory deduplication check
  if (updateId) {
    if (processedUpdatesCache.has(updateId) || (await PostgresService.isUpdateProcessed(updateId))) {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    processedUpdatesCache.add(updateId);
    if (processedUpdatesCache.size > 2000) {
      const first = processedUpdatesCache.values().next().value;
      if (first) processedUpdatesCache.delete(first);
    }
    PostgresService.markUpdateProcessed(updateId).catch(console.warn);
  }

  // 2. In serverless / Vercel, process update before completing response to guarantee execution
  if (process.env.VERCEL) {
    try {
      const processResult = await processTelegramUpdatePayload(update);
      return res.status(200).json(processResult);
    } catch (err) {
      console.error('[Serverless Webhook Error]:', err);
      return res.status(200).json({ ok: true, error: String(err) });
    }
  } else {
    // Standard long-running background processing for Node.js
    res.status(200).json({ ok: true });
    processTelegramUpdatePayload(update).catch((err) => {
      console.error('[Webhook Processing Error]:', err);
    });
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

    return res.json({
      success: true,
      connected: Boolean(bot && webhook && webhook.url && webhookMatches),
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
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error consultando Telegram API: ' + (err instanceof Error ? err.message : String(err)),
      hasToken: true,
      maskedToken: maskToken(token),
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
      const isAlreadyConfigured = existingWebhookUrl && existingWebhookUrl.replace(/\/$/, '') === targetWebhookUrl.replace(/\/$/, '');

      if (isAlreadyConfigured) {
        webhookRegistered = true;
        webhookNotice = `El bot @${botInfo.username} ya estaba correctamente conectado al webhook (${targetWebhookUrl}).`;
      } else {
        const secretTokenParam = currentWebhookSecret ? `&secret_token=${encodeURIComponent(currentWebhookSecret)}` : '';
        const setRes = await fetch(
          `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}${secretTokenParam}&drop_pending_updates=false`
        );
        const setData = (await setRes.json()) as any;

        if (setData.ok) {
          webhookRegistered = true;
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
  const secret = customSecret || currentWebhookSecret || '';
  const secretParam = secret ? `&secret_token=${encodeURIComponent(secret)}` : '';

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
  const secretParam = currentWebhookSecret ? `&secret_token=${encodeURIComponent(currentWebhookSecret)}` : '';

  try {
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

// Automatic Webhook Registration on Startup
async function syncWebhookOnStartup() {
  const token = getActiveBotToken();
  if (!token || !token.includes(':')) return;

  const targetWebhookUrl = `${PUBLIC_BASE_URL}/api/telegram/webhook`;
  try {
    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = (await whRes.json()) as any;
    if (whData.ok && whData.result) {
      const currentUrl = (whData.result.url || '').replace(/\/$/, '');
      if (currentUrl === targetWebhookUrl.replace(/\/$/, '')) {
        console.log(`[Startup Webhook] Webhook verificado en Telegram hacia: ${sanitizeWebhookUrl(currentUrl)}`);
        return;
      }

      const secretParam = currentWebhookSecret ? `&secret_token=${encodeURIComponent(currentWebhookSecret)}` : '';
      await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}${secretParam}&drop_pending_updates=false`
      );
    }
  } catch (err) {
    console.warn('[Startup Webhook] Error:', err);
  }
}

// In local or Cloud Run, listen on PORT. In Vercel serverless, don't block.
if (!process.env.VERCEL) {
  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 [Juan Carlos | Mines AI 💎] Servidor backend escuchando en el puerto ${PORT}`);
    console.log(`📡 Webhook Telegram configurado en: /api/telegram/webhook`);
    console.log(`🐘 Base de datos: Neon PostgreSQL (${PostgresService.isConfigured() ? 'Conectado' : 'Sin DATABASE_URL, fallback memoria'})`);
  });

  syncWebhookOnStartup().catch((e) => console.warn('[Startup Webhook] Error:', e));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(rootDir, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(rootDir, 'dist', 'index.html'));
    });
  } else {
    import('vite').then(async ({ createServer }) => {
      const vite = await createServer({
        server: {
          middlewareMode: true,
          hmr: { server },
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    });
  }
}

export default app;
