import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (req.user!.role === 'admin' || req.user!.role === 'support') {
    const all = await prisma.qhubBooking.findMany({ orderBy: { date: 'desc' } });
    return res.json(all);
  }
  const mine = await prisma.qhubBooking.findMany({
    where: { userId: req.user!.uid },
    orderBy: { date: 'desc' },
  });
  res.json(mine);
});

router.post('/', requireAuth, async (req, res) => {
  const { mentorId, date, note } = req.body ?? {};
  if (!mentorId || !date) return res.status(400).json({ error: 'mentorId a date jsou povinné.' });
  const created = await prisma.qhubBooking.create({
    data: {
      mentorId,
      userId: req.user!.uid,
      userEmail: req.user!.email,
      date: new Date(date),
      note: note ?? '',
      status: 'pending',
    },
  });
  res.json(created);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { status, adminNote, rating, meetingLink, date } = req.body ?? {};
  const data: any = {};
  if (status) data.status = status;
  if (adminNote !== undefined) data.adminNote = adminNote;
  if (typeof rating === 'number') data.rating = rating;
  if (meetingLink !== undefined) data.meetingLink = meetingLink;
  if (date) data.date = new Date(date);
  const updated = await prisma.qhubBooking.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.qhubBooking.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
