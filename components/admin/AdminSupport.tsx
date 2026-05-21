import React, { useState } from 'react';
import { MessageSquare, CheckCircle, XCircle, Search, Clock, Send, User, AlertCircle, Trash2 } from 'lucide-react';
import { SupportTicket } from '../../types';
import { motion } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminSupportProps {
  tickets: SupportTicket[];
  onReplyTicket: (id: string, message: string) => void;
  onCloseTicket: (id: string) => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminSupport: React.FC<AdminSupportProps> = ({ tickets, onReplyTicket, onCloseTicket, notify }) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('open'); // open, closed, all

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const filteredTickets = tickets.filter(t => {
      if (filter === 'open') return t.status === 'open' || t.status === 'pending';
      if (filter === 'closed') return t.status === 'closed';
      return true;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSend = () => {
      if(!selectedTicketId || !replyText.trim()) return;
      onReplyTicket(selectedTicketId, replyText);
      setReplyText('');
      notify('success', 'Odesláno', 'Odpověď byla odeslána.');
  };

  const handleClose = () => {
      if(!selectedTicketId) return;
      onCloseTicket(selectedTicketId);
      notify('success', 'Uzavřeno', 'Ticket byl označen jako vyřešený.');
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-fade-in">
        {/* Ticket List */}
        <div className="w-1/3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-white/80">
                <h2 className="font-bold text-slate-900 mb-4">Support Desk</h2>
                <div className="flex gap-2 mb-2">
                    <button onClick={() => setFilter('open')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${filter === 'open' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-900'}`}>Otevřené</button>
                    <button onClick={() => setFilter('closed')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${filter === 'closed' ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-900'}`}>Vyřešené</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {filteredTickets.length === 0 && <div className="text-center p-8 text-slate-500 text-xs">Žádné tickety.</div>}
                {filteredTickets.map(ticket => (
                    <div 
                        key={ticket.id} 
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`p-4 rounded-xl cursor-pointer border transition ${selectedTicketId === ticket.id ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${ticket.priority === 'high' ? 'bg-rose-100 text-red-400' : 'bg-slate-100 text-slate-500'}`}>{ticket.priority}</span>
                            <span className="text-[10px] text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className={`font-bold text-sm mb-1 truncate ${ticket.status === 'closed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{ticket.subject}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <User size={12}/> {ticket.userEmail}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Ticket Detail / Chat */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden relative">
            {selectedTicket ? (
                <>
                    <div className="h-16 border-b border-slate-200 bg-white/80 px-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                {selectedTicket.subject}
                                {selectedTicket.status === 'closed' && <span className="text-xs bg-emerald-100 text-green-400 px-2 py-0.5 rounded border border-emerald-200">VYŘEŠENO</span>}
                            </h3>
                            <p className="text-xs text-slate-500">Uživatel: {selectedTicket.userEmail}</p>
                        </div>
                        {selectedTicket.status !== 'closed' && (
                            <button onClick={handleClose} className="px-4 py-2 bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-2">
                                <CheckCircle size={14}/> Vyřešit
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
                        {selectedTicket.messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'support' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'support' ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-650/10' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-xs'}`}>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                                    <div className={`text-[10px] mt-2 opacity-50 ${msg.sender === 'support' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {msg.sender === 'support' ? 'Support Team' : selectedTicket.userEmail} • {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedTicket.status !== 'closed' ? (
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="relative">
                                <textarea 
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-12 text-sm text-slate-800 focus:border-indigo-500 hover:border-slate-300 outline-none resize-none h-24 focus:bg-white transition-all"
                                    placeholder="Napište odpověď..."
                                />
                                <button onClick={handleSend} className="absolute bottom-4 right-4 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition">
                                    <Send size={18}/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-white border-t border-slate-200 text-center text-sm text-slate-500">
                            Tento ticket je uzavřen. <button onClick={() => { /* Reopen logic if needed */ }} className="text-indigo-600 hover:underline">Znovu otevřít?</button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare size={48} className="mb-4 opacity-20"/>
                    <p>Vyberte ticket ze seznamu.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminSupport;