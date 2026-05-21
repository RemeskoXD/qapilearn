import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (req.user!.role === 'admin' || req.user!.role === 'support') {
    const all = await prisma.qhubBonusSubmission.findMany({ orderBy: { submittedAt: 'desc' } });
    return res.json(all);
  }
  const mine = await prisma.qhubBonusSubmission.findMany({
    where: { userId: req.user!.uid },
    orderBy: { submittedAt: 'desc' },
  });
  res.json(mine);
});

router.post('/', requireAuth, async (req, res) => {
  const { taskId, content } = req.body ?? {};
  if (!taskId) return res.status(400).json({ error: 'taskId povinné.' });
  const created = await prisma.qhubBonusSubmission.create({
    data: {
      taskId,
      userId: req.user!.uid,
      content: content ?? '',
    },
  });
  res.json(created);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body ?? {};
  if (!['pending', 'approved', 'rejected'].includes(status))
    return res.status(400).json({ error: 'Neplatný status.' });
  const updated = await prisma.qhubBonusSubmission.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.qhubBonusSubmission.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
