import { env } from './lib/env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { prisma } from './prisma.js';
import { crudRouter } from './lib/crud.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import settingsRouter from './routes/settings.js';
import bookingsRouter from './routes/bookings.js';
import ticketsRouter from './routes/tickets.js';
import submissionsRouter from './routes/submissions.js';
import eventsRouter from './routes/events.js';
import sessionsRouter from './routes/sessions.js';
import levelsRouter from './routes/levels.js';
import dbCheckRouter from './routes/db_check.js';
import caflouRouter from './routes/caflou.js';
import { ensureSeeded } from './lib/autoSeed.js';

const app = express();

// V produkci běží frontend ze stejného originu (servíruje ho Express),
// takže CORS potřebujeme jen pro dev (Vite na jiném portu).
app.use(
  cors({
    origin: (origin, cb) => {
      // bez Origin hlavičky (např. curl, same-origin v prod) -> povolit
      if (!origin) return cb(null, true);
      
      const isAllowed = 
        origin === env.CLIENT_ORIGIN ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.endsWith('.run.app') ||
        /\.run\.app$/.test(origin) ||
        origin.includes('run.app') ||
        env.NODE_ENV === 'production';

      if (isAllowed) {
        return cb(null, true);
      }
      
      console.warn(`[Q-Hub] CORS blocked origin: ${origin}`);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

// Express je za reverse proxy (Coolify / Traefik) – nutné pro secure cookies.
app.set('trust proxy', 1);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'qhub-api' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/levels', levelsRouter);
app.use('/api/db-check', dbCheckRouter);
app.use(caflouRouter);

// Generické CRUD endpointy
app.use('/api/courses', crudRouter(prisma.qhubCourse as any));
app.use('/api/quizzes', crudRouter(prisma.qhubQuiz as any));
app.use('/api/mentors', crudRouter(prisma.qhubMentor as any));
app.use('/api/ebooks', crudRouter(prisma.qhubEbook as any));
app.use('/api/streams', crudRouter(prisma.qhubStream as any, {
  sanitize: (b: any) => ({ ...b, date: b.date ? new Date(b.date) : new Date() }),
}));
app.use('/api/artifacts', crudRouter(prisma.qhubArtifact as any));
app.use('/api/challenges', crudRouter(prisma.qhubChallenge as any));
app.use('/api/tasks', crudRouter(prisma.qhubBonusTask as any, {
  sanitize: (b: any) => ({ ...b, deadline: b.deadline ? new Date(b.deadline) : undefined }),
}));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Q-Hub] API error:', err);
  res.status(500).json({ error: err?.message || 'Server error' });
});

// V produkci servírujeme přímo frontend (dist/) ze stejného originu.
// Tím odpadá potřeba zvláštního CORS / hostingu a běží to jako 1 kontejner.
if (env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Dockerfile kopíruje dist do /app/dist; server.js běží z /app/server/dist
  const candidates = [
    path.resolve(__dirname, '../../dist'),
    path.resolve(__dirname, '../dist'),
    path.resolve(process.cwd(), 'dist'),
  ];
  const distDir = candidates.find((p) => fs.existsSync(path.join(p, 'index.html')));

  if (distDir) {
    console.log(`[Q-Hub] Servíruji frontend z: ${distDir}`);
    app.use(express.static(distDir, { maxAge: '1y', index: false }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn('[Q-Hub] dist/ nenalezen – frontend se nebude servírovat.');
  }
}

app.listen(env.PORT, '0.0.0.0', async () => {
  console.log(`[Q-Hub] Server běží na portu ${env.PORT}`);
  console.log(`[Q-Hub] NODE_ENV=${env.NODE_ENV}`);
  await ensureSeeded();
});
