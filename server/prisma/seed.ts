import { prisma } from '../prisma.js';
import '../lib/env.js';

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

async function upsertAll<T extends { id: string }>(model: any, items: T[], label: string) {
  for (const item of items) {
    await model.upsert({ where: { id: item.id }, update: item, create: item });
  }
  console.log(`  ✓ ${label}: ${items.length}`);
}

async function main() {
  console.log('[Q-Hub] Seeding…');

  await prisma.qhubSystemSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, version: '1.0.0 Q-Hub' },
  });
  console.log('  ✓ Settings');

  await upsertAll(prisma.qhubChallenge, CHALLENGES, 'Challenges');
  await upsertAll(prisma.qhubArtifact, ARTIFACTS, 'Artifacts');
  await upsertAll(prisma.qhubMentor, MENTORS, 'Mentors');
  await upsertAll(prisma.qhubEbook, EBOOKS, 'Ebooks');

  for (const s of STREAMS) {
    await prisma.qhubStream.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log(`  ✓ Streams: ${STREAMS.length}`);

  for (const c of COURSES) {
    await prisma.qhubCourse.upsert({
      where: { id: c.id },
      update: { ...c, learningPoints: c.learningPoints as any, modules: c.modules as any },
      create: { ...c, learningPoints: c.learningPoints as any, modules: c.modules as any },
    });
  }
  console.log(`  ✓ Courses: ${COURSES.length}`);

  for (const q of QUIZZES) {
    await prisma.qhubQuiz.upsert({
      where: { id: q.id },
      update: { ...q, questions: q.questions as any },
      create: { ...q, questions: q.questions as any },
    });
  }
  console.log(`  ✓ Quizzes: ${QUIZZES.length}`);

  // Levels - smaž a vytvoř znovu
  await prisma.qhubLevel.deleteMany({});
  await prisma.qhubLevel.createMany({ data: LEVELS });
  console.log(`  ✓ Levels: ${LEVELS.length}`);

  console.log('[Q-Hub] Seed hotov.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
