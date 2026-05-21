import { prisma } from '../prisma.js';

const CHALLENGES = [
  { id: 'c1', title: 'Ranní budíček', description: 'Vstaň před 6:00 a začni pracovat.', type: 'daily', targetCount: 1, rewardXP: 100 },
  { id: 'c2', title: 'Cold Call Master', description: 'Udělej 10 studených hovorů.', type: 'daily', targetCount: 10, rewardXP: 250 },
  { id: 'c3', title: 'Studijní maratonec', description: 'Dokonči 3 lekce v jednom dni.', type: 'daily', targetCount: 3, rewardXP: 300 },
];

const ARTIFACTS = [
  { id: 'a1', name: 'Lektvar soustředění', description: 'Zvyšuje zisk XP o 100% (2x) na 2 hodiny.', rarity: 'rare', type: 'consumable', image: '🧪', quantity: 0, effectType: 'xp_boost', effectDuration: 2 },
  { id: 'a2', name: 'VIP vstupenka', description: 'Vstup na soukromou akci s mentory.', rarity: 'legendary', type: 'ticket', image: '🎟️', quantity: 0 },
  { id: 'a3', name: 'Káva motivace', description: 'Doplní energii pro další úkoly.', rarity: 'common', type: 'consumable', image: '☕', quantity: 0 },
];

const MENTORS = [
  { id: 'm1', name: 'Vašek Gabriel', role: 'Sales & Marketing', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80', bio: 'Expert na high-ticket sales se 7 lety zkušeností v uzavírání obchodů.', hourlyRate: 1500, isAvailable: true },
  { id: 'm2', name: 'Ludvík Remešek', role: 'Brand Authority', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80', bio: 'Guru sociálních sítí, expert na osobní branding a organický dosah.', hourlyRate: 2000, isAvailable: true },
  { id: 'm3', name: 'Vašek Rajchart', role: 'Mindset Coach', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80', bio: 'Psychologie vysokého výkonu, neurolingvistické programování a návyky.', hourlyRate: 1800, isAvailable: true },
];

const EBOOKS = [
  { id: 'b1', title: 'Bible prodeje', description: '120 stránkový detailní manuál pro kompletní psychologii a úspěšné uzavírání B2B i B3C obchodů.', coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=800&q=80', pages: 120, author: 'Vašek Gabriel', downloadUrl: '#' },
  { id: 'b2', title: 'Instagram Dominance', description: 'Praktický návod krok po kroku, jak získat prvních 10k sledujících a vybudovat ziskovou komunitu.', coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&h=800&q=80', pages: 45, author: 'Ludvík Remešek', downloadUrl: '#' },
];

const STREAMS = [
  { id: 's1', title: 'Q-Hub výdenní review', description: 'Pravidelné nedělní hodnocení pokroku, odpovídání na dotazy a oznámení novinek pro nadcházející týden.', thumbnail: 'https://images.unsplash.com/photo-1598550476439-c43e26b610c5?auto=format&fit=crop&w=800&h=450&q=80', streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: 'upcoming', viewers: 0 },
  { id: 's2', title: 'Jak stavět automatizace', description: 'Live stream o integracích Make.com s ChatGPT pro urychlení každodenních obchodních rutinních kroků.', thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&h=450&q=80', streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'ended', viewers: 142 },
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
          { id: 'l-2', title: 'Základní pojmy a prodejní trychtýř', type: 'text', content: '# Prodejní terminologie\n\nZde se naučíte základní pojmy:\n\n1. **Lead** - potenciální kontakt\n2. **SQL** - prodejem kvalifikovaný kontakt\n3. **Closing** - uzavření dohod\n\nPokračujte splněním úkolu a aplikujte tyto pojmy do praxe.', duration: 5, isMandatory: false },
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
          { id: 'l-sm-2', title: 'Analýza konkurence a formáty', type: 'text', content: 'Textová lekce o detailní analýze konkurence.', duration: 10, isMandatory: false },
        ],
      },
    ],
  },
];

const QUIZZES = [
  {
    id: 'q-1',
    title: 'Test podnikatelského IQ',
    description: 'Zjistěte, jak dobře rozumíte základním finančním a strategickým principům byznysu.',
    image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800',
    level: 'student',
    xpReward: 500,
    passingScore: 70,
    published: true,
    questions: [
      { id: 'qq1', question: 'Co je to ROI?', options: ['Regionální obchodní inspekce', 'Return on Investment (Návratnost investic)', 'Risk of Inflation'], correctOptionIndex: 1 },
      { id: 'qq2', question: 'Který sociální kanál je nejlepší pro organický B2B prospecting?', options: ['TikTok', 'LinkedIn', 'Snapchat'], correctOptionIndex: 1 },
    ],
  },
  {
    id: 'q-cc-1',
    title: 'Cold Calling: Průlom přes "Ne"',
    description: 'Otestujte své reakce na nejčastější námitky při studených hovorech po telefonu.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
    level: 'student',
    xpReward: 300,
    passingScore: 80,
    published: true,
    questions: [
      { id: 'q-cc-q1', question: 'Jaký je hlavní cíl prvních 10 vteřin cold callu?', options: ['Prodat produkt okamžitě', 'Získat pozornost, zlomit obranu a koupit si další 2 minuty', 'Představit komplet historii a ocenění firmy'], correctOptionIndex: 1 },
      { id: 'q-cc-q2', question: 'Klient řekne: "Pošlete mi to do mailu." Co je nejlepší reaktivní odpověď?', options: ['Jasně, hned to posílám na jakýkoliv mail.', 'A na jaký email to chcete zaslat?', 'Rád to pošlu, ale abych vás nezahltil nepodstatnými věcmi — na co se v byznysu momentálně nejvíc soustředíte?'], correctOptionIndex: 2 },
    ],
  },
];

const EVENTS = [
  {
    id: 'e1',
    title: 'Jak prodávat High-Ticket Služby',
    description: 'Exkluzivní interaktivní seminář pro studenty o tom, jak nastavit prodej služeb za 50k+ Kč a uzavřít prvního klienta do 14 dnů.',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    type: 'webinar',
    link: 'https://zoom.us/live-link-dummy',
    maxAttendees: 50,
    price: 0,
    isFreeForVip: true,
    isFreeForPremium: true,
    registeredUserIds: '[]',
  },
  {
    id: 'e2',
    title: 'Mindset workshop: Budování neprůstřelné disciplíny',
    description: 'Živý workshop s Vaškem Rajchartem zaměřený na odstranění prokrastinace a nastavení denního režimu.',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    type: 'workshop',
    link: 'https://zoom.us/live-link-dummy-2',
    maxAttendees: 100,
    price: 1500,
    isFreeForVip: true,
    isFreeForPremium: false,
    registeredUserIds: '[]',
  }
];

const BONUS_TASKS = [
  {
    id: 't1',
    title: 'Sestavení vlastního Cold Call Skriptu',
    description: 'Napište skript pro telefonický kontakt, který obsahuje háček (hook), překonání námitky "Nemám čas" a jasnou výzvu k akci (výběr termínu schůzky).',
    rewardXP: 400,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    proofType: 'text',
  },
  {
    id: 't2',
    title: 'Audit profilu na Instagramu',
    description: 'Vyberte si profil libovolného lokálního podnikatele, udělejte rychlý audit (vzhled bia, kvalita reels, možnosti monetizace) a vložte odkaz na sdílený Google Dokument / Canva prezentaci.',
    rewardXP: 600,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    proofType: 'link',
  }
];

const LEVELS = Array.from({ length: 100 }, (_, i) => ({
  level: i + 1,
  xpRequired: i * 1000,
  title: i < 5 ? 'Začátečník' : i < 10 ? 'Pokročilý' : i < 20 ? 'Expert' : 'Legenda',
}));

export async function ensureSeeded() {
  try {
    const courseCount = await prisma.qhubCourse.count();
    if (courseCount > 0) {
      console.log('[Q-Hub AutoSeed] Database already has seeded data. Skipping.');
      return;
    }

    console.log('[Q-Hub AutoSeed] Database is empty. Commencing automatic seeding...');

    // Settings
    await prisma.qhubSystemSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, version: '1.0.0 Q-Hub' },
    });

    // Challenges
    for (const item of CHALLENGES) {
      await prisma.qhubChallenge.upsert({ where: { id: item.id }, update: item, create: item });
    }

    // Artifacts
    for (const item of ARTIFACTS) {
      await prisma.qhubArtifact.upsert({ where: { id: item.id }, update: item, create: item });
    }

    // Mentors
    for (const item of MENTORS) {
      await prisma.qhubMentor.upsert({ where: { id: item.id }, update: item, create: item });
    }

    // Ebooks
    for (const item of EBOOKS) {
      await prisma.qhubEbook.upsert({ where: { id: item.id }, update: item, create: item });
    }

    // Streams
    for (const item of STREAMS) {
      await prisma.qhubStream.upsert({ where: { id: item.id }, update: item, create: item });
    }

    // Courses
    for (const c of COURSES) {
      await prisma.qhubCourse.upsert({
        where: { id: c.id },
        update: { ...c, learningPoints: c.learningPoints as any, modules: c.modules as any },
        create: { ...c, learningPoints: c.learningPoints as any, modules: c.modules as any },
      });
    }

    // Quizzes
    for (const q of QUIZZES) {
      await prisma.qhubQuiz.upsert({
        where: { id: q.id },
        update: { ...q, questions: q.questions as any },
        create: { ...q, questions: q.questions as any },
      });
    }

    // Events
    for (const e of EVENTS) {
      await prisma.qhubCalendarEvent.upsert({
        where: { id: e.id },
        update: { ...e, registeredUserIds: e.registeredUserIds as any },
        create: { ...e, registeredUserIds: e.registeredUserIds as any },
      });
    }

    // Bonus Tasks
    for (const t of BONUS_TASKS) {
      await prisma.qhubBonusTask.upsert({
        where: { id: t.id },
        update: t,
        create: t,
      });
    }

    // Levels
    await prisma.qhubLevel.deleteMany({});
    await prisma.qhubLevel.createMany({ data: LEVELS });

    console.log('[Q-Hub AutoSeed] Automatic seeding completed successfully!');
  } catch (err) {
    console.error('[Q-Hub AutoSeed] Failed to seed database:', err);
  }
}
