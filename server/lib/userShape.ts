// Sjednocení tvaru Q-Hub uživatele pro frontend (zrcadlí types.ts User)
// Skrývá passwordHash a normalizuje JSON pole.

const INITIAL_INVENTORY = [
  {
    id: 'a1',
    name: 'Lektvar Soustředění',
    description: 'Zvyšuje zisk XP o 100% (2x) na 2 hodiny.',
    rarity: 'rare',
    type: 'consumable',
    image: '🧪',
    quantity: 1,
    effectType: 'xp_boost',
    effectDuration: 2,
  },
];

export function publicUser(u: any) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return {
    ...rest,
    joinDate: rest.joinDate instanceof Date ? rest.joinDate.toISOString() : rest.joinDate,
    lastLogin: rest.lastLogin instanceof Date ? rest.lastLogin.toISOString() : rest.lastLogin,
    planExpires: rest.planExpires
      ? rest.planExpires instanceof Date
        ? rest.planExpires.toISOString()
        : rest.planExpires
      : undefined,
    xpBoostUntil: rest.xpBoostUntil
      ? rest.xpBoostUntil instanceof Date
        ? rest.xpBoostUntil.toISOString()
        : rest.xpBoostUntil
      : undefined,
    positions: rest.positions ?? [],
    inventory: rest.inventory ?? [],
    activeChallenges: rest.activeChallenges ?? [],
    certificates: rest.certificates ?? [],
    courseProgress: rest.courseProgress ?? [],
    lessonNotes: rest.lessonNotes ?? {},
    quizHistory: rest.quizHistory ?? [],
    adminNotes: rest.adminNotes ?? [],
    profitHistory: rest.profitHistory ?? [],
    messages: rest.messages ?? [],
  };
}

export function initialUserDefaults() {
  return {
    role: 'student',
    positions: [],
    level: 1,
    xp: 0,
    financialProfit: 0,
    isBanned: false,
    isPublicProfile: false,
    inventory: INITIAL_INVENTORY,
    activeChallenges: [],
    certificates: [],
    courseProgress: [],
    lessonNotes: {},
    quizHistory: [],
    adminNotes: [],
    profitHistory: [],
    messages: [],
  };
}
