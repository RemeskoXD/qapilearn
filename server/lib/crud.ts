import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

interface PrismaModel {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
}

/**
 * Generický CRUD router:
 * - GET    /           (vyžaduje login)
 * - GET    /:id        (vyžaduje login)
 * - POST   /           (admin)
 * - PUT    /:id        (admin)
 * - DELETE /:id        (admin)
 */
export function crudRouter(model: PrismaModel, opts: { sanitize?: (input: any) => any } = {}) {
  const router = Router();
  const sanitize = opts.sanitize ?? ((x: any) => x);

  router.get('/', requireAuth, async (req, res) => {
    try {
      const items = await model.findMany();
      console.log(`[Q-Hub CRUD] GET request. User: ${req.user?.email || 'unknown'}. Found ${items?.length ?? 0} items.`);
      res.json(items);
    } catch (err: any) {
      console.error(`[Q-Hub CRUD] GET error:`, err);
      res.status(500).json({ error: err?.message || 'Chyba při čtení dat z databáze.' });
    }
  });

  router.get('/:id', requireAuth, async (req, res) => {
    const item = await model.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Nenalezeno' });
    res.json(item);
  });

  router.post('/', requireAdmin, async (req, res) => {
    try {
      const data = sanitize(req.body);
      const created = await model.create({ data });
      res.json(created);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.put('/:id', requireAdmin, async (req, res) => {
    try {
      const data = sanitize(req.body);
      delete data.id;
      const updated = await model.update({ where: { id: req.params.id }, data });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.delete('/:id', requireAdmin, async (req, res) => {
    try {
      await model.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  return router;
}
