import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { env } from '../lib/env.js';
import { COOKIE_NAME, COOKIE_OPTIONS, signToken } from '../lib/jwt.js';
import { initialUserDefaults, publicUser } from '../lib/userShape.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  return res.status(403).json({ error: 'Registrace jsou vypnuté. Kontaktujte administrátora pro vytvoření účtu.' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email a heslo jsou povinné.' });
  }
  const normEmail = String(email).toLowerCase().trim();
  const user = await prisma.qhubUser.findUnique({ where: { email: normEmail } });
  if (!user) return res.status(401).json({ error: 'Neplatný email nebo heslo.' });
  if (user.isBanned) return res.status(403).json({ error: 'Účet byl zablokován.' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Neplatný email nebo heslo.' });

  // Auto-povýšení adminských emailů
  let role = user.role;
  if (env.ADMIN_EMAILS.includes(normEmail) && role !== 'admin') {
    role = 'admin';
    await prisma.qhubUser.update({ where: { id: user.id }, data: { role: 'admin' } });
  }

  const updated = await prisma.qhubUser.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = signToken({ uid: updated.id, role, email: updated.email });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({ user: publicUser(updated) });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.qhubUser.findUnique({ where: { id: req.user!.uid } });
  if (!user) {
    res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
    return res.status(401).json({ error: 'Účet neexistuje' });
  }
  res.json({ user: publicUser(user) });
});

export default router;
