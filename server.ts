import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distServerPath = path.join(__dirname, 'dist', 'server.js');
const hasBuiltServer = fs.existsSync(distServerPath);
const isUnderTsx = process.execArgv.some((a) => a.includes('tsx')) || process.env.TSX_BOOTSTRAPPED === 'true';

if (hasBuiltServer && process.env.NODE_ENV === 'production') {
  // 1. Production bundle available: execute fast pre-compiled bundle directly in Node
  await import('./dist/server.js');
} else if (!isUnderTsx) {
  // 2. Plain `node server.ts` invocation: automatically spawn with tsx loader
  process.env.TSX_BOOTSTRAPPED = 'true';
  const child = spawn(process.execPath, ['--import', 'tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });

  process.on('SIGTERM', () => child.kill('SIGTERM'));
  process.on('SIGINT', () => child.kill('SIGINT'));
  child.on('exit', (code) => process.exit(code ?? 0));
  await new Promise(() => {}); // Keep parent process alive while child executes
} else {
  // 3. TSX active: load server app directly with on-the-fly TypeScript resolution
  await import('./src/serverApp.ts');
}
