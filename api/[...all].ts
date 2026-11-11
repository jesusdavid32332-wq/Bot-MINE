import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/serverApp';

// Vercel Serverless Function Handler
// Routes all incoming requests to the Express application backed by Neon PostgreSQL
export default function handler(req: any, res: any) {
  // Normalize req.url to ensure it routes correctly to Express
  if (req.url) {
    const urlObj = new URL(req.url, 'http://localhost');
    let pathname = urlObj.pathname || '/';

    // Handle catch-all parameter if Vercel mapped path to query.all
    if ((!pathname || pathname === '/' || pathname === '/api' || pathname.includes('[...all]')) && req.query?.all) {
      const allParts = Array.isArray(req.query.all) ? req.query.all : [req.query.all];
      pathname = '/' + allParts.join('/');
    }

    // Ensure route begins with /api if it was stripped
    if (!pathname.startsWith('/api/') && pathname !== '/api') {
      pathname = '/api' + (pathname.startsWith('/') ? '' : '/') + pathname;
    }

    req.url = pathname + (urlObj.search || '');
  }

  // If Vercel already parsed the request body, mark _body to avoid body-parser hang
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    req._body = true;
  }

  return app(req, res);
}
