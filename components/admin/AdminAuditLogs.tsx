import React, { useState, useEffect } from 'react';
import { Shield, Clock, Search } from 'lucide-react';
import { api } from '../../lib/api';

export const AdminAuditLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await api.get('/api/admin-logs');
            setLogs(data || []);
        } catch (err) {
            console.error('Failed to fetch admin logs', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = logs.filter(l => 
        l.adminEmail.toLowerCase().includes(search.toLowerCase()) || 
        l.action.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Log Aktivity Administrátorů</h2>
                <p className="text-slate-500 text-sm">Záznamy o všech akcích provedených administrátory.</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <Search size={20} className="text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Hledat podle e-mailu nebo akce..." 
                    className="flex-1 outline-none text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-4">Datum a Čas</th>
                            <th className="p-4">Administrátor</th>
                            <th className="p-4">Akce</th>
                            <th className="p-4">Detaily</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500">Načítání logů...</td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500">Zatím nebyly zaznamenány žádné akce.</td>
                            </tr>
                        ) : (
                            filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="p-4 font-bold text-indigo-700">{log.adminEmail}</td>
                                    <td className="p-4 font-semibold">{log.action}</td>
                                    <td className="p-4 text-xs">{log.details || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
