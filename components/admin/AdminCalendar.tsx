import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Save, X, Users, Lock, Globe } from 'lucide-react';
import { CalendarEvent } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminCalendarProps {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ events, onUpdateEvents, notify }) => {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const handleCreateEvent = () => {
      const newEvent: CalendarEvent = {
          id: `evt-${Date.now()}`,
          title: '',
          description: '',
          date: new Date().toISOString(),
          type: 'webinar',
          registeredUserIds: [],
          maxAttendees: 50,
          price: 0,
          isFreeForVip: true,
          isFreeForPremium: true
      };
      setEditingEvent(newEvent);
  };

  const handleSaveEvent = () => {
      if (!editingEvent || !editingEvent.title) {
          notify('error', 'Chyba', 'Název události je povinný.');
          return;
      }
      
      const exists = events.find(e => e.id === editingEvent.id);
      onUpdateEvents(exists ? events.map(e => e.id === editingEvent.id ? editingEvent : e) : [...events, editingEvent]);
      setEditingEvent(null);
      notify('success', 'Uloženo', 'Událost byla uložena.');
  };

  const handleDeleteEvent = (id: string) => {
      setDeletingEventId(id);
  };

  const confirmDeleteEvent = () => {
      if (deletingEventId) {
          onUpdateEvents(events.filter(e => e.id !== deletingEventId));
          notify('success', 'Smazáno', 'Událost byla odstraněna.');
          setDeletingEventId(null);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Kalendář Akcí</h2>
                <p className="text-slate-500 text-sm">Plánujte webináře, workshopy a setkání.</p>
            </div>
            <button onClick={handleCreateEvent} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                <Plus size={18}/> Nová Akce
            </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => {
                const isPast = new Date(event.date) < new Date();
                return (
                    <div key={event.id} className={`bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row gap-6 hover:border-slate-300 transition ${isPast ? 'opacity-60' : ''}`}>
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white rounded-xl w-24 h-24 border border-slate-200">
                            <span className="text-xs text-slate-500 uppercase font-bold">{new Date(event.date).toLocaleDateString('cs-CZ', {month: 'short'})}</span>
                            <span className="text-3xl font-bold text-slate-900">{new Date(event.date).getDate()}</span>
                            <span className="text-xs text-indigo-600">{new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${event.type === 'webinar' ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>{event.type}</span>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Interní akce</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Users size={14}/> {event.registeredUserIds.length} / {event.maxAttendees || '∞'}</span>
                                {event.isFreeForVip && <span className="flex items-center gap-1 text-yellow-500"><Lock size={12}/> VIP Zdarma</span>}
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col justify-center gap-2">
                            <button onClick={() => setEditingEvent(event)} className="p-2 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg transition"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteEvent(event.id)} className="p-2 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white rounded-lg transition"><Trash2 size={16}/></button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* --- EDIT MODAL --- */}
        <AnimatePresence>
            {editingEvent && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-8 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Editor Události</h3>
                            <button onClick={() => setEditingEvent(null)}><X className="text-slate-500 hover:text-slate-900"/></button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label">Název Akce</label>
                                    <input value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} className="input text-lg font-bold"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="label">Popis</label>
                                    <textarea value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} className="input h-24"/>
                                </div>
                                <div>
                                    <label className="label">Datum a Čas</label>
                                    <input type="datetime-local" value={editingEvent.date.substring(0, 16)} onChange={e => setEditingEvent({...editingEvent, date: new Date(e.target.value).toISOString()})} className="input"/>
                                </div>
                                <div>
                                    <label className="label">Typ</label>
                                    <select value={editingEvent.type} onChange={e => setEditingEvent({...editingEvent, type: e.target.value as any})} className="input">
                                        <option value="webinar">Webinář (Online)</option>
                                        <option value="workshop">Workshop</option>
                                        <option value="meetup">Meetup (Offline)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Odkaz (Zoom/Místo)</label>
                                    <input value={editingEvent.link || ''} onChange={e => setEditingEvent({...editingEvent, link: e.target.value})} className="input" placeholder="https://zoom.us/..."/>
                                </div>
                                <div>
                                    <label className="label">Kapacita</label>
                                    <input type="number" value={editingEvent.maxAttendees || 50} onChange={e => setEditingEvent({...editingEvent, maxAttendees: parseInt(e.target.value)})} className="input"/>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Lock size={18}/> Přístup podle role</h4>
                                <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200">
                                            <input type="checkbox" checked={editingEvent.isFreeForPremium} onChange={e => setEditingEvent({...editingEvent, isFreeForPremium: e.target.checked})} className="accent-blue-500"/>
                                            <span className="text-sm font-bold text-violet-600">Dostupné pro Premium</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200">
                                            <input type="checkbox" checked={editingEvent.isFreeForVip} onChange={e => setEditingEvent({...editingEvent, isFreeForVip: e.target.checked})} className="accent-blue-500"/>
                                            <span className="text-sm font-bold text-amber-600">Dostupné pro VIP</span>
                                        </label>
                                    <p className="text-[10px] text-slate-500">Q-Hub je interní — akce jsou vždy bez platby.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-auto">
                            <button onClick={() => setEditingEvent(null)} className="px-4 py-2 text-slate-500 hover:text-slate-900 font-bold">Zrušit</button>
                            <button onClick={handleSaveEvent} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold shadow-lg">Uložit Akci</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- DELETE CONFIRMATION MODAL --- */}
        <AnimatePresence>
            {deletingEventId && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 size={24}/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Opravdu smazat?</h3>
                            <p className="text-sm text-slate-500 mt-1">Tato akce je nevratná.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setDeletingEventId(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                                Zrušit
                            </button>
                            <button onClick={confirmDeleteEvent} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 transition">
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

export default AdminCalendar;