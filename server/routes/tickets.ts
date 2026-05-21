import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (req.user!.role === 'admin' || req.user!.role === 'support') {
    const all = await prisma.qhubTicket.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(all);
  }
  const mine = await prisma.qhubTicket.findMany({
    where: { userId: req.user!.uid },
    orderBy: { createdAt: 'desc' },
  });
  res.json(mine);
});

router.post('/', requireAuth, async (req, res) => {
  const { subject, body, priority } = req.body ?? {};
  if (!subject) return res.status(400).json({ error: 'Předmět je povinný.' });
  const created = await prisma.qhubTicket.create({
    data: {
      userId: req.user!.uid,
      userEmail: req.user!.email,
      subject,
      priority: priority ?? 'medium',
      status: 'open',
      messages: body
        ? ([{ sender: 'user', text: body, timestamp: new Date().toISOString() }] as any)
        : ([] as any),
    },
  });
  res.json(created);
});

router.post('/:id/reply', requireAuth, async (req, res) => {
  const ticket = await prisma.qhubTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ error: 'Nenalezeno' });

  const isOwner = ticket.userId === req.user!.uid;
  const isSupport = req.user!.role === 'admin' || req.user!.role === 'support';
  if (!isOwner && !isSupport) return res.status(403).json({ error: 'Nepovoleno' });

  const sender = isSupport ? 'support' : 'user';
  const msgs = [
    ...((ticket.messages as any[]) ?? []),
    { sender, text: req.body.text ?? '', timestamp: new Date().toISOString() },
  ];

  const updated = await prisma.qhubTicket.update({
    where: { id: req.params.id },
    data: { messages: msgs as any, status: isSupport ? 'pending' : 'open' },
  });
  res.json(updated);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { status, priority } = req.body ?? {};
  const data: any = {};
  if (status) data.status = status;
  if (priority) data.priority = priority;
  const updated = await prisma.qhubTicket.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.qhubTicket.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
