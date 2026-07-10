import React, { useState } from 'react';
import { Users, BookOpen, Brain, MessageSquare, AlertCircle, TrendingUp, CheckCircle, Shield, Award, Calendar, ChevronRight, Search, Activity, Clock, LogOut, ArrowUpRight, Zap, Ban, Lock } from 'lucide-react';
import { User, Course, Quiz, SupportTicket, BonusSubmission, CalendarEvent } from '../../types';
import { Calendar as CalendarIcon, Briefcase } from 'lucide-react';

interface AdminOverviewProps {
  allUsers: User[];
  courses: Course[];
  quizzes: Quiz[];
  tickets: SupportTicket[];
  submissions: BonusSubmission[];
  events?: CalendarEvent[];
  onNavigate?: (tab: string) => void;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ allUsers = [], courses = [], quizzes = [], tickets = [], submissions = [], events = [], onNavigate }) => {
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [ozData, setOzData] = useState<any>(null);
  React.useEffect(() => {
    fetch('/api/caflou/oz/data').then(r => r.ok ? r.json() : null).then(data => {
        if(data) setOzData(data);
    }).catch(e => console.error(e));
  }, []);
  
  const currentMonthTotalPayout = React.useMemo(() => {
    if (!ozData) return null;
    const monthString = new Date().toISOString().substring(0, 7);
    const monthOrders = (ozData.orders || []).filter((o:any) => (o.date || '').startsWith(monthString) && o.status === 'completed');
    
    let total = 0;
    
    const usersWithOrders = Array.from(new Set(monthOrders.map((o:any) => (o.email || '').toLowerCase())));
    for (const email of usersWithOrders) {
        const config = (ozData.userConfigs || {})[email] || { userType: 'commission', fixRate: 0 };
        const userOrders = monthOrders.filter((o:any) => (o.email || '').toLowerCase() === email);
        const userCommissions = userOrders.reduce((sum:number, o:any) => {
            let rate = 8;
            if (config.userType === 'commission' || config.userType === 'both') {
                rate = config.commissionRates?.[o.type] ?? 8;
            }
            return sum + (o.amount * (rate / 100));
        }, 0);
        
        const fixAmount = (config.userType === 'fix' || config.userType === 'both') ? (config.fixRate || 0) : 0;
        const monthAdjustments = (ozData.adjustments || []).filter((a:any) => (a.email || '').toLowerCase() === email && a.month === monthString);
        const bonusesSum = monthAdjustments.filter((a:any) => a.type === 'bonus').reduce((sum:number, a:any) => sum + a.amount, 0);
        const finesSum = monthAdjustments.filter((a:any) => a.type === 'fine').reduce((sum:number, a:any) => sum + a.amount, 0);
        
        total += Math.max(0, Math.round(userCommissions + fixAmount + bonusesSum - finesSum));
    }
    
    return total;
  }, [ozData]);

  // Calculations
  const activeUsers = (allUsers || []).filter((u) => !u.isBanned);
  const bannedCount = (allUsers || []).filter((u) => u.isBanned).length;
  const adminCount = (allUsers || []).filter((u) => u.role === 'admin').length;
  const merchantUsers = (allUsers || []).filter((u) => u.role === 'obchodnik').length;
  const techUsers = (allUsers || []).filter((u) => u.role === 'technik').length;
  const teamLeaderUsers = (allUsers || []).filter((u) => u.role === 'team_leader').length;
  const lineUsers = (allUsers || []).filter((u) => u.role === 'linka').length;
  const otherUsers = (allUsers || []).filter((u) => u.role === 'ostatni').length;
  
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length;

  // Calculate total QAPI Coin in the platform
  const totalPlatformXP = allUsers.reduce((sum, u) => sum + (u.xp || 0), 0);
  
  // Sort users by recent joining
  const recentUsers = [...allUsers]
    .sort((a, b) => new Date(b.joinDate || '').getTime() - new Date(a.joinDate || '').getTime())
    .slice(0, 5);

  const stats = [
    {
      tab: 'users',
      label: 'Registrovaní pracovníci',
      value: allUsers.length,
      sub: `${activeUsers.length} aktivních · ${bannedCount} zablokovaných`,
      icon: <Users size={22} className="text-indigo-600" />,
      color: 'border-slate-200 hover:border-indigo-400 bg-linear-to-b from-white to-slate-50/50',
      badge: 'Uživatelé',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },
    {
      tab: 'events',
      label: 'Události',
      value: events.length,
      sub: `${events.filter(e => new Date(e.date) >= new Date()).length} nadcházejících`,
      icon: <CalendarIcon size={22} className="text-violet-600" />,
      color: 'border-slate-200 hover:border-violet-400 bg-linear-to-b from-white to-slate-50/50',
      badge: 'Kalendář',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-100',
    },
    {
      tab: 'caflou',
      label: 'Caflou Zakázky',
      value: ozData?.orders ? ozData.orders.length : 0,
      sub: `${ozData?.orders ? ozData.orders.filter((o: any) => o.status === 'completed').length : 0} dokončených zakázek`,
      icon: <Briefcase size={22} className="text-amber-600" />,
      color: 'border-slate-200 hover:border-amber-400 bg-linear-to-b from-white to-slate-50/50',
      badge: 'Obchod',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      tab: 'gamification',
      label: 'Celkový Pokrok Hubu',
      value: `${(totalPlatformXP / 1000).toFixed(1)}k`,
      sub: `Průměrně ${allUsers.length ? Math.round(totalPlatformXP / allUsers.length).toLocaleString() : 0} QAPI Coin na pracovníka`,
      icon: <Zap size={22} className="text-brand-gold" />,
      color: 'border-slate-200 hover:border-brand-gold bg-linear-to-b from-white to-slate-50/50',
      badge: 'Celkem QAPI Coin',
      badgeColor: 'bg-indigo-50 text-brand-gold border-indigo-200',
    },
  ];

  const attentionItems = [
    { 
      label: 'Nevyřešené tickety', 
      value: openTickets, 
      desc: 'Zprávy na zákaznické podpoře od pracovníků.', 
      icon: <MessageSquare size={20} />, 
      alert: openTickets > 0,
      alertColor: 'bg-rose-50 border-rose-100 text-rose-700'
    },
    { 
      label: 'Úkoly ke schválení', 
      value: pendingSubmissions, 
      desc: 'Bonusové projekty, které čekají na vaše schválení.',
      icon: <CheckCircle size={20} />, 
      alert: pendingSubmissions > 0,
       alertColor: 'bg-amber-50 border-amber-100 text-amber-700'
    },
  ];

  // Helper colors for user badges
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit"><Shield size={10}/> Admin</span>;
      case 'obchodnik': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit">💼 Obchodník</span>;
      case 'technik': return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit">🔧 Technik</span>;
      case 'team_leader': return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit">👑 Team Leader</span>;
      case 'linka': return <span className="bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit">📞 Linka</span>;
      case 'ostatni': return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit">⚙️ Ostatní</span>;
      default: return <span className="bg-slate-100 text-slate-650 text-[10px] px-2 py-0.5 rounded-full uppercase">{role}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
        <div>
          <span className="text-xs font-bold text-brand-gold uppercase tracking-widest bg-indigo-50 border border-brand-gold/30 px-3.5 py-1 rounded-full">Centrální dispečink Hubu</span>
          <h2 className="text-3xl font-black text-slate-900 mt-2 mb-1 tracking-tight">Vítejte v Administraci Q-Hubu</h2>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">Spravujte pracovníky, kurzy, herní prvky, podepisujte certifikáty a odpovídejte na dotazy podpory z jednoho intuitivního místa.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl">
          <Activity size={18} className="text-emerald-500 animate-pulse" />
          <div className="text-left">
            <div className="text-xs font-bold text-slate-700 uppercase leading-none">Status Systému</div>
            <span className="text-[10px] text-slate-400 font-medium font-mono">Běží na standardním portu</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`p-6 rounded-3xl border ${stat.color} relative overflow-hidden group hover:shadow-xl transition-all duration-350 flex flex-col justify-between h-48`}
          >
            {/* Top row */}
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs group-hover:bg-indigo-50/25 transition-colors">{stat.icon}</div>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${stat.badgeColor}`}>{stat.badge}</span>
            </div>
            
            {/* Value & Info */}
            <div className="mt-4">
              <div className="text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5">
                {stat.value}
                <ArrowUpRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="text-xs font-bold text-slate-800 uppercase mt-1">{stat.label}</div>
              <div className="text-[11px] text-slate-500 mt-1 truncate font-medium">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Actions & Double Card View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Attention & Roles */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Attention Items */}
          {/* Total Payout Dashboard Widget */}
          {currentMonthTotalPayout !== null && (
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white mb-6">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
             </div>
             <h3 className="font-bold text-emerald-50 text-sm uppercase tracking-widest mb-1">Odhad celkových výplat (Tento měsíc)</h3>
             <p className="text-4xl font-black">{currentMonthTotalPayout.toLocaleString()} Kč</p>
             <p className="text-sm font-medium text-emerald-100 mt-2">Včetně všech bonusů, fixů a srážek za všechny obchodníky v {new Date().toISOString().substring(0,7)}.</p>
          </div>
          )}

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-orange-500 animate-bounce" />
              <h3 className="font-bold text-slate-900 text-base">Vyžaduje pozornost</h3>
            </div>
            
            <div className="space-y-3">
              {attentionItems.map((item, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                    item.alert 
                      ? `${item.alertColor} ring-4 ring-rose-500/5` 
                      : 'bg-slate-50/50 border-slate-200 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl bg-white border border-slate-100 shadow-xs`}>{item.icon}</div>
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    <span className="text-2xl font-black">{item.value}</span>
                  </div>
                  <p className="text-[11px] mt-2 opacity-80 leading-relaxed font-normal">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User Role Distribution CSS Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-905 text-sm mb-4">Struktura Účtů</h3>
            <div className="space-y-3.5">
              {[
                { label: 'Obchodník', count: merchantUsers, color: 'bg-emerald-500', pct: allUsers.length ? (merchantUsers / allUsers.length) * 100 : 0 },
                { label: 'Technik', count: techUsers, color: 'bg-indigo-600', pct: allUsers.length ? (techUsers / allUsers.length) * 100 : 0 },
                { label: 'Team Leader', count: teamLeaderUsers, color: 'bg-amber-500', pct: allUsers.length ? (teamLeaderUsers / allUsers.length) * 100 : 0 },
                { label: 'Linka', count: lineUsers, color: 'bg-violet-600', pct: allUsers.length ? (lineUsers / allUsers.length) * 100 : 0 },
                { label: 'Ostatní', count: otherUsers, color: 'bg-slate-400', pct: allUsers.length ? (otherUsers / allUsers.length) * 100 : 0 },
                { label: 'Administrátoři', count: adminCount, color: 'bg-red-500', pct: allUsers.length ? (adminCount / allUsers.length) * 100 : 0 },
              ].map((roleRow, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">{roleRow.label}</span>
                    <span className="text-slate-905 font-bold font-mono">{roleRow.count} ({Math.round(roleRow.pct)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className={`h-full ${roleRow.color}`} style={{ width: `${roleRow.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Recent Users Register Feed */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Nedávno registrovaní pracovníci</h3>
                <p className="text-xs text-slate-400">Přehled posledních registrovaných pracovníků, jejich QAPI Coin a oprávnění.</p>
              </div>
              <div className="relative w-full sm:w-48 text-[11px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="text" 
                  value={userSearchTerm}
                  onChange={e => setUserSearchTerm(e.target.value)}
                  placeholder="Rychlý filtr..." 
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-hidden font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-550">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 pl-2">Pracovník</th>
                    <th className="pb-3 text-right">Získáno QAPI Coin</th>
                    <th className="pb-3">Plán / Role</th>
                    <th className="pb-3 text-right">Člen od</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentUsers
                    .filter(u => u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                    .map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-500 uppercase flex items-center justify-center border border-slate-250">
                              {usr.name?.charAt(0) || usr.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-905">{usr.name || 'Neznámé jméno'}</div>
                              <div className="text-[10px] text-slate-400 select-all font-mono">{usr.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-800 font-mono">
                          <span className="flex items-center justify-end gap-1 font-bold text-yellow-500">
                            <Zap size={10} fill="currentColor" /> {usr.xp?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {getRoleBadge(usr.role)}
                        </td>
                        <td className="py-3.5 text-right font-mono text-slate-400 font-semibold">
                          {usr.joinDate ? new Date(usr.joinDate).toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'numeric'}) : 'Neznámé'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {recentUsers.length === 0 && (
                <div className="text-center py-12 text-slate-400">Nenalezeni žádní nedávní uživatelé.</div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminOverview;
