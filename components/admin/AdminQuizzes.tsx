import React, { useState } from 'react';
import { Brain, Plus, Edit, Trash2, Save, X, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { Quiz, QuizQuestion } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminQuizzesProps {
  quizzes: Quiz[];
  onUpdateQuizzes: (quizzes: Quiz[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminQuizzes: React.FC<AdminQuizzesProps> = ({ quizzes, onUpdateQuizzes, notify }) => {
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  const handleCreateQuiz = () => {
      const newQuiz: Quiz = { 
          id: `q-${Date.now()}`, 
          title: 'Nový Kvíz', 
          description: '', 
          image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800', 
          level: 'ostatni', 
          xpReward: 100, 
          passingScore: 80, 
          questions: [], 
          published: false 
      };
      setEditingQuiz(newQuiz);
  };

  const handleSaveQuiz = () => {
      if (!editingQuiz) return;
      const exists = quizzes.find(q => q.id === editingQuiz.id);
      onUpdateQuizzes(exists ? quizzes.map(q => q.id === editingQuiz.id ? editingQuiz : q) : [...quizzes, editingQuiz]);
      setEditingQuiz(null);
      notify('success', 'Uloženo', 'Kvíz byl úspěšně uložen.');
  };

  const handleDeleteQuiz = (id: string) => {
      setDeletingQuizId(id);
  };

  const confirmDeleteQuiz = () => {
      if (deletingQuizId) {
          onUpdateQuizzes(quizzes.filter(q => q.id !== deletingQuizId));
          notify('success', 'Smazáno', 'Kvíz byl odstraněn.');
          setDeletingQuizId(null);
      }
  };

  const addQuestion = () => {
      if (!editingQuiz) return;
      const newQ: QuizQuestion = { id: `qq-${Date.now()}`, question: 'Nová otázka', options: ['Možnost A', 'Možnost B'], correctOptionIndex: 0 };
      setEditingQuiz({...editingQuiz, questions: [...editingQuiz.questions, newQ]});
  };

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
      if (!editingQuiz) return;
      const newQuestions = [...editingQuiz.questions];
      newQuestions[idx] = { ...newQuestions[idx], ...updates };
      setEditingQuiz({ ...editingQuiz, questions: newQuestions });
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Správa Kvízů</h2>
                <p className="text-slate-500 text-sm">Testy znalostí a výzvy pro studenty.</p>
            </div>
            <button onClick={handleCreateQuiz} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-white flex items-center gap-2 transition shadow-lg shadow-purple-900/20">
                <Plus size={18}/> Nový Kvíz
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quizzes.map(quiz => (
                <div key={quiz.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-violet-200 transition shadow-xl flex flex-col">
                    <div className="h-32 bg-white relative overflow-hidden">
                        <img src={quiz.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition duration-500"/>
                        <div className="absolute top-2 right-2 bg-slate-900/40 backdrop-blur-md px-2 py-1 rounded text-xs font-bold uppercase border border-white/10">{quiz.level}</div>
                        {!quiz.published && <div className="absolute top-2 left-2 bg-yellow-600/90 px-2 py-1 rounded text-xs font-bold text-white uppercase flex items-center gap-1"><Eye size={12}/> Koncept</div>}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 text-lg mb-2 truncate">{quiz.title}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-1">{quiz.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pt-4 border-t border-slate-200">
                            <span className="flex items-center gap-1"><Brain size={12}/> {quiz.questions.length} otázek</span>
                            <span className="flex items-center gap-1 text-yellow-500 font-bold">+{quiz.xpReward} XP</span>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setEditingQuiz(quiz)} className="flex-1 py-2 bg-slate-100 hover:bg-violet-600 text-slate-600 hover:text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2">
                                <Edit size={14}/> Upravit
                            </button>
                            <button onClick={() => handleDeleteQuiz(quiz.id)} className="px-3 py-2 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white rounded-lg transition">
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* --- QUIZ EDITOR MODAL --- */}
        <AnimatePresence>
            {editingQuiz && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Brain className="text-violet-600"/> Editor Kvízu</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingQuiz(null)} className="px-4 py-2 text-slate-500 hover:text-slate-900">Zrušit</button>
                                <button onClick={handleSaveQuiz} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/20">Uložit Kvíz</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="label">Název Kvízu</label>
                                    <input value={editingQuiz.title} onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})} className="input text-lg font-bold"/>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="label">Popis</label>
                                    <textarea value={editingQuiz.description} onChange={e => setEditingQuiz({...editingQuiz, description: e.target.value})} className="input h-20"/>
                                </div>
                                <div>
                                    <label className="label">Obrázek URL</label>
                                    <input value={editingQuiz.image} onChange={e => setEditingQuiz({...editingQuiz, image: e.target.value})} className="input"/>
                                </div>
                                <div>
                                    <label className="label">Level Přístupu</label>
                                    <select value={editingQuiz.level} onChange={e => setEditingQuiz({...editingQuiz, level: e.target.value as any})} className="input">
                                        <option value="obchodnik">Obchodník</option>
                                        <option value="technik">Technik</option>
                                        <option value="team_leader">Team Leader</option>
                                        <option value="linka">Linka</option>
                                        <option value="ostatni">Ostatní</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Odměna XP</label>
                                    <input type="number" value={editingQuiz.xpReward} onChange={e => setEditingQuiz({...editingQuiz, xpReward: parseInt(e.target.value)})} className="input"/>
                                </div>
                                <div>
                                    <label className="label">Min. Skóre (%)</label>
                                    <input type="number" value={editingQuiz.passingScore} onChange={e => setEditingQuiz({...editingQuiz, passingScore: parseInt(e.target.value)})} className="input"/>
                                </div>
                                <div className="flex items-center gap-4 pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-300 hover:border-purple-500 transition">
                                        <input type="checkbox" checked={editingQuiz.published} onChange={e => setEditingQuiz({...editingQuiz, published: e.target.checked})} className="accent-purple-500 w-5 h-5"/>
                                        <span className="font-bold">Publikováno</span>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold">Otázky ({editingQuiz.questions.length})</h3>
                                    <button onClick={addQuestion} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold border border-slate-300 flex items-center gap-2">
                                        <Plus size={16}/> Přidat Otázku
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    {editingQuiz.questions.map((q, qIdx) => (
                                        <div key={q.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative group">
                                            <button 
                                                onClick={() => {
                                                    const newQs = [...editingQuiz.questions];
                                                    newQs.splice(qIdx, 1);
                                                    setEditingQuiz({...editingQuiz, questions: newQs});
                                                }}
                                                className="absolute top-4 right-4 text-slate-500 hover:text-red-500"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                            
                                            <span className="text-xs font-bold text-violet-600 mb-2 block">OTÁZKA {qIdx + 1}</span>
                                            <input 
                                                value={q.question}
                                                onChange={e => updateQuestion(qIdx, {question: e.target.value})}
                                                className="input mb-4 font-bold bg-white text-slate-900 border-slate-200 border"
                                                placeholder="Znění otázky..."
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition ${q.correctOptionIndex === oIdx ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200 text-slate-800'}`}>
                                                        <input 
                                                            type="radio" 
                                                            checked={q.correctOptionIndex === oIdx} 
                                                            onChange={() => updateQuestion(qIdx, {correctOptionIndex: oIdx})}
                                                            className="accent-green-500 w-5 h-5 cursor-pointer"
                                                        />
                                                        <input 
                                                            value={opt}
                                                            onChange={e => {
                                                                const newOpts = [...q.options];
                                                                newOpts[oIdx] = e.target.value;
                                                                updateQuestion(qIdx, {options: newOpts});
                                                            }}
                                                            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800"
                                                            placeholder={`Možnost ${oIdx + 1}`}
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                const newOpts = [...q.options];
                                                                newOpts.splice(oIdx, 1);
                                                                updateQuestion(qIdx, {options: newOpts});
                                                            }}
                                                            className="text-slate-500 hover:text-red-500"
                                                        >
                                                            <X size={14}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => updateQuestion(qIdx, {options: [...q.options, '']})}
                                                    className="p-3 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:border-gray-500"
                                                >
                                                    + Přidat možnost
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- DELETE CONFIRMATION MODAL --- */}
        <AnimatePresence>
            {deletingQuizId && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 size={24}/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Opravdu smazat?</h3>
                            <p className="text-sm text-slate-500 mt-1">Tato akce je nevratná.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setDeletingQuizId(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                                Zrušit
                            </button>
                            <button onClick={confirmDeleteQuiz} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 transition">
                                Smazat
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminQuizzes;