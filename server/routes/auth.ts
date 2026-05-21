import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { env } from '../lib/env.js';
import { COOKIE_NAME, COOKIE_OPTIONS, signToken } from '../lib/jwt.js';
import { initialUserDefaults, publicUser } from '../lib/userShape.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email a heslo jsou povinné.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Heslo musí mít minimálně 6 znaků.' });
  }

  const normEmail = String(email).toLowerCase().trim();
  const existing = await prisma.qhubUser.findUnique({ where: { email: normEmail } });
  if (existing) {
    return res.status(409).json({ error: 'Uživatel s tímto emailem už existuje.' });
  }

  const settings = await prisma.qhubSystemSettings.findUnique({ where: { id: 1 } });
  if (settings && !settings.allowRegistrations) {
    return res.status(403).json({ error: 'Registrace jsou momentálně uzavřené.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdminEmail = env.ADMIN_EMAILS.includes(normEmail);

  const defaults = initialUserDefaults();
  const user = await prisma.qhubUser.create({
    data: {
      email: normEmail,
      passwordHash,
      name: name?.trim() || normEmail.split('@')[0],
      role: isAdminEmail ? 'admin' : defaults.role,
      positions: defaults.positions as any,
      level: defaults.level,
      xp: defaults.xp,
      financialProfit: defaults.financialProfit,
      isBanned: defaults.isBanned,
      isPublicProfile: defaults.isPublicProfile,
      inventory: defaults.inventory as any,
      activeChallenges: defaults.activeChallenges as any,
      certificates: defaults.certificates as any,
      courseProgress: defaults.courseProgress as any,
      lessonNotes: defaults.lessonNotes as any,
      quizHistory: defaults.quizHistory as any,
      adminNotes: defaults.adminNotes as any,
      profitHistory: defaults.profitHistory as any,
      messages: defaults.messages as any,
    },
  });

  const token = signToken({ uid: user.id, role: user.role, email: user.email });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({ user: publicUser(user) });
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
