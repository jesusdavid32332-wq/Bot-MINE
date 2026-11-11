import type { IncomingMessage, ServerResponse } from 'http';
import app from '../../dist/server.js';

// Vercel Serverless Function Handler for Telegram Webhook
// POST /api/telegram/webhook
export default function handler(req: any, res: any) {
  // Ensure req.url is properly mapped to /api/telegram/webhook
  const currentUrl = req.url || '/';
  const search = currentUrl.includes('?') ? currentUrl.substring(currentUrl.indexOf('?')) : '';
  req.url = '/api/telegram/webhook' + search;

  // Prevent express.json() from re-reading consumed stream if body was already parsed by Vercel
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    req._body = true;
  }

  return app(req, res);
}
