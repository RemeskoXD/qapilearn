import React, { useState } from 'react';
import { Film, Plus, Edit, Trash2, Save, X, Play, Clock, CheckCircle } from 'lucide-react';
import { Stream } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminStreamsProps {
  streams: Stream[];
  onUpdateStreams: (streams: Stream[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminStreams: React.FC<AdminStreamsProps> = ({ streams, onUpdateStreams, notify }) => {
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);

  const handleCreate = () => {
      setEditingStream({
          id: `s-${Date.now()}`,
          title: '',
          description: '',
          thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
          streamUrl: '',
          date: new Date().toISOString(),
          status: 'upcoming',
          viewers: 0
      });
  };

  const handleSave = () => {
      if (!editingStream || !editingStream.title) return;
      const exists = streams.find(s => s.id === editingStream.id);
      onUpdateStreams(exists ? streams.map(s => s.id === editingStream.id ? editingStream : s) : [...streams, editingStream]);
      setEditingStream(null);
      notify('success', 'Uloženo', 'Stream byl uložen.');
  };

  const handleDelete = (id: string) => {
      setDeletingStreamId(id);
  };

  const confirmDeleteStream = () => {
      if (deletingStreamId) {
          onUpdateStreams(streams.filter(s => s.id !== deletingStreamId));
          notify('success', 'Smazáno', 'Stream byl odstraněn.');
          setDeletingStreamId(null);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Streamy & Živé Vysílání</h2>
                <p className="text-slate-500 text-sm">Plánujte vysílání a spravujte záznamy.</p>
            </div>
            <button onClick={handleCreate} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg shadow-red-900/20">
                <Plus size={18}/> Nový Stream
            </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {streams.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(stream => (
                <div key={stream.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-6 hover:border-slate-300 transition">
                    <div className="w-full md:w-64 h-36 bg-white rounded-lg relative overflow-hidden flex-shrink-0 group">
                        <img src={stream.thumbnail} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Play size={32} className="text-slate-900 fill-white"/>
                        </div>
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            stream.status === 'live' ? 'bg-red-600 text-white animate-pulse' : 
                            stream.status === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {stream.status === 'live' ? '● ŽIVĚ' : stream.status === 'upcoming' ? 'PLÁNOVÁNO' : 'ZÁZNAM'}
                        </div>
                    </div>
                    
                    <div className="flex-1 py-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <Clock size={12}/> {new Date(stream.date).toLocaleString()}
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">{stream.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{stream.description}</p>
                        <div className="text-xs text-slate-700 font-mono truncate bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            Embed: {stream.streamUrl}
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
                        <button onClick={() => setEditingStream(stream)} className="p-2 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg transition"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(stream.id)} className="p-2 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white rounded-lg transition"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
            {editingStream && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Nastavení Streamu</h3>
                            <button onClick={() => setEditingStream(null)}><X className="text-slate-500 hover:text-slate-900"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="label">Název</label>
                                <input value={editingStream.title} onChange={e => setEditingStream({...editingStream, title: e.target.value})} className="input"/>
                            </div>
                            <div>
                                <label className="label">Popis</label>
                                <textarea value={editingStream.description} onChange={e => setEditingStream({...editingStream, description: e.target.value})} className="input h-20"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Datum a Čas</label>
                                    <input type="datetime-local" value={editingStream.date.substring(0, 16)} onChange={e => setEditingStream({...editingStream, date: new Date(e.target.value).toISOString()})} className="input"/>
                                </div>
                                <div>
                                    <label className="label">Status</label>
                                    <select value={editingStream.status} onChange={e => setEditingStream({...editingStream, status: e.target.value as any})} className="input">
                                        <option value="upcoming">Plánováno</option>
                                        <option value="live">ŽIVĚ (Live)</option>
                                        <option value="ended">Záznam (Ended)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="label">Stream URL (YouTube/Vimeo Embed)</label>
                                <input value={editingStream.streamUrl} onChange={e => setEditingStream({...editingStream, streamUrl: e.target.value})} className="input font-mono text-indigo-600" placeholder="https://www.youtube.com/embed/..."/>
                            </div>
                            <div>
                                <label className="label">Náhledový obrázek</label>
                                <input value={editingStream.thumbnail} onChange={e => setEditingStream({...editingStream, thumbnail: e.target.value})} className="input"/>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button onClick={() => setEditingStream(null)} className="px-4 py-2 text-slate-500 hover:text-slate-900 font-bold">Zrušit</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold shadow-lg">Uložit Stream</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- DELETE CONFIRMATION MODAL --- */}
        <AnimatePresence>
            {deletingStreamId && (
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
                            <button onClick={() => setDeletingStreamId(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                                Zrušit
                            </button>
                            <button onClick={confirmDeleteStream} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 transition">
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

export default AdminStreams;