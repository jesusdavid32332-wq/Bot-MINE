/**
 * Safe text and data sanitization utilities
 * Prevents "Minified React error #31: Objects are not valid as a React child (found: object with keys {code, message})"
 */

import { AutoMessage, TelegramUser, UserConversation } from '../types';

/**
 * Checks if a value is an error object, such as a FirebaseError, Neon/Postgres error,
 * DOMException, or API error payload with { code, message } or { error }.
 */
export function isErrorObject(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  if ('code' in val && 'message' in val) return true;
  if ('error' in val && Object.keys(val).length <= 3) return true;
  if (val instanceof Error) return true;
  return false;
}

/**
 * Safely converts any value into a renderable string.
 * If an object with `{ code, message }` or `{ message }` or an Error is received,
 * it safely extracts the message string instead of allowing React to crash.
 */
export function safeText(val: any, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return isNaN(val) ? fallback : String(val);
  if (typeof val === 'boolean') return String(val);

  if (typeof val === 'object') {
    // If it's an Error instance or object with a message property
    if (typeof val.message === 'string') return val.message;
    // If it's an object with error property
    if (typeof val.error === 'string') return val.error;
    if (val.error && typeof val.error === 'object' && typeof val.error.message === 'string') {
      return val.error.message;
    }
    // If it has code without message
    if ('code' in val && typeof val.code === 'string') {
      return `Error (${val.code})`;
    }
    // Try serializing cleanly or return fallback
    try {
      const serialized = JSON.stringify(val);
      if (serialized === '{}' || serialized === '[]') return fallback;
      return serialized;
    } catch {
      return fallback;
    }
  }

  return String(val);
}

/**
 * Sanitizes a single TelegramUser object, ensuring no property is an unexpected
 * error object that could break JSX rendering.
 */
export function sanitizeUser(u: any): TelegramUser {
  if (!u || typeof u !== 'object') {
    return {
      id: `usr-default`,
      telegramId: '0',
      name: 'Usuario',
      username: '',
      joinDate: new Date().toISOString(),
      country: '',
      currentStep: 'START',
      stage: 'Inicio',
      lastActivity: 'Reciente',
      status: 'active',
      messagesSent: 0,
      messagesReceived: 0,
      consentGiven: false,
      experienceLevel: 'principiante',
      accountStatus: 'pendiente_revision',
    };
  }

  const rawNotes = safeText(u.notes, '');
  const rawAccountId = u.accountId ? safeText(u.accountId, '') : undefined;
  const rawStatus = safeText(u.accountStatus, 'pendiente_revision');

  return {
    ...u,
    id: safeText(u.id, `usr-${safeText(u.telegramId, '0')}`),
    telegramId: safeText(u.telegramId, '0'),
    name: safeText(u.name, 'Usuario Telegram'),
    username: safeText(u.username, ''),
    country: safeText(u.country, ''),
    declaredCountry: u.declaredCountry ? safeText(u.declaredCountry, '') : undefined,
    currentStep: (safeText(u.currentStep, 'START') as any) || 'START',
    stage: safeText(u.stage, 'Inicio'),
    lastActivity: safeText(u.lastActivity, 'Reciente'),
    status: (safeText(u.status, 'active') as any) || 'active',
    messagesSent: typeof u.messagesSent === 'number' ? u.messagesSent : 0,
    messagesReceived: typeof u.messagesReceived === 'number' ? u.messagesReceived : 0,
    consentGiven: Boolean(u.consentGiven),
    experienceLevel: (safeText(u.experienceLevel, 'principiante') as any) || 'principiante',
    accountId: rawAccountId && rawAccountId.trim().length > 0 ? rawAccountId : undefined,
    accountStatus: (rawStatus as any) || 'pendiente_revision',
    notes: rawNotes,
  };
}

export function sanitizeUsers(users: any[]): TelegramUser[] {
  if (!Array.isArray(users)) return [];
  return users
    .filter((u) => u && typeof u === 'object' && !isErrorObject(u))
    .map(sanitizeUser);
}

export function sanitizeConversations(convs: Record<string, any>): Record<string, UserConversation> {
  if (!convs || typeof convs !== 'object' || isErrorObject(convs)) return {};
  const cleaned: Record<string, UserConversation> = {};

  Object.entries(convs).forEach(([uid, conv]) => {
    if (!conv || typeof conv !== 'object' || isErrorObject(conv)) return;
    const messages = Array.isArray(conv.messages)
      ? conv.messages.map((m: any) => ({
          ...m,
          id: safeText(m.id, `msg-${Date.now()}`),
          sender: safeText(m.sender, 'bot') as any,
          text: safeText(m.text, ''),
          timestamp: safeText(m.timestamp, 'Reciente'),
        }))
      : [];

    cleaned[uid] = {
      ...conv,
      userId: safeText(conv.userId, uid),
      status: safeText(conv.status, 'automated') as any,
      lastMessageTime: safeText(conv.lastMessageTime, 'Reciente'),
      currentStep: safeText(conv.currentStep, 'START') as any,
      messages,
    };
  });

  return cleaned;
}
