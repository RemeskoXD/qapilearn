import React, { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Save, X, Download, Image as ImageIcon } from 'lucide-react';
import { Ebook } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminEbooksProps {
  ebooks: Ebook[];
  onUpdateEbooks: (ebooks: Ebook[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminEbooks: React.FC<AdminEbooksProps> = ({ ebooks, onUpdateEbooks, notify }) => {
  const [editingBook, setEditingBook] = useState<Ebook | null>(null);

  const handleCreate = () => {
      setEditingBook({
          id: `b-${Date.now()}`,
          title: '',
          description: '',
          coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
          downloadUrl: '#',
          pages: 0,
          author: 'Q-Hub'
      });
  };

  const handleSave = () => {
      if (!editingBook || !editingBook.title) return;
      const exists = ebooks.find(b => b.id === editingBook.id);
      onUpdateEbooks(exists ? ebooks.map(b => b.id === editingBook.id ? editingBook : b) : [...ebooks, editingBook]);
      setEditingBook(null);
      notify('success', 'Uloženo', 'E-kniha byla uložena.');
  };

  const handleDelete = (id: string) => {
      if(window.confirm('Opravdu smazat tuto knihu?')) {
          onUpdateEbooks(ebooks.filter(b => b.id !== id));
          notify('success', 'Smazáno', 'E-kniha byla odstraněna.');
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Knihovna (E-booky)</h2>
                <p className="text-slate-500 text-sm">Spravujte studijní materiály a PDF.</p>
            </div>
            <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                <Plus size={18}/> Přidat E-book
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ebooks.map(book => (
                <div key={book.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-indigo-200 transition shadow-xl flex flex-col">
                    <div className="h-64 bg-white relative overflow-hidden">
                        <img src={book.coverImage} className="w-full h-full object-cover transition duration-500 group-hover:scale-105"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
                            <p className="text-xs text-slate-500">{book.author}</p>
                        </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <p className="text-slate-500 text-xs line-clamp-3 mb-4 flex-1">{book.description}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pt-4 border-t border-slate-200">
                            <span>{book.pages} stran</span>
                            <span className="flex items-center gap-1"><Download size={12}/> {Math.floor(Math.random() * 500)} stažení</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingBook(book)} className="flex-1 py-2 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-2">
                                <Edit size={14}/> Upravit
                            </button>
                            <button onClick={() => handleDelete(book.id)} className="px-3 py-2 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white rounded-lg transition">
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
            {editingBook && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Editor E-booku</h3>
                            <button onClick={() => setEditingBook(null)}><X className="text-slate-500 hover:text-slate-900"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="label">Název</label>
                                <input value={editingBook.title} onChange={e => setEditingBook({...editingBook, title: e.target.value})} className="input"/>
                            </div>
                            <div>
                                <label className="label">Autor</label>
                                <input value={editingBook.author} onChange={e => setEditingBook({...editingBook, author: e.target.value})} className="input"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Počet stran</label>
                                    <input type="number" value={editingBook.pages} onChange={e => setEditingBook({...editingBook, pages: parseInt(e.target.value)})} className="input"/>
                                </div>
                                <div>
                                    <label className="label">Odkaz ke stažení</label>
                                    <input value={editingBook.downloadUrl} onChange={e => setEditingBook({...editingBook, downloadUrl: e.target.value})} className="input"/>
                                </div>
                            </div>
                            <div>
                                <label className="label">Popis</label>
                                <textarea value={editingBook.description} onChange={e => setEditingBook({...editingBook, description: e.target.value})} className="input h-24"/>
                            </div>
                            <div>
                                <label className="label">URL Obálky</label>
                                <div className="flex gap-2">
                                    <input value={editingBook.coverImage} onChange={e => setEditingBook({...editingBook, coverImage: e.target.value})} className="input flex-1"/>
                                    <div className="w-12 h-12 rounded bg-white border border-slate-300 overflow-hidden flex-shrink-0">
                                        <img src={editingBook.coverImage} className="w-full h-full object-cover"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button onClick={() => setEditingBook(null)} className="px-4 py-2 text-slate-500 hover:text-slate-900 font-bold">Zrušit</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold shadow-lg">Uložit</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminEbooks;