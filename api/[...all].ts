import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/serverApp';

// Vercel Serverless Function Handler
// Routes all incoming requests to the Express application backed by Neon PostgreSQL
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as any)(req, res);
}
