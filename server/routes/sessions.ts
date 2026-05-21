import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const list = await prisma.qhubCommunitySession.findMany({ orderBy: { date: 'asc' } });
  res.json(list);
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body ?? {};
  if (!b.topic || !b.date) return res.status(400).json({ error: 'topic a date povinné.' });
  const created = await prisma.qhubCommunitySession.create({
    data: {
      hostUserId: req.user!.uid,
      hostName: b.hostName ?? req.user!.email,
      topic: b.topic,
      date: new Date(b.date),
      description: b.description ?? '',
      maxAttendees: b.maxAttendees ?? 50,
      attendees: [] as any,
    },
  });
  res.json(created);
});

router.post('/:id/join', requireAuth, async (req, res) => {
  const s = await prisma.qhubCommunitySession.findUnique({ where: { id: req.params.id } });
  if (!s) return res.status(404).json({ error: 'Nenalezeno' });
  const set = new Set([...((s.attendees as any[]) ?? []), req.user!.uid]);
  const updated = await prisma.qhubCommunitySession.update({
    where: { id: req.params.id },
    data: { attendees: Array.from(set) as any },
  });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const s = await prisma.qhubCommunitySession.findUnique({ where: { id: req.params.id } });
  if (!s) return res.status(404).json({ error: 'Nenalezeno' });
  if (s.hostUserId !== req.user!.uid && req.user!.role !== 'admin')
    return res.status(403).json({ error: 'Nepovoleno' });
  await prisma.qhubCommunitySession.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
