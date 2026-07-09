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
  const { maintenanceMode, allowRegistrations, globalBanner, version, enableCourses, enableQuizzes, enableMentoring, enableCalendar, enableEbooks, enableStreams, enableBonusTasks} = req.body ?? {};
  const data: any = {};
  if (typeof maintenanceMode === 'boolean') data.maintenanceMode = maintenanceMode;
  if (typeof allowRegistrations === 'boolean') data.allowRegistrations = allowRegistrations;
  if (typeof globalBanner === 'string') data.globalBanner = globalBanner;
  if (typeof version === 'string') data.version = version;
  if (typeof enableCourses === 'boolean') data.enableCourses = enableCourses;
  if (typeof enableQuizzes === 'boolean') data.enableQuizzes = enableQuizzes;
  if (typeof enableMentoring === 'boolean') data.enableMentoring = enableMentoring;
  if (typeof enableCalendar === 'boolean') data.enableCalendar = enableCalendar;
  if (typeof enableEbooks === 'boolean') data.enableEbooks = enableEbooks;
  if (typeof enableStreams === 'boolean') data.enableStreams = enableStreams;
  if (typeof enableBonusTasks === 'boolean') data.enableBonusTasks = enableBonusTasks;
  

  const updated = await prisma.qhubSystemSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  res.json(updated);
});

export default router;
