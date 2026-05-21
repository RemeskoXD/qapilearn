import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check, X, ExternalLink, Clock, User, Gift } from 'lucide-react';
import { BonusTask, BonusSubmission, User as UserType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminSubmissionsProps {
  bonusTasks: BonusTask[];
  submissions: BonusSubmission[];
  allUsers: UserType[];
  onUpdateTasks: (tasks: BonusTask[]) => void;
  onReviewSubmission: (id: string, status: 'approved' | 'rejected') => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminSubmissions: React.FC<AdminSubmissionsProps> = ({ 
    bonusTasks, submissions, allUsers, 
    onUpdateTasks, onReviewSubmission, notify 
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'reviews'>('reviews');
  const [editingTask, setEditingTask] = useState<BonusTask | null>(null);

  // --- TASK LOGIC ---
  const handleSaveTask = () => {
      if(!editingTask || !editingTask.title) return;
      const exists = bonusTasks.find(t => t.id === editingTask.id);
      onUpdateTasks(exists ? bonusTasks.map(t => t.id === editingTask.id ? editingTask : t) : [...bonusTasks, editingTask]);
      setEditingTask(null);
      notify('success', 'Uloženo', 'Úkol byl uložen.');
  };
  const handleDeleteTask = (id: string) => {
      if(window.confirm('Smazat úkol?')) onUpdateTasks(bonusTasks.filter(t => t.id !== id));
  };

  // --- REVIEW LOGIC ---
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const getUserName = (uid: string) => {
      const u = allUsers.find(user => user.id === uid);
      return u ? (u.name || u.email) : 'Neznámý uživatel';
  };
  const getTaskTitle = (tid: string) => bonusTasks.find(t => t.id === tid)?.title || 'Neznámý úkol';

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
      onReviewSubmission(id, status);
      notify(status === 'approved' ? 'success' : 'info', status === 'approved' ? 'Schváleno' : 'Zamítnuto', 'Status odevzdání byl aktualizován.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Úkoly a Review</h2>
                <p className="text-slate-500 text-sm">Zadávejte speciální úkoly a kontrolujte práci studentů.</p>
            </div>
            <div className="flex bg-white rounded-xl p-1 border border-slate-200">
                <button onClick={() => setActiveTab('reviews')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>
                    Review {pendingSubmissions.length > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{pendingSubmissions.length}</span>}
                </button>
                <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'tasks' ? 'bg-slate-200 text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}>Správa Úkolů</button>
            </div>
        </div>

        {/* --- REVIEWS TAB --- */}
        {activeTab === 'reviews' && (
            <div className="space-y-4">
                {pendingSubmissions.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200">
                        <CheckSquare size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Vše hotovo! Žádné čekající úkoly k revizi.</p>
                    </div>
                ) : (
                    pendingSubmissions.map(sub => (
                        <div key={sub.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row gap-6 hover:border-indigo-200 transition shadow-lg">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock size={12}/> {new Date(sub.submittedAt).toLocaleString()}
                                    <span className="text-gray-700">|</span>
                                    <User size={12}/> {getUserName(sub.userId)}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{getTaskTitle(sub.taskId)}</h3>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-850 font-mono break-all font-semibold">
                                    {sub.content.startsWith('http') ? (
                                        <a href={sub.content} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-500 hover:underline font-bold flex items-center gap-1">
                                            <ExternalLink size={14}/> Otevřít odkaz
                                        </a>
                                    ) : sub.content}
                                </div>
                            </div>
                            <div className="flex flex-row md:flex-col justify-center gap-2">
                                <button onClick={() => handleReview(sub.id, 'approved')} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center gap-2 text-sm transition">
                                    <Check size={16}/> Schválit
                                </button>
                                <button onClick={() => handleReview(sub.id, 'rejected')} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-2 text-sm transition">
                                    <X size={16}/> Zamítnout
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- TASKS TAB --- */}
        {activeTab === 'tasks' && (
            <div>
                <button onClick={() => setEditingTask({id: `t-${Date.now()}`, title: '', description: '', rewardXP: 500, proofType: 'text'})} className="w-full py-3 mb-6 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2">
                    <Plus size={18}/> Vytvořit Nový Úkol
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bonusTasks.map(task => (
                        <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-6 relative group hover:border-slate-300 transition">
                            <button onClick={() => handleDeleteTask(task.id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                            <h3 className="font-bold text-slate-900 mb-2 pr-8">{task.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 h-10 overflow-hidden line-clamp-2">{task.description}</p>
                            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-200">
                                <span className="bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase font-bold">{task.proofType}</span>
                                <span className="text-yellow-500 font-bold flex items-center gap-1"><Gift size={14}/> {task.rewardXP} XP</span>
                            </div>
                            <button onClick={() => setEditingTask(task)} className="w-full mt-4 py-2 bg-slate-100 hover:bg-indigo-650 text-slate-700 hover:text-white rounded-lg text-sm font-semibold transition">Upravit</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Modal */}
        <AnimatePresence>
            {editingTask && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900">Editor Úkolu</h3>
                        <input value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} placeholder="Název úkolu" className="input"/>
                        <textarea value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} placeholder="Zadání úkolu..." className="input h-24"/>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Typ Důkazu</label>
                                <select value={editingTask.proofType} onChange={e => setEditingTask({...editingTask, proofType: e.target.value as any})} className="input">
                                    <option value="text">Text / Odpověď</option>
                                    <option value="link">Odkaz (URL)</option>
                                    <option value="image">Obrázek (URL)</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Odměna XP</label>
                                <input type="number" value={editingTask.rewardXP} onChange={e => setEditingTask({...editingTask, rewardXP: parseInt(e.target.value)})} className="input"/>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setEditingTask(null)} className="btn-secondary">Zrušit</button>
                            <button onClick={handleSaveTask} className="btn-primary bg-indigo-600 hover:bg-indigo-500">Uložit</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminSubmissions;