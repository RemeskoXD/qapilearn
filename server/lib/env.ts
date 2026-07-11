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

// Zajištění izolace tabulek v samostatném schématu "qhub" a konfigurace spojení pro stabilitu u vzdálených DB
if (process.env.DATABASE_URL) {
  let dbUrl = process.env.DATABASE_URL;
  try {
    const parsedUrl = new URL(dbUrl);
    // Nastavíme schema=qhub, pokud není nastaveno
    if (!parsedUrl.searchParams.has('schema')) {
      parsedUrl.searchParams.set('schema', 'public');
    }
    // Omezíme connection_limit, aby nedocházelo k vyčerpání spojení, ale 3 je příliš málo pro paralelní requesty při načítání. Zvýšeno na 15.
    if (!parsedUrl.searchParams.has('connection_limit')) {
      parsedUrl.searchParams.set('connection_limit', '15');
    }
    // Nastavíme timeouty pro předcházení pádům a dlouhým visícím požadavkům
    if (!parsedUrl.searchParams.has('pool_timeout')) {
      parsedUrl.searchParams.set('pool_timeout', '30');
    }
    if (!parsedUrl.searchParams.has('connect_timeout')) {
      parsedUrl.searchParams.set('connect_timeout', '30');
    }
    process.env.DATABASE_URL = parsedUrl.toString();
  } catch (e) {
    if (!dbUrl.includes('schema=')) {
      dbUrl += dbUrl.includes('?') ? '&schema=public' : '?schema=public';
    }
    if (!dbUrl.includes('connection_limit=')) {
      dbUrl += `&connection_limit=3`;
    }
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
  PORT: (process.env.APP_MODE === 'dev' || process.argv.includes('watch')) ? 4000 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_CHECK_SECRET: process.env.DB_CHECK_SECRET || 'qhubsecret',
};
