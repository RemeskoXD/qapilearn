import { Router } from 'express';
import { prisma } from '../prisma.js';
import { env } from '../lib/env.js';

const router = Router();

// Pomocná funkce pro bezpečné ověření hesla
function checkSecret(req: any) {
  const inputSecret = req.headers['x-db-secret'] || req.body?.secret || req.query?.secret;
  return inputSecret === env.DB_CHECK_SECRET;
}

const MODELS_TO_CHECK = [
  { key: 'qhubUser', table: 'qhub_users', name: 'Uživatelé' },
  { key: 'qhubCourse', table: 'qhub_courses', name: 'Kurzy' },
  { key: 'qhubQuiz', table: 'qhub_quizzes', name: 'Kvízy' },
  { key: 'qhubMentor', table: 'qhub_mentors', name: 'Mentoři' },
  { key: 'qhubBooking', table: 'qhub_bookings', name: 'Rezervace (Bookings)' },
  { key: 'qhubCalendarEvent', table: 'qhub_events', name: 'Kalendář / Události' },
  { key: 'qhubStream', table: 'qhub_streams', name: 'Streamy' },
  { key: 'qhubEbook', table: 'qhub_ebooks', name: 'E-knihy' },
  { key: 'qhubTicket', table: 'qhub_tickets', name: 'Podpora (Tikety)' },
  { key: 'qhubBonusTask', table: 'qhub_bonus_tasks', name: 'Bonusové úkoly' },
  { key: 'qhubBonusSubmission', table: 'qhub_bonus_submissions', name: 'Odevzdané bonusy' },
  { key: 'qhubArtifact', table: 'qhub_artifacts', name: 'Artefakty' },
  { key: 'qhubChallenge', table: 'qhub_challenges', name: 'Výzvy' },
  { key: 'qhubCommunitySession', table: 'qhub_community_sessions', name: 'Komunitní lekce' },
  { key: 'qhubLevel', table: 'qhub_levels', name: 'Gamifikace (Levely)' },
  { key: 'qhubSystemSettings', table: 'qhub_settings', name: 'Systémové nastavení' },
];

router.post('/status', async (req, res) => {
  if (!checkSecret(req)) {
    return res.status(401).json({ error: 'Neplatné tajné heslo pro přístup.' });
  }

  try {
    // 1. Otestovat připojení
    let connectionOk = false;
    let connectionError = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      connectionOk = true;
    } catch (err: any) {
      connectionError = err?.message || 'Chyba při dotazování SELECT 1';
    }

    // 2. Tabulky a počty záznamů
    const tablesStatus = [];
    for (const mod of MODELS_TO_CHECK) {
      if (!connectionOk) {
        tablesStatus.push({
          key: mod.key,
          table: mod.table,
          name: mod.name,
          exists: false,
          count: 0,
          error: 'Chybí připojení k databázi',
        });
        continue;
      }

      try {
        // @ts-ignore
        const count = await prisma[mod.key].count();
        tablesStatus.push({
          key: mod.key,
          table: mod.table,
          name: mod.name,
          exists: true,
          count,
          error: null,
        });
      } catch (err: any) {
        tablesStatus.push({
          key: mod.key,
          table: mod.table,
          name: mod.name,
          exists: false,
          count: 0,
          error: err?.message || 'Chyba při dotazování',
        });
      }
    }

    // 3. Kontrola seedovaných dat
    const checkItem = async (modelKey: string, id: string) => {
      if (!connectionOk) return false;
      try {
        // @ts-ignore
        const found = await prisma[modelKey].findUnique({ where: { id } });
        return !!found;
      } catch {
        return false;
      }
    };

    const seedsCheck = {
      challenges: {
        c1: await checkItem('qhubChallenge', 'c1'),
        c2: await checkItem('qhubChallenge', 'c2'),
        c3: await checkItem('qhubChallenge', 'c3'),
      },
      artifacts: {
        a1: await checkItem('qhubArtifact', 'a1'),
        a2: await checkItem('qhubArtifact', 'a2'),
        a3: await checkItem('qhubArtifact', 'a3'),
      },
      mentors: {
        m1: await checkItem('qhubMentor', 'm1'),
        m2: await checkItem('qhubMentor', 'm2'),
        m3: await checkItem('qhubMentor', 'm3'),
      },
      ebooks: {
        b1: await checkItem('qhubEbook', 'b1'),
        b2: await checkItem('qhubEbook', 'b2'),
      },
      streams: {
        s1: await checkItem('qhubStream', 's1'),
      },
      courses: {
        'course-1': await checkItem('qhubCourse', 'course-1'),
        'course-2': await checkItem('qhubCourse', 'course-2'),
        'course-3': await checkItem('qhubCourse', 'course-3'),
        'course-4': await checkItem('qhubCourse', 'course-4'),
      },
      quizzes: {
        'q-1': await checkItem('qhubQuiz', 'q-1'),
        'q-cc-1': await checkItem('qhubQuiz', 'q-cc-1'),
      },
      levelsCount: await (async () => {
        if (!connectionOk) return 0;
        try {
          return await prisma.qhubLevel.count();
        } catch {
          return 0;
        }
      })(),
      hasSettings: await (async () => {
        if (!connectionOk) return false;
        try {
          const s = await prisma.qhubSystemSettings.findUnique({ where: { id: 1 } });
          return !!s;
        } catch {
          return false;
        }
      })(),
    };

    res.json({
      ok: true,
      databaseUrlSet: !!env.DATABASE_URL,
      connectionOk,
      connectionError,
      tablesStatus,
      seedsCheck,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Nelze provést kontrolu.' });
  }
});

// Seedovací spustitelná akce přímo přes API
router.post('/seed', async (req, res) => {
  if (!checkSecret(req)) {
    return res.status(401).json({ error: 'Neplatné tajné heslo pro přístup.' });
  }

  try {
    // Import seed dat ad-hoc pro nahrání bez psaní duplicit
    const CHALLENGES = [
      { id: 'c1', title: 'Ranní budíček', description: 'Vstaň před 6:00 a začni pracovat.', type: 'daily', targetCount: 1, rewardXP: 100 },
      { id: 'c2', title: 'Cold Call Master', description: 'Udělej 10 studených hovorů.', type: 'daily', targetCount: 10, rewardXP: 250 },
      { id: 'c3', title: 'Studijní maratonec', description: 'Dokonči 3 lekce v jednom dni.', type: 'daily', targetCount: 3, rewardXP: 300 },
    ];

    const ARTIFACTS = [
      { id: 'a1', name: 'Lektvar soustředění', description: 'Zvyšuje zisk XP o 100% (2x) na 2 hodiny.', rarity: 'rare', type: 'consumable', image: '🧪', quantity: 0, effectType: 'xp_boost', effectDuration: 2 },
      { id: 'a2', name: 'VIP vstupenka', description: 'Vstup na soukromou akci s mentory.', rarity: 'legendary', type: 'ticket', image: '🎟️', quantity: 0 },
      { id: 'a3', name: 'Káva motivace', description: 'Doplní energi pro další úkoly.', rarity: 'common', type: 'consumable', image: '☕', quantity: 0 },
    ];

    const MENTORS = [
      { id: 'm1', name: 'Vašek Gabriel', role: 'Sales & Marketing', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800', bio: 'Expert na high-ticket sales.', hourlyRate: 0 },
      { id: 'm2', name: 'Ludvík Remešek', role: 'Brand Authority', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800', bio: 'Guru sociálních sítí.', hourlyRate: 0 },
      { id: 'm3', name: 'Vašek Rajchart', role: 'Mindset Coach', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800', bio: 'Psychologie výkonu.', hourlyRate: 0 },
    ];

    const EBOOKS = [
      { id: 'b1', title: 'Bible prodeje', description: '120 stránkový manuál pro uzavírání obchodů.', coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', pages: 120, author: 'Vašek Gabriel', downloadUrl: '#' },
      { id: 'b2', title: 'Instagram Dominance', description: 'Jak získat prvních 10k sledujících.', coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800', pages: 45, author: 'Ludvík Remešek', downloadUrl: '#' },
    ];

    const STREAMS = [
      { id: 's1', title: 'Q-Hub týdenní review', description: 'Pravidelné nedělní hodnocení.', thumbnail: 'https://images.unsplash.com/photo-1598550476439-c43e26b610c5?w=800', streamUrl: 'https://www.youtube.com/embed/live_stream', date: new Date(), status: 'upcoming', viewers: 0 },
    ];

    const COURSES = [
      {
        id: 'course-1',
        title: 'Sales Master: Od nuly k milionu',
        description: 'Kompletní průvodce prodejní psychologií, vyjednáváním a uzavíráním high-ticket klientů.',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600',
        level: 'student',
        author: 'Vašek Gabriel',
        totalDuration: 120,
        published: true,
        xpReward: 1000,
        learningPoints: ['Psychologie prodeje', 'Vyjednávání', 'Cold calling', 'High-ticket closing'],
        modules: [
          {
            id: 'mod-1',
            title: 'Úvod do prodeje',
            lessons: [
              { id: 'l-1', title: 'Mindset prodejce', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 15, isMandatory: true },
              { id: 'l-2', title: 'Základní pojmy', type: 'text', content: '# Prodejní terminologie\n\nZde se naučíte základní pojmy...', duration: 5, isMandatory: false },
            ],
          },
          {
            id: 'mod-2',
            title: 'Uzavírání',
            lessons: [
              {
                id: 'l-3',
                title: 'Ověření znalostí',
                type: 'quiz',
                content: '',
                duration: 10,
                isMandatory: true,
                questions: [{ id: 'q1', question: 'Co je to closing?', options: ['Otevření dveří', 'Uzavření obchodu', 'Ztráta klienta'], correctOptionIndex: 1 }],
              },
            ],
          },
        ],
      },
      {
        id: 'course-2',
        title: 'Social Media Dominance',
        description: 'Jak vybudovat silný osobní brand a monetizovat publikum.',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1600',
        level: 'premium',
        author: 'Ludvík Remešek',
        totalDuration: 180,
        published: true,
        xpReward: 2000,
        learningPoints: ['Algoritmus IG/TikTok', 'Virální obsah', 'Monetizace', 'Komunita'],
        modules: [
          {
            id: 'm-sm-1',
            title: 'Strategie obsahu',
            lessons: [
              { id: 'l-sm-1', title: 'Jak funguje algoritmus', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 20, isMandatory: true },
              { id: 'l-sm-2', title: 'Analýza konkurence', type: 'text', content: 'Textová lekce o analýze...', duration: 10, isMandatory: false },
            ],
          },
        ],
      },
      {
        id: 'course-3',
        title: 'AI Automatizace & Budoucnost',
        description: 'Ovládněte ChatGPT a automatizační nástroje pro 10x vyšší produktivitu.',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600',
        level: 'premium',
        author: 'Tomáš Veselý',
        totalDuration: 150,
        published: true,
        xpReward: 1500,
        learningPoints: ['Prompt Engineering', 'Make.com', 'Midjourney', 'AI v podpoře'],
        modules: [
          {
            id: 'm-ai-1',
            title: 'Úvod do AI',
            lessons: [
              { id: 'l-ai-1', title: 'Co je LLM', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 12, isMandatory: true },
            ],
          },
        ],
      },
      {
        id: 'course-4',
        title: 'Nezlomná disciplína: Mindset',
        description: 'Naučte se ovládat svou mysl, budovat návyky a eliminovat prokrastinaci.',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600',
        level: 'student',
        author: 'Vašek Rajchart',
        totalDuration: 90,
        published: true,
        xpReward: 500,
        learningPoints: ['Dopaminový detox', 'Ranní rutina', 'Deep work', 'Překonávání strachu'],
        modules: [
          {
            id: 'm-mind-1',
            title: 'Základy disciplíny',
            lessons: [
              { id: 'l-mind-1', title: 'Proč selháváme', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 15, isMandatory: true },
            ],
          },
        ],
      },
    ];

    const QUIZZES = [
      {
        id: 'q-1',
        title: 'Test podnikatelského IQ',
        description: 'Zjistěte, jak dobře rozumíte základním principům byznysu.',
        image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800',
        level: 'student',
        xpReward: 500,
        passingScore: 70,
        published: true,
        questions: [
          { id: 'qq1', question: 'Co je to ROI?', options: ['Regionální obchodní inspekce', 'Return on Investment', 'Risk of Inflation'], correctOptionIndex: 1 },
          { id: 'qq2', question: 'Který kanál je nejlepší pro B2B?', options: ['TikTok', 'LinkedIn', 'Snapchat'], correctOptionIndex: 1 },
        ],
      },
      {
        id: 'q-cc-1',
        title: 'Cold Calling: Průlom přes "Ne"',
        description: 'Otestujte své reakce na nejčastější námitky při studených hovorech.',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
        level: 'student',
        xpReward: 300,
        passingScore: 80,
        published: true,
        questions: [
          { id: 'q-cc-q1', question: 'Jaký je hlavní cíl prvních 10 vteřin cold callu?', options: ['Prodat produkt', 'Získat pozornost a koupit si čas', 'Představit historii firmy'], correctOptionIndex: 1 },
          { id: 'q-cc-q2', question: 'Klient řekne: "Pošlete mi to do mailu." Co odpovíte?', options: ['Jasně, hned to posílám.', 'Na jaký email?', 'Rád to pošlu, ale aby to dávalo smysl, potřebuji vědět jednu věc...'], correctOptionIndex: 2 },
        ],
      },
    ];

    const LEVELS = Array.from({ length: 100 }, (_, i) => ({
      level: i + 1,
      xpRequired: i * 1000,
      title: i < 5 ? 'Začátečník' : i < 10 ? 'Pokročilý' : i < 20 ? 'Expert' : 'Legenda',
    }));

    // Postupný upsert
    await prisma.qhubSystemSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, version: '1.0.0 Q-Hub' },
    });

    for (const item of CHALLENGES) {
      await prisma.qhubChallenge.upsert({ where: { id: item.id }, update: item, create: item });
    }
    for (const item of ARTIFACTS) {
      await prisma.qhubArtifact.upsert({ where: { id: item.id }, update: item, create: item });
    }
    for (const item of MENTORS) {
      await prisma.qhubMentor.upsert({ where: { id: item.id }, update: item, create: item });
    }
    for (const item of EBOOKS) {
      await prisma.qhubEbook.upsert({ where: { id: item.id }, update: item, create: item });
    }
    for (const s of STREAMS) {
      await prisma.qhubStream.upsert({ where: { id: s.id }, update: s, create: s });
    }
    for (const c of COURSES) {
      await prisma.qhubCourse.upsert({
        where: { id: c.id },
        update: { ...c, learningPoints: c.learningPoints as any, modules: c.modules as any },
        create: { ...c, learningPoints: c.learningPoints as any, modules: c.modules as any },
      });
    }
    for (const q of QUIZZES) {
      await prisma.qhubQuiz.upsert({
        where: { id: q.id },
        update: { ...q, questions: q.questions as any },
        create: { ...q, questions: q.questions as any },
      });
    }

    try {
      await prisma.qhubLevel.deleteMany({});
      await prisma.qhubLevel.createMany({ data: LEVELS });
    } catch (lvlErr) {
      console.error('Chyba při nahrávání levelů:', lvlErr);
    }

    res.json({ ok: true, message: 'Seeding dat úspěšně dokončen!' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Chyba při nahrávání seed dat.' });
  }
});

export default router;
