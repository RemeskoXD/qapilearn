import { Router } from 'express';
import { prisma } from '../prisma.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dns from 'node:dns';
import { initialUserDefaults } from '../lib/userShape.js';

// Globální monkeypatch dns.lookup pro domény Caflou.
// Vyřeší permanentní ENOTFOUND chyby na levných VPS či v Coolify sandboxech s nefunkčním výchozím resolverem (resolv.conf).
const originalLookup = dns.lookup;
(dns as any).lookup = function (hostname: string, options: any, callback: any) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const isCaflou = hostname && (
    hostname.includes('caflou.cz') || 
    hostname.includes('caflou.com') || 
    hostname.includes('qapi.cz')
  );

  if (isCaflou) {
    originalLookup(hostname, options, (err, address, family) => {
      if (!err) {
        return callback(null, address, family);
      }

      console.warn(`[Caflou DNS Resolve] Výchozí DNS vyhledání pro ${hostname} selhalo (${err.message}). Zkouším Google Public DNS (8.8.8.8)...`);
      const resolver = new dns.Resolver();
      resolver.setServers(['8.8.8.8', '1.1.1.1']);

      resolver.resolve4(hostname, (dnsErr, addresses) => {
        if (!dnsErr && addresses && addresses.length > 0) {
          console.log(`[Caflou DNS Resolve] Doména ${hostname} úspěšně přeložena přes Google DNS:`, addresses[0]);
          return callback(null, addresses[0], 4);
        }

        resolver.resolve6(hostname, (dns6Err, addresses6) => {
          if (!dns6Err && addresses6 && addresses6.length > 0) {
            console.log(`[Caflou DNS Resolve] Doména ${hostname} (IPv6) úspěšně přeložena přes Google DNS:`, addresses6[0]);
            return callback(null, addresses6[0], 6);
          }

          console.error(`[Caflou DNS Resolve] Překlad selhal i přes Google DNS pro ${hostname}.`);
          return callback(err);
        });
      });
    });
  } else {
    return originalLookup(hostname, options, callback);
  }
};

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
      /* level was removed here to prevent overriding admin configuration */
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

// ============================================================================
// --- PŘÍMÁ INTEGRACE CAFLOU.CZ (API TOKEN, ID ÚČTU, SAZBY A VÝPLATY) ---
// ============================================================================

const CONFIG_FILE = path.join(process.cwd(), 'caflou_config.json');
const RATES_FILE = path.join(process.cwd(), 'caflou_user_rates.json');

export interface CaflouConfig {
  caflouToken: string;
  caflouCompanyId: string;
  caflouBaseUrl?: string;
}

interface UserRates {
  [email: string]: number;
}

function readConfig(): CaflouConfig {
  // Prefer environment variables (Secrets) for extra security
  const envToken = process.env.CAFLOU_TOKEN || process.env.VITE_CAFLOU_TOKEN;
  const envCompanyId = process.env.CAFLOU_COMPANY_ID || process.env.VITE_CAFLOU_COMPANY_ID;
  const envBaseUrl = process.env.CAFLOU_BASE_URL || process.env.VITE_CAFLOU_BASE_URL;
  
  if (envToken) {
    return {
      caflouToken: envToken.trim(),
      caflouCompanyId: (envCompanyId || '').trim(),
      caflouBaseUrl: (envBaseUrl || '').trim()
    };
  }

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return {
        caflouToken: (fileData.caflouToken || '').trim(),
        caflouCompanyId: (fileData.caflouCompanyId || '').trim(),
        caflouBaseUrl: (fileData.caflouBaseUrl || '').trim()
      };
    }
  } catch (e) {
    console.error('[Caflou] Failed to read config:', e);
  }
  return { caflouToken: '', caflouCompanyId: '', caflouBaseUrl: '' };
}

let cachedAccountId: string | null = null;

async function fetchCaflou(urlPathAndQuery: string, options: { method: string; headers: Record<string, string>; body?: string }) {
  const config = readConfig();
  const rawBaseUrl = (config.caflouBaseUrl || '').trim();
  
  let baseHosts = ['app.caflou.cz/api', 'app.caflou.com/api'];
  if (rawBaseUrl) {
    let cleanBaseUrl = rawBaseUrl.replace(/\/$/, '');
    if (!cleanBaseUrl.startsWith('http')) {
      cleanBaseUrl = `https://${cleanBaseUrl}`;
    }
    // Chceme pouze doménu a případnou cestu (/api) z rawBaseUrl, bez protokolu, pro stejnou logiku s hosts
    baseHosts = [cleanBaseUrl.replace(/^https?:\/\//, '')];
  }

  let finalAccountId = config.caflouCompanyId || cachedAccountId;

  // Funkce pro provedení fetch na zadaný host a path
  const doFetch = async (host: string, pathUrl: string) => {
    const fullUrl = `https://${host}${pathUrl}`;
    return fetch(fullUrl, options);
  };

  let lastError: any = null;

  for (const host of baseHosts) {
    try {
      // 1. Zjistíme Account ID, pokud ho ještě nemáme
      if (!finalAccountId) {
        console.log(`[Caflou fetch] Zjišťuji Account ID přes /v1/accounts z hostitele ${host}...`);
        const accResp = await doFetch(host, '/v1/accounts');
        if (accResp.ok) {
          const accounts = await accResp.json();
          if (Array.isArray(accounts) && accounts.length > 0) {
            finalAccountId = accounts[0].id;
            cachedAccountId = finalAccountId;
            console.log(`[Caflou fetch] Zjištěno Account ID: ${finalAccountId}`);
          }
        } else {
          console.warn(`[Caflou fetch] Nelze zjistit Account ID: ${accResp.status} ${await accResp.text()}`);
        }
      }

      // 2. Upravíme cestu, pokud začíná /v1/ a máme accountId (nové API Caflou vynucuje /v1/{account_id}/...)
      let targetPath = urlPathAndQuery;
      if (finalAccountId && targetPath.startsWith('/v1/') && !targetPath.startsWith(`/v1/${finalAccountId}/`)) {
        targetPath = targetPath.replace('/v1/', `/v1/${finalAccountId}/`);
      }

      console.log(`[Caflou fetch] Pokouším se kontaktovat: https://${host}${targetPath}`);
      const resp = await doFetch(host, targetPath);
      return resp;
    } catch (err: any) {
      console.warn(`[Caflou fetch] Připojení k ${host} selhalo:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Nepodařilo se navázat spojení se servery Caflou.');
}

function writeConfig(config: CaflouConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Caflou] Failed to write config:', e);
  }
}

function readRates(): UserRates {
  try {
    if (fs.existsSync(RATES_FILE)) {
      return JSON.parse(fs.readFileSync(RATES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[Caflou] Failed to read rates:', e);
  }
  return {};
}

function writeRates(rates: UserRates) {
  try {
    fs.writeFileSync(RATES_FILE, JSON.stringify(rates, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Caflou] Failed to write rates:', e);
  }
}

// 0. Diagnostika DNS a síťového spojení pro Caflou API
router.get('/api/caflou/diagnostic', async (req, res) => {
  const result: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      isProduction: process.env.NODE_ENV === 'production',
    },
    resolutions: {},
    fetches: {},
    suggestions: []
  };

  const config = readConfig();
  const customBaseUrl = (config.caflouBaseUrl || '').trim();
  let customHost: string | null = null;
  if (customBaseUrl) {
    try {
      const parsed = new URL(customBaseUrl.startsWith('http') ? customBaseUrl : `https://${customBaseUrl}`);
      customHost = parsed.hostname;
    } catch (e) {}
  }

  try {
    const dns = await import('node:dns');
    const hosts = ['app.caflou.cz', 'app.caflou.com', 'google.com'];
    if (customHost && !hosts.includes(customHost)) {
      hosts.unshift(customHost);
    }
    for (const host of hosts) {
      try {
        const addresses = await dns.promises.resolve(host).catch(() => dns.promises.lookup(host).then(r => [r.address]));
        result.resolutions[host] = {
          success: true,
          addresses
        };
      } catch (err: any) {
        result.resolutions[host] = {
          success: false,
          error: err.message,
          code: err.code
        };
      }
    }

    // Ruční Google resolver
    try {
      const resolver = new dns.promises.Resolver();
      resolver.setServers(['8.8.8.8']);
      const extResolutions: any = {};
      const hostsToTest = ['app.caflou.cz', 'app.caflou.com'];
      if (customHost && !hostsToTest.includes(customHost)) {
        hostsToTest.unshift(customHost);
      }
      for (const host of hostsToTest) {
        try {
          const addresses = await resolver.resolve4(host);
          extResolutions[host] = { success: true, addresses };
        } catch (err: any) {
          extResolutions[host] = { success: false, error: err.message, code: err.code };
        }
      }
      result.dns8888 = extResolutions;
    } catch (err: any) {
      result.dns8888 = { success: false, error: err.message };
    }
  } catch (dnsErr: any) {
    result.dnsError = dnsErr.message;
  }

  // Zkusíme fetch
  const testHosts = ['app.caflou.cz/api', 'app.caflou.com/api'];
  if (customHost && !testHosts.includes(customHost)) {
    testHosts.unshift(customHost);
  }
  for (const host of testHosts) {
    const url = `https://${host}/v1/users?per=1`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'QHub-Diagnostic' }
      });
      clearTimeout(timeoutId);
      result.fetches[host] = {
        success: true,
        status: resp.status,
        statusText: resp.statusText,
      };
    } catch (err: any) {
      result.fetches[host] = {
        success: false,
        error: err.message,
        name: err.name,
        cause: err.cause ? { message: err.cause.message, code: err.cause.code } : null
      };
    }
  }

  // Doporučení
  const czRes = result.resolutions['api.caflou.cz'];
  if (czRes && !czRes.success) {
    result.suggestions.push(
      "Lokální DNS překladač ve Vašem kontejneru nebo na VPS nedokáže najít adresu 'api.caflou.cz' (Chyba ENOTFOUND)."
    );
    const extCz = result.dns8888 && result.dns8888['api.caflou.cz'];
    if (extCz && extCz.success) {
      result.suggestions.push(
        "Zajímavé: Zatímco výchozí resolver VPS selhal, dotaz přes veřejný Google DNS (8.8.8.8) úspěšně vrátil IP adresu! To znamená, že Vaše VPS / Docker kontejner má nesprávně nastavený DNS resolver v konfiguraci sítě."
      );
      result.suggestions.push(
        "NÁPRAVA: V nastavení VPS / v Coolify přidejte do Docker DNS resolverů '8.8.8.8' nebo '1.1.1.1'. V docker-compose.yml můžete pro tuto službu přidat blok:\n  dns:\n    - 8.8.8.8\n    - 1.1.1.1"
      );
    } else {
      result.suggestions.push(
        "DNS překlad selhal i přes externí Google DNS. Váš kontejner na Coolify / VPS je s největší pravděpodobností zcela izolován od vnějšího internetu (chybí NAT, odchozí síťová brána nebo odchozí pravidla ve firewallu VPS)."
      );
    }
  } else {
    result.suggestions.push(
      "DNS překlad proběhl v pořádku! Pokud i přesto API nevrací data, zkontrolujte platnost Caflou API Tokenu v nastavení nebo logy serveru pro případné chyby autorizace (401/403)."
    );
  }

  return res.json(result);
});

// 1. Získání Caflou API konfigurace
router.get('/api/caflou/config', (req, res) => {
  const config = readConfig();
  return res.json(config);
});

// 2. Uložení Caflou API konfigurace
router.post('/api/caflou/config', (req, res) => {
  const { caflouToken, caflouCompanyId, caflouBaseUrl } = req.body ?? {};
  writeConfig({
    caflouToken: (caflouToken || '').trim(),
    caflouCompanyId: (caflouCompanyId || '').trim(),
    caflouBaseUrl: (caflouBaseUrl || '').trim()
  });
  return res.json({ ok: true, message: 'Konfigurace Caflou byla úspěšně uložena klientským serverem.' });
});

// 3. Získání hodinových sazeb
router.get('/api/caflou/rates', (req, res) => {
  const rates = readRates();
  return res.json({ rates });
});

// 4. Uložení hodinových sazeb
router.post('/api/caflou/rates', (req, res) => {
  const { rates } = req.body ?? {};
  if (rates && typeof rates === 'object') {
    writeRates(rates);
    return res.json({ ok: true, message: 'Hodinové sazby byly úspěšně aktualizovány.' });
  }
  return res.status(400).json({ error: 'Neplatný formát sazeb.' });
});

// 5. Získání seznamu uživatelů Q-Hub pro administraci sazeb
router.get('/api/caflou/users', async (req, res) => {
  try {
    const users = await prisma.qhubUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        financialProfit: true,
        profitHistory: true
      },
      orderBy: { name: 'asc' }
    });
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Nepodařilo se načíst uživatele.', details: err?.message });
  }
});

// 5.5 Hromadný import uživatelů z Caflou API nebo offline dat
router.post('/api/caflou/import-users', async (req, res) => {
  try {
    const { manualUsers } = req.body ?? {};
    const config = readConfig();
    const token = config.caflouToken;

    // Najdeme unikátní uživatele ve všech těchto zdrojích
    const foundUsersMap = new Map<string, { email: string; name: string; role?: string }>();

    // Pokud uživatel poskytl ruční seznam, přidáme je přímo
    if (Array.isArray(manualUsers) && manualUsers.length > 0) {
      console.log(`[Caflou User Import] Zpracovávám ${manualUsers.length} ručně zadaných zaměstnanců...`);
      for (const mu of manualUsers) {
        if (mu.email && typeof mu.email === 'string' && mu.email.includes('@')) {
          const normEmail = mu.email.toLowerCase().trim();
          foundUsersMap.set(normEmail, {
            email: normEmail,
            name: (mu.name || normEmail.split('@')[0]).trim(),
            role: mu.role || 'obchodnik'
          });
        }
      }
    } else {
      // Jinak načteme z reálného Caflou API nebo z offline zálohy
      if (!token) {
        return res.status(400).json({ error: 'Není nakonfigurován Caflou API Token. Vložte jej v nastavení nebo jako secret CAFLOU_TOKEN.' });
      }

      // Prohledáme delší časový úsek (např. od začátku minulého roku do konce aktuálního), abychom chytili aktivní uživatele
      const now = new Date();
      const startDate = `${now.getFullYear() - 1}-01-01`;
      const endDate = `${now.getFullYear() + 1}-12-31`;

      // Sestavíme dotazy na Caflou API
      const entriesPath = `/v1/timesheets?per=1000&filter[start_date]=${startDate}&filter[end_date]=${endDate}${config.caflouCompanyId ? `&filter[company_ids]=${config.caflouCompanyId}` : ''}`;
      const usersPath = `/v1/users?per=1000`;

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'QHub-App/1.0.0 (NodeFetch; contact@q-hub.cz)'
      };
      if (config.caflouCompanyId) {
        headers['X-Company-Id'] = config.caflouCompanyId;
      }

      console.log(`[Caflou User Import] Volám Caflou API (Uživatelé a Výkazy)...`);
      let entries: any[] = [];
      let directUsers: any[] = [];
      let apiSuccess = false;

      // 1. Zkusíme načíst přímý seznam uživatelů z Caflou API
      try {
        const respUsers = await fetchCaflou(usersPath, { method: 'GET', headers });
        if (respUsers.ok) {
          const rawUsers = await respUsers.json();
          directUsers = Array.isArray(rawUsers) ? rawUsers : (rawUsers.results || rawUsers.data || rawUsers.users || []);
          apiSuccess = true;
          console.log(`[Caflou User Import] Staženo ${directUsers.length} uživatelů přes /v1/users`);
        } else {
          const errText = await respUsers.text();
          console.warn(`[Caflou User Import] /v1/users selhaly (${respUsers.status}): ${errText}`);
        }
      } catch (e) {
        console.warn(`[Caflou User Import] Chyba při spojení na /v1/users:`, e);
      }

      // 2. Zkusíme načíst výkazy, abychom chytili i ty, kteří dělali výkazy, ale nejsou přímo vidět v základním /v1/users
      try {
        const response = await fetchCaflou(entriesPath, { method: 'GET', headers });
        if (response.ok) {
          const rawData = await response.json();
          entries = Array.isArray(rawData) ? rawData : (rawData.results || rawData.data || rawData.entries || []);
          apiSuccess = true;
          console.log(`[Caflou User Import] Staženo ${entries.length} výkazů z /v1/timesheets`);
        } else {
          const errText = await response.text();
          console.warn(`[Caflou User Import] /v1/timesheets selhaly (${response.status}): ${errText}`);
        }
      } catch (fetchErr) {
        console.warn(`[Caflou User Import] Chyba při spojení na /v1/timesheets:`, fetchErr);
      }

      // Pokud obě API volání selhala (např. sandbox bez připojení k síti), použijeme offline backup
      if (!apiSuccess) {
        console.warn('[Caflou User Import] Selhaly všechny síťové dotazy na api.caflou.cz. Používám lokální offline data backup.');
        const ozPath = path.join(process.cwd(), 'caflou_oz_data.json');
        if (fs.existsSync(ozPath)) {
          const ozData = JSON.parse(fs.readFileSync(ozPath, 'utf-8'));
          const userConfigs = ozData.userConfigs || {};
          directUsers = Object.keys(userConfigs).map(email => ({
            email: email,
            name: email.split('@')[0].toUpperCase()
          }));
        }
      }

      function inspectObj(obj: any) {
        if (!obj) return;
        
        const email = obj.email || obj.user_email || (obj.user && (obj.user.email || obj.user.user_email));
        let name = obj.name || obj.user_name || obj.username || obj.fullName || (obj.user && (obj.user.name || obj.user.user_name));
        
        if (!name && (obj.first_name || obj.last_name)) {
          name = `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
        }
        if (!name && obj.user && (obj.user.first_name || obj.user.last_name)) {
          name = `${obj.user.first_name || ''} ${obj.user.last_name || ''}`.trim();
        }

        if (email && typeof email === 'string' && email.includes('@')) {
          const normalizedEmail = email.toLowerCase().trim();
          if (!foundUsersMap.has(normalizedEmail)) {
            foundUsersMap.set(normalizedEmail, {
              email: normalizedEmail,
              name: name ? name.trim() : email.split('@')[0]
            });
          }
        }

        // Prohledáme vnitřní objekty pro výkazy
        const commonObjects = ['user', 'completed_by', 'assigned_to', 'actor'];
        for (const field of commonObjects) {
          if (obj[field] && typeof obj[field] === 'object') {
            const innerEmail = obj[field].email || obj[field].user_email;
            let innerName = obj[field].name || obj[field].user_name || obj[field].username || obj[field].fullName;
            if (!innerName && (obj[field].first_name || obj[field].last_name)) {
              innerName = `${obj[field].first_name || ''} ${obj[field].last_name || ''}`.trim();
            }
            if (innerEmail && typeof innerEmail === 'string' && innerEmail.includes('@')) {
              const normalizedEmail = innerEmail.toLowerCase().trim();
              if (!foundUsersMap.has(normalizedEmail)) {
                foundUsersMap.set(normalizedEmail, {
                  email: normalizedEmail,
                  name: innerName ? innerName.trim() : innerEmail.split('@')[0]
                });
              }
            }
          }
        }
      }

      // Prozkoumáme přímé uživatele
      directUsers.forEach(u => inspectObj(u));

      // Prozkoumáme výkazy
      entries.forEach(entry => {
        inspectObj(entry);
        if (entry.completed_by) inspectObj(entry.completed_by);
        if (entry.assigned_to) inspectObj(entry.assigned_to);
      });

      // Přidáme také kohokoliv z caflou_oz_data.json pokud chybí
      const ozPath = path.join(process.cwd(), 'caflou_oz_data.json');
      if (fs.existsSync(ozPath)) {
        try {
          const ozData = JSON.parse(fs.readFileSync(ozPath, 'utf-8'));
          const userConfigs = ozData.userConfigs || {};
          Object.keys(userConfigs).forEach(email => {
            const normEmail = email.toLowerCase().trim();
            if (!foundUsersMap.has(normEmail)) {
              foundUsersMap.set(normEmail, {
                email: normEmail,
                name: normEmail.split('@')[0].toUpperCase()
              });
            }
          });
        } catch (err) {
          console.error('[Caflou User Import] Nelze načíst caflou_oz_data.json:', err);
        }
      }
    }

    const foundUsers = Array.from(foundUsersMap.values());
    if (foundUsers.length === 0) {
      return res.json({ success: true, count: 0, users: [], message: 'V Caflou datech nebyl nalezen žádný nový uživatel.' });
    }

    const importedResults: any[] = [];
    const defaults = initialUserDefaults();

    for (const u of foundUsers) {
      const existing = await prisma.qhubUser.findUnique({
        where: { email: u.email }
      });

      if (existing) {
        // Ponecháme jej netknutého (včetně stávajícího hesla!), abychom neporušili herní pokrok a bezpečnost přihlášení
        importedResults.push({
          email: u.email,
          name: existing.name || u.name,
          role: existing.role,
          status: 'exists',
          tempPassword: null
        });
      } else {
        // Vygenerujeme čitelné heslo, e.g. "qhub_ludvik_2026"
        const cleanName = u.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const tempPassword = `qhub_${cleanName}_2026`;
        const hash = await bcrypt.hash(tempPassword, 10);

        await prisma.qhubUser.create({
          data: {
            email: u.email,
            passwordHash: hash,
            name: u.name,
            role: u.role || 'obchodnik', // Herní/zaměstnanecká role
            positions: defaults.positions as any,
            level: defaults.level,
            xp: defaults.xp,
            financialProfit: defaults.financialProfit,
            isBanned: defaults.isBanned,
            isPublicProfile: defaults.isPublicProfile,
            inventory: defaults.inventory as any,
            activeChallenges: defaults.activeChallenges as any,
            certificates: defaults.certificates as any,
            courseProgress: defaults.courseProgress as any,
            lessonNotes: defaults.lessonNotes as any,
            quizHistory: defaults.quizHistory as any,
            adminNotes: defaults.adminNotes as any,
            profitHistory: defaults.profitHistory as any,
            messages: defaults.messages as any,
          }
        });

        importedResults.push({
          email: u.email,
          name: u.name,
          role: u.role || 'obchodnik',
          status: 'created',
          tempPassword
        });
      }
    }

    return res.json({
      success: true,
      count: foundUsers.length,
      users: importedResults,
      message: `Hromadný import z Caflou úspěšně dokončen!`
    });

  } catch (err: any) {
    console.error('[Caflou User Import Server Error]', err);
    return res.status(500).json({ error: 'Selhal import uživatelů.', details: err?.message });
  }
});

// 6. Synchronizace výkazů z Caflou a výpočet výplat
router.post('/api/caflou/sync-timesheets', async (req, res) => {
  const { month, year } = req.body ?? {};
  
  if (!month || !year) {
    return res.status(400).json({ error: 'Nebylo zadáno období (měsíc a rok).' });
  }

  const qhubUsers = await prisma.qhubUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      financialProfit: true,
      profitHistory: true
    }
  });

  const rates = readRates();
  const config = readConfig();

  // --- SYSTÉM VYŽADUJE REÁLNÉ ÚDAJE (ŽÁDNÁ DEMO DATA) ---
  if (!config.caflouToken) {
    return res.status(400).json({
      error: 'Není nakonfigurován Caflou API Token. Vložte jej prosím v nastavení nebo jako secret CAFLOU_TOKEN.'
    });
  }

  // --- REÁLNÁ INTEGRACE PROPOJENÁ NA CAFLOU API ---
  try {
    const token = config.caflouToken;
    const companyId = config.caflouCompanyId;

    // Sestavení začátku a konce měsíce
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // Caflou API endpoint pro seznam výkazů je standardně 'entries'
    // filtry posíláme jako params
    const queryParams = new URLSearchParams();
    queryParams.set('per', '1000');
    queryParams.set('filter[start_date]', startDate);
    queryParams.set('filter[end_date]', endDate);
    if (companyId) {
      queryParams.set('filter[company_ids]', companyId);
    }

    const entriesPath = `/v1/timesheets?${queryParams.toString()}`;
    console.log(`[Caflou API] Volám přes fetchCaflou: ${entriesPath}`);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'User-Agent': 'QHub-App/1.0.0 (NodeFetch; contact@q-hub.cz)'
    };
    if (companyId) {
      headers['X-Company-Id'] = companyId;
    }

    const response = await fetchCaflou(entriesPath, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Caflou API Error]', response.status, errText);
      throw new Error(`Volání Caflou API vrací status ${response.status}. Zpráva: ${errText || 'Neautorizováno'}`);
    }

    const rawData: any = await response.json();
    // Caflou vrací většinou rovnou pole nebo pole zabalené v { data: [...] }
    const entries = Array.isArray(rawData) ? rawData : (rawData.results || rawData.data || rawData.entries || []);

    const report = processCaflouEntries(entries, qhubUsers, rates, month, year);
    return res.json({ report, isDemo: false });

  } catch (err: any) {
    console.error('[Caflou] Selhalo spojení s reálným API:', err.message);
    return res.status(500).json({
      error: `Reálné propojení s Caflou selhalo (${err.message}).`
    });
  }
});

// Helper: Agreguje výkazy z Caflou a dává do kupy přehled k výplatě
function processCaflouEntries(entries: any[], qhubUsers: any[], rates: UserRates, month: number, year: number) {
  const aggregated: Record<string, {
    email: string;
    hours: number;
    tasks: string[];
    taskCount: number;
  }> = {};

  entries.forEach(entry => {
    const email = findEmailInObject(entry);
    if (!email) return;

    const normEmail = email.toLowerCase().trim();

    // Hledáme odpracované hodiny robustně napříč možnými názvy atributů v Caflou
    let hours = 0;
    if (typeof entry.hours === 'number') {
      hours = entry.hours;
    } else if (typeof entry.duration === 'number') {
      // Pokud je duration v sekundách (často v Caflou bývá nad 100 sekund)
      hours = entry.duration > 120 ? entry.duration / 3600 : entry.duration;
    } else if (typeof entry.quantity === 'number') {
      hours = entry.quantity;
    } else if (entry.p_duration && typeof entry.p_duration === 'number') {
      hours = entry.p_duration > 120 ? entry.p_duration / 3600 : entry.p_duration;
    } else {
      // Zkusíme parsovat string hodnoty
      const pVal = parseFloat(entry.hours || entry.duration || entry.quantity || entry.time || '1');
      if (!isNaN(pVal)) {
        hours = pVal > 120 ? pVal / 3600 : pVal;
      } else {
        hours = 1.0;
      }
    }

    const title = entry.title || entry.name || entry.description || 'Položka práce';

    if (!aggregated[normEmail]) {
      aggregated[normEmail] = {
        email: normEmail,
        hours: 0,
        tasks: [],
        taskCount: 0
      };
    }

    aggregated[normEmail].hours += hours;
    aggregated[normEmail].taskCount += 1;
    if (aggregated[normEmail].tasks.length < 4) {
      aggregated[normEmail].tasks.push(title);
    }
  });

  // Nyní napasujeme agregované záznamy na naše uživatele
  const report = Object.values(aggregated).map(item => {
    const user = qhubUsers.find(u => u.email.toLowerCase().trim() === item.email);
    const hourlyRate = rates[item.email] || 0;
    const roundedHours = parseFloat(item.hours.toFixed(1));
    const payoutAmount = Math.round(roundedHours * hourlyRate);

    // Zkontrolujeme v profitHistory, zda za tento měsíc již nebyla schválena výplata ze stejné integrace Caflou
    let alreadyPaid = false;
    if (user && Array.isArray(user.profitHistory)) {
      const matchString = `Výplata Caflou (${month}/${year})`;
      alreadyPaid = user.profitHistory.some((historyEntry: any) => 
        historyEntry.note && historyEntry.note.includes(matchString)
      );
    }

    return {
      email: item.email,
      hours: roundedHours,
      taskCount: item.taskCount,
      tasks: item.tasks,
      userFound: !!user,
      userId: user?.id,
      userName: user?.name || null,
      hourlyRate,
      payoutAmount,
      alreadyPaid
    };
  });

  return report;
}

// 7. Vyplacení odměn (Připsání financialProfit, profitHistory, XP a poslání zprávy)
router.post('/api/caflou/payout', async (req, res) => {
  const { userId, amount, hours, month, year, xpReward } = req.body ?? {};

  if (!userId) {
    return res.status(400).json({ error: 'Nebylo zadáno ID uživatele k vyplacení.' });
  }

  try {
    const user = await prisma.qhubUser.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Uživatel s tímto ID nebyl nalezen.' });
    }

    const freshProfit = (user.financialProfit ?? 0) + parseFloat(amount || 0);
    const currentHistory = Array.isArray(user.profitHistory) ? user.profitHistory : [];
    
    // Sestavíme unikátní poznámku o výplatě
    const payoutNote = `Výplata Caflou (${month}/${year}) za odpracovaných ${parseFloat(hours || 0).toFixed(1)} hod.`;

    // Přidáme novou položku historie zisků
    const newHistoryEntry = {
      id: `caflou-pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount || 0),
      note: payoutNote
    };
    const updatedHistory = [newHistoryEntry, ...currentHistory];

    // Výpočet XP a případný Level up
    let updatedXp = user.xp;
    let updatedLevel = user.level;
    const xpToAdd = parseInt(xpReward || 0);

    if (xpToAdd > 0) {
      // Zkontrolujeme zda má aktivní double XP Boost
      const isBoosted = user.xpBoostUntil && new Date(user.xpBoostUntil) > new Date();
      const actualXpToAdd = isBoosted ? xpToAdd * 2 : xpToAdd;
      updatedXp = user.xp + actualXpToAdd;
      updatedLevel = await calculateUserLevel(updatedXp);
    }

    // Sestavíme slavnostní zprávu uživateli do pošty
    const systemNotice = {
      id: `caflou-paymsg-${Date.now()}`,
      sender: 'Finanční Úřad Q-Hubu 💸',
      subject: `Tvá výplata za ${month}/${year} byla úspěšně schválena!`,
      body: `Zdravíme Tě, ${user.name || 'člene týmu'}!\n\nAdministrátor právě schválil tvou měsíční výplatu na základě výkazů odpracovaného času stažených ze systému Caflou.cz.\n\n📊 **Detaily vyplacení:**\n- **Období:** ${month}/${year}\n- **Celkem odpracováno:** ${parseFloat(hours || 0).toFixed(1)} hodin\n- **Připsaná odměna do profilu:** +${amount.toLocaleString()} Kč\n${xpToAdd > 0 ? `- **Získané bonusové XP:** +${xpToAdd} bodů\n` : ''}\nGratulujeme k výborným výsledkům a děkujeme za odvedenou práci. Tvá herní peněženka i herní profil byly ihned aktualizovány!`,
      date: new Date().toISOString(),
      read: false
    };

    const currentMessages = Array.isArray(user.messages) ? user.messages : [];
    const updatedMessages = [systemNotice, ...currentMessages];

    await prisma.qhubUser.update({
      where: { id: user.id },
      data: {
        financialProfit: freshProfit,
        profitHistory: updatedHistory as any,
        xp: updatedXp,
        /* level was removed here to prevent overriding admin configuration */
        messages: updatedMessages as any
      }
    });

    return res.json({
      success: true,
      newProfit: freshProfit,
      newXp: updatedXp,
      newLevel: updatedLevel
    });

  } catch (err: any) {
    console.error('[Caflou Payout Error]', err);
    return res.status(500).json({ error: 'Nezdařilo se provést výplatu.', details: err?.message });
  }
});

// ============================================================================
// --- ROBUSTNÍ ODŇEŇOVACÍ SYSTÉM PRO OBCHODNÍKY (OZ / QAPI.CZ COMS) ---
// ============================================================================

const OZ_DATA_FILE = path.join(process.cwd(), 'caflou_oz_data.json');

// Interface types
export interface OZOrder {
  id: string;
  email: string;
  contractNumber: string;
  customerName: string;
  description: string;
  date: string;
  amount: number;
  discount: number;
  status: 'completed' | 'pending';
  payoutMonth?: string;
  customCommissionPercent?: number;
}

export interface OZUserConfig {
  email: string;
  userType: 'commission' | 'fix' | 'both';
  fixRate: number;
  customRates?: {
    b1: number;
    b2: number;
    b3: number;
    b4: number;
  };
}

export interface OZAdjustment {
  id: string;
  email: string;
  type: 'fine' | 'bonus';
  amount: number;
  reason: string;
  date: string;
  month: string;
}

export interface OZDataContainer {
  userConfigs: Record<string, OZUserConfig>;
  orders: OZOrder[];
  adjustments: OZAdjustment[];
  payouts: any[];
  defaultBillingMonth?: string;
}

// Helpers for reading/writing our robust sales data
function readOZData(): OZDataContainer {
  try {
    if (fs.existsSync(OZ_DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(OZ_DATA_FILE, 'utf-8'));
      const rawOrders: OZOrder[] = parsed.orders || [];
      const cleanOrders = rawOrders.filter(o => o.id && (o.id.startsWith('caflou-prj-') || o.id.startsWith('ord-')));
      const rawAdjustments: OZAdjustment[] = parsed.adjustments || [];
      const cleanAdjustments = rawAdjustments.filter(a => a.id && a.id.startsWith('adj-'));
      
      return {
        userConfigs: parsed.userConfigs || {},
        orders: cleanOrders,
        adjustments: cleanAdjustments,
        payouts: parsed.payouts || [],
        defaultBillingMonth: parsed.defaultBillingMonth || '2026-06'
      };
    }
  } catch (e) {
    console.error('[Caflou OZ] Failed to read OZ data:', e);
  }
  return { userConfigs: {}, orders: [], adjustments: [], payouts: [], defaultBillingMonth: '2026-06' };
}

function writeOZData(data: OZDataContainer) {
  try {
    fs.writeFileSync(OZ_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Caflou OZ] Failed to write OZ data:', e);
  }
}

// 1. Get all OZ Sales statistics, orders, adjustments, layouts
router.get('/api/caflou/oz/data', async (req, res) => {
  const data = readOZData();
  return res.json(data);
});

// 1b. Update default billing month
router.post('/api/caflou/oz/default-month', async (req, res) => {
  const { defaultBillingMonth } = req.body ?? {};
  if (!defaultBillingMonth || !defaultBillingMonth.match(/^\d{4}-\d{2}$/)) {
    return res.status(400).json({ error: 'Neplatný formát měsíce (očekáván YYYY-MM).' });
  }

  const data = readOZData();
  data.defaultBillingMonth = defaultBillingMonth;
  writeOZData(data);

  return res.json({ ok: true, defaultBillingMonth: data.defaultBillingMonth });
});

// 2. Put order (upsert completed job / contract)
router.post('/api/caflou/oz/orders', async (req, res) => {
  const data = readOZData();
  const order = req.body ?? {};
  
  if (!order.email || !order.customerName || !order.amount) {
    return res.status(400).json({ error: 'Chybí povinné údaje zakázky (email, odběratel, částka).' });
  }

  const newOrder: OZOrder = {
    id: order.id || `ord-${Date.now()}`,
    email: order.email.toLowerCase().trim(),
    contractNumber: order.contractNumber || `S${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    customerName: order.customerName,
    description: order.description || 'Montáž oken / stínící technika',
    date: order.date || new Date().toISOString().split('T')[0],
    amount: parseFloat(order.amount),
    discount: parseFloat(order.discount || 0),
    status: order.status || 'completed',
    payoutMonth: order.payoutMonth || undefined,
    customCommissionPercent: (order.customCommissionPercent !== undefined && order.customCommissionPercent !== null && order.customCommissionPercent !== '') ? parseFloat(order.customCommissionPercent) : undefined
  };

  const existingIndex = data.orders.findIndex(o => o.id === newOrder.id);
  if (existingIndex > -1) {
    data.orders[existingIndex] = newOrder;
  } else {
    data.orders.push(newOrder);
  }

  writeOZData(data);
  return res.json({ ok: true, order: newOrder });
});

// 3. Delete order
router.delete('/api/caflou/oz/orders/:id', async (req, res) => {
  const data = readOZData();
  const filtered = data.orders.filter(o => o.id !== req.params.id);
  data.orders = filtered;
  writeOZData(data);
  return res.json({ ok: true });
});

// 4. Update OZ User configurations (Fix versus Commission settings)
router.post('/api/caflou/oz/config', async (req, res) => {
  const data = readOZData();
  const { email, userType, fixRate, customRates } = req.body ?? {};

  if (!email) {
    return res.status(400).json({ error: 'Email uživatele je povinný.' });
  }

  const normEmail = email.toLowerCase().trim();
  data.userConfigs[normEmail] = {
    email: normEmail,
    userType: userType || 'commission',
    fixRate: parseFloat(fixRate || 0),
    customRates: customRates ? {
      b1: parseFloat(customRates.b1 || 8),
      b2: parseFloat(customRates.b2 || 10),
      b3: parseFloat(customRates.b3 || 11),
      b4: parseFloat(customRates.b4 || 12)
    } : undefined
  };

  writeOZData(data);
  return res.json({ ok: true, config: data.userConfigs[normEmail] });
});

// 5. Post Manual Adjustment (pokuta nebo odměna)
router.post('/api/caflou/oz/adjustments', async (req, res) => {
  const data = readOZData();
  const adj = req.body ?? {};

  if (!adj.email || !adj.type || !adj.amount || !adj.month) {
    return res.status(400).json({ error: 'Chybí povinná data úpravy (email, typ odeslání, částka, měsíc).' });
  }

  const newAdj: OZAdjustment = {
    id: adj.id || `adj-${Date.now()}`,
    email: adj.email.toLowerCase().trim(),
    type: adj.type as 'fine' | 'bonus',
    amount: Math.abs(parseFloat(adj.amount)),
    reason: adj.reason || (adj.type === 'fine' ? 'Sankce za prodlení' : 'Mimořádný výkon obchodu'),
    date: adj.date || new Date().toISOString().split('T')[0],
    month: adj.month // e.g., "2026-05"
  };

  const existingIndex = data.adjustments.findIndex(a => a.id === newAdj.id);
  if (existingIndex > -1) {
    data.adjustments[existingIndex] = newAdj;
  } else {
    data.adjustments.push(newAdj);
  }

  writeOZData(data);
  return res.json({ ok: true, adjustment: newAdj });
});

// 6. Delete Manual Adjustment
router.delete('/api/caflou/oz/adjustments/:id', async (req, res) => {
  const data = readOZData();
  data.adjustments = data.adjustments.filter(a => a.id !== req.params.id);
  writeOZData(data);
  return res.json({ ok: true });
});

// 7. Process & finalize payout for sales obrat / commission system
router.post('/api/caflou/oz/payout', async (req, res) => {
  const { email, month, xpReward } = req.body ?? {};

  if (!email || !month) {
    return res.status(400).json({ error: 'Nebyly předány potřebné informace (email, měsíc "YYYY-MM").' });
  }

  const normEmail = email.toLowerCase().trim();
  const dbUser = await prisma.qhubUser.findUnique({ where: { email: normEmail } });

  if (!dbUser) {
    return res.status(404).json({ error: `Uživatel s e-mailem ${normEmail} nebyl nalezen v Q-Hub databázi.` });
  }

  const data = readOZData();
  const userConfig = data.userConfigs[normEmail] || { userType: 'commission', fixRate: 0 };
  
  // Find completed orders for this user in selected month that aren't already locked in payout
  const userMonthOrders = data.orders.filter(o => 
    o.email === normEmail && 
    o.status === 'completed' && 
    (!o.payoutMonth || o.payoutMonth === month) &&
    o.date.startsWith(month)
  );

  // Calculate Cumulative volume (obrat)
  const totalVolume = userMonthOrders.reduce((sum, o) => sum + o.amount, 0);

  // Math logic helper to find individual order commission rates
  const getCommissionRate = (vol: number, discount: number, config: any) => {
    let r1 = config?.customRates?.b1 ?? 8;
    let r2 = config?.customRates?.b2 ?? 10;
    let r3 = config?.customRates?.b3 ?? 11;
    let r4 = config?.customRates?.b4 ?? 12;

    const tier1 = discount >= 33 && discount <= 45; // reduced commission rate
    const tier2 = discount > 45 && discount <= 60; // strictly penalized

    if (vol <= 400000) {
      if (tier2) return 3;
      if (tier1) return 6;
      return r1;
    } else if (vol <= 700000) {
      if (tier2) return 5;
      if (tier1) return 8;
      return r2;
    } else if (vol <= 1000000) {
      if (tier2) return 6;
      if (tier1) return 9;
      return r3;
    } else {
      if (tier2) return 7;
      if (tier1) return 10;
      return r4;
    }
  };

  // Compute calculated commission values per order
  let calculatedCommission = 0;
  if (userConfig.userType === 'commission' || userConfig.userType === 'both') {
    userMonthOrders.forEach(o => {
      if (o.customCommissionPercent !== undefined && o.customCommissionPercent !== null) {
        calculatedCommission += o.amount * (o.customCommissionPercent / 100);
      } else {
        // If discount > 60%, commission is fully penalized to 0%
        const ratePerc = o.discount > 60 ? 0 : getCommissionRate(totalVolume, o.discount, userConfig);
        calculatedCommission += o.amount * (ratePerc / 100);
      }
    });
  }

  // Monthly Fix rate check
  const fixAmount = (userConfig.userType === 'fix' || userConfig.userType === 'both') ? userConfig.fixRate : 0;

  // Manual Adjustments (Bonuses & Fines)
  const monthAdjustments = data.adjustments.filter(a => a.email === normEmail && a.month === month);
  const bonusesAmount = monthAdjustments.filter(a => a.type === 'bonus').reduce((sum, a) => sum + a.amount, 0);
  const finesAmount = monthAdjustments.filter(a => a.type === 'fine').reduce((sum, a) => sum + a.amount, 0);

  // Total Final Payout
  const totalPayout = Math.max(0, Math.round(calculatedCommission + fixAmount + bonusesAmount - finesAmount));

  // Flag orders as payout locked
  data.orders.forEach(o => {
    if (
      o.email === normEmail && 
      o.status === 'completed' && 
      (!o.payoutMonth || o.payoutMonth === month) &&
      o.date.startsWith(month)
    ) {
      o.payoutMonth = month;
    }
  });

  // Store final approved payout record
  const payoutRecord = {
    id: `pay-${Date.now()}-${Math.floor(Math.random()*900+100)}`,
    email: normEmail,
    month: month,
    baseCommission: Math.round(calculatedCommission),
    fixAmount,
    finesAmount,
    bonusesAmount,
    totalPayout,
    datePaid: new Date().toISOString().split('T')[0],
    status: 'paid'
  };
  
  data.payouts.push(payoutRecord);
  writeOZData(data);

  // Process inside DB: financialProfit + profitHistory
  const currentHistory = Array.isArray(dbUser.profitHistory) ? dbUser.profitHistory : [];
  const payoutNote = `Obchodní provize (${month}) - Výplata OZ [Volume: ${totalVolume.toLocaleString()} Kč]`;
  
  const dbProfitEntry = {
    id: `ozpay-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    amount: totalPayout,
    note: payoutNote
  };

  const updatedHistory = [dbProfitEntry, ...currentHistory];
  const freshProfit = (dbUser.financialProfit ?? 0) + totalPayout;

  // Calculate XP & levels up (customizable)
  let updatedXp = dbUser.xp;
  let updatedLevel = dbUser.level;
  const xpToAdd = parseInt(xpReward || 0);

  if (xpToAdd > 0) {
    const isBoosted = dbUser.xpBoostUntil && new Date(dbUser.xpBoostUntil) > new Date();
    const actualXpToAdd = isBoosted ? xpToAdd * 2 : xpToAdd;
    updatedXp = dbUser.xp + actualXpToAdd;
    updatedLevel = await calculateUserLevel(updatedXp);
  }

  // System notification inbox build
  const payoutMail = {
    id: `ozpay-mail-${Date.now()}`,
    sender: 'Mzdová Účtárna QAPI 🏢',
    subject: `Obchodní výplata a výpočty provizí za ${month} schváleny!`,
    body: `Ahoj ${dbUser.name || 'obchodníku'},\n\nprávě ti byla schválena a odeslána výplata provizí za období **${month}**.\n\n📊 **Uzavřený mzdový přehled:**\n- **Obrat uskutečněných zakázek:** ${totalVolume.toLocaleString()} Kč\n- **Vypočtená provize:** +${Math.round(calculatedCommission).toLocaleString()} Kč\n- **Fixní paušál (Fix):** +${fixAmount.toLocaleString()} Kč\n- **Mimořádné odměny:** +${bonusesAmount.toLocaleString()} Kč\n- **Sankce/Pokuty:** -${finesAmount.toLocaleString()} Kč\n\n💰 **CELKOVÁ VYPLACENÁ ČÁSTKA:** **${totalPayout.toLocaleString()} Kč**\n\nTvá peněženka na Q-Hubu byla aktualizována. Děkujeme ti za skvělou obchodní aktivitu!`,
    date: new Date().toISOString(),
    read: false
  };

  const currentMessages = Array.isArray(dbUser.messages) ? dbUser.messages : [];
  const updatedMessages = [payoutMail, ...currentMessages];

  await prisma.qhubUser.update({
    where: { id: dbUser.id },
    data: {
      financialProfit: freshProfit,
      profitHistory: updatedHistory as any,
      xp: updatedXp,
      /* level was removed here to prevent overriding admin configuration */
      messages: updatedMessages as any
    }
  });

  return res.json({
    ok: true,
    message: 'Provize byly úspěšně propočteny, uzamčeny a zapsány do financí uživatele.',
    record: payoutRecord
  });
});

// 7b. Delete / Revert payout record
router.delete('/api/caflou/oz/payout', async (req, res) => {
  const { email, entryId } = req.query ?? {};

  if (!email || !entryId) {
    return res.status(400).json({ error: 'Chybí parametry email nebo entryId.' });
  }

  const normEmail = (email as string).toLowerCase().trim();
  const dbUser = await prisma.qhubUser.findUnique({ where: { email: normEmail } });

  if (!dbUser) {
    return res.status(404).json({ error: `Uživatel s e-mailem ${normEmail} nebyl nalezen.` });
  }

  const currentHistory = Array.isArray(dbUser.profitHistory) ? dbUser.profitHistory : [];
  const entryToDelete = currentHistory.find((entry: any) => entry.id === entryId);

  if (!entryToDelete) {
    return res.status(404).json({ error: 'Záznam o výplatě v historii nebyl nalezen.' });
  }

  const updatedHistory = currentHistory.filter((entry: any) => entry.id !== entryId);
  const freshProfit = Math.max(0, (dbUser.financialProfit ?? 0) - (entryToDelete.amount || 0));

  const monthMatch = (entryToDelete.note || '').match(/\((\d{4}-\d{2})\)/);
  const payoutMonth = monthMatch ? monthMatch[1] : null;

  const data = readOZData();
  
  if (payoutMonth) {
    data.payouts = data.payouts.filter(p => !(p.email.toLowerCase() === normEmail && p.month === payoutMonth));

    data.orders.forEach(o => {
      if (o.email.toLowerCase() === normEmail && o.payoutMonth === payoutMonth) {
        o.payoutMonth = undefined;
      }
    });

    writeOZData(data);
  }

  await prisma.qhubUser.update({
    where: { id: dbUser.id },
    data: {
      financialProfit: freshProfit,
      profitHistory: updatedHistory as any
    }
  });

  return res.json({
    ok: true,
    message: 'Výplata byla úspěšně smazána z historie, finance byly odečteny a zakázky odemčeny.'
  });
});

// 8. Dispute / Claim - Creates a real support ticket automatically in DB
router.post('/api/caflou/oz/reklamace', async (req, res) => {
  const { email, subject, text } = req.body ?? {};

  if (!email || !subject || !text) {
    return res.status(400).json({ error: 'Chybí povinná data reklamace (email, předmět, zpráva).' });
  }

  const normEmail = email.toLowerCase().trim();
  const dbUser = await prisma.qhubUser.findUnique({ where: { email: normEmail } });

  if (!dbUser) {
    return res.status(404).json({ error: 'Uživatel s tímto e-mailem neexistuje v systému.' });
  }

  // Create real ticket
  const ticket = await prisma.qhubTicket.create({
    data: {
      userId: dbUser.id,
      userEmail: normEmail,
      subject: `🚨 [REKLAMACE PROVIZE] ${subject}`,
      priority: 'high',
      status: 'open',
      messages: [
        {
          sender: 'user',
          text: `Automatický systém: Uživatel zahájil reklamaci mzdového plnění.\n\nPodrobný popis reklamace:\n${text}`,
          timestamp: new Date().toISOString()
        }
      ] as any
    }
  });

  return res.json({
    ok: true,
    message: `Reklamace byla úspěšně zaregistrována. Byl vytvořen prioritní ticket s ID #${ticket.id}. Naše podpora či MNG se na to okamžitě podívá.`,
    ticketId: ticket.id
  });
});

router.post('/api/caflou/finished-projects', async (req, res) => {
  const { month, year } = req.body;
  const config = readConfig();
  
  if (!config.caflouToken) {
    return res.status(401).json({ success: false, message: 'Chybí Caflou Token' });
  }

  try {
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    console.log(`[Caflou] Vyhledávám projekty dokončené pro ${month}/${year}`);

    let projects: any[] = [];
    let allCaflouUsers: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const queryParams = new URLSearchParams();
      queryParams.set('per', '100');
      queryParams.set('page', String(page));
      // Optional: limit processing by not going too far back if we have thousands of projects
      // But for accuracy we'll fetch until total_pages
      
      const projectsPath = `/v1/projects?${queryParams.toString()}`;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.caflouToken}`,
        'Accept': 'application/json'
      };

      const [response, usersResp] = await Promise.all([
        fetchCaflou(projectsPath, { method: 'GET', headers }),
        page === 1 ? fetchCaflou('/v1/users?per=1000', { method: 'GET', headers }) : Promise.resolve(null)
      ]);

      if (!response.ok) {
        throw new Error(`Chyba API Caflou (Projects): ${response.status} ${await response.text()}`);
      }

      if (usersResp && usersResp.ok) {
        const uData = await usersResp.json();
        allCaflouUsers = Array.isArray(uData) ? uData : (uData.results || uData.data || uData.users || []);
      }

      const rawData = await response.json();
      const pageResults = Array.isArray(rawData) ? rawData : (rawData.results || rawData.data || rawData.projects || []);
      projects = projects.concat(pageResults);
      
      if (rawData.total_pages && page < rawData.total_pages) {
        page++;
      } else if (!rawData.total_pages && pageResults.length === 100) {
        // Fallback for missing total_pages but max results returned
        page++;
      } else {
        hasMore = false;
      }
      
      // Safety limit to avoid endless loop
      if (page > 30) hasMore = false;
    }

    projects = projects.filter((p: any) => p.project_status_name === 'Máme hotovo' || p.project_status_name === 'Dokončeno');
    
    projects = projects.filter((p: any) => {
      // Prioritizujeme datum realizace, konec projektu, start projektu, nebo až nakonec finished_at
      const dateTarget = p.custom_column_realizovano || p.end_date || p.start_date || p.finished_at || p.updated_at;
      if (!dateTarget) return false;
      const d = new Date(dateTarget);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    // Map user email
    projects = projects.map((p: any) => {
      let userEmail: string | undefined = undefined;

      // Zkusíme najít obchodníka podle custom sloupce `custom_column_planovany_obchodnik1`
      let obchodnikName = null;
      if (p.custom_column_planovany_obchodnik1) {
        obchodnikName = Array.isArray(p.custom_column_planovany_obchodnik1) 
           ? p.custom_column_planovany_obchodnik1[0] 
           : p.custom_column_planovany_obchodnik1;
      }

      if (obchodnikName && obchodnikName !== 'Vyber když plánuješ realizaci!') {
         const matchedUser = allCaflouUsers.find(u => 
            u.name?.toLowerCase().includes(obchodnikName.toLowerCase()) || 
            u.first_name?.toLowerCase().includes(obchodnikName.toLowerCase()) ||
            u.short_name?.toLowerCase().includes(obchodnikName.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(obchodnikName.toLowerCase())
         );
         if (matchedUser) {
            userEmail = matchedUser.email;
         }
      }

      let userName = obchodnikName;

      if (!userEmail) {
         const u = allCaflouUsers.find(u => u.id === p.user_id);
         if (u && !u.name?.includes('Qapi') && !u.email?.includes('qapi.cz@gmail')) {
           userEmail = u.email;
           userName = u.name;
         }
      }
      return {
        ...p,
        _mappedUserEmail: userEmail || null,
        _mappedUserName: userName || 'Neznámý'
      };
    });

    // We also need OZ Configs to do calculations locally or send them along
    const ozData = readOZData();

    // NAČÍTÁNÍ FAKTUR PRO MOŽNÉ SPÁROVÁNÍ SLEVY Z POLOŽEK (POLOŽKA 'sale')
    let allInvoices: any[] = [];
    try {
      console.log('[Caflou] Načítám nedávné faktury pro automatické párování slev...');
      const invoicesHeaders: Record<string, string> = {
        'Authorization': `Bearer ${config.caflouToken}`,
        'Accept': 'application/json'
      };
      
      const [invResp1, invResp2] = await Promise.all([
        fetchCaflou('/v1/invoices?per=100&page=1', { method: 'GET', headers: invoicesHeaders }),
        fetchCaflou('/v1/invoices?per=100&page=2', { method: 'GET', headers: invoicesHeaders }).catch(() => null)
      ]);
      
      if (invResp1 && invResp1.ok) {
        const invData = await invResp1.json();
        const list1 = Array.isArray(invData) ? invData : (invData.results || invData.data || invData.invoices || []);
        allInvoices = allInvoices.concat(list1);
      }
      if (invResp2 && invResp2.ok) {
        const invData = await invResp2.json();
        const list2 = Array.isArray(invData) ? invData : (invData.results || invData.data || invData.invoices || []);
        allInvoices = allInvoices.concat(list2);
      }
      console.log(`[Caflou] Staženo celkem ${allInvoices.length} faktur k analýze.`);
    } catch (err: any) {
      console.warn(`[Caflou] Nepodařilo se načíst faktury pro slevy:`, err.message || err);
    }

    // Vyrovnávací paměť pro stažené detaily faktur během tohoto požadavku (abychom tutéž fakturu nestahovali víckrát)
    const invoiceDetailsCache: Record<string, any> = {};
    
    // Nové: V momentě načítání zakázek automaticky synchronizujeme (upsertujeme)
    // dokončené zakázky do lokálního úložiště pro účely Provizního systému OZ.
    let updatedOzOrders = false;
    
    for (const p of projects) {
      const amount = parseFloat(p.custom_column_celkova_hodnota || p.earnings_price) || 0;
      if (amount <= 0) continue;

      let detectedDiscount = 0;
      
      // Hledáme spárované faktury k projektu p.id
      const matchingInvoices = allInvoices.filter((inv: any) => {
        const pIdStr = String(p.id);
        const invProjId = inv.project_id ? String(inv.project_id) : null;
        const invProjIdNested = (inv.project && inv.project.id) ? String(inv.project.id) : null;
        return invProjId === pIdStr || invProjIdNested === pIdStr;
      });

      if (matchingInvoices.length > 0) {
        console.log(`[Caflou] K projektu ID ${p.id} byly nalezeny ${matchingInvoices.length} faktury.`);
        for (const inv of matchingInvoices) {
          let items = inv.invoice_items || inv.invoice_items_attributes || inv.items;
          
          // Pokud u faktury v seznamu nejsou položky, stáhneme si její kompletní detail
          if (!items || !Array.isArray(items) || items.length === 0) {
            const cacheKey = String(inv.id);
            if (invoiceDetailsCache[cacheKey]) {
              items = invoiceDetailsCache[cacheKey];
            } else {
              try {
                console.log(`[Caflou] Stahuji detail položek pro fakturu ID ${inv.id}...`);
                const detHeaders: Record<string, string> = {
                  'Authorization': `Bearer ${config.caflouToken}`,
                  'Accept': 'application/json'
                };
                const detResp = await fetchCaflou(`/v1/invoices/${inv.id}`, { method: 'GET', headers: detHeaders });
                if (detResp.ok) {
                  const detData = await detResp.json();
                  const fetchedItems = detData.invoice_items || detData.invoice_items_attributes || detData.items || [];
                  invoiceDetailsCache[cacheKey] = fetchedItems;
                  items = fetchedItems;
                }
              } catch (detErr: any) {
                console.warn(`[Caflou] Chyba při načítání detailu faktury ${inv.id}:`, detErr.message || detErr);
              }
            }
          }

          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              // Načteme slevu ("sale") z položky faktury
              const saleVal = parseFloat(item.sale ?? item.discount ?? item.discount_percent ?? 0) || 0;
              if (saleVal > detectedDiscount) {
                detectedDiscount = saleVal;
              }
            });
          }
        }
      }
      
      // Fallback: Pokud jsme nezískali žádnou slevu z položek faktur, použijeme regex z popisu jako dosud
      let discount = detectedDiscount;
      if (discount <= 0) {
        const desc = p.description || p.description_original || p.name || '';
        const match = desc.match(/sleva\s*(\d+)%?/i);
        discount = match ? parseInt(match[1]) : 0;
      }

      const dateValue = p.custom_column_realizovano || p.end_date || p.start_date || p.finished_at || p.updated_at || p.created_at;
      let dateStr = new Date().toISOString().split('T')[0];
      if (dateValue) {
          dateStr = new Date(dateValue).toISOString().split('T')[0];
      }
      
      const orderId = `caflou-prj-${p.id}`;
      const newOrder: OZOrder = {
        id: orderId,
        email: (p._mappedUserEmail || 'neznamy@qapi.cz').toLowerCase().trim(),
        contractNumber: `Projekt ${p.id}`,
        customerName: p.company_name || 'Neznámý zákazník',
        description: p.name,
        date: dateStr,
        amount: amount,
        discount: discount,
        status: 'completed',
        payoutMonth: undefined
      };

      const existingIndex = ozData.orders.findIndex((o: any) => o.id === orderId);
      if (existingIndex > -1) {
        // Pouze aktualizujeme pokud je to nutné
        ozData.orders[existingIndex] = { ...ozData.orders[existingIndex], ...newOrder };
      } else {
        ozData.orders.push(newOrder);
      }
      updatedOzOrders = true;
    }

    if (updatedOzOrders) {
      writeOZData(ozData); // ULOŽ DO LOKÁLNÍ DATABÁZE V REALTIME
      console.log(`[Caflou] OZ data byla úspěšně synchronizována a uložena.`);
    }

    res.json({ success: true, projects, ozData, caflouUsers: allCaflouUsers });

  } catch (e: any) {
    console.error('[Caflou /finished-projects Error]:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
