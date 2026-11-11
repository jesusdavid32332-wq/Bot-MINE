import type { IncomingMessage, ServerResponse } from 'http';
import app from '../../src/serverApp';

// Vercel Serverless Function Handler for Telegram Webhook
// POST /api/telegram/webhook
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as any)(req, res);
}
