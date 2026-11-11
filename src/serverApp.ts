import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
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
const rawToken = process.env.TELEGRAM_BOT_TOKEN;
const rawAdmin = process.env.ADMIN_TELEGRAM_ID;

// Defensive detection: if token was accidentally set as ADMIN_TELEGRAM_ID
const TELEGRAM_BOT_TOKEN = rawToken || (rawAdmin?.includes(':') ? rawAdmin : undefined);
const ADMIN_TELEGRAM_ID = rawAdmin && !rawAdmin.includes(':') ? rawAdmin : '684920153';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(express.json());

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
    telegram: {
      webhookEndpoint: '/api/telegram/webhook',
      botConfigured: Boolean(TELEGRAM_BOT_TOKEN),
      webhookSecretConfigured: Boolean(WEBHOOK_SECRET),
      adminConfigured: Boolean(ADMIN_TELEGRAM_ID),
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', firestore: isFirestoreReady, cloudRun: true });
});

// Helper: Telegram Bot API Call
async function sendTelegramMessage(chatId: string | number, text: string, options: any = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log(`[Telegram Simulation] -> Chat ${chatId}: ${text.slice(0, 80)}...`);
    return { ok: true, simulated: true };
  }

  const endpoint = options.photo
    ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
    : options.video
    ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`
    : `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const body: Record<string, any> = {
    chat_id: chatId,
    parse_mode: 'Markdown',
    ...options,
  };

  if (!options.photo && !options.video) {
    body.text = text;
  } else {
    body.caption = text;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Telegram API Error] Fallo al enviar a ${chatId}:`, err);
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

// ==========================================
// 1. TELEGRAM WEBHOOK ENDPOINT
// ==========================================
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  // Validate Webhook Secret Header if configured
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  if (WEBHOOK_SECRET && secretHeader !== WEBHOOK_SECRET) {
    console.warn('[Webhook Security] Petición rechazada: Secreto de webhook inválido o ausente.');
    return res.status(401).json({ error: 'Unauthorized webhook request' });
  }

  const update = req.body;
  if (!update || (!update.message && !update.callback_query)) {
    return res.status(200).json({ ok: true, ignored: 'No message or callback_query' });
  }

  const updateId = String(update.update_id);

  // Deduplication Check
  try {
    const updateDocRef = doc(db, 'processed_updates', updateId);
    const updateSnap = await getDoc(updateDocRef);
    if (updateSnap.exists()) {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    await setDoc(updateDocRef, {
      updateId,
      processedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Firestore] Error comprobando duplicado update_id:', err);
  }

  // Extract Message or Callback Query Details
  const isCallback = Boolean(update.callback_query);
  const msg = isCallback ? update.callback_query.message : update.message;
  const from = isCallback ? update.callback_query.from : update.message?.from;
  const rawText = isCallback ? update.callback_query.data : update.message?.text || '';
  const chatId = msg?.chat?.id || from?.id;

  if (!chatId || !from) {
    return res.status(200).json({ ok: true, ignored: 'Missing chatId or sender' });
  }

  // Acknowledge Telegram immediately to prevent timeout retries
  res.status(200).json({ ok: true });

  // Process asynchronously
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
      customMap
    );

    const updatedUser = result.updatedUser;
    await saveUserProgress(updatedUser);

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
          : `${process.env.APP_URL || ''}${msgToSend.mediaUrl}`;

        if (msgToSend.mediaType === 'video') {
          options.video = fullMediaUrl;
        } else {
          options.photo = fullMediaUrl;
        }
      }

      await sendTelegramMessage(chatId, msgToSend.text, options);
      updatedUser.messagesReceived = (updatedUser.messagesReceived || 0) + 1;

      await recordMessageInConversation(updatedUser.id, {
        id: `b-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        sender: 'bot',
        text: msgToSend.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stepTriggered: msgToSend.stepTriggered || updatedUser.currentStep,
      });

      if (result.messagesToSend.length > 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    await saveUserProgress(updatedUser);
  } catch (procErr) {
    console.error('[Engine Error] Error procesando actualización de Telegram:', procErr);
  }
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

const server = app.listen(PORT, () => {
  console.log(`🚀 [Juan Carlos | Mines AI 💎] Servidor backend escuchando en el puerto ${PORT}`);
  console.log(`📡 Webhook Telegram configurado en: /api/telegram/webhook`);
  console.log(`🔥 Base de datos: Firebase Cloud Firestore (${firebaseConfig.firestoreDatabaseId})`);
});

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
