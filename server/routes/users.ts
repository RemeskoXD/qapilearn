import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { publicUser, initialUserDefaults } from '../lib/userShape.js';

const router = Router();

// Pole, která může uživatel měnit sám na sobě
const SELF_EDITABLE = new Set([
  'name',
  'phone',
  'bio',
  'avatarUrl',
  'isPublicProfile',
  'positions',
  'inventory',
  'activeChallenges',
  'certificates',
  'courseProgress',
  'lessonNotes',
  'quizHistory',
  'profitHistory',
  'messages',
  'xp',
  'level',
  'xpBoostUntil',
  'financialProfit',
  'dashboardMessage',
]);

// Pole, která může měnit admin (vše kromě passwordHash)
const ADMIN_EDITABLE = new Set([
  ...SELF_EDITABLE,
  'email',
  'role',
  'isBanned',
  'planExpires',
  'adminNotes',
]);

const VALID_POSITIONS = new Set(['technik', 'prodejce', 'team_leader', 'linka', 'ostatni']);

function pick(obj: any, allowed: Set<string>) {
  const out: any = {};
  for (const k of Object.keys(obj)) {
    if (!allowed.has(k)) continue;
    if (k === 'positions') {
      const arr = Array.isArray(obj[k]) ? obj[k] : [];
      const filtered = Array.from(new Set(arr.filter((p: any) => typeof p === 'string' && VALID_POSITIONS.has(p))));
      out[k] = filtered;
    } else {
      out[k] = obj[k];
    }
  }
  return out;
}

router.post('/', requireAdmin, async (req, res) => {
  const { email, password, name, role, phone, positions, planExpires } = req.body ?? {};
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

  const passwordHash = await bcrypt.hash(password, 10);
  const defaults = initialUserDefaults();

  // Filter positions through our validation
  const validPositionsArr = Array.isArray(positions) 
    ? positions.filter((p: any) => typeof p === 'string' && VALID_POSITIONS.has(p))
    : [];

  const user = await prisma.qhubUser.create({
    data: {
      email: normEmail,
      passwordHash,
      name: name?.trim() || normEmail.split('@')[0],
      role: role || defaults.role,
      phone: phone || '',
      positions: validPositionsArr as any,
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
      planExpires: planExpires ? new Date(planExpires).toISOString() : null,
    },
  });

  res.status(201).json(publicUser(user));
});

router.get('/', requireAuth, async (req, res) => {
  const isAdmin = req.user!.role === 'admin';
  let users;
  if (isAdmin) {
    users = await prisma.qhubUser.findMany({ orderBy: { joinDate: 'desc' } });
  } else {
    users = await prisma.qhubUser.findMany({
      where: {
        isBanned: false,
        OR: [
          { isPublicProfile: true },
          { id: req.user!.uid }
        ]
      },
      orderBy: { joinDate: 'desc' }
    });
  }
  res.json(users.map(publicUser));
});

router.patch('/me', requireAuth, async (req, res) => {
  const data = pick(req.body ?? {}, SELF_EDITABLE);
  const updated = await prisma.qhubUser.update({
    where: { id: req.user!.uid },
    data,
  });
  res.json(publicUser(updated));
});

router.get('/:id', requireAuth, async (req, res) => {
  // Nemusíš být admin abys viděl základ jiného uživatele (leaderboard atd.)
  const user = await prisma.qhubUser.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'Nenalezeno' });
  res.json(publicUser(user));
});

router.put('/:id', requireAdmin, async (req, res) => {
  const data = pick(req.body ?? {}, ADMIN_EDITABLE);
  const updated = await prisma.qhubUser.update({ where: { id: req.params.id }, data });
  res.json(publicUser(updated));
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const data = pick(req.body ?? {}, ADMIN_EDITABLE);
  const updated = await prisma.qhubUser.update({ where: { id: req.params.id }, data });
  res.json(publicUser(updated));
});

router.delete('/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user!.uid) {
    return res.status(400).json({ error: 'Nemůžeš smazat sám sebe.' });
  }
  await prisma.qhubUser.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Admin pošle zprávu uživateli (přidá do JSON pole `messages`)
router.post('/:id/messages', requireAdmin, async (req, res) => {
  const user = await prisma.qhubUser.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'Uživatel nenalezen' });
  const message = {
    id: `m-${Date.now()}`,
    sender: req.body.sender ?? 'Admin',
    subject: req.body.subject ?? '',
    body: req.body.body ?? '',
    date: new Date().toISOString(),
    read: false,
    hasAttachment: Boolean(req.body.attachmentName),
    attachmentName: req.body.attachmentName,
  };
  const messages = [message, ...((user.messages as any[]) ?? [])];
  const updated = await prisma.qhubUser.update({
    where: { id: req.params.id },
    data: { messages: messages as any },
  });
  res.json(publicUser(updated));
});

export default router;
