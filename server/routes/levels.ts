import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const list = await prisma.qhubLevel.findMany({ orderBy: { level: 'asc' } });
  res.json(list);
});

router.put('/', requireAdmin, async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items musí být pole.' });
  // Atomická náhrada
  await prisma.$transaction([
    prisma.qhubLevel.deleteMany({}),
    prisma.qhubLevel.createMany({
      data: items.map((i: any) => ({
        level: Number(i.level),
        xpRequired: Number(i.xpRequired ?? 0),
        title: String(i.title ?? ''),
      })),
    }),
  ]);
  const list = await prisma.qhubLevel.findMany({ orderBy: { level: 'asc' } });
  res.json(list);
});

export default router;
