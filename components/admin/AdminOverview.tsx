import React from 'react';
import { Users, BookOpen, Brain, MessageSquare, AlertCircle, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import { User, Course, Quiz, SupportTicket, BonusSubmission } from '../../types';

interface AdminOverviewProps {
  allUsers: User[];
  courses: Course[];
  quizzes: Quiz[];
  tickets: SupportTicket[];
  submissions: BonusSubmission[];
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ allUsers, courses, quizzes, tickets, submissions }) => {
  const activeUsers = allUsers.filter((u) => !u.isBanned);
  const adminCount = allUsers.filter((u) => u.role === 'admin').length;
  const premiumUsers = allUsers.filter((u) => u.role === 'premium').length;
  const vipUsers = allUsers.filter((u) => u.role === 'vip').length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length;

  const stats = [
    {
      label: 'Aktivní uživatelé',
      value: activeUsers.length,
      sub: `${adminCount} admin · ${premiumUsers} premium · ${vipUsers} VIP`,
      icon: <Users size={24} className="text-indigo-600" />,
      color: 'border-indigo-200 bg-indigo-50',
    },
    {
      label: 'Publikované kurzy',
      value: courses.filter((c) => c.published).length,
      sub: `Celkem ${courses.length} kurzů`,
      icon: <BookOpen size={24} className="text-violet-600" />,
      color: 'border-violet-200 bg-violet-50',
    },
    {
      label: 'Aktivní kvízy',
      value: quizzes.filter((q) => q.published).length,
      sub: `Celkem ${quizzes.length} kvízů`,
      icon: <Brain size={24} className="text-pink-600" />,
      color: 'border-pink-200 bg-pink-50',
    },
    {
      label: 'Administrátoři',
      value: adminCount,
      sub: 'Správa interního Q-Hub',
      icon: <Shield size={24} className="text-rose-600" />,
      color: 'border-rose-200 bg-rose-50',
    },
  ];

  const attentionItems = [
    { label: 'Nevyřešené tickety', value: openTickets, icon: <MessageSquare size={20} />, alert: openTickets > 0 },
    { label: 'Úkoly ke schválení', value: pendingSubmissions, icon: <CheckCircle size={20} />, alert: pendingSubmissions > 0 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Přehled Q-Hub</h2>
          <p className="text-slate-500">Interní vzdělávání — bez plateb a předplatného.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border ${stat.color} relative overflow-hidden group hover:shadow-md transition-all`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200">{stat.icon}</div>
              <TrendingUp size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            {stat.sub && <div className="text-xs text-slate-500 mt-2 border-t border-slate-200 pt-2">{stat.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-500" /> Vyžaduje pozornost
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attentionItems.map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  item.alert ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      item.alert ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                </div>
                <span className={`text-xl font-bold ${item.alert ? 'text-rose-600' : 'text-slate-500'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-6 flex flex-col justify-center">
          <h3 className="text-slate-900 font-bold mb-2">Interní systém</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Q-Hub neobsahuje platby ani Stripe. Přístup řídí administrátor přes role uživatele
            (student, premium, VIP, admin).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
