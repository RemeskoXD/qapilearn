import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Database, Shield, Settings, 
  LogOut, TrendingUp, DollarSign, Activity, Lock, ArrowLeft, Search, MoreHorizontal,
  Edit, Trash2, Ban, Mail, Check, X, UserCheck, Play, BookOpen, Film, Award, Gift, FileText, HelpCircle, Calendar, Zap, Plus, ExternalLink, Terminal, AlertTriangle, Save, RefreshCw, Layers, Video, File, List, CheckCircle, Brain, Gem, MessageSquare, Clock, Send, Star, Megaphone, Home, Image as ImageIcon, Filter, ArrowUpDown, Briefcase, Link as LinkIcon, Menu, Eye, ChevronDown, ChevronUp, Package, FileSpreadsheet, FileJson, Download, StickyNote, Info, CalendarCheck, CheckSquare, MailCheck
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

  // Navigation Items
  const navItems = [
    { id: 'overview', icon: <Home size={18} />, label: 'Přehled' },
    { id: 'users', icon: <Users size={18} />, label: 'Uživatelé' },
    { id: 'courses', icon: <BookOpen size={18} />, label: 'Kurzy' },
    { id: 'quizzes', icon: <Brain size={18} />, label: 'Kvízy' },
    { id: 'mentoring', icon: <Briefcase size={18} />, label: 'Mentoring' },
    { id: 'bookings', icon: <CalendarCheck size={18} />, label: 'Rezervace' },
    { id: 'support', icon: <MessageSquare size={18} />, label: 'Support Desk' },
    { id: 'events', icon: <Calendar size={18} />, label: 'Kalendář' },
    { id: 'ebooks', icon: <FileText size={18} />, label: 'E-knihy' },
    { id: 'streams', icon: <Film size={18} />, label: 'Streamy' },
    { id: 'gamification', icon: <Gem size={18} />, label: 'Gamifikace' },
    { id: 'submissions', icon: <CheckSquare size={18} />, label: 'Úkoly & Review' },
    { id: 'levels', icon: <Star size={18} />, label: 'Levely' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Nastavení' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">
      
      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col hidden lg:flex relative z-20">
         <div className="p-8">
           <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 bg-rose-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-rose-600/20"><Shield size={18} /></div>
              <div>
                <div className="font-bold text-slate-900 leading-none">Q-Hub Admin</div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">CMS</p>
              </div>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
           {navItems.map(item => (
             <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm font-medium ${
                  activeTab === item.id ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
             >
                {item.icon} {item.label}
             </button>
           ))}
        </div>
        <div className="p-4 border-t border-slate-200 space-y-1">
           <button onClick={() => props.onNavigate('dashboard')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition rounded-lg hover:bg-slate-50">
              <ArrowLeft size={16} /> Pohled studenta
           </button>
           <button onClick={props.onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 hover:text-rose-700 transition rounded-lg hover:bg-rose-50">
              <LogOut size={16} /> Odhlásit
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative z-10">
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
                    courses={props.courses}
                    quizzes={props.quizzes}
                    tickets={props.tickets}
                    submissions={props.submissions}
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