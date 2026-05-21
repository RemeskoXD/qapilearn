import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  ArrowLeft,
  Key,
  Unlock,
  Layers,
  Sparkles,
  Check,
  FolderOpen
} from 'lucide-react';
import { api } from '../lib/api';

const MotionDiv = motion.div as any;

interface DbCheckPageProps {
  onBack: () => void;
  notify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

interface TableStatus {
  key: string;
  table: string;
  name: string;
  exists: boolean;
  count: number;
  error: string | null;
}

interface SeedsCheck {
  challenges: Record<string, boolean>;
  artifacts: Record<string, boolean>;
  mentors: Record<string, boolean>;
  ebooks: Record<string, boolean>;
  streams: Record<string, boolean>;
  courses: Record<string, boolean>;
  quizzes: Record<string, boolean>;
  levelsCount: number;
  hasSettings: boolean;
}

interface DbCheckResponse {
  ok: boolean;
  databaseUrlSet: boolean;
  connectionOk: boolean;
  connectionError: string | null;
  tablesStatus: TableStatus[];
  seedsCheck: SeedsCheck;
}

export const DbCheckPage: React.FC<DbCheckPageProps> = ({ onBack, notify }) => {
  const [secret, setSecret] = useState(() => localStorage.getItem('qhub_db_secret') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [stats, setStats] = useState<DbCheckResponse | null>(null);
  const [errorSubmit, setErrorSubmit] = useState('');

  const fetchStatus = async (customSecret = secret) => {
    if (!customSecret) {
      setErrorSubmit('Zadejte prosím tajný klíč.');
      return;
    }
    setLoading(true);
    setErrorSubmit('');
    try {
      const res = await api.post<DbCheckResponse>('/db-check/status', { secret: customSecret });
      setStats(res);
      setIsAuthenticated(true);
      localStorage.setItem('qhub_db_secret', customSecret);
      notify('success', 'Spojení ověřeno', 'Informace o databázi načteny.');
    } catch (err: any) {
      setErrorSubmit(err?.message || 'Neplatný klíč nebo chyba připojení.');
      setIsAuthenticated(false);
      notify('error', 'Ověření selhalo', 'Zkontrolujte zadaný tajný klíč.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (secret) {
      fetchStatus(secret);
    }
  }, []);

  const handleRunSeed = async () => {
    if (!secret) return;
    if (!window.confirm('Opravdu chcete do databáze nahrát výchozí seedovací data?')) return;

    setSeeding(true);
    try {
      const res = await api.post<{ ok: boolean; message: string }>('/db-check/seed', { secret });
      notify('success', 'Seed dokončen', res.message || 'Data byla úspěšně nahrána.');
      // Refresh status after seeding
      await fetchStatus(secret);
    } catch (err: any) {
      notify('error', 'Chyba při seedování', err?.message || 'Zkuste to znovu.');
    } finally {
      setSeeding(false);
    }
  };

  // Výpočet kolik tabulek chybí a kolik výchozích dat
  const totalTables = stats?.tablesStatus?.length || 0;
  const migratedTables = stats?.tablesStatus?.filter(t => t.exists)?.length || 0;
  const missingTables = totalTables - migratedTables;

  const countSeedsOk = () => {
    if (!stats) return { ok: 0, total: 0 };
    let ok = 0;
    let total = 0;

    const checkObj = (obj: Record<string, boolean>) => {
      Object.values(obj).forEach(val => {
        if (val) ok++;
        total++;
      });
    };

    checkObj(stats.seedsCheck.challenges);
    checkObj(stats.seedsCheck.artifacts);
    checkObj(stats.seedsCheck.mentors);
    checkObj(stats.seedsCheck.ebooks);
    checkObj(stats.seedsCheck.streams);
    checkObj(stats.seedsCheck.courses);
    checkObj(stats.seedsCheck.quizzes);

    if (stats.seedsCheck.levelsCount >= 100) ok++;
    total++;

    if (stats.seedsCheck.hasSettings) ok++;
    total++;

    return { ok, total };
  };

  const seedSummary = countSeedsOk();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-white">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/70 py-4 px-6 sticky top-0 backdrop-blur-md z-40 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition"
            title="Zpět"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Database className="text-indigo-400" size={24} />
            <div>
              <h1 className="font-bold text-base leading-none">Database Doctor</h1>
              <p className="text-xs text-slate-500 mt-1">Diagnostika a monitoring Q-Hub</p>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => fetchStatus(secret)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Obnovit
          </button>
        )}
      </header>

      {/* CONTENT & PANEL */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {!isAuthenticated ? (
          /* PŘIHLÁŠENÍ S SECRET KEY */
          <MotionDiv
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl mt-12"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Key size={24} />
              </div>
              <h2 className="text-xl font-bold">Autorizace diagnostiky</h2>
              <p className="text-sm text-slate-400 mt-1">
                Zadejte tajné heslo nastavené v <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">DB_CHECK_SECRET</code> pro kontrolu stavu.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchStatus();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">
                  Tajné heslo (default: qhubsecret)
                </label>
                <div className="relative">
                  <Unlock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Např. qhubsecret"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {errorSubmit && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                  <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errorSubmit}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400/50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    Ověřit systém
                  </>
                )}
              </button>
            </form>

            <button
              onClick={onBack}
              className="mt-6 w-full text-center text-xs text-slate-500 hover:text-slate-300 font-medium flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={12} /> Zpět k přihlášení
            </button>
          </MotionDiv>
        ) : (
          /* DIAGNOSTICKÉ CENTRUM */
          <div className="space-y-6">
            {/* HLAVNÍ DIAGNOSTIKY CARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STAV SPOJENÍ */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Připojení k DB</span>
                  {stats?.connectionOk ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle size={12} /> AKTIVNÍ
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
                      <XCircle size={12} /> ODPOJENO
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black block">PostgreSQL</span>
                  <span className="text-xs text-slate-400 font-mono mt-1 break-all block">
                    DATABASE_URL: {stats?.databaseUrlSet ? '✅ Nastaveno v prostředí' : '❌ CHYBÍ'}
                  </span>
                  {stats?.connectionError && (
                    <p className="text-xs text-red-400 bg-red-950/20 border border-red-950 p-2.5 rounded-lg font-mono leading-tight mt-2 whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {stats.connectionError}
                    </p>
                  )}
                </div>
              </div>

              {/* STAV TABULEK */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Migrace tabulek</span>
                  {missingTables === 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle size={12} /> KOMPLETNÍ
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full animate-pulse">
                      <AlertTriangle size={12} /> CHYBÍ {missingTables}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black block">
                    {migratedTables} / {totalTables}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Počet funkčních prefix-tabulek typu <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-300">qhub_*</code>
                  </span>
                </div>
              </div>

              {/* INTEGRITA VÝCHOZÍCH DAT (SEED) */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Výchozí Data (Seed)</span>
                  {seedSummary.ok === seedSummary.total ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle size={12} /> INSTALOVÁNO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-mono">
                      {seedSummary.ok}/{seedSummary.total} SPLNĚNO
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black block">
                    {Math.round((seedSummary.ok / (seedSummary.total || 1)) * 100)}%
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Klíčové výukové materiály a gamifikační data nalezena
                  </span>
                </div>
              </div>
            </div>

            {/* SEEDOVACÍ AKCE TRIGER */}
            {stats && seedSummary.ok < seedSummary.total && (
              <MotionDiv
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-950/20 border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4"
              >
                <div className="flex items-start gap-3 text-center sm:text-left">
                  <Sparkles className="text-indigo-400 mt-0.5 flex-shrink-0 mx-auto" size={24} />
                  <div>
                    <h3 className="font-bold text-indigo-300">Chybí nebo nejsou kompletní výchozí data</h3>
                    <p className="text-xs text-indigo-200 mt-1">
                      Chcete automaticky nahrát výchozí kurzy, výzvy, kvízy, mentory, e-knihy a levels tabulky? Tento proces neovlivní stávající registrované uživatele.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRunSeed}
                  disabled={seeding}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex-shrink-0 shadow-lg shadow-indigo-600/10 disabled:opacity-50"
                >
                  {seeding ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} fill="currentColor" />
                  )}
                  Nahrát výchozí data (Seed)
                </button>
              </MotionDiv>
            )}

            {/* DETAIL TABULEK */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TABULKA 16 TABULEK */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                  <Layers className="text-indigo-400" size={18} />
                  <h3 className="font-bold text-sm">Prisma Schema & Mapped Tables status</h3>
                </div>
                <div className="overflow-x-auto max-h-[480px] custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-semibold sticky top-0">
                      <tr>
                        <th className="p-3">Model / Název</th>
                        <th className="p-3">Název v DB</th>
                        <th className="p-3 text-center">Stav</th>
                        <th className="p-3 text-right">Záznamů</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {stats?.tablesStatus?.map((t) => (
                        <tr key={t.key} className="hover:bg-slate-900/40">
                          <td className="p-3 font-semibold text-slate-200">{t.name}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{t.table}</td>
                          <td className="p-3 text-center">
                            {t.exists ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <Check size={10} /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/15 px-2 py-0.5 rounded-full" title={t.error || ''}>
                                <XCircle size={10} /> CHYBÍ
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-slate-400">{t.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INTEGRITA SEEDŮ DETAILNĚ */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                    <FolderOpen className="text-indigo-400" size={18} />
                    <h3 className="font-bold text-sm">Seznam požadovaných struktur v DB</h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* KURZY */}
                    <SectionCheck
                      title="Výchozí kurzy (4)"
                      items={[
                        { label: 'Sales Master (course-1)', ok: stats?.seedsCheck?.courses?.['course-1'] },
                        { label: 'Social Media Dominance (course-2)', ok: stats?.seedsCheck?.courses?.['course-2'] },
                        { label: 'AI Automatizace & Budoucnost (course-3)', ok: stats?.seedsCheck?.courses?.['course-3'] },
                        { label: 'Nezlomná disciplína: Mindset (course-4)', ok: stats?.seedsCheck?.courses?.['course-4'] },
                      ]}
                    />

                    {/* KVÍZY */}
                    <SectionCheck
                      title="Výchozí kvízy (2)"
                      items={[
                        { label: 'Test podnikatelského IQ (q-1)', ok: stats?.seedsCheck?.quizzes?.['q-1'] },
                        { label: 'Cold Calling (q-cc-1)', ok: stats?.seedsCheck?.quizzes?.['q-cc-1'] },
                      ]}
                    />

                    {/* MENTOŘI */}
                    <SectionCheck
                      title="Mentoři (3)"
                      items={[
                        { label: 'Vašek Gabriel (m1)', ok: stats?.seedsCheck?.mentors?.m1 },
                        { label: 'Ludvík Remešek (m2)', ok: stats?.seedsCheck?.mentors?.m2 },
                        { label: 'Vašek Rajchart (m3)', ok: stats?.seedsCheck?.mentors?.m3 },
                      ]}
                    />

                    {/* VÝZVY & ARTEFAKTY */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SectionCheck
                        title="Vzdělávací výzvy"
                        items={[
                          { label: 'c1: Ranní budíček', ok: stats?.seedsCheck?.challenges?.c1 },
                          { label: 'c2: Cold Call Master', ok: stats?.seedsCheck?.challenges?.c2 },
                          { label: 'c3: Studijní maratonec', ok: stats?.seedsCheck?.challenges?.c3 },
                        ]}
                      />
                      <SectionCheck
                        title="Artefakty / Předměty"
                        items={[
                          { label: 'a1: Lektvar soustředění', ok: stats?.seedsCheck?.artifacts?.a1 },
                          { label: 'a2: VIP vstupenka', ok: stats?.seedsCheck?.artifacts?.a2 },
                          { label: 'a3: Káva motivace', ok: stats?.seedsCheck?.artifacts?.a3 },
                        ]}
                      />
                    </div>

                    {/* DALSÍ STRUKTURY */}
                    <div className="pt-2 border-t border-slate-900 space-y-2">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Gamifikace (úrovně 1-100 v qhub_levels):</span>
                        <span className="font-mono font-bold text-slate-100">
                          {stats?.seedsCheck?.levelsCount === 100 ? (
                            <span className="text-emerald-400">✅ 100/100 nahráno</span>
                          ) : (
                            <span className="text-amber-400">⚠️ {stats?.seedsCheck?.levelsCount || 0}/100 nahráno</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Systémový nastavení inicializováno (ID=1):</span>
                        <span className="font-mono font-bold">
                          {stats?.seedsCheck?.hasSettings ? (
                            <span className="text-emerald-400">✅ Ano</span>
                          ) : (
                            <span className="text-amber-400">⚠️ Chybí</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-4 flex justify-between items-center text-[11px] text-slate-500">
                  <span>Autorizováno pro: Secret Key</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('qhub_db_secret');
                      setIsAuthenticated(false);
                      setStats(null);
                      notify('info', 'Odhlášeno', 'Nastavení tajného klíče bylo zapomenuto.');
                    }}
                    className="text-red-400 hover:text-red-300 underline font-semibold transition"
                  >
                    Odhlásit diagnostiku
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/20">
        Q-Hub Postgres & Prisma Diagnostics Console • Všechna autorská práva vyhrazena.
      </footer>
    </div>
  );
};

const SectionCheck: React.FC<{ title: string; items: { label: string; ok: boolean }[] }> = ({ title, items }) => (
  <div className="space-y-1.5">
    <h4 className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">{title}</h4>
    <div className="space-y-1">
      {items.map((it, idx) => (
        <div key={idx} className="flex justify-between items-center bg-slate-900/50 hover:bg-slate-900 px-2.5 py-1 rounded">
          <span className="text-slate-300 truncate pr-2">{it.label}</span>
          <span>
            {it.ok ? (
              <span className="font-semibold text-emerald-400">Přítomno</span>
            ) : (
              <span className="font-semibold text-red-400">Nenalezeno</span>
            )}
          </span>
        </div>
      ))}
    </div>
  </div>
);
