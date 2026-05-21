import type { Request, Response, NextFunction } from 'express';
import { COOKIE_NAME, verifyToken, type JwtPayload } from '../lib/jwt.js';
import { prisma } from '../prisma.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Nepřihlášen' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Neplatný token' });
  req.user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Uživatel nenalezen v tokenu.' });
      }
      const user = await prisma.qhubUser.findUnique({ where: { id: req.user.uid } });
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Pouze admin' });
      }
      next();
    } catch (err) {
      console.error('[Q-Hub Auth] requireAdmin database query failed:', err);
      return res.status(500).json({ error: 'Chyba při komunikaci s databází při ověřování role.' });
    }
  });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}
