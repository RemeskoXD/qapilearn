import React, { useState } from 'react';
import { Settings, Save, AlertTriangle, Activity, Lock, Globe, Bell, Power, RefreshCw, Server } from 'lucide-react';
import { SystemSettings } from '../../types';
import { motion } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  onFactoryReset: () => void;
  notify: (type: any, title: string, message: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onUpdateSettings, onFactoryReset, notify }) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof SystemSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
  };

  const handleSave = () => {
      onUpdateSettings(localSettings);
      setHasChanges(false);
      notify('success', 'Uloženo', 'Systémová nastavení byla aktualizována.');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Nastavení Systému</h2>
                <p className="text-slate-500 text-sm">Globální konfigurace platformy.</p>
            </div>
            {hasChanges && (
                <button onClick={handleSave} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg shadow-green-900/20 flex items-center gap-2 animate-bounce-short">
                    <Save size={18}/> Uložit Změny
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* System Status Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Server size={20}/></div>
                    <h3 className="font-bold text-slate-900">Stav Systému</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-bold text-slate-900 block">Režim Údržby (Maintenance)</label>
                            <p className="text-xs text-slate-500 max-w-[250px]">Pokud je aktivní, studenti se nebudou moci přihlásit. Admini mají stále přístup.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={localSettings.maintenanceMode} onChange={e => handleChange('maintenanceMode', e.target.checked)} className="sr-only peer"/>
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-bold text-slate-900 block">Povolit Nové Registrace</label>
                            <p className="text-xs text-slate-500 max-w-[250px]">Vypněte, pokud chcete akademii uzavřít pro nové členy.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={localSettings.allowRegistrations} onChange={e => handleChange('allowRegistrations', e.target.checked)} className="sr-only peer"/>
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Global Announcements */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="p-2 bg-amber-50 rounded-lg text-yellow-500"><Bell size={20}/></div>
                    <h3 className="font-bold text-slate-900">Globální Oznámení</h3>
                </div>
                
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 block">Text Banneru</span>
                        <textarea 
                            value={localSettings.globalBanner} 
                            onChange={e => handleChange('globalBanner', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-50 rounded-xl p-3.5 text-slate-900 focus:outline-none h-24 resize-none text-sm font-medium transition-all shadow-sm placeholder:text-slate-400"
                            placeholder="Např. Zítra proběhne odstávka od 2:00 do 4:00..."
                        />
                    </label>
                    {localSettings.globalBanner && (
                        <div className="bg-yellow-50/50 border-2 border-yellow-200/60 p-3.5 rounded-xl flex items-center gap-2 text-yellow-800 text-xs font-semibold">
                            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0"/>
                            <span>Toto oznámení se nyní zobrazuje všem uživatelům na hlavním panelu.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* System Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="p-2 bg-violet-50 rounded-lg text-violet-600"><Activity size={20}/></div>
                    <h3 className="font-bold text-slate-900">Verze Systému</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-slate-500">Verze Aplikace</span>
                        <span className="font-mono text-slate-900 font-bold">{settings.version || '2.0.0'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-slate-500">Poslední Build</span>
                        <span className="font-mono text-slate-900 text-xs">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="pt-2">
                        <label className="text-xs font-bold text-slate-705 tracking-wide uppercase mb-1.5 block">Změnit verzi</label>
                        <input 
                            type="text" 
                            value={localSettings.version} 
                            onChange={e => handleChange('version', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold outline-none transition-all shadow-sm"
                            placeholder="Změnit označení verze..."
                        />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-900/30">
                    <div className="p-2 bg-rose-50 rounded-lg text-red-500"><AlertTriangle size={20}/></div>
                    <h3 className="font-bold text-slate-900">Danger Zone</h3>
                </div>

                <p className="text-sm text-slate-500 mb-6">
                    Následující akce jsou nevratné. Buďte opatrní.
                </p>

                <button 
                    onClick={() => {
                        if(window.confirm('VAROVÁNÍ: Tato akce vymaže veškerá data (uživatele, kurzy, nastavení) a vrátí systém do továrního nastavení. Pokračovat?')) {
                            onFactoryReset();
                        }
                    }}
                    className="w-full py-3 bg-rose-50 hover:bg-red-600 hover:text-slate-900 text-red-500 border border-red-900/50 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                    <RefreshCw size={18}/> Tovární Reset Databáze
                </button>
            </div>

        </div>
    </div>
  );
};

export default AdminSettings;