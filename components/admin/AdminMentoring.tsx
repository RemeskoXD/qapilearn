import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import { Mentor } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminMentoringProps {
  mentors: Mentor[];
  onUpdateMentors: (mentors: Mentor[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminMentoring: React.FC<AdminMentoringProps> = ({ mentors, onUpdateMentors, notify }) => {
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);

  const handleCreateMentor = () => {
      const newMentor: Mentor = {
          id: `m-${Date.now()}`,
          name: '',
          role: '',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800',
          bio: '',
          hourlyRate: 0,
          isAvailable: true
      };
      setEditingMentor(newMentor);
  };

  const handleSaveMentor = () => {
      if (!editingMentor || !editingMentor.name) {
          notify('error', 'Chyba', 'Jméno je povinné.');
          return;
      }
      
      const exists = mentors.find(m => m.id === editingMentor.id);
      onUpdateMentors(exists ? mentors.map(m => m.id === editingMentor.id ? editingMentor : m) : [...mentors, editingMentor]);
      
      setEditingMentor(null);
      notify('success', 'Uloženo', 'Mentor byl úspěšně uložen.');
  };

  const handleDeleteMentor = (id: string) => {
      if (window.confirm('Opravdu smazat tohoto mentora?')) {
          onUpdateMentors(mentors.filter(m => m.id !== id));
          notify('success', 'Smazáno', 'Mentor byl odstraněn.');
      }
  };

  const toggleAvailability = (id: string) => {
      const mentor = mentors.find(m => m.id === id);
      if(mentor) {
          const updated = mentors.map(m => m.id === id ? { ...m, isAvailable: !m.isAvailable } : m);
          onUpdateMentors(updated);
          notify('info', 'Změna stavu', `Mentor ${mentor.name} je nyní ${!mentor.isAvailable ? 'dostupný' : 'nedostupný'}.`);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Správa Mentorů</h2>
                <p className="text-slate-500 text-sm">Přidejte nebo upravte experty akademie.</p>
            </div>
            <button onClick={handleCreateMentor} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                <Plus size={18}/> Přidat Mentora
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map(mentor => (
                <div key={mentor.id} className={`bg-white border rounded-2xl overflow-hidden group transition ${mentor.isAvailable ? 'border-slate-200' : 'border-red-900/50 opacity-80'}`}>
                    <div className="relative h-48 bg-white overflow-hidden">
                        <img src={mentor.image} className={`w-full h-full object-cover transition duration-700 ${mentor.isAvailable ? 'group-hover:scale-105' : 'grayscale'}`}/>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                            <button onClick={() => toggleAvailability(mentor.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border shadow-lg backdrop-blur-md ${mentor.isAvailable ? 'bg-green-600/90 text-white border-emerald-300' : 'bg-red-600/90 text-white border-rose-300'}`}>
                                {mentor.isAvailable ? 'Dostupný' : 'Nedostupný'}
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="font-bold text-xl text-slate-900">{mentor.name}</h3>
                        <p className="text-indigo-600 text-sm font-bold uppercase tracking-wider mb-3">{mentor.role}</p>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{mentor.bio}</p>
                        
                        <div className="flex gap-2 pt-4 border-t border-slate-200">
                            <button onClick={() => setEditingMentor(mentor)} className="flex-1 py-2 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-slate-900 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2">
                                <Edit size={14}/> Upravit
                            </button>
                            <button onClick={() => handleDeleteMentor(mentor.id)} className="px-3 py-2 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-slate-900 rounded-lg transition">
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* --- EDIT MODAL --- */}
        <AnimatePresence>
            {editingMentor && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Profil Mentora</h3>
                            <button onClick={() => setEditingMentor(null)}><X className="text-slate-500 hover:text-slate-900"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="label">Jméno</label>
                                <input value={editingMentor.name} onChange={e => setEditingMentor({...editingMentor, name: e.target.value})} className="input"/>
                            </div>
                            <div>
                                <label className="label">Role / Specializace</label>
                                <input value={editingMentor.role} onChange={e => setEditingMentor({...editingMentor, role: e.target.value})} className="input"/>
                            </div>
                            <div>
                                <label className="label">Bio (Popis)</label>
                                <textarea value={editingMentor.bio} onChange={e => setEditingMentor({...editingMentor, bio: e.target.value})} className="input h-24"/>
                            </div>
                            <div>
                                <label className="label">Foto URL</label>
                                <input value={editingMentor.image} onChange={e => setEditingMentor({...editingMentor, image: e.target.value})} className="input text-xs"/>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div onClick={() => setEditingMentor({...editingMentor, isAvailable: !editingMentor.isAvailable})} className={`w-12 h-6 rounded-full p-1 transition-colors ${editingMentor.isAvailable ? 'bg-green-600' : 'bg-slate-200'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${editingMentor.isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">Aktivní dostupnost</span>
                                </label>
                                {!editingMentor.isAvailable && (
                                    <div className="mt-3">
                                        <label className="label flex items-center gap-2"><Calendar size={12}/> Kdy bude dostupný? (Volitelné)</label>
                                        <input type="date" value={editingMentor.nextAvailableDate || ''} onChange={e => setEditingMentor({...editingMentor, nextAvailableDate: e.target.value})} className="input"/>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button onClick={() => setEditingMentor(null)} className="px-4 py-2 text-slate-500 hover:text-slate-900 font-bold">Zrušit</button>
                            <button onClick={handleSaveMentor} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold shadow-lg">Uložit</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminMentoring;