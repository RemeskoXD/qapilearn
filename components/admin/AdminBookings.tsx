import React, { useState } from 'react';
import { CalendarCheck, Check, X, Clock, MessageSquare, Star, Search, Filter, MoreHorizontal, User, FileText } from 'lucide-react';
import { Booking, Mentor } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminBookingsProps {
  bookings: Booking[];
  mentors: Mentor[];
  onUpdateBookings: (bookings: Booking[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminBookings: React.FC<AdminBookingsProps> = ({ bookings, mentors, onUpdateBookings, notify }) => {
  const [filter, setFilter] = useState('all'); // all, pending, approved, past
  const [search, setSearch] = useState('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const getMentorName = (id: string) => mentors.find(m => m.id === id)?.name || 'Neznámý mentor';

  const filteredBookings = bookings.filter(b => {
      const matchesSearch = b.userEmail.toLowerCase().includes(search.toLowerCase()) || (b.note && b.note.toLowerCase().includes(search.toLowerCase()));
      const isPast = new Date(b.date) < new Date();
      
      if (filter === 'past') return matchesSearch && isPast;
      if (filter === 'pending') return matchesSearch && b.status === 'pending' && !isPast;
      if (filter === 'approved') return matchesSearch && b.status === 'approved' && !isPast;
      return matchesSearch;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleStatusChange = (status: 'approved' | 'rejected') => {
      if(!editingBooking) return;
      const updated = bookings.map(b => b.id === editingBooking.id ? { ...b, status } : b);
      onUpdateBookings(updated);
      setEditingBooking(null);
      notify(status === 'approved' ? 'success' : 'info', 'Status změněn', `Rezervace byla ${status === 'approved' ? 'schválena' : 'zamítnuta'}.`);
  };

  const handleSaveNote = () => {
      if(!editingBooking) return;
      const updated = bookings.map(b => b.id === editingBooking.id ? { ...b, adminNote: editingBooking.adminNote, rating: editingBooking.rating } : b);
      onUpdateBookings(updated);
      setEditingBooking(null);
      notify('success', 'Uloženo', 'Poznámka k rezervaci byla uložena.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Rezervace Mentoringu</h2>
                <p className="text-slate-500 text-sm">Správa požadavků a historie konzultací.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Email, poznámka..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 transition"
                    />
                </div>
                <select 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                    <option value="all">Všechny</option>
                    <option value="pending">Čekající</option>
                    <option value="approved">Schválené</option>
                    <option value="past">Proběhlé / Historie</option>
                </select>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-500">
                <thead className="bg-white/80 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="p-4">Datum & Čas</th>
                        <th className="p-4">Pracovník</th>
                        <th className="p-4">Mentor</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Poznámka</th>
                        <th className="p-4 text-right">Akce</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map(booking => {
                        const isPast = new Date(booking.date) < new Date();
                        return (
                            <tr key={booking.id} className={`hover:bg-slate-50 transition ${isPast ? 'opacity-60' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-slate-900 font-mono">
                                        <Clock size={14} className="text-indigo-600"/>
                                        {new Date(booking.date).toLocaleDateString('cs-CZ')} {new Date(booking.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    {isPast && <span className="text-[10px] text-slate-500 uppercase font-bold">Proběhlo</span>}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <User size={14}/> {booking.userEmail}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-900 font-medium">{getMentorName(booking.mentorId)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                        booking.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                        booking.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {booking.status === 'pending' ? 'Čeká na schválení' : booking.status === 'approved' ? 'Schváleno' : 'Zamítnuto'}
                                    </span>
                                </td>
                                <td className="p-4 max-w-xs truncate text-xs" title={booking.note}>
                                    {booking.note}
                                    {booking.adminNote && <div className="text-indigo-600 mt-1 flex items-center gap-1"><FileText size={10}/> Poznámka admina</div>}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => setEditingBooking(booking)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition">
                                        <MoreHorizontal size={16}/>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filteredBookings.length === 0 && <div className="p-8 text-center text-slate-500">Žádné rezervace v této kategorii.</div>}
        </div>

        {/* --- DETAIL MODAL --- */}
        <AnimatePresence>
            {editingBooking && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Detail Rezervace</h3>
                            <button onClick={() => setEditingBooking(null)}><X className="text-slate-500 hover:text-slate-900"/></button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/80 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500 block text-xs uppercase mb-1">Pracovník</span> <span className="text-slate-900 font-bold">{editingBooking.userEmail}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase mb-1">Mentor</span> <span className="text-slate-900 font-bold">{getMentorName(editingBooking.mentorId)}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase mb-1">Datum</span> <span className="text-slate-900 font-mono">{new Date(editingBooking.date).toLocaleString()}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase mb-1">Status</span> <span className="text-slate-900 capitalize">{editingBooking.status}</span></div>
                            </div>

                            <div>
                                <label className="label">Poznámka pracovníka</label>
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-705 font-medium italic">
                                    "{editingBooking.note}"
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <label className="label flex items-center gap-2"><FileText size={14} className="text-indigo-600"/> Interní poznámka (Admin/Mentor)</label>
                                <textarea 
                                    value={editingBooking.adminNote || ''} 
                                    onChange={e => setEditingBooking({...editingBooking, adminNote: e.target.value})} 
                                    className="input h-24 text-sm" 
                                    placeholder="Soukromá poznámka k průběhu, hodnocení pracovníka..."
                                />
                            </div>

                            <div>
                                <label className="label flex items-center gap-2"><Star size={14} className="text-yellow-500"/> Hodnocení pracovníka (1-5)</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(star => (
                                        <button 
                                            key={star} 
                                            onClick={() => setEditingBooking({...editingBooking, rating: star})}
                                            className={`p-2 rounded-lg border transition ${editingBooking.rating === star ? 'bg-amber-100 border-yellow-500 text-yellow-500' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
                                        >
                                            {star}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                {editingBooking.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleStatusChange('approved')} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm flex items-center gap-2"><Check size={14}/> Schválit</button>
                                        <button onClick={() => handleStatusChange('rejected')} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm flex items-center gap-2"><X size={14}/> Zamítnout</button>
                                    </>
                                )}
                            </div>
                            <button onClick={handleSaveNote} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold shadow-lg">Uložit Změny</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminBookings;