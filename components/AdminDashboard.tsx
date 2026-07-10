import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Database, Shield, Settings, 
  LogOut, TrendingUp, DollarSign, Activity, Lock, ArrowLeft, Search, MoreHorizontal,
  Edit, Trash2, Ban, Mail, Check, X, UserCheck, Play, BookOpen, Film, Award, Gift, FileText, HelpCircle, Calendar, Zap, Plus, ExternalLink, Terminal, AlertTriangle, Save, RefreshCw, Layers, Video, File, List, CheckCircle, Brain, Gem, MessageSquare, Clock, Send, Star, Megaphone, Home, Image as ImageIcon, Filter, ArrowUpDown, Briefcase, Link as LinkIcon, Menu, Eye, ChevronDown, ChevronUp, Package, FileSpreadsheet, FileJson, Download, StickyNote, Info, CalendarCheck, CheckSquare, MailCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole, Message, Challenge, Artifact, CalendarEvent, BonusTask, BonusSubmission, SystemSettings, Course, CourseModule, Lesson, QuizQuestion, Quiz, Mentor, Booking, Ebook, Stream, SupportTicket, LevelRequirement, ToastMessage } from '../types';

// Import Sub-Components
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminCourses from './admin/AdminCourses';
import AdminQuizzes from './admin/AdminQuizzes';
import AdminMentoring from './admin/AdminMentoring';
import AdminBookings from './admin/AdminBookings';
import AdminSupport from './admin/AdminSupport';
import AdminCalendar from './admin/AdminCalendar';
import AdminEbooks from './admin/AdminEbooks';
import AdminStreams from './admin/AdminStreams';
import AdminGamification from './admin/AdminGamification';
import AdminSubmissions from './admin/AdminSubmissions';
import AdminSettings from './admin/AdminSettings';
import AdminCaflou from './admin/AdminCaflou';
import { AdminAuditLogs } from './admin/AdminAuditLogs';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminDashboardProps {
  currentUser: User;
  allUsers: User[];
  settings: SystemSettings;
  challenges: Challenge[];
  artifacts: Artifact[];
  events: CalendarEvent[];
  bonusTasks: BonusTask[];
  submissions: BonusSubmission[];
  courses: Course[];
  quizzes: Quiz[];
  mentors: Mentor[];
  bookings: Booking[];
  ebooks: Ebook[];
  streams: Stream[];
  tickets: SupportTicket[];
  levelRequirements: LevelRequirement[];
  notify: (type: ToastMessage['type'], title: string, message: string) => void;
  onCreateUser?: (userData: any) => Promise<void>;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onImpersonate: (userId: string) => void;
  onSendMessage: (userId: string, message: Message) => void;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onUpdateTasks: (tasks: BonusTask[]) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onUpdateCourses: (courses: Course[]) => void;
  onUpdateQuizzes: (quizzes: Quiz[]) => void;
  onUpdateArtifacts: (artifacts: Artifact[]) => void;
  onUpdateChallenges: (challenges: Challenge[]) => void;
  onUpdateEbooks: (ebooks: Ebook[]) => void;
  onUpdateStreams: (streams: Stream[]) => void;
  onUpdateMentors: (mentors: Mentor[]) => void;
  onUpdateBookings: (bookings: Booking[]) => void;
  onUpdateLevels: (levels: LevelRequirement[]) => void;
  onSendCampaign: (role: string, subject: string, body: string) => void;
  onReviewSubmission: (id: string, status: 'approved' | 'rejected') => void;
  onReplyTicket: (id: string, message: string) => void;
  onCloseTicket: (id: string) => void;
  onFactoryReset: () => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    try {
      localStorage.setItem('admin_sidebar_collapsed', String(newValue));
    } catch (e) {
      console.error(e);
    }
  };

  // Navigation Items
  const navItems = [
    { id: 'overview', icon: <Home size={18} />, label: 'Přehled' },
    { id: 'users', icon: <Users size={18} />, label: 'Uživatelé' },
    { id: 'support', icon: <MessageSquare size={18} />, label: 'Support Desk' },
    ...(props.settings?.enableCalendar !== false ? [{ id: 'events', icon: <Calendar size={18} />, label: 'Kalendář' }] : []),
    { id: 'gamification', icon: <Gem size={18} />, label: 'Gamifikace' },
    { id: 'caflou', icon: <LinkIcon size={18} className="rotate-45" />, label: 'Caflou Integrace' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Nastavení' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">
      
      {/* Mobile Sidebar (Drawer Overlay) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            {/* Drawer content card */}
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 max-w-xs bg-white h-full flex flex-col z-10 shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="https://web2.itnahodinu.cz/QAPI/QHUB.jpeg" 
                    alt="QHUB Logo" 
                    className="h-12 w-auto object-contain flex-shrink-0" 
                    style={{ filter: 'invert(15%) sepia(95%) saturate(6500%) hue-rotate(358deg) brightness(85%) contrast(115%)' }}
                  />
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm font-medium ${
                      activeTab === item.id ? 'bg-indigo-50 text-slate-900 border border-indigo-200 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 space-y-1 bg-slate-50/50">
                <button onClick={() => { props.onNavigate('dashboard'); setSidebarOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition rounded-lg hover:bg-white border border-transparent hover:border-slate-200">
                  <ArrowLeft size={16} /> Pohled pracovníka
                </button>
                <button onClick={() => { props.onLogout(); setSidebarOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 transition rounded-lg hover:bg-rose-50">
                  <LogOut size={16} /> Odhlásit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <div className={`bg-white border-r border-slate-200 flex-shrink-0 flex flex-col hidden lg:flex relative z-10 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
         <div className={`p-6 border-b border-slate-100 flex items-center ${isCollapsed ? 'flex-col gap-4 p-4 justify-center' : 'justify-between'}`}>
           <div className="flex items-center gap-2.5 overflow-hidden">
              <img 
                src="https://web2.itnahodinu.cz/QAPI/QHUB.jpeg" 
                alt="QHUB Logo" 
                className="h-14 w-auto object-contain flex-shrink-0"
                style={{ filter: 'invert(15%) sepia(95%) saturate(6500%) hue-rotate(358deg) brightness(85%) contrast(115%)' }}
              />
              {!isCollapsed && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>


                </motion.div>
              )}
           </div>
           {isCollapsed ? (
             <button onClick={toggleSidebar} className="text-slate-400 hover:text-brand-gold p-1.5 hover:bg-indigo-50 rounded-lg transition" title="Rozbalit boční panel">
                <ChevronRight size={18} />
             </button>
           ) : (
             <button onClick={toggleSidebar} className="text-slate-400 hover:text-brand-gold p-1 rounded-lg hover:bg-slate-50 transition" title="Skrýt boční panel">
                <ChevronLeft size={18} />
             </button>
           )}
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
           {navItems.map(item => (
             <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl transition-all duration-200 text-sm font-medium ${
                  isCollapsed ? 'justify-center p-2.5 h-11 w-11 mx-auto' : 'px-4 py-2.5 gap-3'
                } ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-slate-900 border border-indigo-200 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
             >
                <div className="flex-shrink-0">{item.icon}</div>
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }} 
                    animate={{ opacity: 1, width: 'auto' }}
                    className="whitespace-nowrap overflow-hidden text-ellipsis text-xs"
                  >
                    {item.label}
                  </motion.span>
                )}
             </button>
           ))}
        </div>
        
        <div className={`p-4 border-t border-slate-200 space-y-1.5 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>
           <button 
             onClick={() => props.onNavigate('dashboard')} 
             title={isCollapsed ? "Pohled pracovníka" : undefined}
             className={`flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-all rounded-lg hover:bg-slate-50 ${
               isCollapsed ? 'justify-center h-10 w-10 p-0' : 'w-full gap-2 px-4 py-2.5'
             }`}
           >
              <ArrowLeft size={16} />
              {!isCollapsed && <span className="text-xs">Pohled pracovníka</span>}
           </button>
           <button 
             onClick={props.onLogout} 
             title={isCollapsed ? "Odhlásit" : undefined}
             className={`flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 transition-[#FF2D55] duration-200 rounded-lg hover:bg-rose-50 ${
               isCollapsed ? 'justify-center h-10 w-10 p-0' : 'w-full gap-2 px-4 py-2.5'
             }`}
           >
              <LogOut size={16} />
              {!isCollapsed && <span className="text-xs">Odhlásit</span>}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative z-20">
         <header className="h-16 lg:h-20 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500"><Menu/></button>
                <h1 className="text-xl font-bold text-slate-900">{navItems.find(i => i.id === activeTab)?.label}</h1>
            </div>
            <div className="flex items-center gap-4">
               <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> LIVE
               </div>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">

            {/* --- ROUTER SWITCH --- */}
            
            {activeTab === 'overview' && (
                <AdminOverview 
                    allUsers={props.allUsers}
                    events={props.events}
                    courses={props.courses}
                    quizzes={props.quizzes}
                    tickets={props.tickets}
                    submissions={props.submissions}
                    onNavigate={(tab) => setActiveTab(tab)}
                />
            )}

            {activeTab === 'users' && (
                <AdminUsers 
                    allUsers={props.allUsers}
                    onCreateUser={props.onCreateUser}
                    onUpdateUser={props.onUpdateUser}
                    onDeleteUser={props.onDeleteUser}
                    notify={props.notify}
                />
            )}

            {activeTab === 'courses' && (
                <AdminCourses
                    courses={props.courses}
                    allUsers={props.allUsers}
                    onUpdateCourses={props.onUpdateCourses}
                    notify={props.notify}
                />
            )}

            {activeTab === 'quizzes' && (
                <AdminQuizzes
                    quizzes={props.quizzes}
                    onUpdateQuizzes={props.onUpdateQuizzes}
                    notify={props.notify}
                />
            )}

            {activeTab === 'mentoring' && (
                <AdminMentoring
                    mentors={props.mentors}
                    onUpdateMentors={props.onUpdateMentors}
                    notify={props.notify}
                />
            )}

            {activeTab === 'bookings' && (
                <AdminBookings
                    bookings={props.bookings}
                    mentors={props.mentors}
                    onUpdateBookings={props.onUpdateBookings}
                    notify={props.notify}
                />
            )}

            {activeTab === 'support' && (
                <AdminSupport
                    tickets={props.tickets}
                    onReplyTicket={props.onReplyTicket}
                    onCloseTicket={props.onCloseTicket}
                    notify={props.notify}
                />
            )}

            {activeTab === 'events' && (
                <AdminCalendar
                    events={props.events}
                    onUpdateEvents={props.onUpdateEvents}
                    notify={props.notify}
                />
            )}

            {activeTab === 'ebooks' && (
                <AdminEbooks
                    ebooks={props.ebooks}
                    onUpdateEbooks={props.onUpdateEbooks}
                    notify={props.notify}
                />
            )}

            {activeTab === 'streams' && (
                <AdminStreams
                    streams={props.streams}
                    onUpdateStreams={props.onUpdateStreams}
                    notify={props.notify}
                />
            )}

            {activeTab === 'gamification' && (
                <AdminGamification
                    artifacts={props.artifacts}
                    challenges={props.challenges}
                    levelRequirements={props.levelRequirements}
                    onUpdateArtifacts={props.onUpdateArtifacts}
                    onUpdateChallenges={props.onUpdateChallenges}
                    onUpdateLevels={props.onUpdateLevels}
                    notify={props.notify}
                />
            )}

            {activeTab === 'submissions' && (
                <AdminSubmissions
                    bonusTasks={props.bonusTasks}
                    submissions={props.submissions}
                    allUsers={props.allUsers}
                    onUpdateTasks={props.onUpdateTasks}
                    onReviewSubmission={props.onReviewSubmission}
                    notify={props.notify}
                />
            )}

            {/* Combined Levels into Gamification mostly, but if a separate view is desired, we can keep it or redirect */}
            {activeTab === 'levels' && (
                <AdminGamification
                    artifacts={props.artifacts}
                    challenges={props.challenges}
                    levelRequirements={props.levelRequirements}
                    onUpdateArtifacts={props.onUpdateArtifacts}
                    onUpdateChallenges={props.onUpdateChallenges}
                    onUpdateLevels={props.onUpdateLevels}
                    notify={props.notify}
                />
            )}

            
            {activeTab === 'logs' && (
                <AdminAuditLogs />
            )}

            {activeTab === 'caflou' && (
                <AdminCaflou
                    notify={props.notify}
                />
            )}

            {activeTab === 'settings' && (
                <AdminSettings
                    settings={props.settings}
                    onUpdateSettings={props.onUpdateSettings}
                    onFactoryReset={props.onFactoryReset}
                    notify={props.notify}
                />
            )}

         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;