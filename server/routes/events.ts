import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const list = await prisma.qhubCalendarEvent.findMany({ orderBy: { date: 'asc' } });
  res.json(list);
});

router.post('/', requireAdmin, async (req, res) => {
  const b = req.body ?? {};
  const created = await prisma.qhubCalendarEvent.create({
    data: {
      title: b.title,
      description: b.description ?? '',
      date: new Date(b.date),
      type: b.type ?? 'webinar',
      link: b.link,
      registeredUserIds: (b.registeredUserIds ?? []) as any,
      maxAttendees: b.maxAttendees,
      price: b.price,
      isFreeForVip: !!b.isFreeForVip,
      isFreeForPremium: !!b.isFreeForPremium,
    },
  });
  res.json(created);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const b = req.body ?? {};
  const data: any = { ...b };
  if (b.date) data.date = new Date(b.date);
  delete data.id;
  const updated = await prisma.qhubCalendarEvent.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

router.post('/:id/register', requireAuth, async (req, res) => {
  const ev = await prisma.qhubCalendarEvent.findUnique({ where: { id: req.params.id } });
  if (!ev) return res.status(404).json({ error: 'Nenalezeno' });
  const ids = new Set([...((ev.registeredUserIds as any[]) ?? []), req.user!.uid]);
  const updated = await prisma.qhubCalendarEvent.update({
    where: { id: req.params.id },
    data: { registeredUserIds: Array.from(ids) as any },
  });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.qhubCalendarEvent.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
