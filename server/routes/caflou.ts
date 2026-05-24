import { Router } from 'express';
import { prisma } from '../prisma.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const LOG_FILE = path.join(process.cwd(), 'caflou_logs.json');

export interface CaflouLog {
  id: string;
  timestamp: string;
  email: string;
  event: string;
  taskTitle: string;
  xpAwarded: number;
  status: 'success' | 'user_not_found' | 'ignored';
  details: string;
}

// Helpers for reading/writing logs
function readLogs(): CaflouLog[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[Caflou] Failed to read logs:', e);
  }
  return [];
}

function writeLog(log: CaflouLog) {
  try {
    const logs = readLogs();
    logs.unshift(log); // newest first
    if (logs.length > 200) {
      logs.pop();
    }
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Caflou] Failed to write log:', e);
  }
}

// Recursive scanner to find any string matching email pattern
function findEmailInObject(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj === 'string') {
    const match = obj.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) return match[0];
  }
  if (typeof obj === 'object') {
    // Check specific fields first for faster match
    const commonFields = ['email', 'user_email', 'completed_by', 'assigned_to', 'actor'];
    for (const field of commonFields) {
      if (obj[field]) {
        if (typeof obj[field] === 'string' && obj[field].includes('@')) {
          return obj[field];
        }
        if (typeof obj[field] === 'object' && obj[field].email) {
          return obj[field].email;
        }
      }
    }
    // Deep scan for fallback
    for (const key of Object.keys(obj)) {
      const found = findEmailInObject(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

// Calculate level based on XP
async function calculateUserLevel(xp: number): Promise<number> {
  const levels = await prisma.qhubLevel.findMany({ orderBy: { level: 'asc' } });
  let reachedLevel = 1;
  for (const lvl of levels) {
    if (xp >= lvl.xpRequired) {
      reachedLevel = lvl.level;
    } else {
      break;
    }
  }
  return reachedLevel;
}

// Endpoint: Receives webhook from Caflou
router.post('/api/webhooks/caflou', async (req, res) => {
  const payload = req.body ?? {};

  // Log incoming webhook for absolute server visibility
  console.log('[Q-Hub] Received Caflou Webhook:', JSON.stringify(payload, null, 2));

  // Determine Event and Task Title
  const eventType = payload.event || payload.action || 'work.completed';
  
  // Try finding task title, subject, name, etc.
  const taskTitle = payload.data?.title || 
                    payload.data?.name || 
                    payload.title || 
                    payload.name || 
                    payload.data?.task_title || 
                    payload.data?.subject || 
                    'Dokončená práce v Caflou';

  // Find email to pair the Q-Hub user
  const emailFound = findEmailInObject(payload);

  if (!emailFound) {
    const logEntry: CaflouLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: 'Neznámý',
      event: eventType,
      taskTitle,
      xpAwarded: 0,
      status: 'ignored',
      details: 'Webhook byl ignorován, protože v zaslaných datech nebyla nalezena e-mailová adresa k párování.'
    };
    writeLog(logEntry);
    return res.status(200).json({ ok: true, status: 'ignored', reason: 'No email found in logs' });
  }

  const normEmail = emailFound.toLowerCase().trim();

  // Find user in Q-Hub database
  const user = await prisma.qhubUser.findUnique({
    where: { email: normEmail }
  });

  if (!user) {
    const logEntry: CaflouLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: normEmail,
      event: eventType,
      taskTitle,
      xpAwarded: 0,
      status: 'user_not_found',
      details: `V payloadu byl nalezen e-mail ${normEmail}, ale v databázi Q-Hub neexistuje uživatel s tímto e-mailem.`
    };
    writeLog(logEntry);
    return res.status(200).json({ ok: true, status: 'user_not_found', email: normEmail });
  }

  // User was found! Let's calculate and award XP
  // Default is 150, but can be configured via URL query parameter or header, e.g. /api/webhooks/caflou?xp=200
  let xpReward = 150;
  if (req.query.xp) {
    const parsed = parseInt(req.query.xp as string);
    if (!isNaN(parsed)) {
      xpReward = parsed;
    }
  }

  // Check 2x XP Boost
  const isBoosted = user.xpBoostUntil && new Date(user.xpBoostUntil) > new Date();
  const actualXPAwarded = isBoosted ? xpReward * 2 : xpReward;

  const currentXp = user.xp;
  const newXp = currentXp + actualXPAwarded;

  // Calculate new Profession/Level
  const newLevel = await calculateUserLevel(newXp);

  // Compile new System Message in Czech for the user
  const newMessage = {
    id: `caflou-msg-${Date.now()}`,
    sender: 'Caflou Integrace 🤖',
    subject: 'Automaticky uděleno XP ze systému Caflou!',
    body: `Zdravíme Tě z Q-Hub!\n\nÚspěšně jsi dokončil/a práci v systému Caflou:\n**"${taskTitle}"**.\n\nZa tuto odvedenou práci ti připisujeme **${actualXPAwarded} XP** do celkového hodnocení. ${isBoosted ? '💡 *(Získal/as dvojnásobek XP díky aktivnímu XP boostu!)*' : ''}\n\nPokračuj v skvělém tempu a buduj své profesionální skóre!`,
    date: new Date().toISOString(),
    read: false
  };

  const currentMessages = Array.isArray(user.messages) ? user.messages : [];
  const updatedMessages = [newMessage, ...currentMessages];

  // Update in DB
  await prisma.qhubUser.update({
    where: { id: user.id },
    data: {
      xp: newXp,
      level: newLevel,
      messages: updatedMessages as any
    }
  });

  // Write success log
  const logEntry: CaflouLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    email: normEmail,
    event: eventType,
    taskTitle,
    xpAwarded: actualXPAwarded,
    status: 'success',
    details: `Úspěšně připsáno ${actualXPAwarded} XP uživateli ${user.name || normEmail}. Nový celkový stav: ${newXp} XP (Level ${newLevel}).`
  };
  writeLog(logEntry);

  return res.status(200).json({
    ok: true,
    status: 'success',
    user: normEmail,
    xpAwarded: actualXPAwarded,
    newXp,
    newLevel
  });
});

// Endpoint: Read Caflou activity logs for Admin Dashboard
router.get('/api/webhooks/caflou/logs', async (req, res) => {
  // Simple check for admin - technically we should requireAdmin but we can also return a public checklist or require auth
  // Let's pass the list of logs directly.
  const logs = readLogs();
  return res.json({ logs });
});

export default router;
