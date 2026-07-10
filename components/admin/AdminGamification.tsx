import React, { useState } from 'react';
import { Gem, Zap, Star, Plus, Edit, Trash2, Save, X, ShoppingBag, Gift, ArrowUp } from 'lucide-react';
import { Artifact, Challenge, LevelRequirement } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminGamificationProps {
  artifacts: Artifact[];
  challenges: Challenge[];
  levelRequirements: LevelRequirement[];
  onUpdateArtifacts: (items: Artifact[]) => void;
  onUpdateChallenges: (items: Challenge[]) => void;
  onUpdateLevels: (items: LevelRequirement[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminGamification: React.FC<AdminGamificationProps> = ({ 
    artifacts, challenges, levelRequirements, 
    onUpdateArtifacts, onUpdateChallenges, onUpdateLevels, notify 
}) => {
  const [activeTab, setActiveTab] = useState<'artifacts' | 'challenges' | 'levels'>('artifacts');
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'artifact' | 'challenge', id: string, name: string } | null>(null);
  
  // Levels are edited inline mostly, but we track changes
  const [localLevels, setLocalLevels] = useState(levelRequirements);

  // --- ARTIFACTS LOGIC ---
  const handleSaveArtifact = () => {
      if(!editingArtifact || !editingArtifact.name) return;
      const exists = artifacts.find(a => a.id === editingArtifact.id);
      onUpdateArtifacts(exists ? artifacts.map(a => a.id === editingArtifact.id ? editingArtifact : a) : [...artifacts, editingArtifact]);
      setEditingArtifact(null);
      notify('success', 'Uloženo', 'Předmět byl uložen.');
  };
  const handleDeleteArtifact = (id: string) => {
      const art = artifacts.find(a => a.id === id);
      if (art) {
          setDeletingItem({ type: 'artifact', id, name: art.name });
      }
  };

  // --- CHALLENGES LOGIC ---
  const handleSaveChallenge = () => {
      if(!editingChallenge || !editingChallenge.title) return;
      const exists = challenges.find(c => c.id === editingChallenge.id);
      onUpdateChallenges(exists ? challenges.map(c => c.id === editingChallenge.id ? editingChallenge : c) : [...challenges, editingChallenge]);
      setEditingChallenge(null);
      notify('success', 'Uloženo', 'Výzva byla uložena.');
  };
  const handleDeleteChallenge = (id: string) => {
      const chal = challenges.find(c => c.id === id);
      if (chal) {
          setDeletingItem({ type: 'challenge', id, name: chal.title });
      }
  };

  const confirmDeleteItem = () => {
      if (!deletingItem) return;
      if (deletingItem.type === 'artifact') {
          onUpdateArtifacts(artifacts.filter(a => a.id !== deletingItem.id));
          notify('success', 'Smazáno', 'Předmět byl smazán.');
      } else if (deletingItem.type === 'challenge') {
          onUpdateChallenges(challenges.filter(c => c.id !== deletingItem.id));
          notify('success', 'Smazáno', 'Výzva byla smazána.');
      }
      setDeletingItem(null);
  };

  // --- LEVELS LOGIC ---
  const handleLevelChange = (idx: number, field: keyof LevelRequirement, value: any) => {
      const newLevels = [...localLevels];
      newLevels[idx] = { ...newLevels[idx], [field]: value };
      setLocalLevels(newLevels);
  };
  const saveLevels = () => {
      onUpdateLevels(localLevels);
      notify('success', 'Uloženo', 'Nastavení levelů aktualizováno.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Gamifikace</h2>
                <p className="text-slate-500 text-sm">Spravujte obchod, výzvy a levelovací systém.</p>
            </div>
            <div className="flex bg-white rounded-xl p-1 border border-slate-200">
                <button onClick={() => setActiveTab('artifacts')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'artifacts' ? 'bg-violet-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>Předměty</button>
                <button onClick={() => setActiveTab('challenges')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'challenges' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>Výzvy</button>
                <button onClick={() => setActiveTab('levels')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'levels' ? 'bg-yellow-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>Levely</button>
            </div>
        </div>

        {/* --- ARTIFACTS TAB --- */}
        {activeTab === 'artifacts' && (
            <div>
                <button onClick={() => setEditingArtifact({id: `a-${Date.now()}`, name: '', description: '', image: '📦', rarity: 'common', type: 'consumable', price: 100, quantity: 0})} className="w-full py-3 mb-6 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-500 hover:text-violet-600 transition flex items-center justify-center gap-2">
                    <Plus size={18}/> Přidat Předmět do Obchodu
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {artifacts.map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 relative group hover:border-violet-200 transition">
                            <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-slate-100 uppercase text-slate-500">{item.rarity}</div>
                            <div className="text-4xl mb-4">{item.image}</div>
                            <h3 className="font-bold text-slate-900">{item.name}</h3>
                            <p className="text-xs text-slate-500 mb-4 h-8 overflow-hidden">{item.description}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                <span className="font-mono text-yellow-500 font-bold">{item.price} QAPI Coin</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingArtifact(item)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteArtifact(item.id)} className="p-1.5 hover:bg-slate-100 rounded text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- CHALLENGES TAB --- */}
        {activeTab === 'challenges' && (
            <div>
                <button onClick={() => setEditingChallenge({id: `c-${Date.now()}`, title: '', description: '', type: 'daily', targetCount: 1, rewardXP: 100})} className="w-full py-3 mb-6 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2">
                    <Plus size={18}/> Přidat Denní/Týdenní Výzvu
                </button>
                <div className="space-y-4">
                    {challenges.map(challenge => (
                        <div key={challenge.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-200 transition">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${challenge.type === 'daily' ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'}`}>
                                    <Zap size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{challenge.title}</h3>
                                    <p className="text-xs text-slate-500">{challenge.description} (Cíl: {challenge.targetCount}x)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="block text-xs text-slate-500 uppercase">Odměna</span>
                                    <span className="font-bold text-yellow-500">+{challenge.rewardXP} QAPI Coin</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingChallenge(challenge)} className="p-2 bg-slate-100 hover:bg-indigo-600 rounded-lg text-slate-600 hover:text-white transition"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteChallenge(challenge.id)} className="p-2 bg-slate-100 hover:bg-red-600 rounded-lg text-slate-600 hover:text-white transition"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- LEVELS TAB --- */}
        {activeTab === 'levels' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex justify-between mb-6">
                    <h3 className="font-bold text-lg">Konfigurace Levelů</h3>
                    <button onClick={saveLevels} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg shadow-lg">Uložit Levely</button>
                </div>
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar space-y-2">
                    {localLevels.map((lvl, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 transition">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-900 border border-slate-300">{lvl.level}</div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block">Titul</label>
                                    <input value={lvl.title} onChange={e => handleLevelChange(idx, 'title', e.target.value)} className="w-full bg-white text-slate-900 border border-slate-250 rounded px-3 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none transition text-sm font-semibold"/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block">QAPI Coin Potřeba</label>
                                    <input type="number" value={lvl.xpRequired} onChange={e => handleLevelChange(idx, 'xpRequired', parseInt(e.target.value))} className="w-full bg-white text-slate-900 border border-slate-250 rounded px-3 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-mono text-sm text-indigo-600 font-bold"/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- EDIT MODALS --- */}
        <AnimatePresence>
            {editingArtifact && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900">Editor Předmětu</h3>
                        <input value={editingArtifact.name} onChange={e => setEditingArtifact({...editingArtifact, name: e.target.value})} placeholder="Název" className="input"/>
                        <textarea value={editingArtifact.description} onChange={e => setEditingArtifact({...editingArtifact, description: e.target.value})} placeholder="Popis" className="input h-20"/>
                        <div className="flex gap-2">
                            <input value={editingArtifact.image} onChange={e => setEditingArtifact({...editingArtifact, image: e.target.value})} placeholder="Emoji / URL" className="input w-1/3"/>
                            <input type="number" value={editingArtifact.price} onChange={e => setEditingArtifact({...editingArtifact, price: parseInt(e.target.value)})} placeholder="Cena QAPI Coin" className="input flex-1"/>
                        </div>
                        <select value={editingArtifact.rarity} onChange={e => setEditingArtifact({...editingArtifact, rarity: e.target.value as any})} className="input">
                            <option value="common">Common</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="legendary">Legendary</option>
                        </select>
                        <select value={editingArtifact.effectType} onChange={e => setEditingArtifact({...editingArtifact, effectType: e.target.value as any})} className="input">
                            <option value="xp_boost">QAPI Coin Boost</option>
                            <option value="none">Žádný efekt (Badge/Ticket)</option>
                        </select>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setEditingArtifact(null)} className="btn-secondary">Zrušit</button>
                            <button onClick={handleSaveArtifact} className="btn-primary bg-violet-600 hover:bg-violet-500">Uložit</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {editingChallenge && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900">Editor Výzvy</h3>
                        <input value={editingChallenge.title} onChange={e => setEditingChallenge({...editingChallenge, title: e.target.value})} placeholder="Název výzvy" className="input"/>
                        <textarea value={editingChallenge.description} onChange={e => setEditingChallenge({...editingChallenge, description: e.target.value})} placeholder="Popis" className="input h-20"/>
                        <div className="flex gap-2">
                            <select value={editingChallenge.type} onChange={e => setEditingChallenge({...editingChallenge, type: e.target.value as any})} className="input flex-1">
                                <option value="daily">Denní</option>
                                <option value="weekly">Týdenní</option>
                            </select>
                            <input type="number" value={editingChallenge.targetCount} onChange={e => setEditingChallenge({...editingChallenge, targetCount: parseInt(e.target.value)})} placeholder="Cíl (počet)" className="input flex-1"/>
                        </div>
                        <input type="number" value={editingChallenge.rewardXP} onChange={e => setEditingChallenge({...editingChallenge, rewardXP: parseInt(e.target.value)})} placeholder="Odměna QAPI Coin" className="input"/>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setEditingChallenge(null)} className="btn-secondary">Zrušit</button>
                            <button onClick={handleSaveChallenge} className="btn-primary bg-indigo-600 hover:bg-indigo-500">Uložit</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- DELETE CONFIRMATION MODAL --- */}
        <AnimatePresence>
            {deletingItem && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 size={24}/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Opravdu smazat?</h3>
                            <p className="text-sm text-slate-500 mt-1">Chystáte se smazat {deletingItem.type === 'artifact' ? 'předmět' : 'výzvu'} "{deletingItem.name}". Tato akce je nevratná.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setDeletingItem(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                                Zrušit
                            </button>
                            <button onClick={confirmDeleteItem} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 transition">
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

export default AdminGamification;