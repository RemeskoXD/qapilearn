import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const s =
    (await prisma.qhubSystemSettings.findUnique({ where: { id: 1 } })) ??
    (await prisma.qhubSystemSettings.create({ data: { id: 1 } }));
  res.json(s);
});

router.put('/', requireAdmin, async (req, res) => {
  const { maintenanceMode, allowRegistrations, globalBanner, version } = req.body ?? {};
  const data: any = {};
  if (typeof maintenanceMode === 'boolean') data.maintenanceMode = maintenanceMode;
  if (typeof allowRegistrations === 'boolean') data.allowRegistrations = allowRegistrations;
  if (typeof globalBanner === 'string') data.globalBanner = globalBanner;
  if (typeof version === 'string') data.version = version;

  const updated = await prisma.qhubSystemSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  res.json(updated);
});

export default router;
