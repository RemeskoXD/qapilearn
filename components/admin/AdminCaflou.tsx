import React, { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, RefreshCw, Check, ArrowUpRight, HelpCircle, AlertCircle, 
  History, Settings, Zap, CheckCircle2, FileText, Info
} from 'lucide-react';
import { ToastMessage } from '../../types';

interface CaflouLog {
  id: string;
  timestamp: string;
  email: string;
  event: string;
  taskTitle: string;
  xpAwarded: number;
  status: 'success' | 'user_not_found' | 'ignored';
  details: string;
}

interface AdminCaflouProps {
  notify: (type: ToastMessage['type'], title: string, message: string) => void;
}

export default function AdminCaflou({ notify }: AdminCaflouProps) {
  const [logs, setLogs] = useState<CaflouLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [xpValue, setXpValue] = useState(150);
  const [copied, setCopied] = useState(false);

  // Dynamic origin calculation for the webhook
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://qhub-app.herokuapp.com';
  const webhookUrl = `${currentOrigin}/api/webhooks/caflou?xp=${xpValue}`;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/webhooks/caflou/logs');
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data.logs || []);
      } else {
        notify('error', 'Chyba serveru', 'Nepodařilo se načíst logy synchronizace Caflou.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba spojení', 'Nepodařilo se spojit se serverem pro získání logů.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto refresh logs every 15 seconds
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [xpValue]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    notify('success', 'Zkopírováno!', 'URL adresa webhooku byla uložena do vaší schránky.');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center">
              <LinkIcon size={22} className="rotate-45" />
            </span>
            Integrace Caflou.cz
          </h2>
          <p className="text-slate-500 mt-1">
            Propojte své CRM/ERP Caflou s herním systémem Q-Hub a odměňujte své lidi XP za odvedenou práci.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
          {loading ? 'Načítání...' : 'Aktualizovat logy'}
        </button>
      </div>

      {/* Main Grid: Settings & Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Webhook Configuration - Left Column */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" fill="currentColor" />
              <h3 className="font-extrabold text-slate-900 text-base">Konfigurace Propojení</h3>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
              Připraveno k příjmu 🟢
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              1. Nastavte výši odměny (XP za dokončený úkol)
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={xpValue}
                onChange={e => setXpValue(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-32 bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
              />
              <span className="text-sm font-semibold text-slate-600">XP za každý dokončený úkol/výkaz</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              2. Zkopírujte URL adresu Webhooku
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
              <span className="font-mono text-[11px] text-slate-600 select-all truncate pl-2 flex-1">
                {webhookUrl}
              </span>
              <button 
                onClick={copyToClipboard}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                }`}
              >
                {copied ? <Check size={14} /> : null}
                {copied ? 'Zkopírováno!' : 'Kopírovat'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium italic flex items-start gap-1">
              <Info size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
              Tato adresa obsahuje parametr <code className="font-bold font-mono">xp={xpValue}</code>. Můžete vytvořit více webhooků s různou hodnotou XP.
            </p>
          </div>

          {/* Integration Features */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Jak funguje chytré párování:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-start gap-2.5">
                <span className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-[10px]">1</span>
                <div>
                  <h5 className="font-bold text-slate-800 mb-0.5">E-mailové Párování</h5>
                  <p className="leading-relaxed">Q-Hub inteligentně prohledá celý Caflou webhook payload a vyhledá e-mailovou adresu řešitele nebo autora výkazu.</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-start gap-2.5">
                <span className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-[10px]">2</span>
                <div>
                  <h5 className="font-bold text-slate-800 mb-0.5">Zásobník Zpráv</h5>
                  <p className="leading-relaxed">Uživateli ihned po připsání bodů přijde systémová zpráva na dashboard s popisem a názvem jeho úkolu.</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-start gap-2.5">
                <span className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-[10px]">3</span>
                <div>
                  <h5 className="font-bold text-slate-800 mb-0.5">XP Booster Podpora</h5>
                  <p className="leading-relaxed">Pokud má doručovaný uživatel aktivovaný 2x XP Boost z inventáře, automaticky obdrží za Caflou práci dvojnásobek bodů.</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-start gap-2.5">
                <span className="w-5 h-5 bg-indigo-50 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-[10px]">4</span>
                <div>
                  <h5 className="font-bold text-slate-800 mb-0.5">Automatický Level-up</h5>
                  <p className="leading-relaxed">Platforma po připsání bodů automaticky porovná nové XP body s požadavky levelů a případně zvýší úroveň.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Guide - Right Column */}
        <div className="lg:col-span-5 bg-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <HelpCircle className="text-indigo-400" size={18} />
              <h3 className="font-extrabold text-sm tracking-wider uppercase">Nastavení v Caflou (Návod)</h3>
            </div>

            <ol className="space-y-5 text-sm">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">1</span>
                <div>
                  <strong className="block text-white mb-0.5">Otevřete Nastavení Caflou</strong>
                  <span className="text-indigo-200 text-xs">Přihlaste se do Caflou jako administrátor, jděte do <strong className="text-white">Nastavení účtu</strong> a vyhledejte sekci <strong className="text-white">Webhooky</strong> (Webhooks).</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">2</span>
                <div>
                  <strong className="block text-white mb-0.5">Vytvořte Nový Webhook</strong>
                  <span className="text-indigo-200 text-xs">Klikněte na tlačítko <strong className="text-white">Nový Webhook</strong>, vložte zkopírovanou URL adresu z levého panelu jako cílový endpoint (Target URL).</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">3</span>
                <div>
                  <strong className="block text-white mb-0.5">Zvolte Událost (Trigger)</strong>
                  <span className="text-indigo-200 text-xs">Vyberte události pro spuštění: <strong className="text-white">Změna úkolu</strong> (Status = Hotovo/Completed) nebo <strong className="text-white">Nový výkaz práce</strong> (Timesheet created).</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">4</span>
                <div>
                  <strong className="block text-white mb-0.5">Párování účtů</strong>
                  <span className="text-indigo-200 text-xs">Ujistěte se, že vaši uživatelé mají v Caflou stejný registrační e-mail jako u svého účtu v akademii Q-Hubu.</span>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/5 mt-6 flex items-start gap-3">
            <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-[11px] text-indigo-150 leading-relaxed font-normal">
              Jakmile kdokoliv z vašeho týmu dokončí úkol v Caflou, náš webhook okamžitě obdrží informaci, připíše XP uživateli a odešle mu radostné oznámení!
            </p>
          </div>
        </div>

      </div>

      {/* Synchronisation Logs - Full Width */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <History size={18} className="text-indigo-600" />
            <span className="font-extrabold text-slate-900 text-base">Logy Synchronizace v reálném čase</span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Zobrazuje se posledních 100 požadavků
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={24} className="opacity-30" />
            </div>
            <p className="font-bold text-slate-600 text-sm">Zatím nebyly přijaty žádné webhoooky z Caflou.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              Nastavte webhook v Caflou účtu a otestujte jej dokončením zkušebního úkolu. Zde uvidíte diagnózu doručení.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 rounded-l-xl">Čas</th>
                  <th className="p-4">Uživatel Email</th>
                  <th className="p-4">Událost Caflou</th>
                  <th className="p-4">Název Úkolu/Práce</th>
                  <th className="p-4">Připsáno XP</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-r-xl">Detaily diagnózy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString('cs-CZ')}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 text-xs bg-slate-100/80 border border-slate-200 rounded-md px-1.5 py-0.5">
                        {log.email}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono font-bold text-slate-600 uppercase">
                      {log.event}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 text-xs max-w-xs truncate" title={log.taskTitle}>
                      {log.taskTitle}
                    </td>
                    <td className="p-4">
                      {log.xpAwarded > 0 ? (
                        <span className="text-yellow-600 font-extrabold font-mono text-xs bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5">
                          +{log.xpAwarded} XP
                        </span>
                      ) : (
                        <span className="text-slate-400">0 XP</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        log.status === 'success' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : log.status === 'user_not_found'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-150 text-slate-600'
                      }`}>
                        {log.status === 'success' ? 'Doručeno ✅' : log.status === 'user_not_found' ? 'Neznámý e-mail ⚠️' : 'Ignorováno 💤'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
