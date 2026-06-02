import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { 
  Link as LinkIcon, RefreshCw, Check, ArrowUpRight, HelpCircle, AlertCircle, 
  History, Settings, Zap, CheckCircle2, FileText, Info, Coins, Users, 
  Calendar, DollarSign, AlertTriangle, Eye, EyeOff, Sparkles, Trophy,
  Trash2, Plus, Edit3, Award, TrendingUp, Briefcase, BarChart2,
  Search, ChevronDown, ChevronUp, User, X
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

interface QhubUserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  financialProfit: number;
  profitHistory?: any[];
}

interface ReportItem {
  email: string;
  hours: number;
  taskCount: number;
  tasks: string[];
  userFound: boolean;
  userId?: string;
  userName?: string;
  hourlyRate: number;
  payoutAmount: number;
  alreadyPaid: boolean;
}

interface AdminCaflouProps {
  notify: (type: ToastMessage['type'], title: string, message: string) => void;
}

export default function AdminCaflou({ notify }: AdminCaflouProps) {
  // Navigation tabs: payouts / rates / sales / settings
  const [activeTab, setActiveTab] = useState<'payouts' | 'projects' | 'rates' | 'sales' | 'settings' | 'statistics'>('projects');
  
  // Projects State
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [projectsOzData, setProjectsOzData] = useState<any>(null);
  const [allCaflouUsers, setAllCaflouUsers] = useState<any[]>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [projectMonth, setProjectMonth] = useState(new Date().getMonth() + 1);
  const [projectYear, setProjectYear] = useState(new Date().getFullYear());
  const [localCommissionRates, setLocalCommissionRates] = useState<Record<string, number>>({});

  const fetchFinishedProjects = async () => {
    setIsFetchingProjects(true);
    try {
      const resp = await fetch('/api/caflou/finished-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: projectMonth, year: projectYear })
      });
      if (!resp.ok) {
        throw new Error('Nepodařilo se načíst log zakázek');
      }
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);
      setProjectsData(data.projects);
      if (data.ozData) setProjectsOzData(data.ozData);
      if (data.caflouUsers) setAllCaflouUsers(data.caflouUsers);
      notify('success', 'Zakázky načteny', `Nalezeno ${data.projects.length} dokončených projektů za daný měsíc.`);
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    } finally {
      setIsFetchingProjects(false);
    }
  };
  
  // --- Admin Sales Commission (OZ) States ---
  const [salesData, setSalesData] = useState<{
    userConfigs: Record<string, any>;
    orders: any[];
    adjustments: any[];
    payouts: any[];
  }>({ userConfigs: {}, orders: [], adjustments: [], payouts: [] });
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesStartDate, setSalesStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [salesEndDate, setSalesEndDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(0); return d.toISOString().split('T')[0];
  });

  // Form for configuring user
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [configUserType, setConfigUserType] = useState<'commission' | 'fix' | 'both'>('commission');
  const [configFixRate, setConfigFixRate] = useState<number>(15000);
  const [configRates, setConfigRates] = useState({ b1: 8, b2: 10, b3: 11, b4: 12 });

  // Form for manual adjustments (pokuta / odměna)
  const [adjUserEmail, setAdjUserEmail] = useState('');
  const [adjType, setAdjType] = useState<'fine' | 'bonus'>('bonus');
  const [adjAmount, setAdjAmount] = useState<number>(1000);
  const [adjReason, setAdjReason] = useState('');

  // Form for adding completed order manually
  const [newOrderEmail, setNewOrderEmail] = useState('');
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderDesc, setNewOrderDesc] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState<number>(120000);
  const [newOrderDiscount, setNewOrderDiscount] = useState<number>(15);
  const [isAddingOrder, setIsAddingOrder] = useState(false);

  // Filter for matching users search
  const [salesSearch, setSalesSearch] = useState('');

  // Fetch Sales / OZ Data helper
  const fetchSalesData = async () => {
    try {
      setSalesLoading(true);
      const resp = await fetch('/api/caflou/oz/data');
      if (resp.ok) {
        const data = await resp.json();
        setSalesData(data);
      }
    } catch (e) {
      console.error('[AdminCaflou] Failed to load Sales OZ data:', e);
    } finally {
      setSalesLoading(false);
    }
  };

  // Handlers for Sales data adjustment
  const handleSaveConfig = async (email: string) => {
    try {
      const resp = await fetch('/api/caflou/oz/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userType: configUserType,
          fixRate: configFixRate,
          customRates: configRates
        })
      });
      if (resp.ok) {
        notify('success', 'Konfigurace uložena', `Mzdový profil pro ${email} byl úspěšně nastaven.`);
        setEditingEmail(null);
        fetchSalesData();
      }
    } catch (e) {
      notify('error', 'Chyba nastavení', 'Nepodařilo se změnit profil.');
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjUserEmail || !adjAmount) {
      notify('error', 'Chyba', 'Chybí povinná pole úpravy.');
      return;
    }
    try {
      const resp = await fetch('/api/caflou/oz/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adjUserEmail.toLowerCase().trim(),
          type: adjType,
          amount: adjAmount,
          reason: adjReason,
          month: salesEndDate.substring(0, 7)
        })
      });
      if (resp.ok) {
        notify('success', 'Úprava uložena', `Sankce/Pokuta byla přičtena do evidence.`);
        setAdjUserEmail('');
        setAdjReason('');
        setAdjAmount(1000);
        fetchSalesData();
      }
    } catch (e) {
      notify('error', 'Chyba', 'Uložení selhalo.');
    }
  };

  const handleDeleteAdjustment = async (id: string) => {
    try {
      const resp = await fetch(`/api/caflou/oz/adjustments/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        notify('success', 'Odstraněno', 'Manažerská úprava byla stažena.');
        fetchSalesData();
      }
    } catch (e) {
      notify('error', 'Chyba', 'Odstranění selhalo.');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderEmail || !newOrderCustomer || !newOrderAmount) {
      notify('error', 'Chyba', 'Uveďte e-mail, odběratele a obratovou částku.');
      return;
    }
    try {
      const resp = await fetch('/api/caflou/oz/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newOrderEmail.toLowerCase().trim(),
          contractNumber: newOrderNumber,
          customerName: newOrderCustomer,
          description: newOrderDesc,
          amount: newOrderAmount,
          discount: newOrderDiscount,
          status: 'completed'
        })
      });
      if (resp.ok) {
        notify('success', 'Zakázka přidána', `Zakázka byla úspěšně vystavena na prodejce.`);
        setNewOrderNumber('');
        setNewOrderCustomer('');
        setNewOrderDesc('');
        setNewOrderAmount(120000);
        setNewOrderDiscount(15);
        setIsAddingOrder(false);
        fetchSalesData();
      }
    } catch (e) {
      notify('error', 'Chyba', 'Přidání zakázky selhalo.');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const resp = await fetch(`/api/caflou/oz/orders/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        notify('success', 'Vymazáno', 'Smluvní zakázka byla stažena.');
        fetchSalesData();
      }
    } catch (e) {
      notify('error', 'Chyba', 'Vymazání selhalo.');
    }
  };

  const handleExecuteSalesPayout = async (email: string, xpRewardAdd: number) => {
    try {
      const resp = await fetch('/api/caflou/oz/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          month: salesEndDate.substring(0, 7),
          xpReward: xpRewardAdd
        })
      });
      if (resp.ok) {
        const respData = await resp.json();
        notify('success', 'Mzdová provize vyplacena! 🎉', `Obchodníkovi ${email} byla výplata ve výši ${respData.record.totalPayout.toLocaleString()} Kč uložena do peněženky.`);
        fetchSalesData();
        fetchRatesAndUsers(); // reload core details
      } else {
        const data = await resp.json();
        notify('error', 'Chyba vyplacení', data.error || 'Schválení se nezdařilo.');
      }
    } catch (e) {
      notify('error', 'Mzdové vyplacení selhalo', 'Došlo k chybě připojení k serveru.');
    }
  };
  
  // Settings tab states
  const [caflouToken, setCaflouToken] = useState('');
  const [caflouCompanyId, setCaflouCompanyId] = useState('');
  const [caflouBaseUrl, setCaflouBaseUrl] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [xpValue, setXpValue] = useState(150);
  const [copied, setCopied] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Webhook Logs states
  const [logs, setLogs] = useState<CaflouLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Import states
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    email: string;
    name: string;
    role: string;
    status: 'exists' | 'created';
    tempPassword: string | null;
  }[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showManualImport, setShowManualImport] = useState(false);
  const [manualText, setManualText] = useState('');
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any | null>(null);

  // Spustit diagnostický test sítě / DNS
  const handleRunDiagnostics = async () => {
    setDiagnosticLoading(true);
    setDiagnosticData(null);
    try {
      const resp = await fetch('/api/caflou/diagnostic');
      if (resp.ok) {
        const data = await resp.json();
        setDiagnosticData(data);
        notify('success', 'Diagnostika hotova', 'Síťový a DNS test byl úspěšně spuštěn.');
      } else {
        notify('error', 'Chyba serveru', 'Chyba při spouštění diagnostiky ze strany serveru.');
      }
    } catch (e: any) {
      console.error(e);
      notify('error', 'Chyba spojení', 'Nelze se spojit s diagnostickým API na serveru.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // Users & Sazby States
  const [qhubUsers, setQhubUsers] = useState<QhubUserItem[]>([]);
  const [userRates, setUserRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  
  // Custom interactive tracking states
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [payoutsHistorySearch, setPayoutsHistorySearch] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderDiscount, setEditingOrderDiscount] = useState<number>(0);

  const handleUpdateDiscount = async (order: any, newDiscount: number) => {
    try {
      const resp = await fetch('/api/caflou/oz/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...order,
          discount: newDiscount
        })
      });
      if (resp.ok) {
        notify('success', 'Sleva upravena', `Procentuální sleva u zakázky ${order.contractNumber} byla upravena.`);
        setEditingOrderId(null);
        fetchSalesData();
      } else {
        const err = await resp.json();
        notify('error', 'Chyba', err.error || 'Nepodařilo se uložit změnu.');
      }
    } catch (e: any) {
      notify('error', 'Chyba spojení', 'Chyba při odesílání požadavku na server.');
    }
  };

  // Payouts & Sync States
  const [syncLoading, setSyncLoading] = useState(false);
  const [useDemo, setUseDemo] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [report, setReport] = useState<ReportItem[]>([]);
  const [xpBonusRate, setXpBonusRate] = useState<number>(2); // XP za odpracovanou hodinu (default 2 XP / hod)
  const [processingPayouts, setProcessingPayouts] = useState<Record<string, boolean>>({});

  // Calculations for current report
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://qhub-app.herokuapp.com';
  const webhookUrl = `${currentOrigin}/api/webhooks/caflou?xp=${xpValue}`;

  // Years for selectbox (current and last 3)
  const yearsList = [selectedYear, selectedYear - 1, selectedYear - 2];

  // Fetch API configuration
  const fetchConfig = async () => {
    try {
      const resp = await fetch('/api/caflou/config');
      if (resp.ok) {
        const data = await resp.json();
        setCaflouToken(data.caflouToken || '');
        setCaflouCompanyId(data.caflouCompanyId || '');
        setCaflouBaseUrl(data.caflouBaseUrl || '');
        
        // Pokud není nakonfigurován token, automaticky zapneme Demo režim, aby admin viděl data
        if (!data.caflouToken) {
          setUseDemo(true);
        }
      }
    } catch (e) {
      console.error('Failed to fetch Caflou config:', e);
    }
  };

  // Fetch Hourly Rates
  const fetchRatesAndUsers = async () => {
    setRatesLoading(true);
    try {
      const [ratesResp, usersResp] = await Promise.all([
        fetch('/api/caflou/rates'),
        fetch('/api/caflou/users')
      ]);

      if (ratesResp.ok && usersResp.ok) {
        const ratesData = await ratesResp.json();
        const usersData = await usersResp.json();
        
        setQhubUsers(usersData.users || []);
        setUserRates(ratesData.rates || {});
      } else {
        notify('error', 'Chyba stahování', 'Nepodařil se import sazeb nebo uživatelské báze z databáze.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba spojení', 'Nepodařilo se spojit se serverem pro získání sazeb.');
    } finally {
      setRatesLoading(false);
    }
  };

  // Fetch Webhook logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const resp = await fetch('/api/webhooks/caflou/logs');
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  // Trigger sync report
  const handleSyncTimesheets = async () => {
    setSyncLoading(true);
    try {
      const resp = await fetch('/api/caflou/sync-timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          useDemo: useDemo
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setReport(data.report || []);
        
        if (data.warning) {
          notify('warning', 'Omezení spojení', data.warning);
        } else {
          notify('success', 'Synchronizace dokončena', `Úspěšně staženy a spárovány časové výkazy za období ${selectedMonth}/${selectedYear}.`);
        }
      } else {
        const err = await resp.json();
        notify('error', 'Synchronizace selhala', err.error || 'Nastala neočekávaná chyba při komunikaci s Caflou.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba spojení', 'Nelze se spojit s analytickým synchronizérem.');
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchRatesAndUsers();
    fetchLogs();
    fetchSalesData();
  }, []);

  // Hotfix refresh when changing tabs to refresh data correctly
  useEffect(() => {
    if (activeTab === 'rates') {
      fetchRatesAndUsers();
    } else if (activeTab === 'settings') {
      fetchLogs();
    } else if (activeTab === 'sales' || activeTab === 'statistics') {
      fetchSalesData();
    }
  }, [activeTab]);

  // Save Settings handler
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const resp = await fetch('/api/caflou/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caflouToken, caflouCompanyId, caflouBaseUrl })
      });

      if (resp.ok) {
        notify('success', 'Uloženo', 'Konfigurace přímého připojení Caflou byla úspěšně zapsána.');
        // Zkusíme ihned načíst data, pokud mají zadaný token
        if (caflouToken) {
          setUseDemo(false);
        }
      } else {
        notify('error', 'Chyba', 'Nepodařilo se uložit nastavení API.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba', 'Chyba komunikace při ukládání nastavení.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Hromadný import uživatelů
  const handleImportUsers = async () => {
    setImportLoading(true);
    setImportResults(null);
    try {
      const resp = await fetch('/api/caflou/import-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setImportResults(data.users || []);
        notify('success', 'Import dokončen', data.message || 'Uživatelé byli úspěšně nahráni.');
        // Znovu načteme sazby a seznam pro admin přehledy
        fetchRatesAndUsers();
      } else {
        notify('error', 'Nepodařilo se importovat', data.error || 'Nebylo možné dokončit import.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba spojení', 'Při pokusu o import uživatelů došlo k chybě sítě.');
    } finally {
      setImportLoading(false);
    }
  };

  // Hromadný manuální import uživatelů
  const handleManualImport = async () => {
    if (!manualText.trim()) {
      notify('error', 'Chyba', 'Zadejte prosím alespoň jeden řádek s údaji.');
      return;
    }

    setImportLoading(true);
    setImportResults(null);

    const lines = manualText.split('\n');
    const manualUsers: { email: string; name: string; role: string }[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Zkusit rozdělit podle středníku nebo čárky
      const parts = line.includes(';') ? line.split(';') : line.split(',');
      const emailPart = parts[0]?.trim();
      const namePart = parts[1]?.trim() || '';
      let rolePart = parts[2]?.trim().toLowerCase() || 'obchodnik';

      if (rolePart === 'obchodník' || rolePart === 'obchodnik') {
        rolePart = 'obchodnik';
      } else if (rolePart === 'člen' || rolePart === 'technik' || rolePart === 'student') {
        rolePart = 'student';
      } else if (rolePart === 'admin' || rolePart === 'administrátor') {
        rolePart = 'admin';
      } else {
        rolePart = 'obchodnik';
      }

      if (emailPart && emailPart.includes('@')) {
        manualUsers.push({
          email: emailPart,
          name: namePart || emailPart.split('@')[0],
          role: rolePart
        });
      }
    }

    if (manualUsers.length === 0) {
      notify('error', 'Chyba', 'Nebyly nalezeny žádné platné e-mailové adresy. Použijte formát: email;jméno');
      setImportLoading(false);
      return;
    }

    try {
      const resp = await fetch('/api/caflou/import-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualUsers })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setImportResults(data.users || []);
        setManualText('');
        setShowManualImport(false);
        notify('success', 'Vytvoření dokončeno', data.message || `${manualUsers.length} uživatelů bylo úspěšně vytvořeno.`);
        fetchRatesAndUsers();
      } else {
        notify('error', 'Chyba', data.error || 'Nebylo možné dokončit import.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba spojení', 'Nepodařilo se komunikovat se serverem.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCopyPassword = (pwd: string, index: number) => {
    navigator.clipboard.writeText(pwd);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  };

  // Save Rates handler
  const handleSaveRates = async () => {
    setSavingRates(true);
    try {
      const resp = await fetch('/api/caflou/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: userRates })
      });

      if (resp.ok) {
        notify('success', 'Sazby uloženy', 'Mzdové a odměňovací tarify týmu byly bezpečněProps aktualizovány.');
      } else {
        notify('error', 'Chyba', 'Nepodařilo se uložit hodinové tarify.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba', 'Chyba připojení při zápisu sazeb.');
    } finally {
      setSavingRates(false);
    }
  };

  // Perform single payout
  const handleSinglePayout = async (item: ReportItem) => {
    if (!item.userId) return;
    
    setProcessingPayouts(prev => ({ ...prev, [item.email]: true }));
    const xpReward = Math.round(item.hours * xpBonusRate);

    try {
      const resp = await fetch('/api/caflou/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: item.userId,
          amount: item.payoutAmount,
          hours: item.hours,
          month: selectedMonth,
          year: selectedYear,
          xpReward: xpReward
        })
      });

      if (resp.ok) {
        notify('success', 'Odměna vyplacena', `Uživateli ${item.userName || item.email} bylo úspěšně připsáno ${item.payoutAmount.toLocaleString()} Kč a ${xpReward} XP.`);
        
        // Označíme položku v lokálním stavu reportu jako vyplacenou
        setReport(prev => prev.map(r => r.email === item.email ? { ...r, alreadyPaid: true } : r));
      } else {
        const err = await resp.json();
        notify('error', 'Výplata selhala', err.error || 'Server odmítl transakci.');
      }
    } catch (e) {
      console.error(e);
      notify('error', 'Chyba transakce', 'Nelze dokončit proces zápisu odměny.');
    } finally {
      setProcessingPayouts(prev => ({ ...prev, [item.email]: false }));
    }
  };

  // Payout all unpaid items
  const handlePayoutAllUnpaid = async () => {
    const unpaidItems = report.filter(item => item.userFound && item.payoutAmount > 0 && !item.alreadyPaid);
    if (unpaidItems.length === 0) {
      notify('info', 'Hotovo', 'Všechny spárované výplatní požadavky jsou již vyrovnány.');
      return;
    }

    let successCount = 0;
    // Postupně zpracujeme každého uživatele pro maximalní přesnost a bezchybnost db transakce
    for (const item of unpaidItems) {
      const xpReward = Math.round(item.hours * xpBonusRate);
      try {
        const resp = await fetch('/api/caflou/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: item.userId,
            amount: item.payoutAmount,
            hours: item.hours,
            month: selectedMonth,
            year: selectedYear,
            xpReward: xpReward
          })
        });
        if (resp.ok) successCount++;
      } catch (e) {
        console.error('Batch payout error for ' + item.email, e);
      }
    }

    notify('success', 'Hromadná výplata dokončena', `Úspěšně schváleno a odesláno ${successCount} z ${unpaidItems.length} výplat.`);
    // Refresh report state
    handleSyncTimesheets();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    notify('success', 'Zkopírováno!', 'URL adresa webhooku byla uložena do vaší schránky.');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-caflou-container">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center shadow-inner">
              <LinkIcon size={24} className="rotate-45" />
            </span>
            Klientské napojení Caflou.cz
          </h2>
          <p className="text-slate-500 mt-1.5 text-sm md:text-base">
            Odměňujte a vyplácejte svůj tým v reálném i herním čase na základě schválených výkazů z Caflou.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap -mb-px ${
            activeTab === 'projects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-projects"
        >
          <Briefcase size={16} />
          Log Zakázek (Výplaty ze zakázek)
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap -mb-px ${
            activeTab === 'payouts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-payouts"
        >
          <Coins size={16} />
          Měsíční výplaty & reporty
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm border-b-2 transition -mb-px ${
            activeTab === 'rates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-rates"
        >
          <Users size={16} />
          Hodinové sazby týmu
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm border-b-2 transition -mb-px ${
            activeTab === 'sales'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-sales"
        >
          <Trophy size={16} className="text-amber-500 animate-pulse-none" />
          Provizní systém OZ 🎯
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm border-b-2 transition -mb-px ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-settings"
        >
          <Settings size={16} />
          Konfigurace & Webhooky
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm border-b-2 transition -mb-px ${
            activeTab === 'statistics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-statistics"
        >
          <TrendingUp size={16} />
          Statistiky
        </button>
      </div>

      {activeTab === 'projects' && (
        <div className="space-y-6 animate-fade-in" id="caflou-projects-view">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Briefcase className="text-indigo-600" size={18} />
                Dokončené zakázky a vyplácení
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-8">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Zvolte Měsíc</label>
                <select
                  value={projectMonth}
                  onChange={e => setProjectMonth(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                >
                  <option value={1}>Leden</option>
                  <option value={2}>Únor</option>
                  <option value={3}>Březen</option>
                  <option value={4}>Duben</option>
                  <option value={5}>Květen</option>
                  <option value={6}>Červen</option>
                  <option value={7}>Červenec</option>
                  <option value={8}>Srpen</option>
                  <option value={9}>Září</option>
                  <option value={10}>Říjen</option>
                  <option value={11}>Listopad</option>
                  <option value={12}>Prosinec</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Rok</label>
                <select
                  value={projectYear}
                  onChange={e => setProjectYear(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
              
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={fetchFinishedProjects}
                  disabled={isFetchingProjects}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition"
                >
                  {isFetchingProjects ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                  Načíst zakázky
                </button>
              </div>
            </div>

            {projectsData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Zákazník</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Projekt</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Realizováno</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Hodnota</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Technik (Výplata)</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Obchodník (Výplata)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsData.map(p => {
                      const amount = parseFloat(p.custom_column_celkova_hodnota || p.earnings_price) || 0;
                      
                      // Identify Salesperson (Obchodník)
                      const salesEmail = p._mappedUserEmail;
                      const salesName = p._mappedUserName || 'Neznámý obchodník';
                      let salesPct = 0;
                      if (salesEmail && projectsOzData?.userConfigs?.[salesEmail]) {
                        const conf = projectsOzData.userConfigs[salesEmail];
                        salesPct = conf.customRates?.b1 || 0;
                      }

                      // Identify Technician (Technik)
                      let rawTechName = p.custom_column_technik1 ? (Array.isArray(p.custom_column_technik1) ? p.custom_column_technik1.join(', ') : p.custom_column_technik1) : 'Nepřiřazeno';
                      let techName = typeof rawTechName === 'string' ? rawTechName.split(',')[0].trim() : String(rawTechName);
                      let techPct = 0;
                      let techEmail = '';
                      
                      // Pokus o match technika na uživatele
                      if (techName !== 'Nepřiřazeno') {
                        const matchedTech = allCaflouUsers.find(u => 
                          u.name?.toLowerCase().includes(techName.toLowerCase()) || 
                          u.first_name?.toLowerCase().includes(techName.toLowerCase()) ||
                          u.short_name?.toLowerCase().includes(techName.toLowerCase())
                        );
                        if (matchedTech) {
                          techEmail = matchedTech.email;
                          const techConf = projectsOzData?.userConfigs?.[matchedTech.email];
                          if (techConf) {
                            techPct = techConf.customRates?.b1 || 0;
                          }
                        }
                      }
                      
                      const techPayout = (amount * techPct) / 100;
                      const salesPayout = (amount * salesPct) / 100;

                      return (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{p.company_name || 'Neznámo'}</td>
                          <td className="py-3 px-4 text-slate-700">{p.name || '-'}</td>
                          <td className="py-3 px-4 text-slate-500 text-sm">
                            {p.custom_column_realizovano || (p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {amount.toLocaleString('cs-CZ')} CZK
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="font-semibold text-slate-700 block mb-1">
                              {rawTechName}
                            </span>
                            {techPct > 0 ? (
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs inline-block">+{Math.round(techPayout).toLocaleString('cs-CZ')} CZK ({techPct} %)</span>
                            ) : (
                              <span className="text-slate-400 text-xs">Bez provize</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="font-semibold text-slate-700 block mb-1">{salesName}</span>
                            {salesPct > 0 ? (
                              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs inline-block">+{Math.round(salesPayout).toLocaleString('cs-CZ')} CZK ({salesPct} %)</span>
                            ) : (
                              <span className="text-slate-400 text-xs">Bez provize {salesEmail ? `(${salesEmail})` : ''}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Briefcase size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-slate-500 text-sm font-medium">Klikněte na "Načíst zakázky" pro zobrazení logu dokončených zakázek.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: PAYOUTS & SYNC */}
      {activeTab === 'payouts' && (
        <div className="space-y-6 animate-fade-in" id="caflou-payouts-view">
          {/* Top Panel - Settings of sync */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={18} />
              Spustit synchronizaci mzdových výkazů
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Zvolte Měsíc
                </label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                  id="select-month"
                >
                  <option value={1}>Leden</option>
                  <option value={2}>Únor</option>
                  <option value={3}>Březen</option>
                  <option value={4}>Duben</option>
                  <option value={5}>Květen</option>
                  <option value={6}>Červen</option>
                  <option value={7}>Červenec</option>
                  <option value={8}>Srpen</option>
                  <option value={9}>Září</option>
                  <option value={10}>Říjen</option>
                  <option value={11}>Listopad</option>
                  <option value={12}>Prosinec</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Zvolte Rok
                </label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                  id="select-year"
                >
                  {yearsList.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Bonus v XP (za odpracovanou hodinu)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={xpBonusRate}
                    onChange={e => setXpBonusRate(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                    id="input-xp-bonus"
                  />
                  <Trophy size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">XP / hod</span>
                </div>
              </div>

              <div>
                <button
                  onClick={handleSyncTimesheets}
                  disabled={syncLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"
                  id="btn-sync-submit"
                >
                  <RefreshCw size={16} className={syncLoading ? 'animate-spin' : ''} />
                  {syncLoading ? 'Stahuji...' : 'Načíst výkazy práce'}
                </button>
              </div>
            </div>

            {/* Check/Demo option */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={useDemo}
                  onChange={e => setUseDemo(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  id="checkbox-use-demo"
                />
                💡 Používat DEMO simulaci (generuje data z vašich Q-Hub uživatelů)
              </label>

              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Info size={14} />
                Párování probíhá na základě shody e-mailové adresy obou systémů.
              </span>
            </div>
          </div>

          {/* Report output */}
          {report.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm" id="caflou-report-results">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Přehled odpracovaných hodin za období {selectedMonth}/{selectedYear}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nalezeno {report.length} unikátních uživatelů ve stažených výkazech.
                  </p>
                </div>

                <button
                  onClick={handlePayoutAllUnpaid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-emerald-600/10"
                  id="btn-payout-all"
                >
                  <DollarSign size={14} />
                  Vyplatit všechny nevyplacené
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4 rounded-l-xl">Status Spojení</th>
                      <th className="p-4">Uživatel Email / Jméno</th>
                      <th className="p-4">Mzdová Sazba</th>
                      <th className="p-4 text-center">Odpracováno</th>
                      <th className="p-4 text-emerald-700">Výplata za měsíc</th>
                      <th className="p-4 text-amber-600">Her. XP Odměna</th>
                      <th className="p-4 text-right rounded-r-xl">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.map(item => {
                      const computedXp = Math.round(item.hours * xpBonusRate);
                      return (
                        <tr key={item.email} className={`hover:bg-slate-50/40 transition ${item.alreadyPaid ? 'opacity-65' : ''}`}>
                          <td className="p-4">
                            {item.userFound ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                <Check size={10} strokeWidth={3} /> Spárováno
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase" title="E-mail nebyl nalezen v registrovaných uživatelích Q-Hubu.">
                                <AlertTriangle size={10} /> Chybí účet
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {item.userName || <span className="text-slate-400 italic">Neznámý uživatel</span>}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 mt-0.5">{item.email}</div>
                            {item.tasks.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1 max-w-xs">
                                {item.tasks.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="bg-slate-100 text-[10px] font-medium text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60 truncate max-w-[150px]" title={t}>
                                    {t}
                                  </span>
                                ))}
                                {item.taskCount > 2 && (
                                  <span className="text-[9px] font-bold text-slate-400 self-center leading-none">
                                    +{item.taskCount - 2} dalších
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {item.userFound ? (
                              <div>
                                <span className="font-semibold text-slate-800 text-xs">
                                  {item.hourlyRate} Kč
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">/ hodinu</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs">—</span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-bold text-xs text-slate-700 text-center">
                            {item.hours.toFixed(1)} hod.
                            <span className="text-[10px] leading-none text-slate-400 font-semibold block mt-1">
                              {item.taskCount} výkazů
                            </span>
                          </td>
                          <td className="p-4 font-bold text-xs text-emerald-700 bg-emerald-50/25">
                            {item.payoutAmount.toLocaleString()} Kč
                          </td>
                          <td className="p-4 font-bold text-xs text-amber-600 font-mono">
                            +{computedXp} XP
                          </td>
                          <td className="p-4 text-right">
                            {item.alreadyPaid ? (
                              <span className="inline-flex py-1.5 px-3 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200">
                                Vyplaceno 🟢
                              </span>
                            ) : item.userFound ? (
                              <button
                                onClick={() => handleSinglePayout(item)}
                                disabled={processingPayouts[item.email] || item.payoutAmount === 0}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition duration-150 active:scale-95 shadow shadow-indigo-600/10 disabled:opacity-50"
                              >
                                {processingPayouts[item.email] ? 'Vyplácím...' : 'Schválit & Vyplatit'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  notify('warning', 'Nelze vyplatit', 'Tento uživatel nemá založen herní účet pod tímto e-mailem v Q-Hubu. Vytvořte mu nejprve registraci.');
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-400 font-bold py-1.5 px-3 rounded-xl text-xs transition border border-slate-200"
                              >
                                Nelze spojit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm" id="caflou-report-empty">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins size={28} className="text-slate-400 opacity-60" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Zatím nebyly načteny žádné výkazy</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                Zvolte měsíc a rok a klikněte na tlačítko <strong className="text-slate-600">Načíst výkazy práce</strong> výše. Systém se spojí s Caflou API, dohledá kompletní výkazy spárované podle e-mailu a vypočítá výplaty.
              </p>
            </div>
          )}

          {/* SEZNAM VŠECH LIDÍ S VYPLACENOU ČÁSTKOU A HISTORIÍ VÝPLAT */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="payout-history-overview">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <History className="text-indigo-600" size={18} />
                  Celkový přehled a historie výplat všech členů
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Přehled aktuálních celkových výplat v profilech uživatelů a kompletní historický rozpad schválených výplatních cyklů.
                </p>
              </div>

              {/* Hledání */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Vyhledat uživatele..."
                  value={payoutsHistorySearch}
                  onChange={(e) => setPayoutsHistorySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {payoutsHistorySearch && (
                  <button
                    onClick={() => setPayoutsHistorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {qhubUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                U Q-Hubu zatím nejsou registrováni žádní uživatelé.
              </div>
            ) : (
              <div className="space-y-3">
                {qhubUsers
                  .filter(u => {
                    if (!payoutsHistorySearch) return true;
                    const search = payoutsHistorySearch.toLowerCase();
                    return (
                      (u.name || '').toLowerCase().includes(search) ||
                      u.email.toLowerCase().includes(search)
                    );
                  })
                  .map(user => {
                    const isExpanded = !!expandedUsers[user.id];
                    const historyList = user.profitHistory || [];

                    return (
                      <div
                        key={user.id}
                        className="border border-slate-150 rounded-2xl overflow-hidden transition hover:border-slate-300 bg-slate-50/20"
                      >
                        {/* Header řádku */}
                        <div
                          onClick={() => {
                            setExpandedUsers(prev => ({
                              ...prev,
                              [user.id]: !prev[user.id]
                            }));
                          }}
                          className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none bg-white hover:bg-slate-50/50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                {user.name || <span className="text-slate-400 italic">Nepojmenovaný uživatel</span>}
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-slate-200">
                                  {user.role}
                                </span>
                              </div>
                              <div className="font-mono text-[10px] text-slate-500 mt-0.5">{user.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 self-stretch justify-between sm:self-auto sm:justify-start">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Celkově vyplaceno</span>
                              <span className="font-extrabold text-xs text-emerald-700 font-mono">
                                {(user.financialProfit ?? 0).toLocaleString()} Kč
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
                              <span className="text-[10px] text-slate-400 font-bold mr-1 bg-slate-100 px-2 py-1 rounded-lg">
                                {historyList.length} záznamů
                              </span>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Expandované detaily (historie) */}
                        {isExpanded && (
                          <div className="border-t border-slate-150 p-4 bg-slate-50/60 animate-fade-in">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-405 mb-3">
                              Historie schválených výplat
                            </h4>

                            {historyList.length === 0 ? (
                              <div className="text-[11px] text-slate-400 italic py-2">
                                📭 Pro tohoto uživatele zatím nebyly uloženy žádné schválené výplaty přes Caflou modul.
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full text-left text-[11px] whitespace-nowrap">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      <th className="p-3">Datum schválení</th>
                                      <th className="p-3">Částka</th>
                                      <th className="p-3 rounded-r-xl">Poznámka / Detaily</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-150 font-medium">
                                    {historyList.map((entry: any) => (
                                      <tr key={entry.id || entry.date} className="hover:bg-slate-50/50 transition">
                                        <td className="p-3 font-mono text-slate-500">
                                          {entry.date}
                                        </td>
                                        <td className="p-3 font-extrabold text-slate-900 text-emerald-700 font-mono">
                                          {parseFloat(entry.amount || 0).toLocaleString()} Kč
                                        </td>
                                        <td className="p-3 text-slate-600 italic">
                                          {entry.note || 'Měsíční finanční plnění'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HOURLY RATES */}
      {activeTab === 'rates' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm animate-fade-in space-y-6" id="caflou-rates-view">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Users className="text-indigo-600" size={18} />
                Definovat mzdové tarify týmu
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Zde definujte hodinovou odměnu v Kč pro každého člena. Ta se pak automaticky propíše do výpočtu výplat.
              </p>
            </div>

            <button
              onClick={handleSaveRates}
              disabled={savingRates || ratesLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95 shadow-md shadow-indigo-600/10"
              id="btn-save-rates"
            >
              {savingRates ? 'Ukládám...' : 'Uložit všechny mzdové sazby'}
            </button>
          </div>

          {ratesLoading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
              Načítám mzdovou bázi...
            </div>
          ) : qhubUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              U Q-Hubu zatím nejsou registrováni žádní uživatelé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 rounded-l-xl">Člen</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Uživatelská Role</th>
                    <th className="p-4">Celkový vyplacený zisk v profilu</th>
                    <th className="p-4 rounded-r-xl w-48">Hodinová Sazba (Kč/hod)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100Field">
                  {qhubUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-4 font-bold text-xs text-slate-900">
                        {user.name || <span className="text-slate-400 italic">Nepojmenovaný uživatel</span>}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-600">
                        {user.email}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 tracking-wide border border-slate-200">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-xs text-emerald-700 font-mono">
                        {user.financialProfit.toLocaleString()} Kč
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <input
                            type="number"
                            value={userRates[user.email] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setUserRates(prev => ({ ...prev, [user.email]: val }));
                            }}
                            className="bg-slate-50/80 border border-slate-200 rounded-lg py-1.5 px-3 pl-8 w-36 font-mono font-bold text-xs text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">CZK</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2.5: PROVIZNÍ SYSTÉM OZ */}
      {activeTab === 'sales' && (
        <div className="space-y-8 animate-fade-in text-slate-900 pb-16" id="caflou-sales-view">
          {/* Main header stats */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-lg">Mzdový kontrolor 1.0</span>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider rounded-lg">Obchodní Zástupci (OZ)</span>
              </div>
              <h3 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                <Trophy className="text-amber-500" size={26} />
                Správa provizí obchodníků QAPI
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                Údaje o zakázkách (Máme hotovo / Dokončeno) se načítají realtime přímo z Caflou. Výplaty provizí závisí na e-mailu profilu u projektů a hodnotě zakázek, můžete doplnit i slevy do popisu (např. 'sleva 10%').
              </p>
            </div>

            {/* Global controls */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-2">Od</span>
              <input
                type="date"
                value={salesStartDate}
                onChange={(e) => setSalesStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest pl-2">Do</span>
              <input
                type="date"
                value={salesEndDate}
                onChange={(e) => setSalesEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick interactive utilities grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Col: Handlers forms */}
            <div className="xl:col-span-4 space-y-8">
              {/* Form 1: Add order manually */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Plus size={14} className="text-emerald-500" />
                    Zavést novou zakázku (OZ)
                  </h4>
                  <button 
                    onClick={() => setIsAddingOrder(!isAddingOrder)}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    {isAddingOrder ? 'Skrýt' : 'Zobrazit'}
                  </button>
                </div>

                {isAddingOrder && (
                  <form onSubmit={handleCreateOrder} className="space-y-4 text-xs animate-fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail obchodníka (OZ)</label>
                      <input
                        type="email"
                        required
                        value={newOrderEmail}
                        onChange={(e) => setNewOrderEmail(e.target.value)}
                        placeholder="oz.prodej@qapi.cz"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Číslo smlouvy</label>
                        <input
                          type="text"
                          required
                          value={newOrderNumber}
                          onChange={(e) => setNewOrderNumber(e.target.value)}
                          placeholder="S-2026-1049"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-505"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Datum dokončení</label>
                        <input
                          type="text"
                          required
                          placeholder="2026-05-20"
                          defaultValue={salesEndDate.substring(0, 10)}
                          onChange={(e) => {
                            // Let's use custom formatted value or handle default value in route
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-505"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Název odběratele / Zákazníka</label>
                      <input
                        type="text"
                        required
                        value={newOrderCustomer}
                        onChange={(e) => setNewOrderCustomer(e.target.value)}
                        placeholder="Josef Novák, servis oken a žaluzií"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Specifikace díla</label>
                      <input
                        type="text"
                        value={newOrderDesc}
                        onChange={(e) => setNewOrderDesc(e.target.value)}
                        placeholder="Výměna těsnění, stínící sítě do 4 oken"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-505"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fakturovaný obrat</label>
                        <input
                          type="number"
                          required
                          value={newOrderAmount}
                          onChange={(e) => setNewOrderAmount(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Poskytnutá Sleva (%)</label>
                        <input
                          type="number"
                          required
                          max={100}
                          min={0}
                          value={newOrderDiscount}
                          onChange={(e) => setNewOrderDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      ⚠️ Minimální doporučená cena těsnění je 120 Kč (sleva 33%). Slevy do 20 % jsou bez omezení. Slevy 33-45 % snižují provizi u dané zakázky na 6-10 %, slevy 45-60 % ji snižují na 3-7 % podle výše konkrétní zakázky. Sleva nad 60 % anuluje provizi na 0.
                    </p>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition"
                    >
                      Vystavit zakázku OZ 🧾
                    </button>
                  </form>
                )}
                {!isAddingOrder && (
                  <p className="text-[10px] text-slate-400">Přidávejte dokončené zakázky OZ pro výpočet procentuálních provizí ručně mimo caflou.</p>
                )}
              </div>

              {/* Form 2: Add Manual bonus or fine */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Award size={14} className="text-amber-500 animate-pulse-none" />
                  Mimořádné mzdové úpravy (MNG)
                </h4>

                <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">OZ Obchodník email</label>
                    <input
                      type="email"
                      required
                      value={adjUserEmail}
                      onChange={(e) => setAdjUserEmail(e.target.value)}
                      placeholder="obchodnik@qapi.cz"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-505"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Typ úpravy</label>
                      <select
                        value={adjType}
                        onChange={(e) => setAdjType(e.target.value as 'fine' | 'bonus')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-505"
                      >
                        <option value="bonus">Odměna (+) 🌟</option>
                        <option value="fine">Pokuta (-) 🚨</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Částka v Kč</label>
                      <input
                        type="number"
                        required
                        value={adjAmount}
                        onChange={(e) => setAdjAmount(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-505"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Odůvodnění / Komentář</label>
                    <input
                      type="text"
                      required
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      placeholder="Pokuta za neodeslání zakázkového listu, bonus za překonání cíle..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-505"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition"
                  >
                    Uložit mzdovou úpravu 💾
                  </button>
                </form>
              </div>
            </div>

            {/* Right Col: Primary Users Commission Configs & Audits Panel */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Filter interface */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <input
                  type="text"
                  placeholder="Vyhledat OZ podle e-mailu nebo jména..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-350 shadow-inner"
                />
                <div className="flex gap-2 text-xs font-medium text-slate-400 w-full sm:w-auto justify-end select-none">
                  <span>Celkem zavedených OZ profilů: <strong className="text-slate-900">{Object.keys(salesData.userConfigs).length}</strong></span>
                </div>
              </div>

              {/* OZ Profiles iteration */}
              {salesLoading ? (
                <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl">
                  <RefreshCw className="animate-spin text-slate-400 mx-auto mb-3" size={32} />
                  <p className="text-sm font-medium text-slate-500">Načítám kompletní provizní výkazy OZ z datového úložiště...</p>
                </div>
              ) : (() => {
                // Compile unique Oz emails list
                const allEmails = new Set<string>();
                
                // Add users from main user DB
                qhubUsers.forEach(u => allEmails.add(u.email.toLowerCase().trim()));
                // Add configured userConfigs
                Object.keys(salesData.userConfigs).forEach(e => allEmails.add(e.toLowerCase().trim()));
                // Add from current orders/adjustments
                salesData.orders.forEach(o => allEmails.add(o.email.toLowerCase().trim()));
                salesData.adjustments.forEach(a => allEmails.add(a.email.toLowerCase().trim()));

                const filteredEmails = Array.from(allEmails).filter(email => {
                  if (!email) return false;
                  if (!salesSearch) return true;
                  const norm = email.toLowerCase();
                  const find = salesSearch.toLowerCase();
                  const matchedUser = qhubUsers.find(u => u.email.toLowerCase().trim() === norm);
                  const nameVal = matchedUser?.name || '';
                  return norm.includes(find) || nameVal.toLowerCase().includes(find);
                });

                if (filteredEmails.length === 0) {
                  return (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl text-sm text-slate-400">
                      📭 Podle vašeho vyhledávacího filtru nebyli dohledáni žádní obchodníci.
                    </div>
                  );
                }

                return (
                  <div className="space-y-8 animate-none">
                    {filteredEmails.map(email => {
                      const norm = email.toLowerCase().trim();
                      const matchedUser = qhubUsers.find(u => u.email.toLowerCase().trim() === norm);
                      const config = salesData.userConfigs[norm] || { userType: 'commission', fixRate: 0 };
                      
                      const monthOrders = salesData.orders.filter(o => o.email.toLowerCase() === norm && (o.date >= salesStartDate && o.date <= salesEndDate) && o.status === 'completed');
                      const totalVolume = monthOrders.reduce((sum, o) => sum + o.amount, 0);

                      // Determine bracket base percentage
                      let baseRatePercent = 8;
                      let bracketText = '1 Kč - 400 000 Kč (8%)';
                      if (totalVolume <= 400000) {
                          baseRatePercent = config.customRates?.b1 ?? 8;
                          bracketText = `I. Stupeň (${baseRatePercent}%)`;
                      } else if (totalVolume <= 700000) {
                          baseRatePercent = config.customRates?.b2 ?? 10;
                          bracketText = `II. Stupeň (${baseRatePercent}%)`;
                      } else if (totalVolume <= 1000000) {
                          baseRatePercent = config.customRates?.b3 ?? 11;
                          bracketText = `III. Stupeň (${baseRatePercent}%)`;
                      } else {
                          baseRatePercent = config.customRates?.b4 ?? 12;
                          bracketText = `IV. Exkluzivní (${baseRatePercent}%)`;
                      }

                      // Individual order commission calculations
                      const calculateIndividualCommission = (amount: number, discount: number) => {
                          if (discount > 60) return 0; // penalty

                          const tier1 = discount >= 33 && discount <= 45; // reduced (33% - 45%)
                          const tier2 = discount > 45 && discount <= 60; // penalized (45.1% - 60%)

                          if (tier1) {
                              // Sleva 33% - 45%: rate is determined strictly by the individual order amount
                              if (amount <= 400000) return amount * 0.06;
                              if (amount <= 700000) return amount * 0.08;
                              if (amount <= 1000000) return amount * 0.09;
                              return amount * 0.10;
                          } else if (tier2) {
                              // Sleva 45.1% - 60%: rate is determined strictly by the individual order amount
                              if (amount <= 400000) return amount * 0.03;
                              if (amount <= 700000) return amount * 0.05;
                              if (amount <= 1000000) return amount * 0.06;
                              return amount * 0.07;
                          } else {
                              // Normal discount (< 33%): rate is determined by total monthly volume (totalVolume)
                              let rate = baseRatePercent;
                              let r1 = config.customRates?.b1 ?? 8;
                              let r2 = config.customRates?.b2 ?? 10;
                              let r3 = config.customRates?.b3 ?? 11;
                              let r4 = config.customRates?.b4 ?? 12;

                              if (totalVolume <= 400000) rate = r1;
                              else if (totalVolume <= 700000) rate = r2;
                              else if (totalVolume <= 1000000) rate = r3;
                              else rate = r4;

                              return amount * (rate / 100);
                          }
                      };

                      const totalCommissions = (config.userType === 'commission' || config.userType === 'both')
                          ? monthOrders.reduce((sum, o) => sum + calculateIndividualCommission(o.amount, o.discount), 0)
                          : 0;

                      // Fix Salary basic rate
                      const fixAmount = (config.userType === 'fix' || config.userType === 'both') ? config.fixRate : 0;

                      // Fines & bonuses for selected month
                      const monthAdjustments = salesData.adjustments.filter(a => a.email.toLowerCase() === norm && (a.month >= salesStartDate.substring(0,7) && a.month <= salesEndDate.substring(0,7)));
                      const bonusesSum = monthAdjustments.filter(a => a.type === 'bonus').reduce((sum, a) => sum + a.amount, 0);
                      const finesSum = monthAdjustments.filter(a => a.type === 'fine').reduce((sum, a) => sum + a.amount, 0);

                      // Final payout result
                      const totalPayout = Math.max(0, Math.round(totalCommissions + fixAmount + bonusesSum - finesSum));

                      const isEditing = editingEmail === norm;

                      return (
                        <div key={norm} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:border-slate-300 transition-all">
                          {/* Inner Header strip */}
                          <div className="bg-slate-50/70 p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm">{matchedUser?.name || 'Alternativní OZ'}</span>
                                <span className="text-xs text-slate-400 font-medium select-all">({norm})</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  config.userType === 'commission' ? 'bg-indigo-50 text-indigo-700' :
                                  config.userType === 'fix' ? 'bg-amber-50 text-amber-700' :
                                  'bg-emerald-50 text-emerald-700'
                                }`}>
                                  Typ: {config.userType === 'commission' ? 'Provizní OZ' : config.userType === 'fix' ? 'Fixní mzda' : 'Kombinovaný (Fix+Provize)'}
                                </span>
                                {config.userType !== 'commission' && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black font-mono">
                                    Fix: {config.fixRate?.toLocaleString()} Kč
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Set schema Button */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingEmail(null);
                                  } else {
                                    setConfigUserType(config.userType);
                                    setConfigFixRate(config.fixRate || 15000);
                                    setConfigRates(config.customRates || { b1: 8, b2: 10, b3: 11, b4: 12 });
                                    setEditingEmail(norm);
                                  }
                                }}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1"
                              >
                                <Edit3 size={12} className="text-slate-400" />
                                {isEditing ? 'Storno' : 'Nastavit model ⚙️'}
                              </button>
                            </div>
                          </div>

                          {/* Inline Configuration Editor overlay */}
                          {isEditing && (
                            <div className="p-6 bg-slate-50 border-b border-slate-200 text-xs space-y-4 animate-fade-in animate-none">
                              <h5 className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                                <Settings size={14} />
                                Konfigurační editor odměňovacího schématu (OZ)
                              </h5>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Type selector */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mzdový model</label>
                                  <select
                                    value={configUserType}
                                    onChange={(e) => setConfigUserType(e.target.value as any)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                  >
                                    <option value="commission">Pouze provizní stupně 📈</option>
                                    <option value="fix">Pouze fixní částka {`({fix})`} 📌</option>
                                    <option value="both">Kombinovaný (Fix + Provize) 🌟</option>
                                  </select>
                                </div>

                                {/* Salary basic amount */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fixní základ (Kč)</label>
                                  <input
                                    type="number"
                                    disabled={configUserType === 'commission'}
                                    value={configFixRate}
                                    onChange={(e) => setConfigFixRate(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold disabled:bg-slate-100/70"
                                  />
                                </div>
                              </div>

                              {/* Customize percentages per tiers */}
                              {configUserType !== 'fix' && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest mt-2">Dohodnuté provizní sazby (březnové bonusové stupně)</span>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">I. Stupeň (1-400k Kč)</label>
                                      <input
                                        type="number"
                                        value={configRates.b1}
                                        onChange={(e) => setConfigRates(prev => ({ ...prev, b1: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">II. Stupeň (400k-700k Kč)</label>
                                      <input
                                        type="number"
                                        value={configRates.b2}
                                        onChange={(e) => setConfigRates(prev => ({ ...prev, b2: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">III. Stupeň (700k-1M Kč)</label>
                                      <input
                                        type="number"
                                        value={configRates.b3}
                                        onChange={(e) => setConfigRates(prev => ({ ...prev, b3: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">IV. Stupeň (1M+ Kč)</label>
                                      <input
                                        type="number"
                                        value={configRates.b4}
                                        onChange={(e) => setConfigRates(prev => ({ ...prev, b4: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/50">
                                <button
                                  onClick={() => setEditingEmail(null)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-bold"
                                >
                                  Zrušit
                                </button>
                                <button
                                  onClick={() => handleSaveConfig(norm)}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg shadow-sm"
                                >
                                  Uložit schéma ✔️
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Calculations Overview Grid */}
                          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Měsíční obrat (Obrat)</span>
                              <div className="text-lg font-black text-slate-900 mt-1">{totalVolume.toLocaleString()} Kč</div>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {monthOrders.length} uznaných zakázek
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Provize ze smluv</span>
                              <div className="text-lg font-bold text-indigo-700 mt-1">
                                {config.userType === 'fix' ? '0 Kč' : `${Math.round(totalCommissions).toLocaleString()} Kč`}
                              </div>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold block w-max mt-1">
                                Pásmo: {config.userType === 'fix' ? 'Fixní model' : bracketText}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Fixní plat + Korekce</span>
                              <div className="text-lg font-extrabold text-slate-800 mt-1">
                                {((config.userType === 'fix' || config.userType === 'both') ? config.fixRate : 0).toLocaleString()} Kč
                              </div>
                              <span className={`text-[10px] font-bold block mt-1 ${bonusesSum - finesSum >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                Extras: {bonusesSum - finesSum >= 0 ? '+' : ''}{(bonusesSum - finesSum).toLocaleString()} Kč
                              </span>
                            </div>

                            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-center">
                              <span className="text-[10px] font-extrabold text-emerald-800 block uppercase tracking-wider">Navržená výplata</span>
                              <div className="text-xl font-black text-emerald-950 mt-1">{totalPayout.toLocaleString()} Kč</div>
                            </div>
                          </div>

                          {/* Inner list: Log of deals and applied corrections for current month */}
                          <div className="px-6 py-4 bg-slate-50/40 border-b border-slate-100 space-y-4">
                            {/* Deals list header */}
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-405 block">Soupis zakázkových listů (Tento cyklus)</span>
                            </div>

                            {monthOrders.length === 0 ? (
                              <div className="text-slate-400 text-[10px] py-2 leading-relaxed">
                                📭 Pro zúčtovací období {salesStartDate} do {salesEndDate} nemá toto OZ zavedené žádné dokončené objednávky. Provize bude vypočtena na 0 Kč.
                              </div>
                            ) : (
                              <div className="space-y-2 text-[11px] font-medium leading-normal">
                                {monthOrders.map(o => {
                                  const cPrice = calculateIndividualCommission(o.amount, o.discount);
                                  return (
                                    <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center group">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-900">{o.customerName}</span>
                                          <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">{o.contractNumber}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 leading-none">
                                          <span>{o.description || 'Instalace stínící techniky'}</span>
                                          <span className="text-slate-300">|</span>
                                          <span>Sleva:</span>
                                          {editingOrderId === o.id ? (
                                            <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-300">
                                              <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={editingOrderDiscount}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setEditingOrderDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                                className="w-12 bg-white text-[11px] font-bold text-slate-800 text-center rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 py-px px-1 border border-slate-200"
                                              />
                                              <span className="text-[10px] font-bold text-slate-500">%</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateDiscount(o, editingOrderDiscount);
                                                }}
                                                className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded bg-white transition border border-slate-200"
                                                title="Uložit slevu"
                                              >
                                                <Check size={10} strokeWidth={3} />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingOrderId(null);
                                                }}
                                                className="p-0.5 text-rose-600 hover:bg-rose-50 rounded bg-white transition border border-slate-200"
                                                title="Zrušit"
                                              >
                                                <X size={10} strokeWidth={3} />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="inline-flex items-center gap-1">
                                              <strong className="text-slate-700">{o.discount}%</strong>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingOrderId(o.id);
                                                  setEditingOrderDiscount(o.discount);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                                                title="Upravit slevu"
                                              >
                                                <Edit3 size={10} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <span className="font-extrabold text-slate-900 block">{o.amount.toLocaleString()} Kč</span>
                                          <span className="text-[10px] font-bold text-slate-500">Provize: {config.userType === 'fix' ? '0' : Math.round(cPrice).toLocaleString()} Kč</span>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteOrder(o.id)}
                                          className="p-1 px-1.5 text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg transition"
                                          title="Smazat zakázku"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Applied corrections */}
                            {monthAdjustments.length > 0 && (
                              <div className="space-y-2 animate-none">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-405 block pt-2">Schválené korekce a úpravy</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                  {monthAdjustments.map(a => (
                                    <div key={a.id} className={`p-2.5 rounded-lg border flex justify-between items-center ${
                                      a.type === 'bonus' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' : 'bg-rose-50/50 border-rose-100 text-rose-950'
                                    }`}>
                                      <div>
                                        <span className="font-bold">{a.reason}</span>
                                        <span className="block text-[9px] text-slate-400 font-semibold">{a.date}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`font-mono font-bold ${a.type === 'bonus' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                          {a.type === 'bonus' ? '+' : '-'}{a.amount.toLocaleString()} Kč
                                        </span>
                                        <button
                                          onClick={() => handleDeleteAdjustment(a.id)}
                                          className="text-[10px] font-bold text-rose-600 hover:underline"
                                        >
                                          Zrušit
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Direct wallet payouts execution actions */}
                          <div className="p-6 bg-slate-50/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-slate-100">
                            <div>
                              <span className="text-slate-400 font-bold text-[10px] uppercase">Vyplacené cykly OZ:</span>
                              <div className="flex flex-wrap gap-1 mt-1 leading-relaxed">
                                {salesData.payouts.filter(p => p.email.toLowerCase() === norm).length === 0 ? (
                                  <span className="text-[10px] text-slate-400 font-medium">Zatím nebyly v tomto systému vyplaceny žádné mzdy.</span>
                                ) : (
                                  salesData.payouts.filter(p => p.email.toLowerCase() === norm).map(p => (
                                    <span key={p.id} className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-bold rounded">
                                      {p.month} ({p.totalPayout.toLocaleString()} Kč) ✔️
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Action triggering */}
                            {(() => {
                              const targetMonth = salesEndDate.substring(0, 7);
                              const alreadyPaidThisMonth = salesData.payouts.some(p => p.email.toLowerCase() === norm && p.month === targetMonth);

                              if (alreadyPaidThisMonth) {
                                return (
                                  <span className="px-3 py-2 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-xl border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 size={14} />
                                    Vyplaceno a zaúčtováno v tomto cyklu
                                  </span>
                                );
                              }

                              return (
                                <div className="flex items-center gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                                  {/* Custom XP reward helper field */}
                                  <div className="flex items-center gap-1 BG-WHITE border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-xs select-none shadow-sm">
                                    <Sparkles size={12} className="text-amber-500" />
                                    <span className="font-bold text-slate-450 text-[10px]">Herní XP:</span>
                                    <input
                                      type="number"
                                      defaultValue={totalPayout}
                                      id={`xp-reward-input-${norm}`}
                                      className="w-16 bg-transparent text-center font-bold font-mono focus:outline-none"
                                    />
                                  </div>

                                  <button
                                    onClick={() => {
                                      const inputEl = document.getElementById(`xp-reward-input-${norm}`) as HTMLInputElement;
                                      const xpAdd = inputEl ? (parseInt(inputEl.value) || 0) : totalPayout;
                                      handleExecuteSalesPayout(norm, xpAdd);
                                    }}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition flex justify-center items-center gap-1.5 shadow-sm"
                                  >
                                    <Coins size={14} className="text-emerald-400" />
                                    Schválit & Vyplatit mzdu 💰
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & WEBHOOK HISTORY */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fade-in" id="caflou-settings-view">
          
          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* API Connection Setup */}
            <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" fill="currentColor" />
                  <h3 className="font-extrabold text-slate-900 text-base">Konfigurace Caflou API</h3>
                </div>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  Připojení 🟢
                </span>
              </div>

              <div className="space-y-5">
                {/* Caflou API Token Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    1. Vložte Caflou API Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={caflouToken}
                      onChange={e => setCaflouToken(e.target.value)}
                      placeholder="caflou_sk_..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-3 pr-10 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      id="input-token-caflou"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      id="btn-toggle-token-visibility"
                    >
                      {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    API token získáte v Caflou v Nastavení účtu pod záložkou "API přístupový token".
                  </p>
                </div>

                {/* Company ID Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    2. Vložte ID Účtu (nepovinné)
                  </label>
                  <input
                    type="text"
                    value={caflouCompanyId}
                    onChange={e => setCaflouCompanyId(e.target.value)}
                    placeholder="Např. 3848"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                    id="input-company-id"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    ID firmy / účtu naleznete na konci cílové url v Caflou po přihlášení, nebo jej můžete nechat prázdné.
                  </p>
                </div>

                {/* Custom Base URL Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    3. Vlastní Caflou API URL (volitelné)
                  </label>
                  <input
                    type="text"
                    value={caflouBaseUrl}
                    onChange={e => setCaflouBaseUrl(e.target.value)}
                    placeholder="https://api.caflou.cz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                    id="input-base-url"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    Pokud necháte prázdné, aplikace automaticky vyzkouší české i slovenské/globální servery. Případně můžete zvolit nebo vepsat adresu ručně:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCaflouBaseUrl('https://api.caflou.cz')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        caflouBaseUrl === 'https://api.caflou.cz'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      🇨🇿 api.caflou.cz
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaflouBaseUrl('https://api.caflou.com')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        caflouBaseUrl === 'https://api.caflou.com'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      🌍 api.caflou.com
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaflouBaseUrl('https://app.caflou.cz/api')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        caflouBaseUrl === 'https://app.caflou.cz/api'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      🔗 app.caflou.cz/api
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaflouBaseUrl('')}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        caflouBaseUrl === ''
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      ⚙ Automatická volba (výchozí)
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3">
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-xs transition duration-150 active:scale-95 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                    id="btn-save-settings"
                  >
                    {savingSettings ? 'Ukládám...' : 'Uložit a otestovat konfiguraci'}
                  </button>
                </div>
              </div>

              {/* Webhook block */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Alt. Webhook k odměňování (Webhooky v reálném čase):</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">
                      XP hodnota za doručenou webhook událost
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={xpValue}
                        onChange={e => setXpValue(Math.max(10, parseInt(e.target.value) || 0))}
                        className="w-32 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:border-indigo-500 outline-none transition text-xs"
                      />
                      <span className="text-xs font-semibold text-slate-500">XP za každý dokončený úkol</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase block">
                      Cílová URL webhooku pro Caflou
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-250 rounded-2xl p-2">
                      <span className="font-mono text-[10px] text-slate-500 select-all truncate pl-2 flex-1">
                        {webhookUrl}
                      </span>
                      <button 
                        onClick={copyToClipboard}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          copied 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {copied ? <Check size={12} /> : null}
                        {copied ? 'Uloženo!' : 'Kopírovat'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction block */}
            <div className="lg:col-span-12 xl:col-span-5 bg-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <HelpCircle className="text-indigo-400" size={18} />
                  <h3 className="font-extrabold text-sm tracking-widest uppercase">Jak funguje chytré stahování?</h3>
                </div>

                <ul className="space-y-5 text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">A</span>
                    <div>
                      <strong className="block text-white mb-0.5">Přímé stahování jedním klikem</strong>
                      <span className="text-indigo-150 text-xs">Už nemusíte nastavovat webhook pro každý úkol. Platforma se spojí přímo přes API s vaším účtem v Caflou a stáhne výkazy za vybraný měsíc.</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">B</span>
                    <div>
                      <strong className="block text-white mb-0.5">Sazbový mzdový asistent</strong>
                      <span className="text-indigo-150 text-xs">V záložce Sazby přiřadíte uživatelům jejich hodinovou sazbu. Jakmile stáhnete měsíční hodiny z Caflou, systém jim vypočítá celkovou výplatu.</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">C</span>
                    <div>
                      <strong className="block text-white mb-0.5">Odměna do herního profilu</strong>
                      <span className="text-indigo-150 text-xs">Tlačítko schválení odešle uživateli finanční profit do jeho Q-Hub peněženky, připíše mu XP a zašle slavnostní gratulační zprávu.</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/5 mt-6 flex items-start gap-3">
                <Sparkles className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
                <p className="text-[11px] text-indigo-100 leading-relaxed font-normal">
                  Chytré napojení Caflou šetří hodiny administrativní práce. Celý mzdový proces a doručování gamifikace probíhá plně automatizovaně.
                </p>
              </div>
            </div>

          </div>

          {/* Hromadný import uživatelů */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Rychlý import členů týmu z Caflou</h3>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                Bezpečný přepis 🔒
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tento nástroj prohledá Caflou výkazy a automaticky importuje všechny aktivní členy týmu (obchodníky, techniky), kteří dosud nemají vytvořený účet v Q-Hubu. 
                <strong className="block mt-1 text-slate-850 bg-amber-50 border border-amber-100 p-2.5 rounded-xl">🔒 Bezpečnostní záruka: Pro stávající registrované uživatele v Q-Hubu (včetně Vašeho osobního profilu) jsou stávající hesla i herní profily plně zachovány a nedojde k žádnému přepisu jejich citlivých přihlašovacích údajů.</strong>
              </p>

              {/* Informační banner o DNS sandboxu */}
              <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl text-xs space-y-2 text-indigo-900 leading-relaxed">
                <p className="font-bold flex items-center gap-2">
                  <span className="text-base">ℹ️</span> Diagnostická informace o síťových voláních:
                </p>
                <p>
                  Pokud zkoušíte volat API uvnitř <strong>tohoto vývojářského prostředí (AI Studio Preview)</strong>, síťová spojení ven jsou z bezpečnostních důvodů omezena (proto se v logu objevuje chyba <code>ENOTFOUND api.caflou.cz</code>). Pro testování jsou zde okamžitě použita <strong>věrná offline testovací záložní data</strong>.
                </p>
                <p className="font-medium text-[11px] text-emerald-800 bg-emerald-50 rounded-lg p-2 border border-emerald-150">
                  ✔ <strong>Na Vašem ostrém serveru (Coolify / VPS / Cloud Run)</strong> má aplikace plné internetové připojení, kde toto propojení s reálným Caflou API funguje automaticky a bez chyb!
                </p>
              </div>

              {/* Diagnostika sítě a DNS pro VPS / Coolify */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>⚙️</span> Diagnostický nástroj sítě (VPS / Coolify):
                  </p>
                  <button
                    onClick={handleRunDiagnostics}
                    disabled={diagnosticLoading}
                    className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw size={11} className={diagnosticLoading ? 'animate-spin' : ''} />
                    {diagnosticLoading ? 'Testuji...' : 'Spustit test spojení'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tento test ověří, zda má Vaše VPS možnost přeložit doménu <code>api.caflou.cz</code> a zda mu v tom nebrání chybné nastavení sítě nebo DNS v Dockeru na Coolify.
                </p>

                {diagnosticData && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 font-mono text-[10px] text-slate-700 max-h-72 overflow-y-auto">
                    <div className="flex items-center justify-between font-bold border-b pb-1.5 text-slate-800">
                      <span>VÝSLEDKY DIAGNOSTIKY:</span>
                      <span className="text-[9px] text-slate-400">{new Date(diagnosticData.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-slate-800">1. Překlad domén (DNS):</span>
                        <div className="pl-2.5 mt-1 space-y-1">
                          {Object.entries(diagnosticData.resolutions || {}).map(([host, res]: any) => (
                            <div key={host} className="flex flex-col">
                              <span className="font-semibold text-slate-600">{host}:</span>
                              {res.success ? (
                                <span className="text-emerald-600 pl-2">✔ OK: {res.addresses?.join(', ')}</span>
                              ) : (
                                <span className="text-rose-600 pl-2">❌ Selhal ({res.code || 'CHYBA'}): {res.error}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {diagnosticData.dns8888 && (
                        <div>
                          <span className="font-bold text-slate-800">2. DNS přes Google Resolver (8.8.8.8):</span>
                          <div className="pl-2.5 mt-1 space-y-1">
                            {Object.entries(diagnosticData.dns8888).map(([host, res]: any) => (
                              <div key={host} className="flex flex-col">
                                <span className="font-semibold text-slate-600">{host}:</span>
                                {res.success ? (
                                  <span className="text-emerald-600 pl-2">✔ OK přes 8.8.8.8: {res.addresses?.join(', ')}</span>
                                ) : (
                                  <span className="text-rose-500 pl-2">❌ Google DNS selhal: {res.error}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="font-bold text-slate-1000">3. Testy síťového volání (fetch):</span>
                        <div className="pl-2.5 mt-1 space-y-1">
                          {Object.entries(diagnosticData.fetches || {}).map(([host, res]: any) => (
                            <div key={host} className="flex flex-col">
                              <span className="font-semibold text-slate-600">https://{host}/...</span>
                              {res.success ? (
                                <span className="text-emerald-600 pl-2">✔ Spojení navázáno (Status: {res.status} {res.statusText})</span>
                              ) : (
                                <span className="text-rose-600 pl-2">❌ Volání selhalo: {res.error}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {diagnosticData.suggestions && diagnosticData.suggestions.length > 0 && (
                      <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-2.5 font-sans text-xs space-y-1 text-amber-900 leading-normal">
                        <p className="font-bold flex items-center gap-1 text-[11px] text-amber-800">
                          <span>💡</span> Zjištěné doporučení k nápravě:
                        </p>
                        {diagnosticData.suggestions.map((sug: string, idx: number) => (
                          <p key={idx} className="text-[11px] font-medium whitespace-pre-wrap">{sug}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleImportUsers}
                  disabled={importLoading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl text-xs transition active:scale-95 shadow-md shadow-indigo-600/10"
                  id="btn-import-users-from-caflou"
                >
                  <RefreshCw size={14} className={importLoading ? 'animate-spin' : ''} />
                  {importLoading ? 'Importuji data...' : 'Začít automatický import z Caflou API'}
                </button>

                <button
                  onClick={() => setShowManualImport(!showManualImport)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl text-xs transition active:scale-95"
                  id="btn-toggle-manual-import"
                >
                  <span>✏️</span>
                  {showManualImport ? 'Skrýt ruční vložení' : 'Založit uživatele ručním vložením (Hromadná pasta)'}
                </button>
              </div>

              {/* Collapsible manual input form */}
              {showManualImport && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3 animate-fade-in">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📝</span> Hromadné založení zaměstnanců ručně:
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Zadejte jeden záznam na řádek ve formátu: <code className="bg-slate-200 text-slate-800 px-1 rounded">email;Jméno Příjmení;role</code>
                    <br />
                    Podporované role: <code className="bg-slate-200 text-slate-800 px-1 rounded">obchodnik</code> (výchozí) nebo <code className="bg-slate-200 text-slate-800 px-1 rounded">student</code> nebo <code className="bg-slate-200 text-slate-800 px-1 rounded">admin</code>.
                  </p>
                  <textarea
                    rows={5}
                    placeholder="ludvikremesekwork@gmail.com;Ludvík Remešek;obchodnik&#10;technik1@qapi.cz;Technik Jedna;student&#10;novy.kolega@firma.cz;Jan Novák;obchodnik"
                    className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setManualText('');
                        setShowManualImport(false);
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-150 transition"
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={handleManualImport}
                      disabled={importLoading || !manualText.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg text-xs transition shadow-sm"
                    >
                      {importLoading ? 'Zpracovávám...' : 'Vytvořit tyto účty'}
                    </button>
                  </div>
                </div>
              )}

              {/* Import results details */}
              {importResults !== null && (
                <div className="mt-6 border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50 p-4 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-extrabold text-slate-800">Výsledek hromadné synchronizace ({importResults.length})</span>
                    <button 
                      onClick={() => setImportResults(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-650 font-bold"
                    >
                      Skrýt výsledky
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="pb-2">Jméno</th>
                          <th className="pb-2">E-mail</th>
                          <th className="pb-2">Herní Role</th>
                          <th className="pb-2">Status účtu</th>
                          <th className="pb-2">Dočasné Heslo pro přihlášení</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium font-sans">
                        {importResults.map((u, idx) => (
                          <tr key={u.email} className="hover:bg-white/40 transition">
                            <td className="py-2.5 text-slate-800 font-semibold">{u.name}</td>
                            <td className="py-2.5 text-slate-500 font-mono text-[11px]">{u.email}</td>
                            <td className="py-2.5">
                              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                                {u.role === 'admin' ? 'Administrátor' : u.role === 'obchodnik' ? 'Obchodník' : 'Pracovník'}
                              </span>
                            </td>
                            <td className="py-2.5">
                              {u.status === 'created' ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase">
                                  Nově vytvořen ✦
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase">
                                  Již existuje (Heslo beze změny)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5">
                              {u.status === 'created' && u.tempPassword ? (
                                <div className="flex items-center gap-2">
                                  <code className="bg-amber-50 text-amber-800 font-mono border border-amber-200 text-[11px] font-bold px-2 py-1 rounded select-all">
                                    {u.tempPassword}
                                  </code>
                                  <button
                                    onClick={() => handleCopyPassword(u.tempPassword!, idx)}
                                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                                    title="Kopírovat heslo"
                                  >
                                    {copiedIndex === idx ? (
                                      <span className="text-[10px] text-emerald-600 font-bold">Zkopírováno!</span>
                                    ) : (
                                      <span className="text-[10px] text-indigo-600 font-bold hover:underline">Kopírovat</span>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Uživatel zachován se svým osobním heslem 🔒</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-slate-500 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">
                    💡 <strong>Doporučení:</strong> Nově vytvořeným uživatelům prosím předejte dočasná přihlašovací hesla z tabulky výše. Po prvním přihlášení si mohou své heslo změnit ve svém profilu v Q-Hubu.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Webhook Logs - Full Width */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                <span className="font-extrabold text-slate-900 text-base">Logy doručených Webhooků (Diagnostika)</span>
              </div>
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={12} className={logsLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
                {logsLoading ? 'Načítání...' : 'Aktualizovat'}
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="font-bold text-slate-600 text-sm">Zatím nebyly doručeny žádné webhooky z Caflou.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4 rounded-l-xl">Čas</th>
                      <th className="p-4">Uživatel Email</th>
                      <th className="p-4">Událost Caflou</th>
                      <th className="p-4">Název Úkolu/Práce</th>
                      <th className="p-4">Připsáno XP</th>
                      <th className="p-4 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition text-xs">
                        <td className="p-4 font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString('cs-CZ')}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 bg-slate-100/80 border border-slate-200 rounded px-1.5 py-0.5">
                            {log.email}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono font-bold text-slate-600 uppercase">
                          {log.event}
                        </td>
                        <td className="p-4 font-semibold text-slate-800 max-w-xs truncate" title={log.taskTitle}>
                          {log.taskTitle}
                        </td>
                        <td className="p-4">
                          {log.xpAwarded > 0 ? (
                            <span className="text-yellow-600 font-extrabold font-mono bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5">
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
                            {log.status === 'success' ? 'Doručeno ✅' : log.status === 'user_not_found' ? 'Neznámý ⚠️' : 'Ignorováno 💤'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* TAB 4: STATISTICS */}
      {activeTab === 'statistics' && (
        <div className="space-y-8 animate-fade-in" id="caflou-statistics-view">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-6 flex items-center gap-2">
              <BarChart2 className="text-indigo-600" size={18} />
              Analytika a Statistiky výplat obchodníků
            </h3>
            
            {!salesData ? (
              <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-500 font-bold">
                Načítám data...
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Objem výplat podle obchodníků */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-inner">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-6">Celkové vyplacené provize (Kč)</h4>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(() => {
                        const allEmails = new Set<string>();
                        qhubUsers.forEach(u => allEmails.add(u.email.toLowerCase().trim()));
                        Object.keys(salesData.userConfigs || {}).forEach(e => allEmails.add(e.toLowerCase().trim()));
                        (salesData.payouts || []).forEach(p => allEmails.add(p.email.toLowerCase().trim()));
                        
                        return Array.from(allEmails).map(email => {
                          const norm = email.toLowerCase();
                          const name = qhubUsers.find(u => u.email.toLowerCase() === norm)?.name || norm;
                          return {
                            name,
                            total: salesData.payouts.filter(p => p.email.toLowerCase() === norm).reduce((sum, p) => sum + p.totalPayout, 0)
                          };
                        }).sort((a, b) => b.total - a.total);
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val.toLocaleString()} Kč`} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} formatter={(val: number) => [`${val.toLocaleString()} Kč`, 'Celkem vyplaceno']} />
                        <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Objem rozdaných EXpů */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-inner">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-6">Rozdané Herní Zkušenosti (XP)</h4>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(() => {
                        const allEmails = new Set<string>();
                        qhubUsers.forEach(u => allEmails.add(u.email.toLowerCase().trim()));
                        Object.keys(salesData.userConfigs || {}).forEach(e => allEmails.add(e.toLowerCase().trim()));
                        (salesData.payouts || []).forEach(p => allEmails.add(p.email.toLowerCase().trim()));
                        
                        return Array.from(allEmails).map(email => {
                          const norm = email.toLowerCase();
                          const name = qhubUsers.find(u => u.email.toLowerCase() === norm)?.name || norm;
                          return {
                            name,
                            xp: salesData.payouts.filter(p => p.email.toLowerCase() === norm).reduce((sum, p) => sum + p.xpReward, 0)
                          };
                        }).sort((a, b) => b.xp - a.xp);
                      })()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} formatter={(val: number) => [`${val} XP`, 'Celkem rozdaných XP']} />
                        <Bar dataKey="xp" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trendy v čase podle měsíců */}
                <div className="xl:col-span-2 bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-inner">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-6">Vývoj celkových výplat v čase (Obrat provizí za měsíc)</h4>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={
                        Object.values(salesData.payouts.reduce((acc: any, p: any) => {
                          if (!acc[p.month]) acc[p.month] = { month: p.month, celkem: 0, pocet: 0 };
                          acc[p.month].celkem += p.totalPayout;
                          acc[p.month].pocet += 1;
                          return acc;
                        }, {})).sort((a: any, b: any) => a.month.localeCompare(b.month))
                      }>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val.toLocaleString()} Kč`} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} formatter={(val: number, name: string) => [name === 'celkem' ? `${val.toLocaleString()} Kč` : val, name === 'celkem' ? 'Suma výplat' : 'Počet výplat']} />
                        <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                        <Line type="monotone" dataKey="celkem" name="Suma výplat" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 8, fill: '#047857'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
