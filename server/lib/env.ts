import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// V Dockeru/Coolify se .env nepoužívá – proměnné jsou injektovány přímo.
// Lokálně načteme server/.env (relativně k tomuto souboru).
const localEnv = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(localEnv)) {
  loadDotenv({ path: localEnv, override: true });
}

// Zajištění izolace tabulek v samostatném schématu "qhub" pro zamezení kolizí u sdílených databází
if (process.env.DATABASE_URL) {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.includes('schema=')) {
    dbUrl += dbUrl.includes('?') ? '&schema=qhub' : '?schema=qhub';
    process.env.DATABASE_URL = dbUrl;
  }
}

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    console.error(`[Q-Hub] Chybí environment proměnná: ${name}. Vytvoř server/.env (viz server/.env.example).`);
    process.exit(1);
  }
  return v;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET', 'qhub-default-jwt-secret-key-super-secure-123-fallback-for-easy-deploy'),
  PORT: process.env.APPLET_ID ? 4000 : (process.env.NODE_ENV === 'production' ? parseInt(process.env.PORT || '4000', 10) : 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_CHECK_SECRET: process.env.DB_CHECK_SECRET || 'qhubsecret',
};
