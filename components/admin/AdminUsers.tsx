import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, Mail, Shield, Gem, Crown, MoreHorizontal, X, Save, Calendar, MessageSquare, DollarSign, Phone, CheckCircle, AlertTriangle, Briefcase, UserPlus, User as UserIcon, Lock as LockIcon, Sparkles } from 'lucide-react';
import { User, UserRole, DashboardMessage, QhubPosition, QHUB_POSITIONS } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminUsersProps {
  allUsers: User[];
  onCreateUser?: (userData: any) => Promise<void>;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  notify: (type: any, title: string, message: string) => void;
}

export const CZECH_REGIONS = [
  'Karlovy Vary',
  'Plzeň',
  'Ostrava',
  'Zlín',
  'Praha',
  'Brno',
  'České Budějovice',
  'Liberec',
  'Hradec Králové'
];

const AdminUsers: React.FC<AdminUsersProps> = ({ allUsers, onCreateUser, onUpdateUser, onDeleteUser, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState<QhubPosition | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState<{
      name: string;
      email: string;
      role: UserRole;
      positions: QhubPosition[];
      region: string;
      level: number;
      xp: number;
      phone: string;
      bio: string;
      financialProfit: number;
      planExpires: string;
      dashboardMessageText: string;
      dashboardMessageActive: boolean;
  } | null>(null);

  // Create Form State
  const [isCreating, setIsCreating] = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
      name: '',
      email: '',
      password: '',
      role: 'ostatni' as UserRole,
      phone: '',
      region: 'Karlovy Vary',
      positions: [] as QhubPosition[],
  });

  const handleCreateSave = async () => {
      if (!onCreateUser) return;
      if (!createForm.email || !createForm.password) {
          notify('error', 'Chyba', 'Email a heslo jsou povinné.');
          return;
      }
      setCreatingLoading(true);
      try {
          await onCreateUser({
              email: createForm.email,
              password: createForm.password,
              name: createForm.name,
              role: createForm.role,
              phone: createForm.phone,
              region: createForm.region,
              positions: createForm.positions,
              planExpires: null,
          });
          setIsCreating(false);
          // Reset form
          setCreateForm({
              name: '',
              email: '',
              password: '',
              role: 'ostatni',
              phone: '',
              region: 'Karlovy Vary',
              positions: [],
          });
      } catch (e: any) {
          // Toast notifications are handled by onCreateUser
      } finally {
          setCreatingLoading(false);
      }
  };

  const toggleCreatePosition = (p: QhubPosition) => {
      const has = createForm.positions.includes(p);
      const next = has ? createForm.positions.filter(x => x !== p) : [...createForm.positions, p];
      setCreateForm({ ...createForm, positions: next });
  };

  const handleEditClick = (user: User) => {
      let resolvedPositions: any[] = [];
      if (Array.isArray(user.positions)) {
          resolvedPositions = user.positions;
      } else if (typeof user.positions === 'string') {
          try {
              const parsed = JSON.parse(user.positions);
              if (Array.isArray(parsed)) resolvedPositions = parsed;
          } catch {}
      }

      setEditingUser(user);
      setEditForm({
          name: user.name || '',
          email: user.email,
          role: user.role,
          positions: resolvedPositions as any,
          region: user.region || 'Karlovy Vary',
          level: user.level || 1,
          xp: user.xp,
          phone: user.phone || '',
          bio: user.bio || '',
          financialProfit: user.financialProfit || 0,
          planExpires: user.planExpires ? user.planExpires.split('T')[0] : '',
          dashboardMessageText: user.dashboardMessage?.text || '',
          dashboardMessageActive: user.dashboardMessage?.active || false
      });
  };

  const handleSave = () => {
      if (!editingUser || !editForm) return;

      // Construct dashboard message safely to avoid undefined values in Firestore
      const safeDashboardMessage: DashboardMessage = {
          text: editForm.dashboardMessageText,
          active: editForm.dashboardMessageActive,
      };
      
      // Only add optional fields if they are defined
      if (editingUser.dashboardMessage?.imageUrl) {
          safeDashboardMessage.imageUrl = editingUser.dashboardMessage.imageUrl;
      }
      if (editingUser.dashboardMessage?.pdfUrl) {
          safeDashboardMessage.pdfUrl = editingUser.dashboardMessage.pdfUrl;
      }

      const updatedUser: User = {
          ...editingUser,
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          positions: editForm.positions,
          region: editForm.region,
          level: editForm.level,
          xp: editForm.xp,
          phone: editForm.phone,
          bio: editForm.bio,
          financialProfit: editForm.financialProfit,
          planExpires: editForm.planExpires ? new Date(editForm.planExpires).toISOString() : undefined,
          dashboardMessage: safeDashboardMessage
      };

      // Remove undefined keys at root level to prevent Firestore errors
      if (updatedUser.planExpires === undefined) {
          delete updatedUser.planExpires;
      }

      onUpdateUser(updatedUser);
      setEditingUser(null);
      notify('success', 'Uživatel uložen', 'Data uživatele byla úspěšně aktualizována.');
  };

  // Filter Logic
  const filteredUsers = (allUsers || []).filter(u => {
      if (!u) return false;
      const email = typeof u.email === 'string' ? u.email : '';
      const name = typeof u.name === 'string' ? u.name : '';
      const role = typeof u.role === 'string' ? u.role : '';
      
      const emailLower = email.toLowerCase();
      const nameLower = name.toLowerCase();
      const searchLower = (searchTerm || '').toLowerCase();
      
      const matchesSearch = emailLower.includes(searchLower) || nameLower.includes(searchLower);
      const matchesRole = roleFilter === 'all' || role === roleFilter;
      
      let userPositions: any[] = [];
      if (Array.isArray(u.positions)) {
          userPositions = u.positions;
      } else if (typeof u.positions === 'string') {
          try {
              const parsed = JSON.parse(u.positions);
              if (Array.isArray(parsed)) userPositions = parsed;
          } catch {}
      }
      
      const matchesPosition = positionFilter === 'all' || userPositions.includes(positionFilter);
      const matchesRegion = regionFilter === 'all' || (u.region || 'Karlovy Vary') === regionFilter;
      return matchesSearch && matchesRole && matchesPosition && matchesRegion;
  });

  const togglePosition = (p: QhubPosition) => {
      if (!editForm) return;
      const has = editForm.positions.includes(p);
      const next = has ? editForm.positions.filter(x => x !== p) : [...editForm.positions, p];
      setEditForm({ ...editForm, positions: next });
  };

  const positionBadgeClass = (color: string) => ({
      indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      amber:   'bg-amber-50 text-amber-700 border-amber-200',
      violet:  'bg-violet-50 text-violet-700 border-violet-200',
      slate:   'bg-slate-50 text-slate-700 border-slate-200',
  } as Record<string, string>)[color] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Správa Uživatelů</h2>
                <p className="text-slate-500 text-sm">Celkem {allUsers.length} registrovaných uživatelů</p>
                <button
                    onClick={() => {
                        setCreateForm({
                            name: '',
                            email: '',
                            password: '',
                            role: 'ostatni',
                            phone: '',
                            positions: [],
                        });
                        setIsCreating(true);
                    }}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-emerald-600/10"
                >
                    <UserPlus size={14} />
                    Nový uživatel
                </button>
            </div>
            <div className="flex gap-3 w-full md:w-auto flex-wrap md:flex-nowrap items-center">
                <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Hledat podle jména, emailu..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="relative flex-shrink-0">
                    <select 
                        value={roleFilter} 
                        onChange={e => setRoleFilter(e.target.value)}
                        className="appearance-none bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-805 font-bold outline-none transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">👥 Všechny role</option>
                        <option value="obchodnik">💼 Obchodník</option>
                        <option value="technik">🔧 Technik</option>
                        <option value="team_leader">👑 Team Leader</option>
                        <option value="linka">📞 Linka</option>
                        <option value="ostatni">⚙️ Ostatní</option>
                        <option value="admin">🛡️ Admin</option>
                    </select>
                </div>
                <div className="relative flex-shrink-0">
                    <select 
                        value={positionFilter} 
                        onChange={e => setPositionFilter(e.target.value as any)}
                        className="appearance-none bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-805 font-bold outline-none transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">💼 Všechny pozice</option>
                        {QHUB_POSITIONS.map(p => (
                            <option key={p.id} value={p.id}>• {p.label}</option>
                        ))}
                    </select>
                </div>
                <div className="relative flex-shrink-0">
                    <select 
                        value={regionFilter} 
                        onChange={e => setRegionFilter(e.target.value)}
                        className="appearance-none bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-805 font-bold outline-none transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">📍 Všechny regiony</option>
                        {CZECH_REGIONS.map(reg => (
                            <option key={reg} value={reg}>{reg}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-500">
                    <thead className="bg-white/80 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="p-4">Uživatel</th>
                            <th className="p-4">Role & Level</th>
                            <th className="p-4">Kontakt</th>
                            <th className="p-4">Pozice</th>
                            <th className="p-4 text-right">Akce</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredUsers.map(user => {
                            if (!user) return null;
                            const emailDisplay = user.email || '';
                            const nameDisplay = user.name || 'Bezejmenný';
                            const roleDisplay = user.role || 'student';
                            const levelDisplay = user.level ?? 1;
                            const xpDisplay = user.xp ?? 0;
                            const avatarDisplay = user.name?.[0] || user.email?.[0] || '?';

                            return (
                                <tr key={user.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${roleDisplay === 'admin' ? 'bg-red-600' : 'bg-indigo-600'}`}>
                                                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover"/> : avatarDisplay}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{nameDisplay}</div>
                                                <div className="text-xs text-slate-500">{emailDisplay}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                roleDisplay === 'admin' ? 'bg-rose-50 text-red-700 border border-red-200' :
                                                roleDisplay === 'obchodnik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-205' :
                                                roleDisplay === 'technik' ? 'bg-indigo-50 text-indigo-700 border border-indigo-205' :
                                                roleDisplay === 'team_leader' ? 'bg-amber-50 text-amber-700 border border-amber-205' :
                                                roleDisplay === 'linka' ? 'bg-violet-50 text-violet-700 border border-violet-205' :
                                                'bg-slate-50 text-slate-700 border border-slate-205'
                                            }`}>
                                                {roleDisplay === 'obchodnik' ? '💼 Obchodník' :
                                                 roleDisplay === 'technik' ? '🔧 Technik' :
                                                 roleDisplay === 'team_leader' ? '👑 Team Leader' :
                                                 roleDisplay === 'linka' ? '📞 Linka' :
                                                 roleDisplay === 'ostatni' ? '⚙️ Ostatní' :
                                                 roleDisplay === 'admin' ? '🛡️ Admin' : roleDisplay}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-750">
                                                {levelDisplay === 2 ? '🥈 Senior' : levelDisplay >= 3 ? '🥇 Expert' : '🥉 Junior'} • {xpDisplay} XP
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs">
                                        {user.phone && <div className="flex items-center gap-1 mb-1 font-semibold text-slate-700"><Phone size={12}/> {user.phone}</div>}
                                        <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 border border-indigo-150 w-fit px-2 py-0.5 rounded-md font-medium">
                                            <span>📍</span> {user.region || 'Karlovy Vary'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {(() => {
                                            let userPositions = Array.isArray(user.positions) ? user.positions : [];
                                            if (typeof user.positions === 'string') {
                                                try { userPositions = JSON.parse(user.positions); } catch {}
                                            }
                                            if (userPositions.length > 0) {
                                                return (
                                                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                        {userPositions.map(pid => {
                                                            const p = QHUB_POSITIONS.find(q => q.id === pid);
                                                            if (!p) return null;
                                                            return (
                                                                <span key={pid} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${positionBadgeClass(p.color)}`}>
                                                                    <Briefcase size={10}/>{p.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            }
                                            return <span className="text-slate-400 text-xs">—</span>;
                                        })()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEditClick(user)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition" title="Upravit">
                                                <Edit size={16}/>
                                            </button>
                                            <button onClick={() => onDeleteUser(user.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition" title="Smazat">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {filteredUsers.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    Nebyli nalezeni žádní uživatelé.
                </div>
            )}
        </div>

        {/* --- EDIT MODAL --- */}
        <AnimatePresence>
            {editingUser && editForm && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y: 20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-slate-200 shadow-2xl flex flex-col">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Detail Uživatele</h3>
                                <p className="text-xs text-slate-500">ID: {editingUser.id}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X/></button>
                        </div>

                        <div className="p-8 space-y-8">
                            
                            {/* Section 1: Základní údaje uživatele */}
                            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-4">
                                <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                    <UserIcon size={16} className="text-indigo-505" />
                                    Osobní & Přihlašovací informace
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <UserIcon size={13} className="text-slate-400" /> Jméno a příjmení
                                        </label>
                                        <input 
                                            value={editForm.name} 
                                            onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                            placeholder="Zadejte celé jméno..."
                                            className="w-full bg-white border-2 border-slate-205 hover:border-slate-305 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <Mail size={13} className="text-slate-400" /> E-mailová adresa (Pravidelný e-mail)
                                        </label>
                                        <input 
                                            type="email"
                                            value={editForm.email} 
                                            onChange={e => setEditForm({...editForm, email: e.target.value})} 
                                            placeholder="např. jmeno@qhub.cz"
                                            className="w-full bg-white border-2 border-slate-205 hover:border-slate-305 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400" /> Telefonní číslo
                                        </label>
                                        <input 
                                            value={editForm.phone} 
                                            onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                                            placeholder="např. +420 777 123 456"
                                            className="w-full bg-white border-2 border-slate-205 hover:border-slate-305 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <Shield size={13} className="text-slate-400" /> Uživatelská role
                                        </label>
                                        <select 
                                            value={editForm.role} 
                                            onChange={e => setEditForm({...editForm, role: e.target.value as any})} 
                                            className="w-full bg-white border-2 border-slate-205 hover:border-slate-305 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-805 text-sm font-bold cursor-pointer outline-none transition-all shadow-sm"
                                        >
                                            <option value="obchodnik">💼 Obchodník</option>
                                            <option value="technik">🔧 Technik</option>
                                            <option value="team_leader">👑 Team Leader</option>
                                            <option value="linka">📞 Linka</option>
                                            <option value="ostatni">⚙️ Ostatní</option>
                                            <option value="admin">🛡️ Administrator</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <span>📍</span> Region / Pobočka
                                        </label>
                                        <select 
                                            value={editForm.region} 
                                            onChange={e => setEditForm({...editForm, region: e.target.value})} 
                                            className="w-full bg-white border-2 border-slate-205 hover:border-slate-305 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium cursor-pointer outline-none transition-all shadow-sm"
                                        >
                                            {CZECH_REGIONS.map(reg => (
                                                <option key={reg} value={reg}>{reg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Pracovní Pozice */}
                            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-3">
                                <label className="text-xs font-bold text-slate-705 tracking-wide uppercase flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-slate-500" /> Přiřazené Pracovní Pozice / Zaměření (lze vybrat více)
                                </label>
                                <div className="p-4 bg-white rounded-xl border border-slate-202 flex flex-wrap gap-2.5">
                                    {QHUB_POSITIONS.map(p => {
                                        const active = editForm.positions.includes(p.id);
                                        return (
                                            <button
                                                type="button"
                                                key={p.id}
                                                onClick={() => togglePosition(p.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                                    active
                                                        ? `${positionBadgeClass(p.color)} border-indigo-505 scale-[1.03] shadow-sm`
                                                        : 'bg-slate-50 text-slate-605 border-slate-202 hover:border-slate-400 hover:bg-slate-100'
                                                }`}
                                            >
                                                {active ? '✓ ' : '+ '}{p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10.5px] text-slate-500">
                                    💡 Tyto pozice určují, které specifické kanály, výzvy a materiály budou pro uživatele zvýrazněny v rozhraní.
                                </p>
                            </div>

                            {/* Section 3: Úroveň a Gamifikace */}
                            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
                                <div>
                                    <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                        <Crown size={14} className="text-amber-500" /> Profesní úroveň (Rank) & XP
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="relative w-1/2">
                                            <select 
                                                value={editForm.level} 
                                                onChange={e => setEditForm({...editForm, level: parseInt(e.target.value) || 1})} 
                                                className="w-full bg-white border-2 border-slate-205 hover:border-slate-305 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-3 py-3 text-slate-905 text-xs font-bold cursor-pointer outline-none transition-all shadow-sm"
                                            >
                                                <option value={1}>🥉 Junior</option>
                                                <option value={2}>🥈 Senior</option>
                                                <option value={3}>🥇 Expert / Master</option>
                                            </select>
                                        </div>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-indigo-400 uppercase">XP</span>
                                            <input 
                                                type="number" 
                                                value={editForm.xp} 
                                                onChange={e => setEditForm({...editForm, xp: parseInt(e.target.value) || 0})} 
                                                className="w-full bg-white border-2 border-slate-205 hover:border-slate-305 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl pl-9 pr-4 py-3 text-slate-900 text-sm font-bold outline-none transition-all shadow-sm" 
                                                placeholder="XP body"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10.5px] text-slate-500 mt-1.5 font-medium">Správce nastavuje tytéž profesní úrovně ručně pro každého reprezentanta.</p>
                                </div>
                            </div>

                            {/* Section 4: Personal Dashboard Message */}
                            <div className="bg-indigo-50/50 p-6 rounded-2xl border-2 border-indigo-100/80 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                    <h4 className="font-bold text-indigo-905 flex items-center gap-2 text-sm">
                                        <MessageSquare size={18} className="text-indigo-505" /> 
                                        Osobní vzkaz na Dashboardu studenta
                                    </h4>
                                    <label className="flex items-center gap-2.5 cursor-pointer bg-indigo-100 hover:bg-indigo-200/80 px-4 py-2 rounded-xl border border-indigo-202 transition-all select-none">
                                        <span className="text-[11px] text-indigo-705 uppercase font-bold tracking-wider">Aktivní vzkaz</span>
                                        <input 
                                            type="checkbox" 
                                            checked={editForm.dashboardMessageActive} 
                                            onChange={e => setEditForm({...editForm, dashboardMessageActive: e.target.checked})} 
                                            className="accent-indigo-600 w-5 h-5 cursor-pointer"
                                        />
                                    </label>
                                </div>
                                <textarea 
                                    value={editForm.dashboardMessageText} 
                                    onChange={e => setEditForm({...editForm, dashboardMessageText: e.target.value})} 
                                    className="w-full h-28 bg-white border-2 border-indigo-100 hover:border-indigo-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-xl p-4 text-slate-900 text-sm font-medium outline-none resize-none transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="Sem vepište motivaci, oznámení o bonusovém obsahu nebo úkolech..."
                                />
                                <p className="text-[10.5px] text-slate-600 font-medium flex items-center gap-1">
                                    <Sparkles size={12} className="text-indigo-505 animate-pulse" /> Student uvidí tento vzkaz zazářit ve widgetu na hlavní stránce okamžitě po svém přihlášení.
                                </p>
                            </div>

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0">
                            <button onClick={() => setEditingUser(null)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition">Zrušit</button>
                            <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20">
                                <Save size={18}/> Uložit Změny
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}

            {isCreating && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y: 20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-slate-200 shadow-2xl flex flex-col">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Nový uživatelský účet</h3>
                                    <p className="text-xs text-slate-500">Vytvoření nového člena platformy Q-Hub</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X/></button>
                        </div>

                        <div className="p-8 space-y-8">
                            
                            {/* Section 1: Základní přístupové a osobní údaje */}
                            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-5">
                                <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                                    <UserIcon size={16} className="text-emerald-505" />
                                    Přihlašovací údaje & Osobní profil
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <Mail size={13} className="text-slate-400" /> E-mailová adresa <span className="text-rose-500 font-extrabold text-[13px]">*</span>
                                        </label>
                                        <input 
                                            type="email" 
                                            value={createForm.email} 
                                            onChange={e => setCreateForm({...createForm, email: e.target.value})} 
                                            placeholder="např. jmeno@qhub.cz" 
                                            className="w-full bg-white border-2 border-slate-205 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">E-mail slouží jako jedinečné přihlašovací jméno.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <LockIcon size={13} className="text-slate-400" /> Přístupové heslo <span className="text-rose-500 font-extrabold text-[13px]">*</span>
                                        </label>
                                        <input 
                                            type="password" 
                                            value={createForm.password} 
                                            onChange={e => setCreateForm({...createForm, password: e.target.value})} 
                                            placeholder="Např. silné heslo..."
                                            className="w-full bg-white border-2 border-slate-205 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Minimálně 6 znaků (z bezpečnostních důvodů).</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <UserIcon size={13} className="text-slate-400" /> Celé jméno nového člena
                                        </label>
                                        <input 
                                            type="text" 
                                            value={createForm.name} 
                                            onChange={e => setCreateForm({...createForm, name: e.target.value})} 
                                            placeholder="např. Ing. František Dobrota" 
                                            className="w-full bg-white border-2 border-slate-205 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400" /> Kontaktní Telefon
                                        </label>
                                        <input 
                                            type="text" 
                                            value={createForm.phone} 
                                            onChange={e => setCreateForm({...createForm, phone: e.target.value})} 
                                            placeholder="např. +420 732 444 555" 
                                            className="w-full bg-white border-2 border-slate-205 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <Shield size={13} className="text-slate-400" /> Startovní systémová role
                                        </label>
                                        <select 
                                            value={createForm.role} 
                                            onChange={e => setCreateForm({...createForm, role: e.target.value as any})} 
                                            className="w-full bg-white border-2 border-slate-205 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-805 text-sm font-bold cursor-pointer outline-none transition-all shadow-sm"
                                        >
                                            <option value="obchodnik">💼 Obchodník</option>
                                            <option value="technik">🔧 Technik</option>
                                            <option value="team_leader">👑 Team Leader</option>
                                            <option value="linka">📞 Linka</option>
                                            <option value="ostatni">⚙️ Ostatní</option>
                                            <option value="admin">🛡️ Administrator</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block flex items-center gap-1.5">
                                            <span>📍</span> Region / Pobočka
                                        </label>
                                        <select 
                                            value={createForm.region} 
                                            onChange={e => setCreateForm({...createForm, region: e.target.value})} 
                                            className="w-full bg-white border-2 border-slate-205 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-905 text-sm font-medium cursor-pointer outline-none transition-all shadow-sm"
                                        >
                                            {CZECH_REGIONS.map(reg => (
                                                <option key={reg} value={reg}>{reg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Pozice (multi-select) */}
                            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-3">
                                <label className="text-xs font-bold text-slate-705 tracking-wide uppercase flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-slate-500" /> Pracovní pozice / Zaměření (lze vybrat více)
                                </label>
                                <div className="p-4 bg-white rounded-xl border border-slate-202 flex flex-wrap gap-2.5">
                                    {QHUB_POSITIONS.map(p => {
                                        const active = createForm.positions.includes(p.id);
                                        return (
                                            <button
                                                type="button"
                                                key={p.id}
                                                onClick={() => toggleCreatePosition(p.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                                    active
                                                        ? `${positionBadgeClass(p.color)} border-indigo-505 scale-[1.03] shadow-sm`
                                                        : 'bg-slate-50 text-slate-605 border-slate-202 hover:border-slate-400 hover:bg-slate-100'
                                                }`}
                                            >
                                                {active ? '✓ ' : '+ '}{p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    💡 Tyto pracovní pozice dají studentovi přístup k vybraným materiálům ihned po jeho prvním přihlášení.
                                </p>
                            </div>

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0">
                            <button onClick={() => setIsCreating(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition">Zrušit</button>
                            <button 
                                onClick={handleCreateSave} 
                                disabled={creatingLoading}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
                            >
                                <Save size={18}/> {creatingLoading ? 'Vytváření...' : 'Vytvořit Účet'}
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminUsers;