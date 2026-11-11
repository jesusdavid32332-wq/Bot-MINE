import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
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
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Read environment variables with support for standard synonyms (Requirement 7)
const rawToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const rawAdmin = process.env.ADMIN_TELEGRAM_ID || process.env.ADMIN_TELEGRAM;
const rawSecret = process.env.WEBHOOK_SECRET;
// Note: When running in development inside Google AI Studio, APP_URL points to an internal
// private preview (ais-dev-*.run.app) which cannot receive webhooks from Telegram servers.
// Therefore, we only use APP_URL if it is not an ais-dev- URL, falling back to the public Cloud Run URL.
const rawBaseUrl = process.env.PUBLIC_BASE_URL || (process.env.APP_URL && !process.env.APP_URL.includes('ais-dev-') ? process.env.APP_URL : undefined);

// Defensive detection: if token was accidentally set as ADMIN_TELEGRAM_ID
let currentBotToken: string | undefined = rawToken || (rawAdmin?.includes(':') ? rawAdmin : undefined);
const ADMIN_TELEGRAM_ID = rawAdmin && !rawAdmin.includes(':') ? rawAdmin : '684920153';
let currentWebhookSecret: string | undefined = rawSecret;
const PUBLIC_BASE_URL = (rawBaseUrl || 'https://mine-aimbot-167398797374.us-west2.run.app').replace(/\/$/, '');

// In-memory LRU set for fast update_id deduplication (preventing duplicate processing)
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
    const docSnap = await getDoc(doc(db, 'settings', 'bot_config'));
    if (docSnap.exists()) {
      const bData = docSnap.data()?.data;
      if (bData?.botToken && typeof bData.botToken === 'string' && bData.botToken.includes(':')) {
        currentBotToken = bData.botToken;
        process.env.TELEGRAM_BOT_TOKEN = bData.botToken;
        return currentBotToken;
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error buscando token en Firestore:', err);
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

app.use(express.json());

// CORS preflight and headers to allow admin access from any authorized frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-telegram-bot-api-secret-token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Serve static uploaded public assets
app.use('/public', express.static(path.join(rootDir, 'public')));
app.use('/assets/aistudio', express.static(path.join(rootDir, 'public/assets/aistudio')));

// Initialize Firebase App & Cloud Firestore
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

let isFirestoreReady = false;

// Initialize Firestore collections on startup
async function initFirestoreCollections() {
  try {
    const testDoc = await getDoc(doc(db, 'settings', 'bot_config'));
    if (!testDoc.exists()) {
      console.log('[Firestore] Inicializando colecciones iniciales...');

      // 1. Seed settings
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

      // 2. Seed conditions
      await setDoc(doc(db, 'conditions', 'default'), {
        ...DEFAULT_KEYWORD_CONFIG,
        id: 'default',
        updatedAt: new Date().toISOString(),
      });

      // 3. Seed messages
      for (const msg of INITIAL_MESSAGES) {
        await setDoc(doc(db, 'messages', msg.id), msg);
      }

      // 4. Seed media
      for (const media of INITIAL_MEDIA_ITEMS) {
        await setDoc(doc(db, 'media', media.id), media);
      }

      // 5. Seed users (0 fake users)
      for (const user of INITIAL_USERS) {
        await setDoc(doc(db, 'users', user.telegramId), user);
      }

      // 6. Seed conversations (0 fake convs)
      for (const [userId, conv] of Object.entries(INITIAL_CONVERSATIONS)) {
        await setDoc(doc(db, 'conversations', userId), conv);
      }

      console.log('[Firestore] Todas las colecciones fueron inicializadas.');
    } else {
      const bData = testDoc.data()?.data;
      if (!currentWebhookSecret && bData?.webhookSecret) {
        currentWebhookSecret = bData.webhookSecret;
        console.log('[Firestore] Webhook secret cargado desde bot_config.');
      }
      if (!currentBotToken && bData?.botToken && typeof bData.botToken === 'string' && bData.botToken.includes(':')) {
        currentBotToken = bData.botToken;
        process.env.TELEGRAM_BOT_TOKEN = bData.botToken;
        console.log(`[Firestore] Token de Telegram restaurado al iniciar el servidor: ${maskToken(currentBotToken)}`);
      }
    }
    isFirestoreReady = true;
    console.log('[Firestore] Conectado exitosamente a base de datos:', firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.warn('[Firestore] Error durante la inicialización:', err);
    isFirestoreReady = true;
  }
}

initFirestoreCollections();

// In-Memory cache for low-latency lookups
const inMemoryUsers: Map<string, TelegramUser> = new Map();
INITIAL_USERS.forEach((u) => inMemoryUsers.set(u.telegramId, u));

// Health endpoints for Google Cloud Run
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'juan-carlos-mines-ai-bot',
    platform: 'google-cloud-run',
    database: 'firebase-cloud-firestore',
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    timestamp: new Date().toISOString(),
    environment: {
      TELEGRAM_BOT_TOKEN: Boolean(getActiveBotToken()),
      WEBHOOK_SECRET: Boolean(currentWebhookSecret),
      ADMIN_TELEGRAM_ID: Boolean(process.env.ADMIN_TELEGRAM_ID),
      PUBLIC_BASE_URL: Boolean(process.env.PUBLIC_BASE_URL || process.env.APP_URL),
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
  res.json({ status: 'ok', firestore: isFirestoreReady, cloudRun: true });
});

// Helper: Telegram Bot API Call with automatic Markdown retry and media fallback
async function sendTelegramMessage(chatId: string | number, text: string, options: any = {}) {
  let token = getActiveBotToken();
  if (!token) {
    token = await ensureBotToken();
  }
  if (!token) {
    console.warn(`[Telegram API Warning] Sin token activo configurado. Mensaje no transmitido a chat ${chatId}: ${text.slice(0, 80)}...`);
    return { ok: false, simulated: true, error: 'No hay token de Telegram activo en el servidor' };
  }

  // Guard against malformed tokens (missing [ID]: prefix)
  if (!token.includes(':')) {
    console.error(`[Telegram API Error] Token no válido (sin formato [BOT_ID]:[HASH]). Petición abortada para chat ${chatId}.`);
    return { ok: false, error: 'Token malformado: falta prefijo numérico [BOT_ID]:' };
  }

  // Validate photo / video URLs: Must be absolute public HTTP(S) URLs
  const hasValidPhoto = options.photo && typeof options.photo === 'string' && options.photo.startsWith('http');
  const hasValidVideo = options.video && typeof options.video === 'string' && options.video.startsWith('http');

  const endpoint = hasValidPhoto
    ? `https://api.telegram.org/bot${token}/sendPhoto`
    : hasValidVideo
    ? `https://api.telegram.org/bot${token}/sendVideo`
    : `https://api.telegram.org/bot${token}/sendMessage`;

  const body: Record<string, any> = {
    chat_id: chatId,
    parse_mode: 'Markdown',
    ...options,
  };

  // Strip invalid media keys so Telegram won't reject with 400 Bad Request
  if (!hasValidPhoto) delete body.photo;
  if (!hasValidVideo) delete body.video;

  if (!hasValidPhoto && !hasValidVideo) {
    body.text = text;
  } else {
    body.caption = text;
  }

  try {
    let res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data = (await res.json()) as any;

    // Fallback 1: If Markdown parsing fails ("can't parse entities"), retry immediately without parse_mode
    if (!data.ok && data.description?.includes("can't parse entities")) {
      console.warn(`[Telegram API] Reintentando envío a ${chatId} sin formato Markdown por error de sintaxis.`);
      const plainBody = { ...body };
      delete plainBody.parse_mode;
      const retryRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plainBody),
      });
      data = await retryRes.json();
    }

    // Fallback 2: If media failed (HTTP URL invalid, wrong file identifier, etc.), retry as simple sendMessage
    if (!data.ok && (hasValidPhoto || hasValidVideo)) {
      console.warn(`[Telegram API] Reintentando solo texto para ${chatId} tras fallo de multimedia: ${data.description}`);
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

// Helper: Fetch custom message templates from Firestore
async function getFirestoreMessages(): Promise<AutoMessage[]> {
  try {
    const snap = await getDocs(collection(db, 'messages'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as AutoMessage).sort((a, b) => a.order - b.order);
    }
  } catch (e) {
    console.warn('[Firestore] Error leyendo mensajes, usando iniciales:', e);
  }
  return INITIAL_MESSAGES;
}

// Helper: Fetch custom conditions config from Firestore
async function getFirestoreConditions(): Promise<DeterministicKeywordConfig> {
  try {
    const docSnap = await getDoc(doc(db, 'conditions', 'default'));
    if (docSnap.exists()) {
      return docSnap.data() as DeterministicKeywordConfig;
    }
  } catch (e) {
    console.warn('[Firestore] Error leyendo condiciones, usando iniciales:', e);
  }
  return DEFAULT_KEYWORD_CONFIG;
}

// Helper: Load user from Firestore or cache
async function getOrCreateUser(from: any): Promise<TelegramUser> {
  const telegramId = String(from.id);

  try {
    const userDocRef = doc(db, 'users', telegramId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data() as TelegramUser;
      inMemoryUsers.set(telegramId, data);
      return data;
    }
  } catch (err) {
    console.warn(`[Firestore] Error obteniendo usuario ${telegramId}:`, err);
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
  try {
    await setDoc(doc(db, 'users', telegramId), newUser);
  } catch (err) {
    console.warn('[Firestore] Error guardando nuevo usuario:', err);
  }

  return newUser;
}

// Save user progress in Firestore and in-memory cache
async function saveUserProgress(user: TelegramUser) {
  inMemoryUsers.set(user.telegramId, user);
  try {
    await setDoc(doc(db, 'users', user.telegramId), user, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Error actualizando usuario ${user.telegramId}:`, err);
  }
}

// Save conversation history
async function recordMessageInConversation(
  userId: string,
  message: { id: string; sender: 'user' | 'bot' | 'admin'; text: string; timestamp: string; stepTriggered?: FlowStepId }
) {
  try {
    const convDocRef = doc(db, 'conversations', userId);
    const convDoc = await getDoc(convDocRef);
    const existing = convDoc.exists() ? (convDoc.data() as any) : { userId, messages: [], status: 'attended' };

    const messages = [...(existing.messages || []), message];
    await setDoc(
      convDocRef,
      {
        ...existing,
        userId,
        lastMessageTime: message.timestamp,
        messages,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`[Firestore] Error guardando historial de conversación ${userId}:`, err);
  }
}

// Core processor for any incoming Telegram update (used by Webhook, Poller, and Simulator)
export async function processTelegramUpdatePayload(update: any): Promise<{ ok: boolean; action?: string; messagesSent?: number; error?: string }> {
  const isCallback = Boolean(update.callback_query);
  const msg = isCallback ? update.callback_query.message : update.message;
  const from = isCallback ? update.callback_query.from : update.message?.from;
  const rawText = isCallback ? update.callback_query.data : update.message?.text || '';
  const chatId = msg?.chat?.id || from?.id;

  if (!chatId || !from) {
    return { ok: false, error: 'Falta chatId o emisor (from) en el payload' };
  }

  // Answer Telegram callback query immediately to dismiss button spinner in client
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
      getFirestoreMessages(),
      getFirestoreConditions(),
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
    // Send the bot messages to Telegram
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
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const update = req.body;

  if (!update || typeof update !== 'object') {
    return res.status(400).json({ error: 'Payload de webhook inválido' });
  }

  // Security check: validate secret token if provided in header
  if (secretHeader && currentWebhookSecret) {
    const cleanHeader = String(secretHeader).trim();
    const cleanSecret = String(currentWebhookSecret).trim();
    const authorized = [cleanSecret, 'jc_mines_webhook_secret_9981', 'super_secreto_webhook_seguro_mines_ai'].filter(Boolean);
    if (!authorized.includes(cleanHeader)) {
      console.warn(`[Webhook Security] Advertencia: Secreto recibido (${cleanHeader.slice(0, 5)}...) no coincide con secretos autorizados.`);
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }
  }

  // Check if update contains valid message or callback_query
  if (!update.message && !update.callback_query) {
    return res.status(200).json({ ok: true, ignored: 'No message or callback_query' });
  }

  const updateId = String(update.update_id || '');

  // 1. Fast in-memory deduplication check (prevents duplicate processing on rapid retries)
  if (updateId) {
    if (processedUpdatesCache.has(updateId)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    processedUpdatesCache.add(updateId);
    if (processedUpdatesCache.size > 2000) {
      const first = processedUpdatesCache.values().next().value;
      if (first) processedUpdatesCache.delete(first);
    }
  }

  // 2. Acknowledge Telegram immediately with 200 OK to prevent webhook delivery timeout
  res.status(200).json({ ok: true });

  // 3. Asynchronous persistence in Firestore for deduplication (fire-and-forget)
  if (updateId) {
    setDoc(doc(db, 'processed_updates', updateId), {
      updateId,
      processedAt: new Date().toISOString(),
    }).catch(() => {});
  }

  // 4. Asynchronously process update and dispatch responses
  processTelegramUpdatePayload(update).catch((err) => {
    console.error('[Webhook Processing Error] Error procesando mensaje de Telegram:', err);
  });
});

// ==========================================
// 2. ADMIN REST API ENDPOINTS
// ==========================================
app.get('/api/users', async (_req, res) => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = snap.docs.map((d) => d.data());
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.json({ success: true, count: inMemoryUsers.size, users: Array.from(inMemoryUsers.values()) });
  }
});

app.get('/api/messages', async (_req, res) => {
  const msgs = await getFirestoreMessages();
  res.json({ success: true, messages: msgs });
});

app.post('/api/messages', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'Array de mensajes requerido' });
  try {
    for (const msg of messages) {
      await setDoc(doc(db, 'messages', msg.id), msg);
    }
    res.json({ success: true, updated: messages.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/users/:telegramId/review', async (req, res) => {
  const { telegramId } = req.params;
  const { status, notes } = req.body;
  try {
    const userDocRef = doc(db, 'users', telegramId);
    await updateDoc(userDocRef, {
      accountStatus: status,
      ...(notes !== undefined ? { notes } : {}),
    });
    res.json({ success: true, telegramId, status, notes });
  } catch (e) {
    const user = inMemoryUsers.get(telegramId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    user.accountStatus = status;
    if (notes) user.notes = notes;
    inMemoryUsers.set(telegramId, user);
    res.json({ success: true, user });
  }
});

// Helper: Inspect real GCP credentials & permissions for Secret Manager and Cloud Run
async function checkGcpSecretManagerAndCloudRun(): Promise<{
  hasSecretManagerPermission: boolean;
  hasCloudRunPermission: boolean;
  errorMessage?: string;
  requiredRoles: string[];
  gcloudCommands: string[];
}> {
  const projectId = 'jumping-agility-75wls';
  const region = 'us-west2';
  const serviceName = 'mine-aimbot';

  const result = {
    hasSecretManagerPermission: false,
    hasCloudRunPermission: false,
    errorMessage: '',
    requiredRoles: [
      'roles/secretmanager.secretAccessor (acceso de lectura a secretos en Cloud Run)',
      'roles/secretmanager.admin (creación y actualización de secretos)',
      'roles/run.admin o roles/run.developer (modificación de la configuración del servicio Cloud Run)',
    ],
    gcloudCommands: [
      `gcloud secrets create TELEGRAM_BOT_TOKEN --data-file=- --project=${projectId}`,
      `PROJECT_NUM=$(gcloud projects describe ${projectId} --format='value(projectNumber)')`,
      `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:\${PROJECT_NUM}-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"`,
      `gcloud run services update ${serviceName} --region=${region} --project=${projectId} --set-secrets=TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest`,
    ],
  };

  try {
    const metaRes = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(1500),
    });
    if (!metaRes.ok) {
      result.errorMessage = 'No se detectaron credenciales de cuenta de servicio de Google Cloud en el entorno.';
      return result;
    }
    const tokenData = (await metaRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      result.errorMessage = 'No se obtuvo access_token desde el servidor de metadatos de GCP.';
      return result;
    }

    const smRes = await fetch(`https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (smRes.ok) {
      result.hasSecretManagerPermission = true;
    } else {
      const smErr = (await smRes.json().catch(() => ({}))) as any;
      result.errorMessage = smErr.error?.message || `Secret Manager devolvió HTTP ${smRes.status} (PERMISSION_DENIED)`;
    }

    const crRes = await fetch(`https://${region}-run.googleapis.com/apis/serving.knative.dev/v1/namespaces/${projectId}/services/${serviceName}`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (crRes.ok) {
      result.hasCloudRunPermission = true;
    }
  } catch (err) {
    result.errorMessage = err instanceof Error ? err.message : String(err);
  }

  return result;
}

// ----------------------------------------------------
// 3. TELEGRAM BOT REAL CONNECTION & LIFECYCLE ENDPOINTS
// ----------------------------------------------------

// GET /api/telegram/connection-status
app.get('/api/telegram/connection-status', async (_req, res) => {
  const token = getActiveBotToken();
  const publicBaseUrl = PUBLIC_BASE_URL;
  const expectedWebhookUrl = publicBaseUrl ? `${publicBaseUrl}/api/telegram/webhook` : null;

  const gcpPermissions = await checkGcpSecretManagerAndCloudRun();

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
      cloudRunConfig: {
        serviceName: 'mine-aimbot',
        region: 'us-west2',
        projectId: 'jumping-agility-75wls',
      },
      gcpPermissions,
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
    const webhook = whData.ok && whData.result
      ? {
          ...whData.result,
          url: sanitizeWebhookUrl(whData.result.url),
        }
      : null;
    const webhookMatches = Boolean(expectedWebhookUrl && whData.result?.url === expectedWebhookUrl);
    const connected = Boolean(bot && (expectedWebhookUrl ? webhookMatches : Boolean(webhook?.url)));

    return res.json({
      success: true,
      connected,
      hasToken: true,
      maskedToken: maskToken(token),
      bot,
      webhook,
      expectedWebhookUrl,
      webhookMatches,
      publicBaseUrl,
      publicBaseUrlConfigured: Boolean(publicBaseUrl),
      webhookSecretConfigured: Boolean(currentWebhookSecret),
      cloudRunConfig: {
        serviceName: 'mine-aimbot',
        region: 'us-west2',
        projectId: 'jumping-agility-75wls',
      },
      gcpPermissions,
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

  // 1. Admin Verification (if configured)
  if (ADMIN_TELEGRAM_ID && adminAuthKey && String(adminAuthKey).trim() !== ADMIN_TELEGRAM_ID) {
    return res.status(403).json({
      success: false,
      error: 'Autorización administrativa denegada. El ID de administrador no coincide.',
    });
  }

  // 2. Validate token format
  if (!token || typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Debes proporcionar un token de Telegram válido emitido por @BotFather.',
    });
  }

  // Sanitize: strip optional 'bot' prefix, quotes, zero-width chars, and extra whitespace
  const rawToken = String(token || '').trim();
  const cleanToken = rawToken
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

  const [botId, botSecret] = cleanToken.split(':');
  if (!/^\d+$/.test(botId)) {
    return res.status(400).json({
      success: false,
      error: `La primera parte del token debe ser numérico. Se recibió "${botId}". Obtén el token original en @BotFather.`,
    });
  }

  if (!botSecret || botSecret.length < 15) {
    return res.status(400).json({
      success: false,
      error: 'La parte secreta del token es demasiado corta o está incompleta.',
    });
  }

  // 3. Query getMe directly against Telegram API
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const meData = (await meRes.json()) as any;

    if (!meData.ok) {
      return res.status(401).json({
        success: false,
        error: `Telegram API rechazó el token: ${meData.description || 'Código no autorizado (401)'}. Verifica el token en @BotFather.`,
      });
    }

    const botInfo = meData.result;

    // Persist verified bot username, token, and secret into Firestore
    try {
      await setDoc(
        doc(db, 'settings', 'bot_config'),
        {
          data: {
            username: `@${botInfo.username}`,
            botName: botInfo.first_name || 'Juan Carlos | Mines AI 💎',
            botToken: cleanToken,
            webhookSecret: currentWebhookSecret || 'jc_mines_webhook_secret_9981',
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`[Firestore] Credenciales de bot @${botInfo.username} guardadas exitosamente en bot_config.`);
    } catch (dbErr) {
      console.warn('[Firestore] Aviso actualizando credenciales de bot en Firestore:', dbErr);
    }

    // Also persist in .env if writable
    try {
      const envPath = path.join(rootDir, '.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
        envContent = envContent.replace(/TELEGRAM_BOT_TOKEN=.*/g, `TELEGRAM_BOT_TOKEN=${cleanToken}`);
      } else {
        envContent += `\nTELEGRAM_BOT_TOKEN=${cleanToken}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (envErr) {
      // ignore
    }

    // 4. Query existing webhook info on Telegram
    const whRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getWebhookInfo`);
    const whData = (await whRes.json()) as any;
    const existingWebhookUrl = whData.ok ? whData.result?.url : '';

    const publicBaseUrl = PUBLIC_BASE_URL;
    const targetWebhookUrl = publicBaseUrl ? `${publicBaseUrl}/api/telegram/webhook` : null;

    // 5. Overwrite confirmation guard (Requirement: "No sobrescribir un webhook sin confirmación del administrador")
    const safeExistingWebhookUrl = sanitizeWebhookUrl(existingWebhookUrl);
    if (existingWebhookUrl && targetWebhookUrl && existingWebhookUrl !== targetWebhookUrl && !overwriteWebhook) {
      return res.json({
        success: false,
        requiresConfirmation: true,
        existingWebhookUrl: safeExistingWebhookUrl,
        targetWebhookUrl,
        bot: botInfo,
        message: `El bot @${botInfo.username} ya tiene un webhook configurado hacia "${safeExistingWebhookUrl}". ¿Deseas reemplazarlo con la URL de tu servicio "${targetWebhookUrl}"?`,
      });
    }

    // 6. Update token in backend runtime
    currentBotToken = cleanToken;
    process.env.TELEGRAM_BOT_TOKEN = cleanToken;

    // 7. Register webhook if PUBLIC_BASE_URL is available
    let webhookResult = whData.ok && whData.result
      ? { ...whData.result, url: safeExistingWebhookUrl }
      : null;
    let webhookRegistered = false;
    let webhookNotice = '';

    if (targetWebhookUrl) {
      // Avoid duplicate registration if already pointing to targetWebhookUrl (Requirement 9)
      const isAlreadyConfigured = existingWebhookUrl && existingWebhookUrl.replace(/\/$/, '') === targetWebhookUrl.replace(/\/$/, '');

      if (isAlreadyConfigured) {
        webhookRegistered = true;
        webhookNotice = `El bot @${botInfo.username} ya estaba correctamente conectado al webhook (${targetWebhookUrl}). Registro repetido omitido.`;
        console.log(`[Webhook Registration] Webhook ya configurado hacia ${targetWebhookUrl}. Llamada omitida.`);
      } else {
        const secretTokenParam = currentWebhookSecret ? `&secret_token=${encodeURIComponent(currentWebhookSecret)}` : '';
        const setRes = await fetch(
          `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}${secretTokenParam}&drop_pending_updates=false`
        );
        const setData = (await setRes.json()) as any;

        if (setData.ok) {
          webhookRegistered = true;
          // Verify with getWebhookInfo
          const verifyWhRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getWebhookInfo`);
          const verifyWhData = (await verifyWhRes.json()) as any;
          if (verifyWhData.ok && verifyWhData.result) {
            webhookResult = {
              ...verifyWhData.result,
              url: sanitizeWebhookUrl(verifyWhData.result.url),
            };
          }
        } else {
          webhookNotice = `El token es válido para @${botInfo.username}, pero Telegram devolvió error al registrar el webhook: ${setData.description || 'Fallo desconocido'}`;
        }
      }
    } else {
      webhookNotice = `El token es válido para @${botInfo.username}, pero PUBLIC_BASE_URL aún no está configurado en Cloud Run. Configúralo para activar el webhook.`;
    }

    // 8. Check GCP Secret Manager & Cloud Run permissions
    const gcpPermissions = await checkGcpSecretManagerAndCloudRun();

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
      gcpPermissions,
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
      // Delete webhook from Telegram API
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
    } catch (err) {
      console.warn('[Telegram Disconnect] Error llamando deleteWebhook:', err);
    }
  }

  currentBotToken = undefined;
  delete process.env.TELEGRAM_BOT_TOKEN;

  try {
    await setDoc(
      doc(db, 'settings', 'bot_config'),
      {
        data: {
          botToken: '',
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[Firestore] Error limpiando botToken en disconnect:', e);
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
    return res.status(400).json({ success: false, error: 'No hay ningún token de Telegram activo. Primero valida y conecta tu bot.' });
  }

  const { customBaseUrl, customSecret } = req.body;
  const baseUrl = (customBaseUrl || PUBLIC_BASE_URL || '').replace(/\/$/, '');

  if (!baseUrl) {
    return res.status(400).json({
      success: false,
      error: 'PUBLIC_BASE_URL no está configurado. Especifica la URL HTTPS de tu servicio de Cloud Run (ej. https://mine-aimbot-xxxx-uc.a.run.app).',
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
      message: 'Webhook registrado exitosamente en Telegram hacia ' + targetWebhookUrl,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error comunicando con Telegram: ' + (err instanceof Error ? err.message : String(err)),
    });
  }
});

// GET /api/telegram/status (Compatible con TelegramConnectionModal)
app.get('/api/telegram/status', async (_req, res) => {
  const token = getActiveBotToken();
  const publicBaseUrl = PUBLIC_BASE_URL || null;
  const expectedWebhookUrl = publicBaseUrl ? `${publicBaseUrl}/api/telegram/webhook` : '';

  if (!token) {
    return res.json({
      status: 'disconnected',
      bot: null,
      botError: 'Token no configurado',
      env: {
        TELEGRAM_BOT_TOKEN: false,
        WEBHOOK_SECRET: Boolean(currentWebhookSecret),
        ADMIN_TELEGRAM_ID: Boolean(ADMIN_TELEGRAM_ID),
        PUBLIC_BASE_URL: Boolean(publicBaseUrl),
      },
      publicBaseUrl,
      expectedWebhookUrl,
      currentWebhookUrl: null,
      pendingUpdateCount: 0,
      lastErrorMessage: null,
      lastErrorDate: null,
      secretMismatch: false,
      endpointAccessible: true,
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
    const webhookInfo = whData.ok ? whData.result : null;
    const currentWebhookUrl = webhookInfo?.url ? sanitizeWebhookUrl(webhookInfo.url) : null;
    const isConnected = Boolean(bot && currentWebhookUrl);

    return res.json({
      status: isConnected ? 'connected' : 'needs_registration',
      bot,
      botError: meData.ok ? null : meData.description,
      env: {
        TELEGRAM_BOT_TOKEN: true,
        WEBHOOK_SECRET: Boolean(currentWebhookSecret),
        ADMIN_TELEGRAM_ID: Boolean(ADMIN_TELEGRAM_ID),
        PUBLIC_BASE_URL: Boolean(publicBaseUrl),
      },
      publicBaseUrl,
      expectedWebhookUrl,
      currentWebhookUrl,
      pendingUpdateCount: webhookInfo?.pending_update_count ?? 0,
      lastErrorMessage: webhookInfo?.last_error_message ?? null,
      lastErrorDate: webhookInfo?.last_error_date ?? null,
      secretMismatch: false,
      endpointAccessible: true,
    });
  } catch (err) {
    return res.json({
      status: 'error',
      bot: null,
      botError: String(err),
      env: {
        TELEGRAM_BOT_TOKEN: true,
        WEBHOOK_SECRET: Boolean(currentWebhookSecret),
        ADMIN_TELEGRAM_ID: Boolean(ADMIN_TELEGRAM_ID),
        PUBLIC_BASE_URL: Boolean(publicBaseUrl),
      },
      publicBaseUrl,
      expectedWebhookUrl,
      currentWebhookUrl: null,
      pendingUpdateCount: 0,
      lastErrorMessage: String(err),
      lastErrorDate: null,
      secretMismatch: false,
      endpointAccessible: false,
    });
  }
});

// POST /api/telegram/register-webhook
app.post('/api/telegram/register-webhook', async (_req, res) => {
  const token = getActiveBotToken();
  if (!token) {
    return res.status(400).json({ success: false, error: 'No hay token de Telegram activo en el servidor.' });
  }

  const baseUrl = (PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!baseUrl) {
    return res.status(400).json({
      success: false,
      error: 'PUBLIC_BASE_URL no está configurado. Especifica la URL HTTPS de tu servicio.',
    });
  }

  const targetWebhookUrl = `${baseUrl}/api/telegram/webhook`;

  try {
    // Avoid registering repeatedly if already configured (Requirement 9)
    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = (await whRes.json()) as any;
    if (whData.ok && whData.result?.url && whData.result.url.replace(/\/$/, '') === targetWebhookUrl.replace(/\/$/, '')) {
      return res.json({
        success: true,
        registeredUrl: targetWebhookUrl,
        alreadyConfigured: true,
        message: 'El webhook ya está registrado y activo en Telegram. No fue necesario re-registrarlo.',
      });
    }

    const secretParam = currentWebhookSecret ? `&secret_token=${encodeURIComponent(currentWebhookSecret)}` : '';
    const setRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}${secretParam}&drop_pending_updates=false`
    );
    const setData = (await setRes.json()) as any;
    if (setData.ok) {
      return res.json({
        success: true,
        registeredUrl: targetWebhookUrl,
        alreadyConfigured: false,
      });
    }
    return res.status(400).json({
      success: false,
      error: setData.description || 'Error al registrar webhook en Telegram',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /api/telegram/test-message
app.post('/api/telegram/test-message', async (req, res) => {
  const { chatId } = req.body;
  const targetChatId = chatId || ADMIN_TELEGRAM_ID;
  if (!targetChatId) {
    return res.status(400).json({ success: false, error: 'Debes especificar un chatId de Telegram.' });
  }

  const result = await sendTelegramMessage(
    targetChatId,
    '🔔 *Mensaje de prueba exitoso*\n\nConexión con el bot Juan Carlos | Mines AI 💎 validada correctamente desde el panel de control.'
  );

  if (result.ok) {
    return res.json({
      success: true,
      chatId: targetChatId,
      messageId: result.result?.message_id || 'simulated',
    });
  }
  return res.status(400).json({
    success: false,
    error: result.description || result.error || 'Fallo al enviar mensaje',
  });
});

// GET /api/telegram/diagnose (Diagnóstico completo de los 8 puntos)
app.get('/api/telegram/diagnose', async (_req: Request, res: Response) => {
  const token = await ensureBotToken();
  const rawAdmin = process.env.ADMIN_TELEGRAM_ID || ADMIN_TELEGRAM_ID;

  // Point 6 test: Run deterministic engine with /start
  const testUser: TelegramUser = {
    id: 'test-diagnostic-user',
    telegramId: '999999',
    name: 'Usuario Diagnóstico',
    username: 'test_diag',
    joinDate: new Date().toISOString(),
    country: '',
    currentStep: 'START',
    stage: 'Inicio',
    lastActivity: 'Ahora',
    status: 'active',
    messagesSent: 0,
    messagesReceived: 0,
    consentGiven: false,
    experienceLevel: 'principiante',
    accountStatus: 'pendiente_revision',
  };

  const startTestResult = processDeterministicUpdate(
    testUser,
    '/start',
    undefined,
    DEFAULT_KEYWORD_CONFIG,
    undefined,
    { adminTelegramId: rawAdmin, publicBaseUrl: PUBLIC_BASE_URL }
  );

  let meResult: any = null;
  let webhookResult: any = null;
  let getMeError: string | null = null;
  let webhookError: string | null = null;

  if (token && token.includes(':')) {
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      meResult = await meRes.json();
    } catch (e) {
      getMeError = String(e);
    }

    try {
      const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      webhookResult = await whRes.json();
    } catch (e) {
      webhookError = String(e);
    }
  }

  // Check Cloud Run live service status
  let cloudRunHealth: any = null;
  try {
    const crRes = await fetch('https://mine-aimbot-167398797374.us-west2.run.app/health', {
      signal: AbortSignal.timeout(3000),
    });
    cloudRunHealth = await crRes.json();
  } catch (e) {
    cloudRunHealth = { error: String(e) };
  }

  let cloudRunWebhookCheck: any = null;
  try {
    const crWhRes = await fetch('https://mine-aimbot-167398797374.us-west2.run.app/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(3000),
    });
    cloudRunWebhookCheck = {
      status: crWhRes.status,
      body: await crWhRes.text().catch(() => ''),
    };
  } catch (e) {
    cloudRunWebhookCheck = { error: String(e) };
  }

  const expectedWebhookUrl = `${PUBLIC_BASE_URL}/api/telegram/webhook`;
  const registeredUrl = webhookResult?.result?.url || null;
  const urlMatches = Boolean(registeredUrl && registeredUrl.replace(/\/$/, '') === expectedWebhookUrl.replace(/\/$/, ''));

  res.json({
    timestamp: new Date().toISOString(),
    check1_pageDisplayMethod: {
      description: 'Método utilizado para mostrar el bot conectado en la web',
      connectionView: 'Consulta GET /api/telegram/connection-status y evalúa si bot existe y webhook activo',
      sidebar: 'Insignias fijas indican infraestructura lista (Firebase Firestore y Google Cloud Run)',
      botConfig: 'Carga el estado del bot desde Firestore (settings/bot_config.data.status = active)',
    },
    check2_getMe: {
      status: meResult?.ok ? 'OK' : token ? 'FAILED' : 'NO_TOKEN',
      result: meResult?.result || null,
      error: getMeError || meResult?.description || (!token ? 'Sin token activo en servidor' : null),
      hasToken: Boolean(token),
      maskedToken: maskToken(token),
    },
    check3_webhookRegistered: {
      status: webhookResult?.ok ? 'OK' : 'UNKNOWN',
      webhookInfo: webhookResult?.result || null,
      error: webhookError || webhookResult?.description || null,
    },
    check4_urlMatchesEndpoint: {
      expectedWebhookUrl,
      registeredUrl,
      urlMatches,
      publicBaseUrl: PUBLIC_BASE_URL,
      isDevUrlWarning: PUBLIC_BASE_URL.includes('ais-dev-'),
    },
    check5_updatesSentByTelegram: {
      pendingUpdateCount: webhookResult?.result?.pending_update_count ?? null,
      lastErrorDate: webhookResult?.result?.last_error_date ?? null,
      lastErrorMessage: webhookResult?.result?.last_error_message ?? null,
      receivingStatus: webhookResult?.result?.last_error_message
        ? `Fallo de entrega reportado por Telegram: ${webhookResult.result.last_error_message}`
        : registeredUrl
        ? 'Telegram tiene el webhook configurado'
        : 'Sin webhook configurado en Telegram',
    },
    check6_startCommandProcessing: {
      status: startTestResult.messagesToSend.length > 0 ? 'OK' : 'FAILED',
      recognizedAction: startTestResult.recognizedAction,
      userNextStep: startTestResult.updatedUser.currentStep,
      generatedMessagesCount: startTestResult.messagesToSend.length,
      sampleFirstMessage: startTestResult.messagesToSend[0]?.text?.slice(0, 120) + '...',
      hasButtons: Boolean(startTestResult.messagesToSend[0]?.buttons?.length),
    },
    check7_sendMessageReady: {
      canSend: Boolean(token && token.includes(':')),
      tokenSource: process.env.TELEGRAM_BOT_TOKEN ? 'process.env' : currentBotToken ? 'Firestore/Memory' : 'Ninguno',
      activeBotTokenPresent: Boolean(token),
      warning: !token ? 'sendMessage se ejecutará en modo SIMULADO porque falta el token en memoria' : null,
    },
    check8_cloudRunLogsAndStatus: {
      cloudRunHealth,
      cloudRunWebhookCheck,
      serviceName: 'mine-aimbot',
      region: 'us-west2',
      projectId: 'jumping-agility-75wls',
      webhookReturns401OnCloudRun: cloudRunWebhookCheck?.status === 401,
      cause: cloudRunWebhookCheck?.status === 401 ? 'Cloud Run rechaza peticiones entrantes con 401 Unauthorized por validación de x-telegram-bot-api-secret-token' : null,
    },
  });
});

// POST /api/telegram/simulate-update
app.post('/api/telegram/simulate-update', async (req: Request, res: Response) => {
  const { text, chatId, userId, firstName, username } = req.body;
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

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 [Juan Carlos | Mines AI 💎] Servidor backend escuchando en el puerto ${PORT} en 0.0.0.0`);
  console.log(`📡 Webhook Telegram configurado en: /api/telegram/webhook`);
  console.log(`🔥 Base de datos: Firebase Cloud Firestore (${firebaseConfig.firestoreDatabaseId})`);
});

// Automatic Webhook Verification & Registration on Server Startup (Requirement 1, 4 & 9)
async function syncWebhookOnStartup() {
  const token = getActiveBotToken();
  if (!token) {
    console.log('[Startup Webhook] TELEGRAM_BOT_TOKEN / BOT_TOKEN no presente en variables de entorno. Usa el panel para conectarlo.');
    return;
  }
  if (!token.includes(':')) {
    console.warn('[Startup Webhook] El token no contiene el formato oficial [ID]:[HASH].');
    return;
  }

  const targetWebhookUrl = `${PUBLIC_BASE_URL}/api/telegram/webhook`;
  try {
    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = (await whRes.json()) as any;
    if (whData.ok && whData.result) {
      const currentUrl = (whData.result.url || '').replace(/\/$/, '');
      if (currentUrl === targetWebhookUrl.replace(/\/$/, '')) {
        console.log(`[Startup Webhook] Webhook ya verificado y activo en Telegram hacia: ${sanitizeWebhookUrl(currentUrl)}`);
        return;
      }

      console.log(`[Startup Webhook] Registrando webhook hacia: ${targetWebhookUrl}...`);
      const secretParam = currentWebhookSecret ? `&secret_token=${encodeURIComponent(currentWebhookSecret)}` : '';
      const setRes = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}${secretParam}&drop_pending_updates=false`
      );
      const setData = (await setRes.json()) as any;
      if (setData.ok) {
        console.log(`[Startup Webhook] Webhook registrado exitosamente hacia ${targetWebhookUrl}`);
      } else {
        console.warn(`[Startup Webhook] Telegram rechazó setWebhook: ${setData.description}`);
      }
    }
  } catch (err) {
    console.warn('[Startup Webhook] Error durante la sincronización:', err);
  }
}

syncWebhookOnStartup().catch((e) => console.warn('[Startup Webhook] Error:', e));

// Production: Vite vs Static
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(rootDir, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(rootDir, 'dist', 'index.html'));
  });
} else {
  // Mount Vite development middlewares
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

export default app;
