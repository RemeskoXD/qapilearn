import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, BookOpen, Film, Calendar, Users, HelpCircle, 
  FileText, Award, Gem, Shield, LogOut, Bell, Zap, Play, Gift, 
  TrendingUp, Settings, Lock, Mail, ChevronDown, ChevronUp, Download, EyeOff, Eye, CheckCircle, Package, Clock, ExternalLink, Camera, Send, X, ArrowLeft, Brain, Video, Check, Layers, Crown, Plus, Users as UsersIcon, MessageSquare, ArrowRight, AlertOctagon, Info, Star, Trophy, ArrowUp, MessageCircle, User as UserIcon, StickyNote, Edit3, ShoppingBag, BarChart2, DollarSign, Calendar as CalendarIcon, Copy, Coins, Trash2, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Challenge, Artifact, CalendarEvent, BonusTask, BonusSubmission, Course, Quiz, Mentor, Booking, Ebook, Stream, SupportTicket, LevelRequirement, CommunitySession, ToastMessage, ProfitEntry, QhubPosition, QHUB_POSITIONS } from '../types';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { SecretGame } from './SecretGame';

// Fix types for framer motion
const MotionDiv = motion.div as any;

const CZECH_REGIONS = [
  'Karlovy Vary',
  'Plzeň',
  'Ostrava',
  'Zlín',
  'Praha',
  'Brno',
  'České Budějovice',
  'Liberec',
  'Hradec Králové',
  'Olomouc',
  'Středočeský kraj'
];

// Helper to render basic markdown for course lessons with full styling support
const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    let insideList = false;
    let listItems: string[] = [];
    const elements: React.ReactNode[] = [];
    
    const flushList = (keyIdx: number) => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${keyIdx}`} className="list-disc pl-6 space-y-2 my-4 text-slate-800">
                    {listItems.map((item, i) => <li key={i}>{parseInlineMarkdown(item)}</li>)}
                </ul>
            );
            listItems = [];
            insideList = false;
        }
    };

    const parseInlineMarkdown = (str: string) => {
        if (str.startsWith('![') && str.endsWith(')')) {
            const altMatch = str.match(/!\[(.*?)\]/);
            const urlMatch = str.match(/\((.*?)\)/);
            if (urlMatch) {
                return (
                    <span className="block my-6 text-center">
                        <img 
                            src={urlMatch[1]} 
                            referrerPolicy="no-referrer"
                            alt={altMatch ? altMatch[1] : 'Obrázek'} 
                            className="rounded-xl border border-slate-200 shadow-lg max-h-96 mx-auto object-cover" 
                        />
                        {altMatch && altMatch[1] && <span className="block text-xs text-slate-400 mt-2 italic">{altMatch[1]}</span>}
                    </span>
                );
            }
        }
        
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const inner = part.slice(2, -2);
                return <strong key={pIdx} className="font-extrabold text-slate-900">{inner}</strong>;
            }
            const subParts = part.split(/(\*.*?\*)/g);
            return subParts.map((sub, sIdx) => {
                if (sub.startsWith('*') && sub.endsWith('*')) {
                    return <em key={`${pIdx}-${sIdx}`} className="italic text-slate-700">{sub.slice(1, -1)}</em>;
                }
                return sub;
            });
        });
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('- ')) {
            insideList = true;
            listItems.push(trimmed.substring(2));
        } else {
            if (insideList) {
                flushList(index);
            }
            
            if (trimmed.startsWith('# ')) {
                elements.push(<h1 key={index} className="text-3xl font-extrabold text-slate-900 mt-6 mb-4 border-b border-slate-100 pb-2">{parseInlineMarkdown(trimmed.substring(2))}</h1>);
            } else if (trimmed.startsWith('## ')) {
                elements.push(<h2 key={index} className="text-2xl font-bold text-slate-900 mt-5 mb-3">{parseInlineMarkdown(trimmed.substring(3))}</h2>);
            } else if (trimmed.startsWith('### ')) {
                elements.push(<h3 key={index} className="text-xl font-semibold text-slate-900 mt-4 mb-2">{parseInlineMarkdown(trimmed.substring(4))}</h3>);
            } else if (trimmed.startsWith('---')) {
                elements.push(<hr key={index} className="my-6 border-slate-200" />);
            } else if (trimmed.startsWith('> ')) {
                elements.push(
                    <blockquote key={index} className="border-l-4 border-indigo-500 pl-4 py-2 my-4 italic text-slate-700 bg-indigo-50/50 rounded-r-lg">
                        {parseInlineMarkdown(trimmed.substring(2))}
                    </blockquote>
                );
            } else if (trimmed !== '') {
                if (trimmed.startsWith('![') && trimmed.endsWith(')')) {
                    elements.push(<div key={index}>{parseInlineMarkdown(trimmed)}</div>);
                } else {
                    elements.push(<p key={index} className="text-slate-700 leading-relaxed my-3">{parseInlineMarkdown(trimmed)}</p>);
                }
            } else {
                elements.push(<div key={index} className="h-2" />);
            }
        }
    });
    
    if (insideList) {
        flushList(lines.length);
    }
    
    return <div className="space-y-1 text-slate-800">{elements}</div>;
};

const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Calvin",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Dora",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Eliza",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Bear",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Cat",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Dog",
    "https://api.dicebear.com/7.x/bottts/svg?seed=1",
    "https://api.dicebear.com/7.x/bottts/svg?seed=2",
    "https://api.dicebear.com/7.x/bottts/svg?seed=3",
];

interface DashboardProps {
  user: User;
  challenges: Challenge[];
  allUsers: User[];
  events: CalendarEvent[];
  bonusTasks: BonusTask[];
  submissions: BonusSubmission[];
  courses: Course[];
  quizzes: Quiz[];
  mentors?: Mentor[];
  bookings?: Booking[];
  ebooks?: Ebook[];
  streams?: Stream[];
  artifacts?: Artifact[];
  tickets?: SupportTicket[];
  nextLevelRequirement?: LevelRequirement;
  communitySessions?: CommunitySession[];
  notify: (type: ToastMessage['type'], title: string, message: string) => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  onUpdateProfile: (user: User) => void;
  onRegisterEvent: (eventId: string, userId: string) => void;
  onSubmitTask: (taskId: string, userId: string, content: string) => void;
  onCourseProgress: (courseId: string, lessonId: string) => void;
  onQuizComplete: (quizId: string, score: number, passed: boolean) => void;
  onBookMentor?: (mentorId: string, date: string, note: string) => void;
  onCreateTicket?: (subject: string) => void;
  onReplyTicket?: (ticketId: string, message: string) => void;
  onUseArtifact?: (artifactId: string) => void;
  onChallengeAction?: (challengeId: string) => void;
  onCreateSession?: (topic: string, date: string, desc: string, max: number) => void;
  onJoinSession?: (sessionId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    user, challenges, allUsers, events, bonusTasks, submissions, courses, quizzes,
    mentors = [], bookings = [], ebooks = [], streams = [], artifacts = [], tickets = [], nextLevelRequirement, communitySessions = [], notify,
    onLogout, onNavigate, onUpdateProfile, onRegisterEvent, onSubmitTask, onCourseProgress, onQuizComplete,
    onBookMentor, onCreateTicket, onReplyTicket, onUseArtifact, onChallengeAction, onCreateSession, onJoinSession
}) => {
  // If user is expired, default tab should be settings or tickets
  const isExpired = user.role === 'expired';
  const allowedTabs = ['settings', 'certificates', 'support'];
  const [activeTab, setActiveTab] = useState(isExpired ? 'settings' : 'dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);

  const [logoClicks, setLogoClicks] = useState(0);
  const [showSecretGame, setShowSecretGame] = useState(false);

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 10) {
        setShowSecretGame(true);
        notify('success', '🏆 Úspěch!', 'Našel jsi tajnou hru Q-Hubu! Lov padající zakázky!');
        return 0;
      }
      return next;
    });
  };

  // --- OZ Sales Commission State & Handlers ---
  const [ozData, setOzData] = useState<{
    userConfigs: Record<string, any>;
    orders: any[];
    adjustments: any[];
    payouts: any[];
    defaultBillingMonth?: string;
  }>({ userConfigs: {}, orders: [], adjustments: [], payouts: [] });
  const [ozLoading, setOzLoading] = useState(false);
  const [selectedOzMonth, setSelectedOzMonth] = useState('2026-06');
  const [isDefaultMonthSet, setIsDefaultMonthSet] = useState(false);
  const [claimSubject, setClaimSubject] = useState('');
  const [claimText, setClaimText] = useState('');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimTargetOrder, setClaimTargetOrder] = useState<any>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  const [chartMode, setChartMode] = useState<'individual' | 'comparison'>('individual');
  const [chartSelectedEmail, setChartSelectedEmail] = useState<string>('');

  useEffect(() => {
    if (user && user.email) {
      setChartSelectedEmail(user.email.toLowerCase().trim());
    }
  }, [user]);

  const fetchOzData = async () => {
    try {
      setOzLoading(true);
      const res = await fetch('/api/caflou/oz/data');
      if (res.ok) {
        const data = await res.json();
        setOzData(data);
        if (!isDefaultMonthSet && data.defaultBillingMonth) {
          setSelectedOzMonth(data.defaultBillingMonth);
          setIsDefaultMonthSet(true);
        }
      }
    } catch (e) {
      console.error('[Dashboard] Failed to fetch OZ sales data:', e);
    } finally {
      setOzLoading(false);
    }
  };

  useEffect(() => {
    fetchOzData();
  }, [activeTab]);

  const handleClaimSubmit = async () => {
    if (!claimSubject || !claimText) {
      notify('error', 'Chyba', 'Uveďte prosím předmět i zprávu reklamace.');
      return;
    }
    try {
      setClaimSubmitting(true);
      const promptText = claimTargetOrder 
        ? `K zakázce Číslo: ${claimTargetOrder.contractNumber} (${claimTargetOrder.customerName}, obrat ${claimTargetOrder.amount} Kč, sleva ${claimTargetOrder.discount}%)\n\nPodrobná zpráva:\n${claimText}`
        : `Zpráva:\n${claimText}`;
        
      const res = await fetch('/api/caflou/oz/reklamace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          subject: claimSubject,
          text: promptText
        })
      });
      if (res.ok) {
        notify('success', 'Reklamace Založena!', `Automatický reklamační lístek s vysokou prioritou byl registrován v našem Helpdesku.`);
        setIsClaimModalOpen(false);
        setClaimSubject('');
        setClaimText('');
        setClaimTargetOrder(null);
        // Refresh
        fetchOzData();
      } else {
        notify('error', 'Chyba reklamace', 'Nepodařilo se odeslat reklamační lístek.');
      }
    } catch (err: any) {
      notify('error', 'Chyba reklamace', err?.message || 'Nepodařilo se odeslat.');
    } finally {
      setClaimSubmitting(false);
    }
  };
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [leaderboardRegion, setLeaderboardRegion] = useState('all');
  const [activeYoutubeId, setActiveYoutubeId] = useState<string | null>(null);
  const [hoveredXpIndex, setHoveredXpIndex] = useState<number | null>(null);
  
  // Quiz Player State (Standalone)
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{score: number, passed: boolean} | null>(null);

  // Course Player State
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [isPlayerLessonsOpen, setPlayerLessonsOpen] = useState(false);

  // Video watch constraints states
  const [watchTimeLeft, setWatchTimeLeft] = useState<number>(0);
  const [watchComplete, setWatchComplete] = useState<boolean>(true);

  // Countdown timer for video lessons with watch constraints
  useEffect(() => {
      if (!activeCourseId || !activeLessonId) {
          setWatchTimeLeft(0);
          setWatchComplete(true);
          return;
      }
      const course = courses.find(c => c.id === activeCourseId);
      if (!course) return;
      const flatLessons = course.modules.flatMap(m => m.lessons);
      const lesson = flatLessons.find(l => l.id === activeLessonId);

      if (lesson && lesson.type === 'video' && lesson.hasWatchConstraint && lesson.videoWatchTime) {
          setWatchTimeLeft(lesson.videoWatchTime);
          setWatchComplete(false);

          const interval = setInterval(() => {
              setWatchTimeLeft(prev => {
                  if (prev <= 1) {
                      clearInterval(interval);
                      setWatchComplete(true);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);

          return () => clearInterval(interval);
      } else {
          setWatchTimeLeft(0);
          setWatchComplete(true);
      }
  }, [activeLessonId, activeCourseId, courses]);

  // Update current note when lesson changes
  useEffect(() => {
      if (activeLessonId && user.lessonNotes) {
          setCurrentNote(user.lessonNotes[activeLessonId] || '');
      } else {
          setCurrentNote('');
      }
  }, [activeLessonId, user.lessonNotes]);

  const handleSaveNote = () => {
      if (!activeLessonId) return;
      const updatedNotes = { ...user.lessonNotes, [activeLessonId]: currentNote };
      onUpdateProfile({ ...user, lessonNotes: updatedNotes });
      notify('success', 'Uloženo', 'Poznámka byla uložena.');
  };

  // In-Lesson Quiz State
  const [lessonQuizState, setLessonQuizState] = useState({
    step: 'start', // 'start' | 'playing' | 'result'
    currentQuestionIndex: 0,
    answers: {} as Record<string, number>,
    score: 0,
    passed: false
  });

  // Booking State
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  // Support State
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
      name: user.name || '',
      phone: user.phone || '',
      bio: user.bio || '',
      isPublicProfile: user.isPublicProfile,
      positions: (user.positions || []) as QhubPosition[]
  });
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  
  // Submission State
  const [activeTaskSubmission, setActiveTaskSubmission] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');

  // Business Tracker State
  const [newProfitAmount, setNewProfitAmount] = useState('');
  const [newProfitDate, setNewProfitDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartTimeframe, setChartTimeframe] = useState<'30d' | '1y' | 'all'>('1y');

  // Community Chat State (Local Simulation)
  const [chatMessage, setChatMessage] = useState('');
  const [localFeed, setLocalFeed] = useState([
      { id: 'p1', user: 'Admin', text: 'Vítejte v Q-Hub! 🚀', time: 'Před 2 dny', pinned: true },
      { id: 'p2', user: 'David Černý', text: 'Právě jsem dokončil modul o Sales. Neskutečná hodnota!', time: 'Před 2 hodinami', pinned: false }
  ]);

  // Tools Tab Interactive States
  const [toolsSubTab, setToolsSubTab] = useState<'roi' | 'coldcall'>('roi');
  const [roiBudget, setRoiBudget] = useState(10000);
  const [roiLeads, setRoiLeads] = useState(100);
  const [roiConvers, setRoiConvers] = useState(10);
  const [roiDealVal, setRoiDealVal] = useState(5000);

  const [ccProduct, setCcProduct] = useState('B2B Služba');
  const [ccTarget, setCcTarget] = useState('Majitelé firem');
  const [ccBenefit, setCcBenefit] = useState('Ušetříme 20 hodin týdně díky AI automatizacím');
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);

  const handlePostMessage = () => {
      if(!chatMessage.trim()) return;
      setLocalFeed(prev => [{
          id: `p-${Date.now()}`,
          user: user.name || user.email,
          text: chatMessage,
          time: 'Právě teď',
          pinned: false
      }, ...prev]);
      setChatMessage('');
      notify('success', 'Odesláno', 'Váš příspěvek byl sdílen.');
  };

  const handleAddProfit = () => {
      if (!newProfitAmount || !newProfitDate) return;
      const amount = parseInt(newProfitAmount);
      if (isNaN(amount)) return;

      const newEntry: ProfitEntry = {
          id: `p-${Date.now()}`,
          date: newProfitDate,
          amount: amount
      };

      const newHistory = [...(user.profitHistory || []), newEntry].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const totalProfit = newHistory.reduce((sum, item) => sum + item.amount, 0);

      onUpdateProfile({ ...user, profitHistory: newHistory, financialProfit: totalProfit });
      setNewProfitAmount('');
      notify('success', 'Uloženo', 'Zisk byl úspěšně přidán do statistik.');
  };

  const handleBuyItem = (item: Partial<Artifact>) => {
      if (!item.price || user.xp < item.price) {
          notify('error', 'Nedostatek XP', 'Nemáte dostatek kreditů pro nákup.');
          return;
      }

      // Check if item exists in inventory
      const existingItemIndex = user.inventory.findIndex(i => i.name === item.name);
      const newInventory = [...user.inventory];

      if (existingItemIndex > -1) {
          newInventory[existingItemIndex].quantity += 1;
      } else {
          newInventory.push({ ...item, id: `inv-${Date.now()}`, quantity: 1 } as Artifact);
      }

      onUpdateProfile({ ...user, xp: user.xp - item.price, inventory: newInventory });
      notify('success', 'Zakoupeno!', `${item.name} byl přidán do inventáře.`);
  };

  // --- ACCESS CONTROL LOGIC ---
  const isLocked = (level: string) => {
      // Role hierarchy: student < premium < vip < admin
      if (user.role === 'admin') return false;
      
      const levels = ['student', 'premium', 'vip'];
      const userLevelIdx = levels.indexOf(user.role);
      const courseLevelIdx = levels.indexOf(level);
      
      // If role not found (e.g. expired), lock everything except student maybe? 
      // But expired is handled globally.
      if (userLevelIdx === -1) return true; 

      return userLevelIdx < courseLevelIdx;
  };

  // ... (Chart logic remains same) ...
  // --- CHART LOGIC ---
  const getChartData = () => {
      const history = user.profitHistory || [];
      if (history.length === 0) return [];

      const now = new Date();
      let filtered = history;

      if (chartTimeframe === '30d') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          filtered = history.filter(e => new Date(e.date) >= thirtyDaysAgo);
          // Group by Day
          const grouped: Record<string, number> = {};
          filtered.forEach(e => {
              const d = new Date(e.date).toLocaleDateString('cs-CZ', {day:'numeric', month:'numeric'});
              grouped[d] = (grouped[d] || 0) + e.amount;
          });
          return Object.entries(grouped).map(([label, val]) => ({label, val}));
      } 
      else if (chartTimeframe === '1y') {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          filtered = history.filter(e => new Date(e.date) >= oneYearAgo);
          // Group by Month
          const grouped: Record<string, number> = {};
          filtered.forEach(e => {
              const d = new Date(e.date).toLocaleDateString('cs-CZ', {month:'long'});
              grouped[d] = (grouped[d] || 0) + e.amount;
          });
          return Object.entries(grouped).map(([label, val]) => ({label, val}));
      }
      else {
          // All Time - Group by Year
          const grouped: Record<string, number> = {};
          history.forEach(e => {
              const d = new Date(e.date).getFullYear().toString();
              grouped[d] = (grouped[d] || 0) + e.amount;
          });
          return Object.entries(grouped).map(([label, val]) => ({label, val}));
      }
  };

  const chartData = getChartData();
  const maxChartVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.val)) * 1.1 : 1000;

  // Function to create SVG path
  const createGraphPath = (width: number, height: number) => {
      if (chartData.length < 2) return "";
      const stepX = width / (chartData.length - 1);
      
      const points = chartData.map((d, i) => {
          const x = i * stepX;
          const y = height - (d.val / maxChartVal) * height;
          return `${x},${y}`;
      });

      return `M ${points.join(' L ')}`;
  };

  const createFillPath = (width: number, height: number) => {
      if (chartData.length < 2) return "";
      const line = createGraphPath(width, height);
      return `${line} L ${width},${height} L 0,${height} Z`;
  };

  const getXpChartData = () => {
      const points: { label: string; xp: number; desc: string }[] = [];
      const baseDate = user.joinDate ? new Date(user.joinDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      points.push({
          label: baseDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
          xp: 50,
          desc: 'Založení účtu'
      });

      let currentSum = 50;

      const progress = user.courseProgress || [];
      progress.forEach((p, i) => {
          if (p.isCompleted) {
              const date = new Date(baseDate.getTime() + (i + 1) * 3 * 24 * 60 * 60 * 1000);
              currentSum += 150;
              points.push({
                  label: date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
                  xp: Math.min(user.xp, currentSum),
                  desc: 'Úspěšné dokončení kurzu'
              });
          }
      });

      const quizHist = user.quizHistory || [];
      quizHist.forEach((q, i) => {
          if (q.passed) {
              const date = new Date(baseDate.getTime() + (i + 1) * 4 * 24 * 60 * 60 * 1000);
              currentSum += 100;
              points.push({
                  label: date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
                  xp: Math.min(user.xp, currentSum),
                  desc: 'Složení odborného testu'
              });
          }
      });

      points.sort((a, b) => a.xp - b.xp);

      // Ensure today's active score is final
      points.push({
          label: new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
          xp: user.xp,
          desc: 'Dnešní skóre v Q-Hubu'
      });

      return points;
  };

  const xpChartData = getXpChartData();
  const maxXpVal = xpChartData.length > 0 ? Math.max(...xpChartData.map(d => d.xp)) * 1.15 : 1000;

  const createXpGraphPath = (width: number, height: number) => {
      if (xpChartData.length < 2) return "";
      const stepX = width / (xpChartData.length - 1);
      const points = xpChartData.map((d, i) => {
          const x = i * stepX;
          const y = height - (d.xp / maxXpVal) * height;
          return `${x},${y}`;
      });
      return `M ${points.join(' L ')}`;
  };

  const createXpFillPath = (width: number, height: number) => {
      if (xpChartData.length < 2) return "";
      const line = createXpGraphPath(width, height);
      return `${line} L ${width},${height} L 0,${height} Z`;
  };

  // ... (Sidebar links and logic remain same) ...
  const sidebarLinks = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", id: 'dashboard' },
    { icon: <Coins size={20} className="text-emerald-500" />, label: "Moje Provize (OZ)", id: 'oz-rewards' },
    { icon: <Trophy size={20} />, label: "Žebříček", id: 'leaderboard' },
    { icon: <BookOpen size={20} />, label: "Kurzy", id: 'courses' },
    { icon: <Zap size={20} />, label: "Výzvy", id: 'challenges' },
    { icon: <Brain size={20} />, label: "Kvízy", id: 'quizzes' },
    { icon: <Calendar size={20} />, label: "Akce & Webináře", id: 'events' },
    { icon: <Users size={20} />, label: "Mentoring", id: 'mentoring' },
    { icon: <HelpCircle size={20} />, label: "Podpora", id: 'support' },
    { icon: <FileText size={20} />, label: "Vzdělávání o obchodě", id: 'ebooks' },
    { icon: <Gift size={20} />, label: "Bonusové úkoly", id: 'bonus' },
    { icon: <Award size={20} />, label: "Certifikáty", id: 'certificates' },
  ];

  // VIP Zóna je dočasně skrytá z menu podle požadavku uživatele
  // if (user.role === 'vip' || user.role === 'admin') {
  //     sidebarLinks.push({ icon: <Crown size={20} />, label: "VIP Zóna", id: 'vip-zone' });
  // }

  const unreadMessages = user.messages.filter(m => !m.read).length;
  const isBoostActive = user.xpBoostUntil && new Date(user.xpBoostUntil) > new Date();

  // --- Dynamic Notifications Logic ---
  const notifications = useMemo(() => {
      const list: { id: string, title: string, text: string, icon: any, color: string, action?: () => void }[] = [];

      // 1. Level Up Progress
      if (nextLevelRequirement) {
          const xpNeeded = nextLevelRequirement.xpRequired - user.xp;
          if (xpNeeded > 0) {
              list.push({
                  id: 'level-up',
                  title: 'Level Up na dosah!',
                  text: `Chybí ti jen ${xpNeeded} XP na level ${nextLevelRequirement.level} (${nextLevelRequirement.title}). Dokonči lekci a máš to!`,
                  icon: <Star size={18} />,
                  color: 'text-yellow-500',
                  action: () => setActiveTab('courses')
              });
          }
      }

      // 2. Incomplete Challenges
      const incompleteChallenges = user.activeChallenges.filter(c => !c.completed).length;
      if (incompleteChallenges > 0) {
          list.push({
              id: 'challenges',
              title: 'Denní Výzvy',
              text: `Máš ${incompleteChallenges} nesplněných výzev. Nenech si utéct extra XP!`,
              icon: <Zap size={18} />,
              color: 'text-indigo-600',
              action: () => setActiveTab('challenges')
          });
      }

      // 3. Artifacts Reminder
      const consumableItems = user.inventory.filter(i => i.type === 'consumable');
      if (consumableItems.length > 0) {
          list.push({
              id: 'artifacts',
              title: 'Plný Inventář',
              text: `Máš ${consumableItems.length} nepoužitých předmětů. Aktivuj si XP Boost!`,
              icon: <Package size={18} />,
              color: 'text-violet-600',
              action: () => setActiveTab('artifacts')
          });
      }
      
      // 4. Community Sessions
      const upcomingSessions = communitySessions?.filter(s => new Date(s.date) > new Date()).length || 0;
      if (upcomingSessions > 0) {
           list.push({
              id: 'community',
              title: 'Mastermind Calls',
              text: `Naplánováno ${upcomingSessions} nových hovorů. Přidej se a networkuj!`,
              icon: <UsersIcon size={18} />,
              color: 'text-green-500',
              action: () => setActiveTab('community')
          });
      }

      return list;
  }, [user, nextLevelRequirement, challenges, courses, communitySessions]);

  // --- Handlers (unchanged) ---
  const handleSaveSettings = () => { onUpdateProfile({ ...user, ...settingsForm }); notify('success', 'Uloženo', 'Profil byl aktualizován.'); };
  const handleAvatarSelect = (url: string) => { onUpdateProfile({ ...user, avatarUrl: url }); setIsAvatarPickerOpen(false); notify('success', 'Avatar Změněn', 'Váš profilový obrázek byl aktualizován.'); };
  const submitTask = () => { if (!activeTaskSubmission || !submissionContent) return; onSubmitTask(activeTaskSubmission, user.id, submissionContent); setActiveTaskSubmission(null); setSubmissionContent(''); };
  const handleBooking = () => { if(selectedMentor && bookingDate && onBookMentor) { onBookMentor(selectedMentor, bookingDate, bookingNote); setSelectedMentor(null); setBookingDate(''); setBookingNote(''); } };
  const handleCreateTicket = () => { if(newTicketSubject && onCreateTicket) { onCreateTicket(newTicketSubject); setNewTicketSubject(''); setIsNewTicketOpen(false); } };

  // Standalone Quiz Logic (unchanged)
  const startQuiz = (qid: string) => { setActiveQuizId(qid); setCurrentQuestionIndex(0); setSelectedAnswers({}); setQuizResult(null); };
  const handleAnswerSelect = (qId: string, optionIdx: number) => { setSelectedAnswers(prev => ({...prev, [qId]: optionIdx})); };
  const submitQuiz = () => {
      if (!activeQuizId) return;
      const quiz = quizzes.find(q => q.id === activeQuizId);
      if (!quiz) return;
      let correctCount = 0;
      quiz.questions.forEach(q => { if (selectedAnswers[q.id] === q.correctOptionIndex) correctCount++; });
      const score = Math.round((correctCount / quiz.questions.length) * 100);
      const passed = score >= quiz.passingScore;
      setQuizResult({ score, passed });
      onQuizComplete(activeQuizId, score, passed);
  };
  const closeQuiz = () => { setActiveQuizId(null); setQuizResult(null); };

  // In-Lesson Quiz Logic (unchanged)
  const handleLessonQuizAnswer = (qId: string, idx: number) => { setLessonQuizState(prev => ({ ...prev, answers: { ...prev.answers, [qId]: idx } })); };
  const submitLessonQuiz = (questions: any[]) => {
      let correct = 0;
      questions.forEach(q => {
          const qType = q.type || 'choice';
          if (qType === 'text-fill') {
              const userAns = (lessonQuizState.answers[q.id] || '').toString().trim().toLowerCase();
              const correctAns = (q.correctTextAnswer || '').trim().toLowerCase();
              if (userAns === correctAns) correct++;
          } else {
              if (lessonQuizState.answers[q.id] === q.correctOptionIndex) correct++;
          }
      });
      const score = Math.round((correct / questions.length) * 100);
      setLessonQuizState(prev => ({ ...prev, step: 'result', score, passed: score >= 70 }));
  };

  // Certificate Selection for Print
  const [printingCertId, setPrintingCertId] = useState<string | null>(null);

  // Certificate Download Handler
  const handleDownloadCertificate = (certId: string) => {
      setPrintingCertId(certId);
      notify('info', 'Připravuji dokument...', 'Otevře se tiskové okno. Pro optimální tisk zvolte formát "Na výšku" (A4) a v pokročilém nastavení zapněte možnost "Grafika na pozadí" (Background graphics).');
      setTimeout(() => {
          window.print();
          // Reset after a modest amount of time so layout goes back to normal
          setTimeout(() => {
              setPrintingCertId(null);
          }, 1500);
      }, 600);
  };

  // Sort users for leaderboard
  const leaderboardUsers = useMemo(() => {
      const resolvedUsers = allUsers.map(u => u.id === user.id ? { ...u, ...user } : u);
      if (!resolvedUsers.some(u => u.id === user.id)) {
          resolvedUsers.push(user);
      }
      return resolvedUsers
          .filter(u => u.isPublicProfile || u.id === user.id)
          .filter(u => leaderboardRegion === 'all' || u.region === leaderboardRegion)
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 20);
  }, [allUsers, user, leaderboardRegion]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">
      
      {showSecretGame && (
         <SecretGame onClose={() => setShowSecretGame(false)} userEmail={user.email} />
      )}
      
      {/* PERFECTLY FORMATTED VERTICAL A4 CERTIFICATE FOR PRINTING */}
      {printingCertId && (() => {
          const cert = user.certificates.find(c => c.id === printingCertId);
          if (!cert) return null;
          
          return (
              <div id="certificate-print-area" className="hidden print:flex flex-col justify-between bg-white text-slate-900 border-[16px] border-double border-amber-500/80 p-12 relative overflow-hidden" style={{ minHeight: '297mm', width: '210mm' }}>
                  {/* Fine border decoration */}
                  <div className="absolute inset-4 border-2 border-amber-600/40 pointer-events-none"></div>
                  
                  {/* Subtle watermarks / background circles */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border-4 border-dashed border-amber-500/5 opacity-[0.06] pointer-events-none"></div>
                  
                  {/* TOP HEADER BLOCK */}
                  <div className="flex flex-col items-center text-center mt-6">
                      <img src="https://web2.itnahodinu.cz/QAPI/QHUB.jpeg" alt="QHub Logo" className="h-12 w-auto object-contain mb-4" />
                      <div className="tracking-[0.25em] text-xs font-bold text-amber-600 uppercase mb-2">PROFESNÍ VZDĚLÁVACÍ SYSTÉM Q-HUB</div>
                      <div className="w-16 border-t-2 border-amber-500/50 mb-4"></div>
                  </div>
                  
                  {/* CERTIFICATE MAIN TITLE */}
                  <div className="text-center my-4">
                      <h1 className="text-4xl font-extrabold tracking-widest text-slate-900 font-serif uppercase mb-1">CERTIFIKÁT</h1>
                      <div className="text-xs tracking-wider text-slate-500 italic">o absolvování kurzu a úspěšném ověření znalostí</div>
                  </div>

                  {/* RECIPIENT BLOCK */}
                  <div className="text-center my-4">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Tento dokument potvrzuje, že</p>
                      <h2 className="text-3xl font-extrabold text-amber-700 font-serif border-b border-amber-200 pb-2 px-12 inline-block">
                          {cert.studentName || 'Vážený Student'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-2">úspěšně splnil(a) všechny stanovené akademické a praktické standardy</p>
                  </div>

                  {/* COURSE NAME BLOCK */}
                  <div className="text-center my-6">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">v rámci vzdělávacího programu</p>
                      <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border-y border-amber-500/20 py-4 px-6 my-2">
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                              {cert.courseName}
                          </h3>
                      </div>
                  </div>

                  {/* METRICS / STATS */}
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-4 text-center border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                      <div>
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Datum udělení</div>
                          <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('cs-CZ') : new Date().toLocaleDateString('cs-CZ')}</div>
                      </div>
                      <div>
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Stav certifikátu</div>
                          <div className="text-xs font-bold text-emerald-600 mt-0.5 uppercase tracking-wider font-sans">Aktivní / Ověřený</div>
                      </div>
                  </div>

                  {/* BOTTOM BLOCK: SIGNATURE, SEAL & QR VALIDATOR */}
                  <div className="grid grid-cols-3 items-center gap-6 mt-6 pt-6 border-t border-slate-100 relative">
                      {/* Left: QR code for verification */}
                      <div className="flex flex-col items-start gap-1">
                          {cert.qrCodeUrl ? (
                              <img src={cert.qrCodeUrl} className="w-20 h-20 mix-blend-multiply border border-slate-200 p-0.5 rounded shadow-xs" alt="Ověřovací kód" />
                          ) : (
                              <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">QR CODE</div>
                          )}
                          <div className="text-[8px] text-slate-400 font-mono tracking-wider mt-1 uppercase">Ověření: {cert.code || 'Q-HUB-' + cert.id.substring(0,6)}</div>
                      </div>

                      {/* Middle: Golden Seal Image or Badge */}
                      <div className="flex justify-center">
                          <div className="relative flex items-center justify-center w-20 h-20">
                              {/* Golden SVG Seal Badge */}
                              <svg className="w-20 h-20 text-amber-500 fill-current drop-shadow-md" viewBox="0 0 100 100">
                                  <path d="M50 5 L55 20 L70 15 L65 30 L80 35 L70 45 L80 55 L65 60 L70 75 L55 70 L50 85 L45 70 L30 75 L35 60 L20 55 L30 45 L20 35 L35 30 L30 15 L45 20 Z" />
                                  <circle cx="50" cy="45" r="22" className="text-amber-600" />
                                  <circle cx="50" cy="45" r="20" className="text-amber-500" />
                                  <text x="50" y="42" textAnchor="middle" className="text-amber-950 font-sans font-bold text-[8px] uppercase tracking-widest">Q-HUB</text>
                                  <text x="50" y="51" textAnchor="middle" className="text-amber-950 font-sans font-black text-[9px] uppercase tracking-tight">SEAL</text>
                              </svg>
                          </div>
                      </div>

                      {/* Right: Signature stamp */}
                      <div className="text-center flex flex-col items-center justify-end h-full">
                          {/* Fake elegant cursive signature signature image or handwriting-like look */}
                          <div className="h-10 flex items-center justify-center">
                              <span className="font-serif italic text-xl text-indigo-900 font-bold tracking-wider select-none pr-2 opacity-80" style={{ fontFamily: 'Georgia, serif' }}>Novotný Jan</span>
                          </div>
                          <div className="w-28 border-t border-slate-300 mt-1"></div>
                          <div className="text-[9px] text-slate-500 font-bold mt-1 uppercase">Vzdělávací Komise Q-Hub</div>
                          <div className="text-[8px] text-slate-400">Garant a CEO platformy</div>
                      </div>
                  </div>
              </div>
          );
      })()}
      
      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex">
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
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-80 max-w-[calc(100vw-3rem)] h-full bg-white flex flex-col shadow-2xl z-10"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div onClick={handleLogoClick} className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all" title="Klikni 10x pro tajnou hru">
                    <img src="https://web2.itnahodinu.cz/QAPI/QHUB.jpeg" alt="QHUB Logo" className="h-14 w-auto object-contain flex-shrink-0" />
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
                {sidebarLinks.map((link, i) => {
                  const isBlocked = isExpired && !allowedTabs.includes(link.id);
                  return (
                      <button 
                        key={i} 
                        onClick={() => { if (!isBlocked) { setActiveTab(link.id); setSidebarOpen(false); } }}
                        disabled={isBlocked}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                          activeTab === link.id ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        } ${isBlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span className={`${activeTab === link.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`}>{link.icon}</span>
                        {link.label}
                        {isBlocked && <Lock size={14} className="absolute right-4 text-slate-500"/>}
                      </button>
                  );
                })}
                
                <div className="pt-6 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Extra</p></div>
                <button disabled={isExpired} onClick={() => { setActiveTab('artifacts'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${isExpired ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'artifacts' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}>
                   <Package size={20} className="text-yellow-500" /> Inventář {isExpired && <Lock size={14}/>}
                </button>
                
                {user.role === 'admin' && (
                   <button onClick={() => { onNavigate('admin'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-slate-900 hover:bg-rose-50 border border-red-900/30 transition mt-4 group">
                      <Lock size={20} className="group-hover:text-red-500" /> Administrace
                   </button>
                )}
              </div>
              <div className="p-4 border-t border-slate-200">
                 <div onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 transition cursor-pointer group relative border border-slate-200/50">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-300"/>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold text-white">{user.email.charAt(0).toUpperCase()}</div>
                    )}
                    <div className="flex-1 overflow-hidden">
                       <p className="text-sm font-bold truncate text-slate-900 leading-tight">{user.name || user.email}</p>
                       <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 mt-0.5">
                           <span>📍 {user.region || 'Karlovy Vary'}</span>
                       </p>
                       <p className="text-xs text-indigo-600 flex items-center gap-1 uppercase font-bold mt-0.5">{user.role === 'admin' ? <><Shield size={10} /> ADMIN</> : <><Gem size={10}/> {user.role === 'expired' ? 'EXPIRED' : user.role}</>}</p>
                    </div>
                    <Settings size={16} className="text-slate-500 group-hover:text-slate-900 transition" />
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <div className="w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col hidden lg:flex">
        <div className="p-8">
           <div onClick={handleLogoClick} className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 active:scale-95 transition-all" title="Klikni 10x pro tajnou hru">
              <img src="https://web2.itnahodinu.cz/QAPI/QHUB.jpeg" alt="QHUB Logo" className="h-14 w-auto object-contain flex-shrink-0" />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
          {sidebarLinks.map((link, i) => {
            // Block tabs if expired, allow only specific ones
            const isBlocked = isExpired && !allowedTabs.includes(link.id);
            return (
                <button 
                  key={i} 
                  onClick={() => !isBlocked && setActiveTab(link.id)}
                  disabled={isBlocked}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                    activeTab === link.id ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  } ${isBlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className={`${activeTab === link.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`}>{link.icon}</span>
                  {link.label}
                  {isBlocked && <Lock size={14} className="absolute right-4 text-slate-500"/>}
                </button>
            );
          })}
          
          <div className="pt-6 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Extra</p></div>
          <button disabled={isExpired} onClick={() => setActiveTab('artifacts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${isExpired ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'artifacts' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}>
             <Package size={20} className="text-yellow-500" /> Inventář {isExpired && <Lock size={14}/>}
          </button>
          
          {user.role === 'admin' && (
             <button onClick={() => onNavigate('admin')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-slate-900 hover:bg-rose-50 border border-red-900/30 transition mt-4 group">
                <Lock size={20} className="group-hover:text-red-500" /> Administrace
             </button>
          )}
        </div>
        <div className="p-4 border-t border-slate-200">
           <div onClick={() => setActiveTab('settings')} className="bg-white/80 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 transition cursor-pointer group relative">
              {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-300"/>
              ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold">{user.email.charAt(0).toUpperCase()}</div>
              )}
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-bold truncate text-slate-900 leading-tight">{user.name || user.email}</p>
                 <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 mt-0.5">
                     <span>📍 {user.region || 'Karlovy Vary'}</span>
                 </p>
                 <p className="text-xs text-indigo-600 flex items-center gap-1 uppercase font-bold mt-0.5">{user.role === 'admin' ? <><Shield size={10} /> ADMIN</> : <><Gem size={10}/> {user.role === 'expired' ? 'EXPIRED' : user.role}</>}</p>
                 <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 leading-none">
                        <span className="flex items-center gap-0.5 font-bold font-mono text-slate-700 hidden">
                            <Zap size={10} className="text-yellow-500" fill="currentColor" /> {user.xp?.toLocaleString() || 0} XP
                        </span>
                        <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded leading-none">
                            {user.level === 2 ? 'Senior' : user.level >= 3 ? 'Expert' : 'Junior'}
                        </span>
                    </div>
                    {nextLevelRequirement && (
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{width: `${Math.min(100, (user.xp / nextLevelRequirement.xpRequired) * 105)}%`}}></div>
                        </div>
                    )}
                 </div>
              </div>
              <Settings size={16} className="text-slate-500 group-hover:text-slate-900 transition" />
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
         {/* ... (Header remains unchanged) ... */}
         <header className="h-20 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 relative z-[80]">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition mr-1">
                    <Menu size={24} />
                </button>
               <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">Vítej zpět, {user.name?.split(' ')[0] || 'Pracovníku'} <span className="text-2xl">👋</span></h2>
                  {nextLevelRequirement && !isExpired && (
                      <div className="flex items-center gap-3 mt-1 hidden md:flex">
                          <div className="text-xs font-mono text-indigo-600 font-bold bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded">{user.level === 2 ? 'Senior' : user.level >= 3 ? 'Expert' : 'Junior'}</div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden relative group hidden">
                              <div className="h-full bg-indigo-500" style={{width: `${Math.min(100, (user.xp / nextLevelRequirement.xpRequired) * 100)}%`}}></div>
                          </div>
                          <div className="text-xs font-mono text-slate-500 hidden">{nextLevelRequirement.title}</div>
                      </div>
                  )}
                  {isExpired && <span className="text-xs text-red-600 font-bold bg-rose-50 px-2 py-1 rounded mt-1 inline-block border border-rose-300">ÚČET DEAKTIVOVÁN</span>}
               </div>
               {isBoostActive && (
                   <div className="flex items-center gap-2 bg-violet-100 border border-violet-300 px-3 py-1 rounded-full animate-pulse">
                       <Zap size={14} className="text-violet-600" fill="currentColor"/>
                       <span className="text-xs font-bold text-purple-300 hidden md:inline">2x XP BOOST AKTIVNÍ</span>
                   </div>
               )}
            </div>
            
            {/* Right Side Menu with Notification Center */}
            <div className="flex items-center gap-4">
               {/* NOTIFICATION CENTER */}
               <div className="relative">
                   <button 
                        onClick={() => { setNotificationsOpen(!notificationsOpen); setMessagesOpen(false); }} 
                        className="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
                   >
                        <Bell size={20} />
                        {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border-2 border-white">{notifications.length}</span>}
                   </button>
                   <AnimatePresence>
                       {notificationsOpen && (
                           <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[100] origin-top-right"
                           >
                               <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                   <h4 className="font-bold text-slate-900 text-sm">Oznámení</h4>
                                   <span className="text-xs text-slate-500">{notifications.length} nových</span>
                               </div>
                               <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                   {notifications.length > 0 ? notifications.map((notif, idx) => (
                                       <div key={idx} onClick={() => { if(notif.action) { notif.action(); setNotificationsOpen(false); }}} className="p-4 border-b border-slate-200 hover:bg-slate-50 transition cursor-pointer flex gap-3">
                                           <div className={`mt-1 ${notif.color}`}>{notif.icon}</div>
                                           <div>
                                               <h5 className={`text-sm font-bold ${notif.color} mb-1`}>{notif.title}</h5>
                                               <p className="text-xs text-slate-500 leading-relaxed">{notif.text}</p>
                                           </div>
                                       </div>
                                   )) : (
                                       <div className="p-8 text-center text-slate-500 text-sm">Žádná nová oznámení.</div>
                                   )}
                               </div>
                           </motion.div>
                       )}
                   </AnimatePresence>
               </div>

               {/* MESSAGES */}
               <button onClick={() => { setMessagesOpen(!messagesOpen); setNotificationsOpen(false); }} className="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition">
                  <Mail size={20} />
                  {unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border-2 border-white">{unreadMessages}</span>}
               </button>
               
               <button onClick={() => {onLogout();}} className="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 transition"><LogOut size={20} /></button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 custom-scrollbar pb-32">
            
            {/* EXPIRED LOCK SCREEN */}
            {isExpired && !allowedTabs.includes(activeTab) ? (
                <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
                    <div className="w-32 h-32 bg-rose-50 rounded-full flex items-center justify-center mb-8 border border-rose-200 relative">
                        <AlertOctagon size={64} className="text-red-500" />
                        <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse"></div>
                    </div>
                    <h2 className="text-4xl font-bold mb-4 text-slate-900">Přístup byl deaktivován</h2>
                    <p className="text-slate-500 max-w-lg mb-8 text-lg leading-relaxed">
                        Váš účet nemá aktivní přístup do Q-Hub. Kontaktujte administrátora pro obnovení.
                        <br/><br/>
                        <span className="text-sm bg-white p-2 rounded border border-slate-300">Vaše data, certifikáty a progress zůstávají bezpečně uloženy.</span>
                    </p>
                    <button onClick={onLogout} className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl font-bold text-white text-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition transform hover:scale-105">
                        Kontaktovat administrátora
                    </button>
                </div>
            ) : (
                <>
                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'dashboard' && (
                   <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      {/* Brand Header */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                         <div className="space-y-2 z-10 w-full md:w-3/4 text-left">
                            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                               Ahoj, {user.name || user.email}! 👋
                            </h2>
                            <p className="text-slate-500 text-sm max-w-xl">
                               Vítej zpět na tvém herním panelu Q-Hub. Zde sleduješ svůj posun v dovednostech a můžeš okamžitě rozvíjet svou profesní dráhu.
                            </p>
                            
                            {/* Level summary badges */}
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                               <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                  <Crown size={14} className="text-brand-gold"/> Profesní úroveň: {user.level === 2 ? '🥈 Senior' : user.level >= 3 ? '🥇 Expert' : '🥉 Junior'}
                               </span>
                               <span className="bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 hidden">
                                  🏆 {user.xp} XP Celkem
                               </span>
                               {user.xpBoostUntil && new Date(user.xpBoostUntil) > new Date() && (
                                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl animate-pulse">
                                     💡 2x XP Boost!
                                  </span>
                               )}
                            </div>
                         </div>
                         
                         {/* Next Level progress circular gauge */}
                         <div className="z-10 bg-slate-50/60 rounded-3xl p-4 border border-slate-100 flex items-center gap-4 max-w-sm w-full md:w-auto hidden">
                            {nextLevelRequirement ? (
                               <>
                                  <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                                     <svg className="absolute w-full h-full transform -rotate-90">
                                        <circle cx="32" cy="32" r="28" stroke="#EDDEC9" strokeWidth="3" fill="transparent" />
                                        <circle cx="32" cy="32" r="28" stroke="#D4AF37" strokeWidth="3.5" strokeDasharray={`${Math.PI * 2 * 28}`} strokeDashoffset={`${Math.PI * 2 * 28 * (1 - Math.min(1, user.xp / nextLevelRequirement.xpRequired))}`} fill="transparent" strokeLinecap="round" className="transition-all duration-1000" />
                                     </svg>
                                     <span className="text-xs font-black text-slate-900">{Math.round((user.xp / nextLevelRequirement.xpRequired) * 100)}%</span>
                                  </div>
                                  <div className="text-left">
                                     <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Další Level</h5>
                                     <p className="text-sm font-black text-slate-900 leading-tight">Level {nextLevelRequirement.level} ({nextLevelRequirement.title})</p>
                                     <p className="text-[10.5px] text-slate-500 mt-0.5">Potřebuješ ještě {nextLevelRequirement.xpRequired - user.xp} XP</p>
                                  </div>
                               </>
                            ) : (
                               <div className="text-left">
                                  <span className="text-xs font-bold text-slate-400">Dosáhl/a jsi maximálního levelu! 👑</span>
                               </div>
                            )}
                         </div>
                      </div>

                      {/* Prominent Quick-Links Grid: KURZY, MENTORING, LEADERBOARD */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         
                         {/* Card 1: KURZY */}
                         <div className="bg-white border border-slate-150 hover:border-indigo-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 text-slate-200/20 group-hover:text-amber-500/10 group-hover:rotate-6 transition duration-300"><BookOpen size={90}/></div>
                            <div className="space-y-4">
                               <div className="w-12 h-12 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-2xl flex items-center justify-center">
                                  <BookOpen size={22} className="text-indigo-650" />
                               </div>
                               <div className="text-left">
                                  <h3 className="text-lg font-bold text-slate-950">Kurzy & Výuka</h3>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                     Rozvíjejte své prodejní i technické schopnosti. Certifikované kurzy s testy a úkoly.
                                  </p>
                                </div>
                                <div className="flex gap-4 text-xs font-bold pt-1 border-t border-slate-100 justify-start">
                                   <div className="text-left">
                                      <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-widest">Aktivní</span>
                                      <span className="text-slate-800 text-sm font-black">{courses.length} kurzy</span>
                                   </div>
                                   <div className="text-left">
                                      <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-widest">Hotovo</span>
                                      <span className="text-indigo-650 text-sm font-black">
                                         {user.courseProgress.filter(p => p.isCompleted).length}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <button onClick={() => setActiveTab('courses')} className="mt-5 w-full py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                                Studovat lekce <ArrowRight size={14}/>
                             </button>
                          </div>

                          {/* Card 2: MENTORING */}
                          <div className="bg-white border border-slate-150 hover:border-indigo-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 text-slate-200/20 group-hover:text-amber-500/10 group-hover:rotate-6 transition duration-300"><UsersIcon size={90}/></div>
                             <div className="space-y-4">
                                <div className="w-12 h-12 bg-indigo-50 text-rose-700 border border-indigo-150 rounded-2xl flex items-center justify-center">
                                   <UsersIcon size={22} className="text-indigo-650" />
                                </div>
                                <div className="text-left">
                                   <h3 className="text-lg font-bold text-slate-950">Mentoring</h3>
                                   <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                      Rezervujte si individuální konzultace s lídry oboru, získejte zpětnou vazbu a plán.
                                   </p>
                                </div>
                                <div className="flex gap-4 text-xs font-bold pt-1 border-t border-slate-100 justify-start">
                                   <div className="text-left">
                                      <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-widest">Lektoři</span>
                                      <span className="text-slate-800 text-sm font-black">{mentors.length} k dispozici</span>
                                   </div>
                                   <div className="text-left">
                                      <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-widest">Rezervace</span>
                                      <span className="text-indigo-650 text-sm font-black">
                                         {bookings.filter(b => b.userId === user.id).length} sezení
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <button onClick={() => setActiveTab('mentoring')} className="mt-5 w-full py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                                Rezervovat mentoring <ArrowRight size={14}/>
                             </button>
                          </div>

                          {/* Card 3: LEADERBOARD / ŽEBŘÍČEK */}
                          <div className="bg-white border border-slate-150 hover:border-indigo-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 text-slate-200/20 group-hover:text-amber-500/10 group-hover:rotate-6 transition duration-300"><Trophy size={90}/></div>
                             <div className="space-y-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-705 border border-amber-100 rounded-2xl flex items-center justify-center">
                                   <Trophy size={22} className="text-brand-gold" />
                                </div>
                                <div className="text-left">
                                   <h3 className="text-lg font-bold text-slate-950">Síň slávy & Žebříček</h3>
                                   <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                      Soutěžte s ostatními kolegy, sledujte finanční zisk a celkové postavení v týmu.
                                   </p>
                                </div>
                                <div className="flex gap-4 text-xs font-bold pt-1 border-t border-slate-100 justify-start">
                                   <div className="text-left">
                                      <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-widest">Celkový zisk</span>
                                      <span className="text-emerald-700 text-sm font-black">{(user.financialProfit ?? 0).toLocaleString()} Kč</span>
                                   </div>
                                   <div className="text-left">
                                      <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-widest">Region</span>
                                      <span className="text-slate-800 text-sm font-black capitalize">{user.region || 'Celá ČR'}</span>
                                   </div>
                                </div>
                             </div>
                             <button onClick={() => setActiveTab('leaderboard')} className="mt-5 w-full py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                                Zobrazit žebříček <ArrowRight size={14}/>
                             </button>
                          </div>

                       </div>

                       {/* --- XP PROGRESS CHART / GRAF --- */}
                       <div className="bg-white border border-slate-150 rounded-3xl p-6 md:p-8 shadow-sm hidden">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                             <div className="text-left">
                                <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                                   <TrendingUp size={20} className="text-brand-gold" />
                                   Křivka profesního růstu (XP Body)
                                 </h3>
                                 <p className="text-xs text-slate-500 mt-0.5">Sledujte v reálném čase, jak se vaše body vyvíjí za odvedenou práci, Caflou úkoly a studijní moduly.</p>
                             </div>
                             <div className="bg-indigo-50 border border-indigo-150 rounded-xl px-4 py-2 text-xs font-bold text-indigo-700 flex items-center gap-1.5 shadow-sm">
                                🌱 Tempo růstu: <span className="font-mono text-slate-900">{user.xp} XP</span>
                             </div>
                          </div>

                          {/* SVG Graph Drawing */}
                          {xpChartData.length < 2 ? (
                             <div className="py-12 text-center text-slate-400">
                                Chybí dostatek bodů pro vykreslení růstové křivky. Získejte svá první XP!
                             </div>
                          ) : (
                             <div className="relative pt-4">
                                {/* Highlight point description box */}
                                <AnimatePresence>
                                   {hoveredXpIndex !== null && xpChartData[hoveredXpIndex] && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: -5 }} 
                                         animate={{ opacity: 1, scale: 1, y: 0 }} 
                                         exit={{ opacity: 0, scale: 0.95 }}
                                         className="absolute top-4 right-4 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 max-w-xs z-10 text-xs text-left"
                                      >
                                         <div className="font-extrabold text-brand-gold mb-1 text-[11px] uppercase tracking-wider">Milník v Q-Hub</div>
                                         <p className="font-semibold text-slate-100">{xpChartData[hoveredXpIndex].desc}</p>
                                         <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                                            <span>Datum: {xpChartData[hoveredXpIndex].label}</span>
                                            <span className="text-brand-gold font-bold">+{xpChartData[hoveredXpIndex].xp} XP</span>
                                         </div>
                                      </motion.div>
                                   )}
                                </AnimatePresence>

                                <div className="w-full h-64 overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100 relative">
                                   <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                                      <defs>
                                         <linearGradient id="xpAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2"/>
                                            <stop offset="100%" stopColor="#E6EFFE" stopOpacity="0.0"/>
                                         </linearGradient>
                                      </defs>

                                      {/* Background grid lines */}
                                      <line x1="0" y1="60" x2="800" y2="60" stroke="#EDDEC9" strokeWidth="1" strokeDasharray="4 4" />
                                      <line x1="0" y1="120" x2="800" y2="120" stroke="#EDDEC9" strokeWidth="1" strokeDasharray="4 4" />
                                      <line x1="0" y1="180" x2="800" y2="180" stroke="#EDDEC9" strokeWidth="1" strokeDasharray="4 4" />

                                      {/* Filled Area */}
                                      <path 
                                         d={createXpFillPath(800, 240)} 
                                         fill="url(#xpAreaGradient)"
                                         className="transition-all duration-300"
                                      />

                                      {/* Spline Border */}
                                      <path 
                                         d={createXpGraphPath(800, 240)} 
                                         fill="none" 
                                         stroke="#D4AF37" 
                                         strokeWidth="3.5" 
                                         strokeLinecap="round"
                                         className="transition-all duration-300"
                                      />

                                      {/* Interactive Hover Nodes */}
                                      {xpChartData.map((d, idx) => {
                                         const stepX = 800 / (xpChartData.length - 1);
                                         const cx = idx * stepX;
                                         const cy = 240 - (d.xp / maxXpVal) * 240;

                                         return (
                                            <g key={idx} className="cursor-pointer group">
                                               {/* Invisible larger hover circle */}
                                               <circle 
                                                  cx={cx} 
                                                  cy={cy} 
                                                  r="18" 
                                                  fill="transparent"
                                                  onMouseEnter={() => setHoveredXpIndex(idx)}
                                                  onMouseLeave={() => setHoveredXpIndex(null)}
                                               />
                                               {/* Glowing dot effect */}
                                               <circle 
                                                  cx={cx} 
                                                  cy={cy} 
                                                  r={hoveredXpIndex === idx ? "8" : "5"} 
                                                  fill={hoveredXpIndex === idx ? "#0C1532" : "#D4AF37"}
                                                  stroke="white"
                                                  strokeWidth="2.5"
                                                  className="transition-all duration-200"
                                               />
                                            </g>
                                         );
                                      })}
                                   </svg>
                                </div>

                                {/* Legend labels */}
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono mt-3 px-1">
                                   <span>Zahájení studia ({xpChartData[0]?.label})</span>
                                   <span className="text-slate-400">Průběh</span>
                                   <span>Dnes ({xpChartData[xpChartData.length - 1]?.label})</span>
                                </div>
                             </div>
                          )}
                       </div>

                      {/* Personal Admin Message */}
                      {user.dashboardMessage && user.dashboardMessage.active && user.dashboardMessage.text && (
                          <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-200 rounded-3xl p-8 relative overflow-hidden shadow-sm">
                              <div className="absolute top-0 right-0 p-8 opacity-10 text-indigo-300"><MessageSquare size={120} /></div>
                              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                                  <Info size={24}/> Zpráva od vedení
                              </h3>
                              
                              <div className="flex flex-col md:flex-row gap-6">
                                  {user.dashboardMessage.imageUrl && (
                                      <div className="w-full md:w-64 h-40 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 bg-white">
                                          <img src={user.dashboardMessage.imageUrl} className="w-full h-full object-cover" alt="Message attachment" />
                                      </div>
                                  )}
                                  <div className="flex-1">
                                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{user.dashboardMessage.text}</p>
                                      
                                      {user.dashboardMessage.pdfUrl && (
                                          <a href={user.dashboardMessage.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition border border-indigo-200">
                                              <FileText size={16}/> Stáhnout přílohu (PDF)
                                          </a>
                                      )}
                                  </div>
                              </div>
                          </div>
                      )}
                   </MotionDiv>
                )}

                {/* --- COURSES TAB (UPDATED WITH LOCKS) --- */}
                {activeTab === 'courses' && (
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Kurzy Akademie</h2>
                                <p className="text-slate-500 text-sm">Vaše cesta k mistrovství začíná zde.</p>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-lg text-sm text-slate-500 border border-slate-200 self-start sm:self-auto shrink-0">
                                Váš plán: <span className="text-indigo-600 font-bold uppercase">{user.role}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => {
                                const locked = isLocked(course.level);
                                const progress = user.courseProgress.find(p => p.courseId === course.id);
                                const completedCount = progress?.completedLessonIds.length || 0;
                                const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                                const percent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

                                return (
                                    <MotionDiv 
                                        key={course.id}
                                        whileHover={!locked ? { y: -5 } : {}}
                                        onClick={() => { if(!locked) setActiveCourseId(course.id); else notify('warning', 'Uzamčeno', `Tento kurz vyžaduje roli ${course.level.toUpperCase()}. Kontaktuj administrátora.`); }}
                                        className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 ${locked ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-75' : 'border-slate-300 bg-white hover:border-indigo-300 cursor-pointer shadow-xl hover:shadow-blue-900/10'}`}
                                    >
                                        <div className="h-48 relative overflow-hidden">
                                            <img src={course.image} className={`w-full h-full object-cover transition duration-700 ${locked ? 'grayscale' : 'group-hover:scale-105'}`}/>
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border backdrop-blur-md ${
                                                    course.level === 'vip' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    course.level === 'premium' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                                    'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                }`}>
                                                    {course.level}
                                                </span>
                                            </div>
                                            {locked && (
                                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                                                    <Lock size={32} className="text-slate-500 mb-2"/>
                                                    <span className="text-slate-900 font-bold text-sm">Vyžaduje {course.level.toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{course.title}</h3>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                                <span className="flex items-center gap-1"><Clock size={12}/> {course.totalDuration} min</span>
                                                <span className="flex items-center gap-1"><Layers size={12}/> {course.modules.length} modulů</span>
                                                {course.xpReward && <span className="flex items-center gap-1 text-yellow-500"><Zap size={12}/> {course.xpReward} XP</span>}
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            {!locked && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-500">Postup</span>
                                                        <span className={percent === 100 ? 'text-green-500 font-bold' : 'text-indigo-600'}>{Math.round(percent)}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: `${percent}%`}}></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={`mt-4 pt-4 border-t border-slate-200 ${locked ? 'opacity-20 blur-[1px]' : ''}`}>
                                                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Co se naučíte:</h4>
                                                <ul className="space-y-1">
                                                    {(course.learningPoints || ['Kompletní know-how', 'Praktické ukázky']).slice(0, 2).map((pt, i) => (
                                                        <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                                                            <CheckCircle size={12} className="text-indigo-600 mt-0.5 flex-shrink-0"/> 
                                                            <span className="line-clamp-1">{pt}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </MotionDiv>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- TOOLS (NÁSTROJE) TAB --- */}
                {activeTab === 'tools' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-1">Nástroje pro Podnikatele</h2>
                                <p className="text-slate-500">Praktické kalkulačky a generátory pro podporu vašeho obchodu.</p>
                            </div>
                            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 flex-wrap sm:flex-nowrap justify-center sm:justify-start w-full sm:w-auto">
                                <button
                                    onClick={() => setToolsSubTab('roi')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${toolsSubTab === 'roi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    📊 ROI Kalkulačka
                                </button>
                                <button
                                    onClick={() => setToolsSubTab('coldcall')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${toolsSubTab === 'coldcall' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    📞 Skriptovač Cold Callů
                                </button>
                            </div>
                        </div>

                        {toolsSubTab === 'roi' ? (
                            <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                                    <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Nastavení Params</h3>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rozpočet na Kampaň (Kč)</label>
                                        <input
                                            type="number"
                                            value={roiBudget}
                                            onChange={e => setRoiBudget(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:border-indigo-500 outline-none transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Generováno kontaktů / leadů</label>
                                        <input
                                            type="number"
                                            value={roiLeads}
                                            onChange={e => setRoiLeads(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:border-indigo-500 outline-none transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Konverzní poměr obchodu (%)</label>
                                        <input
                                            type="number"
                                            value={roiConvers}
                                            onChange={e => setRoiConvers(Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:border-indigo-500 outline-none transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Průměrná hodnota dealu (Kč)</label>
                                        <input
                                            type="number"
                                            value={roiDealVal}
                                            onChange={e => setRoiDealVal(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:border-indigo-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Odhadovaný počet klientů</span>
                                            <div className="text-3xl font-black text-slate-900">{Math.round(roiLeads * (roiConvers / 100))} sales</div>
                                            <p className="text-xs text-slate-400 mt-1">Počet úspěšně podepsaných smluv z oslovených kontaktů.</p>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Hrubý Objem Tržeb</span>
                                            <div className="text-3xl font-black text-slate-900">{(Math.round(roiLeads * (roiConvers / 100)) * roiDealVal).toLocaleString()} Kč</div>
                                            <p className="text-xs text-slate-400 mt-1">Celková finanční hodnota nově uzavřených zakázek.</p>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Čistý Zisk z kampaně</span>
                                            <div className="text-3xl font-black text-slate-900">
                                                {((Math.round(roiLeads * (roiConvers / 100)) * roiDealVal) - roiBudget).toLocaleString()} Kč
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Tržby po odečtení reklamního rozpočtu.</p>
                                        </div>

                                        <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-xl shadow-indigo-600/10">
                                            <span className="text-xs font-bold text-white/70 uppercase block mb-1">Návratnost marketingové investice (ROI)</span>
                                            <div className="text-4xl font-black">
                                                {roiBudget > 0 
                                                    ? Math.round((((Math.round(roiLeads * (roiConvers / 100)) * roiDealVal) - roiBudget) / roiBudget) * 100) 
                                                    : 0
                                                }%
                                            </div>
                                            <p className="text-xs text-indigo-100/80 mt-1">Kolik korun zisku vrátí každá 1 Kč investovaná do marketingu.</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                        <h4 className="font-bold text-slate-900 mb-2">🎯 Tipy pro maximalizaci ROI:</h4>
                                        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                                            <li>Zvýšením konverzního poměru o pouhé <strong>2 %</strong> získáte dodatečný zisk bez navýšení marketingového rozpočtu.</li>
                                            <li>Soustřeďte se na kvalifikaci kontaktů (SQL) před hovorem – zvýší se hodnota průměrného dealu.</li>
                                            <li>Aktivujte XP boostery v inventáři pro zvýšení motivace týmu na uzavírání obchodů.</li>
                                        </ul>
                                    </div>
                                </div>
                            </MotionDiv>
                        ) : (
                            <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                                    <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Konfigurátor Skriptu</h3>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Co prodáváte? (Produkt / Služba)</label>
                                        <input
                                            type="text"
                                            value={ccProduct}
                                            onChange={e => setCcProduct(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:border-indigo-500 outline-none transition"
                                            placeholder="např. Business Consulting"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Na koho cílíte? (Ideální klient)</label>
                                        <input
                                            type="text"
                                            value={ccTarget}
                                            onChange={e => setCcTarget(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:border-indigo-500 outline-none transition"
                                            placeholder="např. ředitelé IT firem"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hlavní lákavý benefit</label>
                                        <textarea
                                            value={ccBenefit}
                                            onChange={e => setCcBenefit(e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:border-indigo-500 outline-none transition resize-none"
                                            placeholder="např. ušetříme 30 % nákladů na nábor zaměstnanců"
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                                            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">🗣️ Dynamický Obchodní Skript</span>
                                            <button
                                                onClick={() => {
                                                    const textToCopy = `KROK 1: HOOK (Háček)\n„Krásný den, oslovuji přímo ${ccTarget}. Volám vám zrychleně, protože u firem jako je ta vaše řešíme ${ccBenefit}... Máte na mě půl minuty?“\n\nKROK 2: VALUE PROP (Hodnotová propozice)\n„Naše řešení ${ccProduct} se specializuje na to, jak efektivně zajistit ${ccBenefit}. Naši klienti běžně zkracují implementaci o polovinu.“\n\nKROK 3: OBJECTION RESOLUTION (Námitky)\n„Chápu, že toho máte hodně a pravděpodobně máte již zavedený systém. Přesně proto volám — abychom si v rychlém 5 minutovém hovoru vyjasnili, zda má smysl jít do hloubky, nebo se rozloučit.“\n\nKROK 4: CALL TO ACTION (Výzva)\n„Co takhle nezávazný 15 minutový online call? Hodí se vám spíše úterý v 10:00, nebo čtvrtek odpoledne?“`;
                                                    navigator.clipboard.writeText(textToCopy);
                                                    notify('success', 'Kopírováno', 'Skript byl úspěšně uložen do schránky.');
                                                }}
                                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition flex items-center gap-1"
                                            >
                                                <Copy size={12}/> Kopírovat Skript
                                            </button>
                                        </div>

                                        <div className="p-6 space-y-6 divide-y divide-slate-100 text-sm">
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">KROK 1: HOOK (Háček pro upoutání pozornosti)</span>
                                                <p className="text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-xl">
                                                    „Krásný den, oslovuji přímo <span className="text-indigo-600 font-semibold">{ccTarget || '...' }</span>. Volám vám ve spěchu, protože u firem jako je ta vaše pomáháme zajistit <span className="text-indigo-600 font-semibold">{ccBenefit || '...' }</span>... Máte na mě půl minuty?“
                                                </p>
                                            </div>

                                            <div className="space-y-1.5 pt-4">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">KROK 2: VALUE PROP (Hodnota a odlišení se)</span>
                                                <p className="text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-xl">
                                                    „Naše řešení <span className="text-indigo-600 font-semibold">{ccProduct || '...' }</span> se specializuje na to, jak efektivně vyřešit <span className="text-indigo-600 font-semibold">{ccBenefit || '...' }</span>. Naši běžní klienti uvádějí okamžité zlepšení výsledků.“
                                                </p>
                                            </div>

                                            <div className="space-y-1.5 pt-4">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">KROK 3: PRE-EMPTIVE HANDLING (Překonávání námitek typu "nemám čas")</span>
                                                <p className="text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-xl">
                                                    „Naprosto chápu, že toho máte hodně a máte již vyřešené workflow. Přesně proto volám — abychom si v krátkém 5ti minutovém callu upřímně definovali, zda pro vás dává smysl získat tyto výhody.“
                                                </p>
                                            </div>

                                            <div className="space-y-1.5 pt-4">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">KROK 4: CALL TO ACTION (Konverze do schůzky)</span>
                                                <p className="text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-xl">
                                                    „Pojďme se nezávazně spojit na rychlý online pokec. Hodí se vám spíše úterý v 10:00, nebo čtvrtek odpoledne?“
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </MotionDiv>
                        )}
                    </div>
                )}

                {/* --- CHALLENGES (VÝZVY) TAB --- */}
                {activeTab === 'challenges' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Výzvy a Daily Quests</h2>
                            <p className="text-slate-500">Zlepšujte své návyky, dokončujte denní cíle a inkasujte cenné XP do žebříčku.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {challenges && challenges.length > 0 ? challenges.map(challenge => {
                                const progress = user.activeChallenges?.find(c => c.challengeId === challenge.id);
                                const current = progress?.currentCount || 0;
                                const isCompleted = progress?.completed || current >= challenge.targetCount;
                                const percent = Math.min(100, (current / challenge.targetCount) * 100);

                                return (
                                    <div key={challenge.id} className={`bg-white border rounded-2xl p-6 relative flex flex-col justify-between transition ${isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200 hover:border-indigo-300'}`}>
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${challenge.type === 'daily' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {challenge.type === 'daily' ? 'Denní' : 'Týdenní'}
                                                </span>
                                                <span className="text-yellow-500 font-bold text-xs flex items-center gap-1 font-mono">
                                                    <Zap size={14} fill="currentColor"/> +{challenge.rewardXP} XP
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-slate-900 text-lg mb-1">{challenge.title}</h3>
                                            <p className="text-slate-500 text-xs mb-4 leading-relaxed">{challenge.description}</p>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-slate-100">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-slate-400">Postup</span>
                                                <span className={isCompleted ? 'text-emerald-500' : 'text-slate-700'}>
                                                    {current} / {challenge.targetCount}
                                                </span>
                                            </div>
                                            
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>

                                            {isCompleted ? (
                                                <div className="w-full py-2 bg-emerald-100 text-emerald-800 font-bold text-xs text-center rounded-xl flex items-center justify-center gap-1">
                                                    <Check size={14}/> SPLNĚNO
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => onChallengeAction && onChallengeAction(challenge.id)}
                                                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus size={14}/> Zaznamenat pokrok (+1)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full text-center py-20 text-slate-500">
                                    <Zap size={48} className="mx-auto mb-4 opacity-30"/>
                                    <p>Žádné aktivní výzvy momentálně v systému nejsou k dispozici.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- QUIZZES (KVÍZY) TAB --- */}
                {activeTab === 'quizzes' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Samo-testy a Ověření vědomostí</h2>
                            <p className="text-slate-500">Prověřte své odborné znalosti, získejte certifikáty a instantní XP bonus.</p>
                        </div>

                        {activeQuizId ? (() => {
                            const quizObj = quizzes.find(q => q.id === activeQuizId);
                            if (!quizObj) {
                                setActiveQuizId(null);
                                return null;
                            }
                            const question = quizObj.questions[currentQuestionIndex];
                            const isLastQuestion = currentQuestionIndex === quizObj.questions.length - 1;

                            if (quizResult) {
                                return (
                                    <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl space-y-6">
                                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-2 ${quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {quizResult.passed ? <CheckCircle size={44}/> : <X className="p-2" size={44}/>}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-2xl text-slate-900">{quizResult.passed ? 'Test úspěšně dokončen! 🎉' : 'Test nebyl úspěšně splněn'}</h3>
                                            <p className="text-slate-500 text-sm mt-1">{quizResult.passed ? 'Získáváte slíbené kredity XP za excelentní výsledek!' : 'Zkuste to znovu po dalším prostudování lekcí.'}</p>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-6 grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-slate-400 uppercase font-semibold block">Skóre</span>
                                                <span className={`text-2xl font-black ${quizResult.passed ? 'text-emerald-500' : 'text-red-500'}`}>{quizResult.score}%</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 uppercase font-semibold block">Bodový Limit</span>
                                                <span className="text-2xl font-black text-slate-700">{quizObj.passingScore}%</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setActiveQuizId(null);
                                                setQuizResult(null);
                                                setSelectedAnswers({});
                                                setCurrentQuestionIndex(0);
                                            }}
                                            className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/10"
                                        >
                                            Zpět na výběr testů
                                        </button>
                                    </MotionDiv>
                                );
                            }

                            return (
                                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                                        <span className="font-bold text-sm text-slate-700">Test: {quizObj.title}</span>
                                        <span className="text-xs font-mono font-bold text-indigo-600">Otázka {currentQuestionIndex + 1} / {quizObj.questions.length}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100">
                                        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / quizObj.questions.length) * 100}%` }}></div>
                                    </div>

                                    <div className="p-6 md:p-8 space-y-6">
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{question.question}</h3>
                                        
                                        <div className="grid grid-cols-1 gap-3">
                                            {question.options.map((option, idx) => {
                                                const isSelected = selectedAnswers[question.id] === idx;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [question.id]: idx })}
                                                        className={`w-full text-left p-4 rounded-xl border font-medium text-sm transition-all flex justify-between items-center ${isSelected ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'}`}
                                                    >
                                                        <span>{option}</span>
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                                                            {isSelected && <Check size={12}/>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between">
                                        <button
                                            disabled={currentQuestionIndex === 0}
                                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 transition disabled:opacity-40"
                                        >
                                            Předchozí
                                        </button>

                                        {isLastQuestion ? (
                                            <button
                                                disabled={selectedAnswers[question.id] === undefined}
                                                onClick={() => {
                                                    const total = quizObj.questions.length;
                                                    const correct = quizObj.questions.filter(q => selectedAnswers[q.id] === q.correctOptionIndex).length;
                                                    const scorePct = Math.round((correct / total) * 100);
                                                    const hasPassed = scorePct >= quizObj.passingScore;
                                                    
                                                    onQuizComplete(quizObj.id, scorePct, hasPassed);
                                                    setQuizResult({ score: scorePct, passed: hasPassed });
                                                }}
                                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                                            >
                                                Vyhodnotit test 🏆
                                            </button>
                                        ) : (
                                            <button
                                                disabled={selectedAnswers[question.id] === undefined}
                                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                                            >
                                                Další otázka
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })() : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {quizzes && quizzes.length > 0 ? quizzes.map(quiz => {
                                    const locked = isLocked(quiz.level);
                                    return (
                                        <div key={quiz.id} className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between transition ${locked ? 'border-slate-200 opacity-70 bg-slate-50' : 'border-slate-200 hover:border-indigo-300 shadow-md hover:shadow-lg'}`}>
                                            <div>
                                                <div className="h-44 bg-slate-100 relative overflow-hidden">
                                                    {quiz.image ? (
                                                        <img src={quiz.image} className="w-full h-full object-cover"/>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-200">🧠</div>
                                                    )}
                                                    {locked && (
                                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white font-bold p-4">
                                                            <Lock size={28} className="mb-1.5"/>
                                                            <span className="text-xs uppercase">Vyžaduje roli {quiz.level.toUpperCase()}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-5">
                                                    <h3 className="font-bold text-slate-800 text-lg mb-1">{quiz.title}</h3>
                                                    <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">{quiz.description}</p>
                                                    
                                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                                                        <span className="flex items-center gap-1 font-mono text-yellow-500 font-bold">
                                                            <Zap size={12} fill="currentColor"/> +{quiz.xpReward} XP
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            🎯 Limit: {quiz.passingScore}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-5 pt-0">
                                                <button
                                                    onClick={() => {
                                                        if (locked) {
                                                            notify('warning', 'Omezený přístup', `Tento test vyžaduje úroveň účtu: ${quiz.level.toUpperCase()}`);
                                                            return;
                                                        }
                                                        setActiveQuizId(quiz.id);
                                                        setQuizResult(null);
                                                        setSelectedAnswers({});
                                                        setCurrentQuestionIndex(0);
                                                    }}
                                                    className={`w-full py-2.5 font-bold text-xs rounded-xl transition ${locked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                                                >
                                                    Spustit test 🧠
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-full text-center py-20 text-slate-500">
                                        <Brain size={48} className="mx-auto mb-4 opacity-30"/>
                                        <p>V systému nejsou definovány žádné testy.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- EVENTS / AKCE & WEBINÁŘE TAB --- */}
                {activeTab === 'events' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Akce, Webináře & Mastermind</h2>
                            <p className="text-slate-500">Živé online workshopy s odborníky pro rozvoj vašich dovedností v reálném čase.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {events && events.length > 0 ? events.map(event => {
                                const regIds = Array.isArray(event.registeredUserIds) 
                                    ? event.registeredUserIds 
                                    : (typeof event.registeredUserIds === 'string' ? JSON.parse(event.registeredUserIds || '[]') : []);
                                const isRegistered = regIds.includes(user.id);
                                
                                const freeForVip = event.isFreeForVip;
                                const freeForPrem = event.isFreeForPremium;
                                const isFreeForUser = (user.role === 'admin' || user.role === 'vip' && freeForVip) || (user.role === 'premium' && freeForPrem);
                                const priceText = (event.price === 0 || isFreeForUser) ? 'Zdarma' : `${event.price?.toLocaleString()} Kč`;

                                return (
                                    <div key={event.id} className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${isRegistered ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="p-6 md:p-8 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    event.type === 'webinar' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                    event.type === 'workshop' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                                                    'bg-teal-50 text-teal-700 border border-teal-200'
                                                }`}>
                                                    {event.type === 'webinar' ? 'Webinář' : event.type === 'workshop' ? 'Workshop' : 'Meetup'}
                                                </span>
                                                <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${priceText === 'Zdarma' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {priceText}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-slate-900 text-xl mb-2">{event.title}</h3>
                                                <p className="text-slate-500 text-sm leading-relaxed">{event.description}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-4 pt-4 text-xs text-slate-500 border-t border-slate-100">
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon size={14}/>
                                                    <span>{new Date(event.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14}/>
                                                    <span>{new Date(event.date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {event.maxAttendees && (
                                                    <div className="flex items-center gap-1">
                                                        <UsersIcon size={14}/>
                                                        <span>Kapacita: {regIds.length} / {event.maxAttendees}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col gap-3">
                                            {isRegistered ? (
                                                <div className="space-y-3">
                                                    <div className="w-full py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs text-center rounded-xl flex items-center justify-center gap-1">
                                                        <CheckCircle size={14} className="text-indigo-600"/> JSTE PŘIHLÁŠEN(A)
                                                    </div>
                                                    {event.link && (
                                                        <a
                                                            href={event.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center rounded-xl transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.2)] animate-pulse"
                                                        >
                                                            <ExternalLink size={14}/> Vstoupit do Zoom / Google Meet
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => onRegisterEvent(event.id, user.id)}
                                                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                                                >
                                                    <CalendarIcon size={14}/> Přihlásit se na akci
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full text-center py-20 text-slate-500 bg-white border border-slate-200 rounded-3xl">
                                    <CalendarIcon size={48} className="mx-auto mb-4 opacity-30"/>
                                    <p>Momentálně nejsou naplánované žádné živé akce.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* CERTIFICATES TAB */}
                {activeTab === 'certificates' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {user.certificates.length > 0 ? user.certificates.map(cert => (
                            <div key={cert.id} className="bg-white text-slate-900 p-6 rounded-2xl border-4 border-double border-amber-400 relative overflow-hidden shadow-xl group transition hover:shadow-2xl flex flex-col justify-between">
                                {/* Gold Corner Ribbon decoration */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/20 to-yellow-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                                
                                <div className="relative z-10 text-center flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="w-14 h-14 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-600 border border-amber-200 shadow-inner">
                                            <Award size={28} className="animate-pulse"/>
                                        </div>
                                        <h3 className="font-serif font-black text-xs uppercase tracking-[0.2em] text-amber-600 mb-1">DIPLOM & CERTIFIKÁT</h3>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-4 font-mono">Platforma Q-HUB</p>
                                        
                                        <h4 className="font-bold text-slate-900 text-base mb-3 leading-snug min-h-[2.5rem] flex items-center justify-center">
                                            {cert.courseName}
                                        </h4>
                                        
                                        <div className="text-xs text-slate-500 mb-4 bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                                            Uděleno pracovníkovi:<br/>
                                            <span className="font-black text-slate-800 text-sm">{cert.workerName || cert.studentName}</span>
                                        </div>
                                    </div>

                                    <div>
                                        {/* Golden Seal element wrapper on screen */}
                                        <div className="flex items-center justify-center gap-4 my-3 bg-amber-500/5 py-2 rounded-xl border border-amber-500/10 mb-4">
                                            {cert.qrCodeUrl ? (
                                                <img src={cert.qrCodeUrl} className="w-14 h-14 mix-blend-multiply opacity-90 border border-amber-200/50 p-0.5 rounded bg-white"/>
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-100 rounded text-[8px] flex items-center justify-center text-slate-400 font-mono">QR</div>
                                            )}
                                            <div className="text-left">
                                                <div className="text-[8px] font-mono text-slate-400 tracking-wider">KÓD CERTIFIKÁTU</div>
                                                <div className="text-[10px] font-bold text-slate-700 font-mono">{cert.code || 'QHB-' + cert.id.substring(0, 8).toUpperCase()}</div>
                                                <div className="text-[8px] text-amber-600 font-semibold mt-0.5 font-sans flex items-center gap-0.5">● Ověřený profil</div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleDownloadCertificate(cert.id)} 
                                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.98]"
                                        >
                                            <Download size={13}/> Vytisknout / Stáhnout A4
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-20 text-slate-500">
                                <Award size={48} className="mx-auto mb-4 opacity-50 text-amber-500"/>
                                <p>Zatím nemáte žádné certifikáty. Dokončete kurz pro získání prvního!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- MENTORING TAB --- */}
                {activeTab === 'mentoring' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-3xl p-6 md:p-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Individuální Mentoring 1:1</h2>
                            <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
                                Rezervujte si osobní strategickou konzultaci s našimi zkušenými experty. Společně probereme vaše podnikání, prodejní skripty nebo AI automatizace a posuneme výsledky na další úroveň.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Available Mentors */}
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="font-bold text-xl text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <UsersIcon size={20} className="text-emerald-600"/> Naši Mentoři
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {mentors && mentors.length > 0 ? mentors.map(mentor => (
                                        <div key={mentor.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-teal-300 transition flex flex-col justify-between">
                                            <div className="p-5 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    {mentor.image ? (
                                                        <img src={mentor.image} className="w-14 h-14 rounded-full object-cover border border-slate-200 bg-slate-50"/>
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-lg uppercase border border-slate-200">
                                                            {mentor.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{mentor.name}</h4>
                                                        <span className="text-xs text-teal-600 font-semibold uppercase tracking-wider">{mentor.role}</span>
                                                    </div>
                                                </div>

                                                <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{mentor.bio}</p>

                                                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                                                    <span className="text-slate-400">Hodnotová konzultace:</span>
                                                    <span className="font-bold text-slate-900">{mentor.hourlyRate === 0 ? 'Zdarma' : `${mentor.hourlyRate.toLocaleString()} Kč / hod`}</span>
                                                </div>
                                            </div>

                                            <div className="p-5 pt-0">
                                                <button
                                                    onClick={() => {
                                                        setSelectedMentor(mentor.id);
                                                        setBookingDate('');
                                                        setBookingNote('');
                                                    }}
                                                    className={`w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition ${selectedMentor === mentor.id ? 'ring-2 ring-teal-500' : ''}`}
                                                >
                                                    Sjednat schůzku 📅
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-10 text-center text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                                            Momentálně nejsou k dispozici žádní mentoři.
                                        </div>
                                    )}
                                </div>

                                {/* Booking Confirmation Form (Interactive modal style inside content) */}
                                {selectedMentor && (() => {
                                    const mentorObj = mentors.find(m => m.id === selectedMentor);
                                    if (!mentorObj) return null;
                                    return (
                                        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-2xl p-6 space-y-4 animate-fade-in relative">
                                            <button 
                                                onClick={() => setSelectedMentor(null)} 
                                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                                            >
                                                <X size={18}/>
                                            </button>
                                            <h4 className="font-bold text-slate-950 flex items-center gap-2">
                                                📅 Rezervace konzultace s: <span className="text-indigo-600">{mentorObj.name}</span>
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Datum a Čas schůzky</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={bookingDate}
                                                        onChange={e => setBookingDate(e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-950 text-xs font-semibold focus:border-indigo-500 outline-none transition"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Stručné téma konzultace (poznámka)</label>
                                                    <input
                                                        type="text"
                                                        value={bookingNote}
                                                        onChange={e => setBookingNote(e.target.value)}
                                                        placeholder="S čím potřebujete poradit?"
                                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-955 text-xs focus:border-indigo-500 outline-none transition"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2">
                                                <button
                                                    onClick={() => setSelectedMentor(null)}
                                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
                                                >
                                                    Zrušit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (!bookingDate) {
                                                            notify('warning', 'Chybí datum', 'Zvolte prosím platné datum a čas konzultace.');
                                                            return;
                                                        }
                                                        if (onBookMentor) {
                                                            onBookMentor(selectedMentor, bookingDate, bookingNote);
                                                            notify('success', 'Žádost odeslána', `Konzultace s ${mentorObj.name} byla úspěšně zažádána.`);
                                                            setSelectedMentor(null);
                                                            setBookingDate('');
                                                            setBookingNote('');
                                                        }
                                                    }}
                                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition shadow-md shadow-indigo-600/10"
                                                >
                                                    Odeslat žádost o sezení 🚀
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* My Booked Consultations */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-xl text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <CalendarIcon size={20} className="text-teal-600"/> Moje Rezervace
                                </h3>

                                <div className="space-y-3">
                                    {bookings && bookings.filter(b => b.userId === user.id).length > 0 ? (
                                        bookings.filter(b => b.userId === user.id).map(booking => {
                                            const mentorName = mentors.find(m => m.id === booking.mentorId)?.name || 'Mentor/Konzultant';
                                            return (
                                                <div key={booking.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-indigo-200 transition">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-xs text-slate-800">{mentorName}</h4>
                                                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                                                {new Date(booking.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                                                            booking.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                            booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {booking.status === 'approved' ? 'Schváleno' : booking.status === 'rejected' ? 'Zamítnuto' : 'Čeká'}
                                                        </span>
                                                    </div>

                                                    {booking.note && (
                                                        <p className="text-[11px] text-slate-500 italic bg-white p-2 border border-slate-100 rounded-lg">
                                                            „{booking.note}“
                                                        </p>
                                                    )}

                                                    {booking.meetingLink && (
                                                        <a
                                                            href={booking.meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold text-center rounded-lg transition flex items-center justify-center gap-1"
                                                        >
                                                            <ExternalLink size={11}/> Vstoupit do Google Meet
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                                            Zatím nemáte sjednané žádné osobní konzultace.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MOJE PROVIZE (OZ) TAB --- */}
                {activeTab === 'oz-rewards' && (
                    <div className="space-y-8 animate-fade-in text-slate-900 pb-12">
                        {/* Header Section with billing cycle selector */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Okna & Stínící technika QAPI</span>
                                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">Provizní model OZ</span>
                                </div>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                    <Coins className="text-emerald-500" size={28} />
                                    Osobní provizní přehled (OZ)
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Sledujte své dokončené zakázky, schválené slevy, dosažené provizní stupně a celkovou výplatu.
                                </p>
                            </div>

                            {/* Month Switcher */}
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Zúčtovací měsíc</span>
                                <input
                                    type="month"
                                    value={selectedOzMonth}
                                    onChange={(e) => setSelectedOzMonth(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Core Statistics calculations */}
                        {(() => {
                            const normEmail = (user.email || '').toLowerCase().trim();
                            const config = ozData.userConfigs[normEmail] || { userType: 'commission', fixRate: 0 };

                            const allMerchantEmails: string[] = Array.from(new Set([
                                ...Object.keys(ozData.userConfigs || {}),
                                ...(ozData.orders || []).map(o => o.email.toLowerCase().trim())
                            ])).filter(Boolean) as string[];

                            const getMerchantName = (emailStr: string) => {
                                const emailLower = emailStr.toLowerCase().trim();
                                if (emailLower === (user.email || '').toLowerCase().trim()) {
                                    return 'Já (Osobní přehled)';
                                }
                                const mappings: Record<string, string> = {
                                    'ludvikremesekwork@gmail.com': 'Ludvík Remešek',
                                    'technik1@qapi.cz': 'Technik Jedna',
                                    'prodejce2@qapi.cz': 'Prodejce Dva',
                                    'chytrosmichal@gmail.com': 'Michal Chytroš',
                                    'erik.bahleda@qapi.cz': 'Erik Bahleda',
                                    'andrej.krok@qapi.cz': 'Andrej Krok',
                                    'petr.kollner@qapi.cz': 'Petr Köllner',
                                    'filip.sindl@qapi.cz': 'Filip Šindl',
                                    'davechytros@gmail.com': 'David Chytroš',
                                    'qapi.shop@gmail.com': 'QAPI E-shop',
                                };
                                if (mappings[emailLower]) return mappings[emailLower];
                                const part = emailLower.split('@')[0];
                                return part.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                            };

                            const uniqueMonths: string[] = Array.from(new Set(
                                (ozData.orders || [])
                                    .map(o => o.date ? o.date.substring(0, 7) : '')
                                    .filter(m => m && m.match(/^\d{4}-\d{2}$/))
                            )).sort() as string[];
                            const sortedMonths: string[] = uniqueMonths.length > 0 ? uniqueMonths : ['2026-04', '2026-05', '2026-06', '2026-07'];

                            const formatMonthLabel = (m: string) => {
                                const parts = m.split('-');
                                if (parts.length !== 2) return m;
                                const year = parts[0];
                                const monthNum = parts[1];
                                const monthNames: Record<string, string> = {
                                    '01': 'Leden', '02': 'Únor', '03': 'Březen', '04': 'Duben',
                                    '05': 'Květen', '06': 'Červen', '07': 'Červenec', '08': 'Srpen',
                                    '09': 'Září', '10': 'Říjen', '11': 'Listopad', '12': 'Prosinec'
                                };
                                return `${monthNames[monthNum] || monthNum} ${year}`;
                            };

                            const getMerchantStatsForMonth = (email: string, mMonth: string) => {
                                const mNormEmail = email.toLowerCase().trim();
                                const mConfig = ozData.userConfigs[mNormEmail] || { userType: 'commission', fixRate: 0 };
                                
                                const mUserOrders = ozData.orders.filter(o => o.email.toLowerCase() === mNormEmail);
                                const mMonthOrders = mUserOrders.filter(o => o.date.startsWith(mMonth) && o.status === 'completed');
                                
                                const mTotalVolume = mMonthOrders.reduce((sum, o) => sum + o.amount, 0);

                                let mBaseRatePercent = 8;
                                if (mTotalVolume <= 400000) {
                                    mBaseRatePercent = mConfig.customRates?.b1 ?? 8;
                                } else if (mTotalVolume <= 700000) {
                                    mBaseRatePercent = mConfig.customRates?.b2 ?? 10;
                                } else if (mTotalVolume <= 1000000) {
                                    mBaseRatePercent = mConfig.customRates?.b3 ?? 11;
                                } else {
                                    mBaseRatePercent = mConfig.customRates?.b4 ?? 12;
                                }

                                const mTotalCommissions = mMonthOrders.reduce((sum, o) => {
                                    if (o.customCommissionPercent !== undefined && o.customCommissionPercent !== null) {
                                        return sum + (o.amount * (o.customCommissionPercent / 100));
                                    }
                                    if (o.discount > 60) return sum;

                                    let rate = mBaseRatePercent;
                                    const tier1 = o.discount >= 33 && o.discount <= 45;
                                    const tier2 = o.discount > 45 && o.discount <= 60;

                                    let r1 = mConfig.customRates?.b1 ?? 8;
                                    let r2 = mConfig.customRates?.b2 ?? 10;
                                    let r3 = mConfig.customRates?.b3 ?? 11;
                                    let r4 = mConfig.customRates?.b4 ?? 12;

                                    if (mTotalVolume <= 400000) {
                                        if (tier2) rate = 3;
                                        else if (tier1) rate = 6;
                                        else rate = r1;
                                    } else if (mTotalVolume <= 700000) {
                                        if (tier2) rate = 5;
                                        else if (tier1) rate = 8;
                                        else rate = r2;
                                    } else if (mTotalVolume <= 1000000) {
                                        if (tier2) rate = 6;
                                        else if (tier1) rate = 9;
                                        else rate = r3;
                                    } else {
                                        if (tier2) rate = 7;
                                        else if (tier1) rate = 10;
                                        else rate = r4;
                                    }
                                    return sum + (o.amount * (rate / 100));
                                }, 0);

                                const mFixAmount = (mConfig.userType === 'fix' || mConfig.userType === 'both') ? (mConfig.fixRate || 0) : 0;
                                
                                const mMonthAdjustments = ozData.adjustments.filter(a => a.email.toLowerCase() === mNormEmail && a.month === mMonth);
                                const mBonusesSum = mMonthAdjustments.filter(a => a.type === 'bonus').reduce((sum, a) => sum + a.amount, 0);
                                const mFinesSum = mMonthAdjustments.filter(a => a.type === 'fine').reduce((sum, a) => sum + a.amount, 0);

                                const mTotalPayout = Math.max(0, Math.round(mTotalCommissions + mFixAmount + mBonusesSum - mFinesSum));

                                return {
                                    obrat: mTotalVolume,
                                    provize: Math.round(mTotalCommissions),
                                    fix: mFixAmount,
                                    payout: mTotalPayout,
                                    count: mMonthOrders.length
                                };
                            };

                            const individualChartData = sortedMonths.map(month => {
                                const stats = getMerchantStatsForMonth(chartSelectedEmail || (user.email || '').toLowerCase().trim(), month);
                                return {
                                    rawMonth: month,
                                    monthLabel: formatMonthLabel(month),
                                    obrat: stats.obrat,
                                    provize: stats.provize,
                                    payout: stats.payout,
                                    pocetZakazek: stats.count
                                };
                            });

                            const comparisonChartData = allMerchantEmails.map(email => {
                                const stats = getMerchantStatsForMonth(email, selectedOzMonth);
                                return {
                                    email,
                                    name: getMerchantName(email),
                                    obrat: stats.obrat,
                                    provize: stats.provize,
                                    payout: stats.payout,
                                    pocetZakazek: stats.count
                                };
                            }).filter(d => d.obrat > 0 || d.provize > 0 || d.payout > 0);
                            
                            const userOrders = ozData.orders.filter(o => o.email.toLowerCase() === normEmail);
                            const monthOrders = userOrders.filter(o => o.date.startsWith(selectedOzMonth) && o.status === 'completed');
                            
                            // Calculate monthly volume (obrat)
                            const totalVolume = monthOrders.reduce((sum, o) => sum + o.amount, 0);

                            // Determine bracket base percentage
                            let baseRatePercent = 8;
                            let bracketText = '1 Kč - 400 000 Kč (8%)';
                            if (totalVolume <= 400000) {
                                baseRatePercent = config.customRates?.b1 ?? 8;
                                bracketText = `I. Stupeň (${baseRatePercent}%)`;
                            } else if (totalVolume <= 700000) {
                                baseRatePercent = config.customRates?.b2 ?? 10;
                                bracketText = `II. Stupeň (${baseRatePercent}%)`;
                            } else if (totalVolume <= 1000000) {
                                baseRatePercent = config.customRates?.b3 ?? 11;
                                bracketText = `III. Stupeň (${baseRatePercent}%)`;
                            } else {
                                baseRatePercent = config.customRates?.b4 ?? 12;
                                bracketText = `IV. Exkluzivní stupeň (${baseRatePercent}%)`;
                            }

                            // Individual order commission calculations
                            const calculateOrderCommission = (amount: number, discount: number, overridePercent?: number) => {
                                if (overridePercent !== undefined && overridePercent !== null) {
                                    return amount * (overridePercent / 100);
                                }
                                if (discount > 60) return 0; // complete penalty

                                let rate = baseRatePercent;
                                const tier1 = discount >= 33 && discount <= 45; // reduced
                                const tier2 = discount > 45 && discount <= 60; // strictly penalized

                                let r1 = config.customRates?.b1 ?? 8;
                                let r2 = config.customRates?.b2 ?? 10;
                                let r3 = config.customRates?.b3 ?? 11;
                                let r4 = config.customRates?.b4 ?? 12;

                                if (totalVolume <= 400000) {
                                    if (tier2) rate = 3;
                                    else if (tier1) rate = 6;
                                    else rate = r1;
                                } else if (totalVolume <= 700000) {
                                    if (tier2) rate = 5;
                                    else if (tier1) rate = 8;
                                    else rate = r2;
                                } else if (totalVolume <= 1000000) {
                                    if (tier2) rate = 6;
                                    else if (tier1) rate = 9;
                                    else rate = r3;
                                } else {
                                    if (tier2) rate = 7;
                                    else if (tier1) rate = 10;
                                    else rate = r4;
                                }
                                return amount * (rate / 100);
                            };

                            const totalCommissions = (config.userType === 'commission' || config.userType === 'both')
                                ? monthOrders.reduce((sum, o) => sum + calculateOrderCommission(o.amount, o.discount, o.customCommissionPercent), 0)
                                : 0;

                            // Monthly Fix rate
                            const fixAmount = (config.userType === 'fix' || config.userType === 'both') ? config.fixRate : 0;

                            // Fines & bonuses for selected month
                            const monthAdjustments = ozData.adjustments.filter(a => a.email.toLowerCase() === normEmail && a.month === selectedOzMonth);
                            const bonusesSum = monthAdjustments.filter(a => a.type === 'bonus').reduce((sum, a) => sum + a.amount, 0);
                            const finesSum = monthAdjustments.filter(a => a.type === 'fine').reduce((sum, a) => sum + a.amount, 0);

                            // Total Final payout
                            const totalPayout = Math.max(0, Math.round(totalCommissions + fixAmount + bonusesSum - finesSum));

                            // Tier Progress math
                            let nextTierThreshold = 400000;
                            let currentProgressPercent = (totalVolume / 400000) * 100;
                            let nextTierText = 'K odemčení vyší provize 10%';

                            if (totalVolume > 400000 && totalVolume <= 700000) {
                                nextTierThreshold = 700000;
                                currentProgressPercent = ((totalVolume - 400000) / 300000) * 100;
                                nextTierText = 'K odemčení provize 11%';
                            } else if (totalVolume > 700000 && totalVolume <= 1000000) {
                                nextTierThreshold = 1000000;
                                currentProgressPercent = ((totalVolume - 700000) / 300000) * 100;
                                nextTierText = 'K odemčení max. provize 12%';
                            } else if (totalVolume > 1000000) {
                                currentProgressPercent = 100;
                                nextTierText = 'Gratulujeme! Dosáhli jste nejvyšší provizní sazby.';
                            }

                            return (
                                <div className="space-y-8">
                                    {/* Metric Cards Grid */}
                                    {ozLoading ? (
                                        <div className="text-center py-10 text-slate-500 font-medium bg-white rounded-3xl border border-slate-200">Načítám mzdové výpočty...</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            {/* Card 1: Cumulative Obrat */}
                                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all duration-300">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform"></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Měsíční obrat (Obrat)</span>
                                                <span className="text-2xl font-black text-slate-900 block tracking-tight animate-none">
                                                    {totalVolume.toLocaleString()} Kč
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    {monthOrders.length} uzavřených smluv
                                                </div>
                                            </div>

                                            {/* Card 2: Reached Bracket */}
                                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all duration-300">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform"></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Dosažený stupeň</span>
                                                <span className="text-xl font-extrabold text-indigo-600 block leading-tight mt-1">
                                                    {config.userType === 'fix' ? 'Fixní mzda' : bracketText}
                                                 </span>
                                                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 font-medium">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-[10px] font-bold">Base Rate</span>
                                                    Sleva 0-33% = {baseRatePercent}% provize
                                                </div>
                                            </div>

                                            {/* Card 3: Payout Details & Breaks */}
                                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-amber-300 transition-all">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Provize + Fix</span>
                                                <div className="space-y-1 mt-1">
                                                    <div className="flex justify-between text-xs font-medium text-slate-600">
                                                        <span>Provize ze zakázek:</span>
                                                        <span className="font-bold">+{Math.round(totalCommissions).toLocaleString()} Kč</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-medium text-slate-600 flex-none">
                                                        <span>Měsíční fixní základ:</span>
                                                        <span className="font-bold">+{fixAmount.toLocaleString()} Kč</span>
                                                    </div>
                                                </div>
                                                <div className="border-t border-dashed border-slate-100 mt-2.5 pt-2 flex justify-between text-xs text-slate-500">
                                                    <span>Manažerské úpravy:</span>
                                                    <span className={`font-bold ${bonusesSum - finesSum >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {bonusesSum - finesSum >= 0 ? '+' : ''}{(bonusesSum - finesSum).toLocaleString()} Kč
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card 4: Total payout */}
                                            <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                                                <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-800 rounded-full opacity-20"></div>
                                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block mb-1">Navrhovaná Výplata</span>
                                                <span className="text-3xl font-black text-emerald-400 block tracking-tight">
                                                    {totalPayout.toLocaleString()} Kč
                                                </span>
                                                <p className="text-[10px] text-emerald-200/80 mt-2 font-medium">
                                                    Konečná částka připsaná do peněženky za tento zúčtovací měsíc po schválení finanční účtárnou.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tier Level progressive bar */}
                                    {config.userType !== 'fix' && (
                                        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                                                <div>
                                                    <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                                        <TrendingUp size={16} className="text-emerald-500" />
                                                        Postup po provizních stupních (Měsíční výkon)
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">Výška provize se automaticky zvedá podle vašeho celkového dosaženého měsíčního obratu.</p>
                                                </div>
                                                {totalVolume < 1000000 && (
                                                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                        Chybí {(nextTierThreshold - totalVolume).toLocaleString()} Kč {nextTierText.toLowerCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Visual progress bar */}
                                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 relative mb-2 shadow-inner">
                                                <div 
                                                    className="h-full bg-emerald-500 max-w-full transition-all duration-700"
                                                    style={{ width: `${Math.min(100, (totalVolume / 1000000) * 100)}%` }}
                                                ></div>
                                            </div>

                                            {/* Bracket indicators */}
                                            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-slate-400 select-none">
                                                <div className={totalVolume <= 400000 ? 'text-emerald-600 font-extrabold bg-emerald-50/50 py-1 rounded' : ''}>
                                                    1. Stupeň (8%)<span className="block font-medium text-[9px]">0k - 400k Kč</span>
                                                </div>
                                                <div className={totalVolume > 400000 && totalVolume <= 700000 ? 'text-emerald-600 font-extrabold bg-emerald-50/50 py-1 rounded' : ''}>
                                                    2. Stupeň (10%)<span className="block font-medium text-[9px]">400k - 700k Kč</span>
                                                </div>
                                                <div className={totalVolume > 700000 && totalVolume <= 1000000 ? 'text-emerald-600 font-extrabold bg-emerald-50/50 py-1 rounded' : ''}>
                                                    3. Stupeň (11%)<span className="block font-medium text-[9px]">700k - 1M Kč</span>
                                                </div>
                                                <div className={totalVolume > 1000000 ? 'text-emerald-600 font-extrabold bg-emerald-50/50 py-1 rounded' : ''}>
                                                    Exkluzivní (12%)<span className="block font-medium text-[9px]">1M+ Kč</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- GRAPHICAL ANALYSIS PANEL WITH RECHARTS --- */}
                                    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                                    <BarChart2 size={20} className="text-emerald-500 animate-pulse" />
                                                    Grafická analýza výkonnosti & provizí
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-1">Interaktivní přehled vývoje prodejů a vyplacené odměny jednotlivých obchodníků.</p>
                                            </div>

                                            {/* Mode Selector */}
                                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-100 shrink-0 self-stretch sm:self-auto">
                                                <button
                                                    onClick={() => setChartMode('individual')}
                                                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${chartMode === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                                >
                                                    Vývoj v čase (Osobní)
                                                </button>
                                                <button
                                                    onClick={() => setChartMode('comparison')}
                                                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${chartMode === 'comparison' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                                >
                                                    Srovnání týmu
                                                </button>
                                            </div>
                                        </div>

                                        {/* Configuration Controls */}
                                        {chartMode === 'individual' ? (
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="text-[11px] text-slate-500">
                                                    Sledování trendu uzavřeného měsíčního obratu (zelená plocha, levá osa) vůči schváleným osobním provizím (modrá plocha, pravá osa).
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block shrink-0 whitespace-nowrap">Zvolit OZ:</span>
                                                    <select
                                                        value={chartSelectedEmail || (user.email || '').toLowerCase().trim()}
                                                        onChange={(e) => setChartSelectedEmail(e.target.value)}
                                                        className="w-full sm:w-[220px] bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    >
                                                        {allMerchantEmails.map(email => (
                                                            <option key={email} value={email}>
                                                                {getMerchantName(email)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="text-[11px] text-slate-500 font-medium">
                                                    Srovnání dosažených výsledků všech aktivních obchodních zástupců, kteří v daném období realizovali objednávky.
                                                </div>
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 shrink-0">
                                                    Měsíc: <span className="text-emerald-600 font-extrabold uppercase tracking-wider">{formatMonthLabel(selectedOzMonth)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Chart Display area */}
                                        <div className="bg-slate-50/50 border border-slate-100 p-4 md:p-6 rounded-3xl">
                                            {chartMode === 'individual' ? (
                                                <div className="space-y-6">
                                                    <div className="h-[300px] md:h-[350px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={individualChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id="colorObratDashboard" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                                                                    </linearGradient>
                                                                    <linearGradient id="colorProvizeDashboard" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                                <XAxis 
                                                                    dataKey="monthLabel" 
                                                                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} 
                                                                    axisLine={false} 
                                                                    tickLine={false} 
                                                                />
                                                                <YAxis 
                                                                    yAxisId="left"
                                                                    tick={{fontSize: 9, fill: '#10b981', fontWeight: 'bold'}} 
                                                                    axisLine={false} 
                                                                    tickLine={false} 
                                                                    tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} 
                                                                />
                                                                <YAxis 
                                                                    yAxisId="right"
                                                                    orientation="right"
                                                                    tick={{fontSize: 9, fill: '#6366f1', fontWeight: 'bold'}} 
                                                                    axisLine={false} 
                                                                    tickLine={false} 
                                                                    tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} 
                                                                />
                                                                <Tooltip 
                                                                    contentStyle={{
                                                                        borderRadius: '16px', 
                                                                        border: '1px solid #e2e8f0', 
                                                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', 
                                                                        fontSize: '11px', 
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: '#ffffff'
                                                                    }} 
                                                                    formatter={(value: any, name: any) => {
                                                                        if (name === 'obrat') return [`${parseFloat(value).toLocaleString()} Kč`, 'Celkový Obrat'];
                                                                        if (name === 'provize') return [`${parseFloat(value).toLocaleString()} Kč`, 'Získaná Provize'];
                                                                        if (name === 'payout') return [`${parseFloat(value).toLocaleString()} Kč`, 'Celková Výplata'];
                                                                        return [value, name];
                                                                    }}
                                                                />
                                                                <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '10px'}} />
                                                                <Area 
                                                                    yAxisId="left"
                                                                    type="monotone" 
                                                                    dataKey="obrat" 
                                                                    name="obrat" 
                                                                    stroke="#10b981" 
                                                                    fillOpacity={1} 
                                                                    fill="url(#colorObratDashboard)" 
                                                                    strokeWidth={3}
                                                                    dot={{r: 4, strokeWidth: 1, fill: '#10b981'}}
                                                                    activeDot={{r: 6}}
                                                                />
                                                                <Area 
                                                                    yAxisId="right"
                                                                    type="monotone" 
                                                                    dataKey="provize" 
                                                                    name="provize" 
                                                                    stroke="#6366f1" 
                                                                    fillOpacity={1} 
                                                                    fill="url(#colorProvizeDashboard)" 
                                                                    strokeWidth={3}
                                                                    dot={{r: 4, strokeWidth: 1, fill: '#6366f1'}}
                                                                    activeDot={{r: 6}}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>

                                                    {/* Monthly summary timeline detail boxes */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {individualChartData.map((d, idx) => (
                                                            <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200/60 flex flex-col hover:border-slate-300 transition-all font-sans">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.monthLabel}</span>
                                                                <div className="text-xs font-extrabold text-slate-800 mt-1">
                                                                    Obrat: <span className="text-emerald-600 font-mono font-black">{d.obrat.toLocaleString()} Kč</span>
                                                                </div>
                                                                <div className="text-xs font-semibold text-slate-600">
                                                                    Provize: <span className="text-indigo-600 font-mono font-black">{d.provize.toLocaleString()} Kč</span>
                                                                </div>
                                                                <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                                                                    {d.pocetZakazek} uzavřených zakázek
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {comparisonChartData.length === 0 ? (
                                                        <div className="text-center py-16 text-slate-400 space-y-2">
                                                            <div className="text-2xl">📊</div>
                                                            <div className="text-xs font-bold">Žádná data k zobrazení</div>
                                                            <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-normal">Pro vybraný měsíc {formatMonthLabel(selectedOzMonth)} nebyly zjištěny uzavřené zakázky s prodejním obratem.</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="h-[300px] md:h-[350px] w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={comparisonChartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                                        <XAxis 
                                                                            dataKey="name" 
                                                                            tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} 
                                                                            axisLine={false} 
                                                                            tickLine={false} 
                                                                        />
                                                                        <YAxis 
                                                                            tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} 
                                                                            axisLine={false} 
                                                                            tickLine={false} 
                                                                            tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} 
                                                                        />
                                                                        <Tooltip 
                                                                            contentStyle={{
                                                                                borderRadius: '16px', 
                                                                                border: '1px solid #e2e8f0', 
                                                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', 
                                                                                fontSize: '11px', 
                                                                                fontWeight: 'bold',
                                                                                backgroundColor: '#ffffff'
                                                                            }} 
                                                                            formatter={(value: any, name: any) => {
                                                                                if (name === 'obrat') return [`${parseFloat(value).toLocaleString()} Kč`, 'Uzavřený Obrat'];
                                                                                if (name === 'payout') return [`${parseFloat(value).toLocaleString()} Kč`, 'Celková Výplata'];
                                                                                return [value, name];
                                                                            }}
                                                                        />
                                                                        <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '10px'}} />
                                                                        <Bar dataKey="obrat" name="obrat" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={45} />
                                                                        <Bar dataKey="payout" name="payout" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={45} />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>

                                                            {/* Mini Leaderboard List */}
                                                            <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                                                                <div className="grid grid-cols-12 bg-slate-50/80 p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                                                                    <div className="col-span-5 md:col-span-6 pl-2">Obchodní zástupce (OZ)</div>
                                                                    <div className="col-span-3 text-right">Uzavřený obrat</div>
                                                                    <div className="col-span-4 md:col-span-3 text-right pr-2">Provize celkem</div>
                                                                </div>
                                                                <div className="divide-y divide-slate-100">
                                                                    {comparisonChartData.sort((a, b) => b.obrat - a.obrat).map((d, index) => (
                                                                        <div key={index} className="grid grid-cols-12 p-3 items-center text-xs hover:bg-slate-50/20 transition duration-150">
                                                                            <div className="col-span-5 md:col-span-6 flex items-center gap-2 pl-2">
                                                                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{index + 1}</span>
                                                                                <div className="truncate">
                                                                                    <div className="font-extrabold text-slate-800">{d.name}</div>
                                                                                    <div className="text-[9px] text-slate-400 font-medium lowercase tracking-wide font-mono">{d.email}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-3 text-right font-black text-emerald-600 font-mono">
                                                                                {d.obrat.toLocaleString()} Kč
                                                                            </div>
                                                                            <div className="col-span-4 md:col-span-3 text-right pr-2 font-black text-indigo-600 font-mono">
                                                                                {d.provize.toLocaleString()} Kč
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Orders log list */}
                                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-sm md:text-base">Uzavřené zakázky & zakázkové listy</h3>
                                                <p className="text-xs text-slate-400 mt-0.5">Kompletní log realizací pro přiznání provizí. Procento provize se snižuje při překročení doporučených slev.</p>
                                            </div>
                                            <div className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl shadow-sm">
                                                Celkem: {monthOrders.length} zakázek
                                            </div>
                                        </div>

                                        {monthOrders.length === 0 ? (
                                            <div className="text-center py-16 text-slate-400 font-medium text-sm space-y-2">
                                                <div>📭 Nebyly nalezeny žádné uzavřené zakázky pro měsíc {selectedOzMonth}.</div>
                                                <p className="text-xs text-slate-400 font-normal">Jakmile dokončíte objednávku u klienta, objeví se ve vašich podkladech.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                                                            <th className="py-4 px-6 md:px-8">Datum</th>
                                                            <th className="py-4 px-4 font-mono">Číslo smlouvy</th>
                                                            <th className="py-4 px-4">Zákazník / Odběratel</th>
                                                            <th className="py-4 px-4 text-right">Fakturovaný obrat</th>
                                                            <th className="py-4 px-4 text-center">Sleva (%)</th>
                                                            <th className="py-4 px-4 text-center">Provize %</th>
                                                            <th className="py-4 px-4 text-right">Získaná Provize</th>
                                                            <th className="py-4 px-6 text-center">Akce</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 animate-none">
                                                        {monthOrders.map((o) => {
                                                            const orderCommValue = config.userType === 'fix' ? 0 : calculateOrderCommission(o.amount, o.discount, o.customCommissionPercent);
                                                            
                                                            // Determine percentage
                                                            let currentRateStr = `${baseRatePercent}%`;
                                                            if (o.customCommissionPercent !== undefined && o.customCommissionPercent !== null) {
                                                                currentRateStr = `${o.customCommissionPercent}%`;
                                                            } else if (o.discount > 60) currentRateStr = '0%';
                                                            else if (o.discount > 45) {
                                                                if (totalVolume <= 400000) currentRateStr = '3%';
                                                                else if (totalVolume <= 700000) currentRateStr = '5%';
                                                                else if (totalVolume <= 1000000) currentRateStr = '6%';
                                                                else currentRateStr = '7%';
                                                            } else if (o.discount >= 33) {
                                                                if (totalVolume <= 400000) currentRateStr = '6%';
                                                                else if (totalVolume <= 700000) currentRateStr = '8%';
                                                                else if (totalVolume <= 1000000) currentRateStr = '9%';
                                                                else currentRateStr = '10%';
                                                            }

                                                            return (
                                                                <tr key={o.id} className="hover:bg-slate-50/60 transition group">
                                                                    <td className="py-4 px-6 md:px-8 font-medium text-slate-500">{o.date}</td>
                                                                    <td className="py-4 px-4 font-mono font-bold text-indigo-600">{o.contractNumber}</td>
                                                                    <td className="py-4 px-4 font-semibold text-slate-900">
                                                                        <div>{o.customerName}</div>
                                                                        <span className="text-[10px] font-normal text-slate-400">{o.description}</span>
                                                                    </td>
                                                                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                                                                        {o.amount.toLocaleString()} Kč
                                                                    </td>
                                                                    <td className="py-4 px-4 text-center">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                            o.discount <= 20 
                                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                                : o.discount <= 32.9
                                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                                : o.discount <= 45
                                                                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        }`}>
                                                                            {o.discount}%
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 px-4 text-center font-bold text-indigo-700">
                                                                        {config.userType === 'fix' ? 'Fixní' : currentRateStr}
                                                                    </td>
                                                                    <td className="py-4 px-4 text-right font-black text-slate-900">
                                                                        {config.userType === 'fix' ? '0 Kč' : `${Math.round(orderCommValue).toLocaleString()} Kč`}
                                                                    </td>
                                                                    <td className="py-4 px-6 text-center">
                                                                        <button
                                                                            onClick={() => {
                                                                                setClaimTargetOrder(o);
                                                                                setClaimSubject(`Nesrovnalost provize u zakázky ${o.contractNumber}`);
                                                                                setIsClaimModalOpen(true);
                                                                            }}
                                                                            className="px-2.5 py-1 text-[10px] text-rose-600 font-bold border border-rose-200 hover:bg-rose-50 rounded-lg transition"
                                                                        >
                                                                            Rozporovat 🚨
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fines and bonuses display */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Section 1: Adjustments */}
                                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                            <h3 className="font-extrabold text-slate-900 text-xs md:text-sm border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                                                <Award size={16} className="text-amber-500" />
                                                Mimořádné odměny a stržené pokuty (MNG)
                                            </h3>
                                            
                                            {monthAdjustments.length === 0 ? (
                                                <div className="text-center py-10 text-slate-400 text-xs">Bez dodatečných manažerských zásahů a pokut v tomto měsíci.</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {monthAdjustments.map((a) => (
                                                        <div key={a.id} className={`p-4 rounded-xl border flex justify-between items-start ${
                                                            a.type === 'bonus' 
                                                                ? 'bg-emerald-50 text-emerald-950 border-emerald-100'
                                                                : 'bg-rose-50 text-rose-950 border-rose-100'
                                                        }`}>
                                                            <div>
                                                                <div className="text-xs font-bold">{a.reason}</div>
                                                                <span className="text-[10px] text-slate-400 font-medium block mt-1">{a.date}</span>
                                                            </div>
                                                            <span className={`text-sm font-extrabold font-mono ${a.type === 'bonus' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                                {a.type === 'bonus' ? '+' : '-'}{a.amount.toLocaleString()} Kč
                                                            </span>
                                                        </div>
                                                    ))}
                                                 </div>
                                            )}
                                        </div>

                                        {/* Section 2: Payouts audit */}
                                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                            <h3 className="font-extrabold text-slate-900 text-xs md:text-sm border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                                                <FileText size={16} className="text-indigo-600" />
                                                Historie vyplacených mezd za OZ činnost
                                            </h3>
                                            
                                            {ozData.payouts.filter(p => p.email.toLowerCase() === normEmail).length === 0 ? (
                                                <div className="text-center py-10 text-slate-400 text-xs">Zatím nebyly zaúčtovány žádné minulé měsíční výplaty.</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {ozData.payouts.filter(p => p.email.toLowerCase() === normEmail).map((p) => (
                                                        <div key={p.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs text-slate-700">
                                                            <div>
                                                                <span className="font-bold block py-0.5 px-2 bg-slate-200 text-slate-800 text-[10px] rounded w-max mb-1 uppercase tracking-wider">{p.month}</span>
                                                                <span className="text-slate-500 font-medium text-[10px]">Vyplaceno: {p.datePaid}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-extrabold text-slate-900 block">{p.totalPayout.toLocaleString()} Kč</span>
                                                                <span className="text-[9px] font-bold text-emerald-600">● Zaúčtováno / Vyplaceno</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* --- MOJE PROVIZE REKLAMACE MODAL --- */}
                {isClaimModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-900">
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 w-full max-w-lg shadow-2xl relative">
                            <button
                                onClick={() => {
                                    setIsClaimModalOpen(false);
                                    setClaimTargetOrder(null);
                                }}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-6">
                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-full">Helpdesk mzdových reklamací</span>
                                <h3 className="text-xl font-bold text-slate-900 mt-2">🚨 Založení reklamace mzdového plnění</h3>
                                <p className="text-xs text-slate-400 mt-1">Zadejte spor pro nesrovnalost u provize. Vytvoří to automatický tiket pro MNG & administrátora.</p>
                            </div>

                            <div className="space-y-4">
                                {claimTargetOrder && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                                        <div className="font-bold text-indigo-700">Parametry reklamované zakázky:</div>
                                        <div className="text-slate-700"><span className="font-bold text-slate-900">Odběratel:</span> {claimTargetOrder.customerName}</div>
                                        <div className="text-slate-700"><span className="font-bold text-slate-900">Smlouva:</span> {claimTargetOrder.contractNumber}</div>
                                        <div className="text-slate-700"><span className="font-bold text-slate-900">Měsíční objem:</span> {claimTargetOrder.amount.toLocaleString()} Kč (Sleva {claimTargetOrder.discount}%)</div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Předmět Reklamace</label>
                                    <input
                                        type="text"
                                        value={claimSubject}
                                        onChange={(e) => setClaimSubject(e.target.value)}
                                        placeholder="Vyberte jasný název sporu"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Slovní odůvodnění</label>
                                    <textarea
                                        value={claimText}
                                        onChange={(e) => setClaimText(e.target.value)}
                                        rows={5}
                                        placeholder="Popište přesně nesrovnalost (např. Sleva byla schválena managerem mimořádně, požaduji přiznání plné sazby...)"
                                        className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner"
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setIsClaimModalOpen(false);
                                            setClaimTargetOrder(null);
                                        }}
                                        className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                                    >
                                        Zrušit
                                    </button>
                                    <button
                                        onClick={handleClaimSubmit}
                                        disabled={claimSubmitting}
                                        className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-450 text-white text-xs font-bold rounded-xl transition flex justify-center items-center gap-2"
                                    >
                                        {claimSubmitting ? 'Odesílám...' : 'Odeslat reklamaci 📬'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SUPPORT TAB --- */}
                {activeTab === 'support' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Technická Podpora & Helpdesk</h2>
                            <p className="text-slate-500">Máte otázku ke platformě nebo obsahu projektu? Založte kanál a odpovíme vám bleskově.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Tickets Listing & Ticket Creation */}
                            <div className={`lg:col-span-1 space-y-6 bg-white border border-slate-200 rounded-2xl p-6 ${activeTicketId ? 'hidden lg:block' : 'block'}`}>
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800">Moje Lístky</h3>
                                    <button 
                                        onClick={() => setIsNewTicketOpen(!isNewTicketOpen)}
                                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition"
                                    >
                                        Nový lístek ➕
                                    </button>
                                </div>

                                {isNewTicketOpen && (
                                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Předmět / Problém</label>
                                            <input
                                                type="text"
                                                value={newTicketSubject}
                                                onChange={e => setNewTicketSubject(e.target.value)}
                                                placeholder="S čím potřebujete pomoci?"
                                                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setIsNewTicketOpen(false)}
                                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                                            >
                                                Zrušit
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (!newTicketSubject.trim()) {
                                                        notify('warning', 'Prázdný předmět', 'Napište prosím předmět dřív, než odešlete lístek.');
                                                        return;
                                                    }
                                                    if (onCreateTicket) {
                                                        onCreateTicket(newTicketSubject);
                                                        notify('success', 'Lístek vytvořen', 'Váš požadavek byl úspěšně zaregistrován.');
                                                        setNewTicketSubject('');
                                                        setIsNewTicketOpen(false);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                                            >
                                                Odeslat
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {tickets && tickets.filter(t => t.userId === user.id).length > 0 ? (
                                        tickets.filter(t => t.userId === user.id).map(ticket => (
                                            <button
                                                key={ticket.id}
                                                onClick={() => {
                                                    setActiveTicketId(ticket.id);
                                                    setTicketReply('');
                                                }}
                                                className={`w-full text-left p-4 rounded-xl border transition ${activeTicketId === ticket.id ? 'border-indigo-505 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <span className="font-bold text-xs text-slate-800 block line-clamp-1">{ticket.subject}</span>
                                                    <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                                        ticket.status === 'open' ? 'bg-indigo-100 text-indigo-800' :
                                                        ticket.status === 'closed' ? 'bg-slate-100 text-slate-500' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {ticket.status === 'open' ? 'Aktivní' : ticket.status === 'closed' ? 'Zavřeno' : 'Čeká'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                                    <span>Začátek doplňování</span>
                                                    <span>{new Date(ticket.createdAt).toLocaleDateString('cs-CZ')}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-400 text-xs">
                                            Nemáte žádné aktivní komunikační lístky.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ticket Detail Chat View */}
                            <div className={`lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden h-[500px] flex-col justify-between ${activeTicketId ? 'flex' : 'hidden lg:flex'}`}>
                                {activeTicketId && tickets.find(t => t.id === activeTicketId) ? (() => {
                                    const activeTicketObj = tickets.find(t => t.id === activeTicketId)!;
                                    return (
                                        <>
                                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-900">{activeTicketObj.subject}</h4>
                                                    <span className="text-[10px] text-slate-400 font-mono">ID Lístku: {activeTicketObj.id.slice(0, 8)}</span>
                                                </div>
                                                <button 
                                                    onClick={() => setActiveTicketId(null)}
                                                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded transition"
                                                >
                                                    Zavřít chat ❌
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar">
                                                {activeTicketObj.messages && activeTicketObj.messages.length > 0 ? (
                                                    activeTicketObj.messages.map((msg, index) => {
                                                        const isUser = msg.sender === 'user';
                                                        return (
                                                            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none text-slate-900'}`}>
                                                                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                                                                    <span className={`text-[8px] block text-right mt-1 font-mono ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-20 text-slate-400 text-xs">
                                                        Zatím nebyly zaslány žádné zprávy.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
                                                <input
                                                    type="text"
                                                    value={ticketReply}
                                                    onChange={e => setTicketReply(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && ticketReply.trim()) {
                                                            if (onReplyTicket) {
                                                                onReplyTicket(activeTicketObj.id, ticketReply);
                                                                setTicketReply('');
                                                                notify('success', 'Zpráva odeslána', 'Komentář byl odeslán našemu týmu.');
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Napište doplňující dotaz pro technickou podporu..."
                                                    className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-950 focus:outline-none focus:border-indigo-500 transition"
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (!ticketReply.trim()) return;
                                                        if (onReplyTicket) {
                                                            onReplyTicket(activeTicketObj.id, ticketReply);
                                                            setTicketReply('');
                                                            notify('success', 'Zpráva odeslána', 'Komentář byl odeslán našemu týmu.');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
                                                >
                                                    Poslat
                                                </button>
                                            </div>
                                        </>
                                    );
                                })() : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs p-6 text-center space-y-2">
                                        <MessageCircle size={36} className="opacity-30 mb-2"/>
                                        <p className="font-semibold text-slate-600">Není vybrán žádný lístek</p>
                                        <p>Vyberte lístek ze seznamu vlevo nebo založte nový a zahajte konverzaci.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- E-BOOKS TAB --- */}
                {activeTab === 'ebooks' && (
                    <div className="space-y-8 animate-fade-in font-sans">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Vzdělávání o obchodě Kvapy</h2>
                            <p className="text-slate-500">Klíčové rozvoje dovedností, prodejní příručky a interní video školení společnosti Kvapy.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {ebooks && ebooks.length > 0 ? ebooks.map(ebook => (
                                <div key={ebook.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                                    <div>
                                        <div className="h-48 bg-slate-100 relative">
                                            {ebook.coverImage ? (
                                                <img src={ebook.coverImage} className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-200">📖</div>
                                            )}
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block font-mono">{ebook.author || 'Módní experti Kvapy'}</span>
                                                <h3 className="font-bold text-slate-900 text-lg mt-0.5">{ebook.title}</h3>
                                            </div>
                                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{ebook.description}</p>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold font-mono">
                                                <BookOpen size={14}/>
                                                <span>Rozsah: {ebook.pages} stran</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-0">
                                        <button
                                            onClick={() => {
                                                notify('success', 'Stahování', `Příprava ke stažení e-booku: ${ebook.title}...`);
                                                window.open(ebook.downloadUrl || '#', '_blank');
                                            }}
                                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                                        >
                                            <Download size={14}/> Stáhnout Prodejní Příručku
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-20 text-slate-500">
                                    <FileText size={48} className="mx-auto mb-4 opacity-30"/>
                                    <p>V knihovně prozatím nejsou nahrány žádné e-booky.</p>
                                </div>
                            )}
                        </div>

                        {/* Video Training Section */}
                        <div className="pt-8 border-t border-slate-200">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">📺 Video nahrávky prodejních školení & webinářů</h2>
                                <p className="text-slate-500 text-sm">Záznamy z expertních mastermind workshopů společnosti Kvapy.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[
                                  {
                                    id: 'yt-1',
                                    title: 'Jak úspěšně vyjednávat se zákazníky: Psychologie obchodu',
                                    description: 'Klíčové principy překonávání námitek, psychologie tlaku a správné argumentace výhod na prodejní schůzce.',
                                    duration: '18:42',
                                    youtubeId: 'W3uQzFmI_t0',
                                    category: 'Prodejní dovednosti',
                                    logo: '🎯'
                                  },
                                  {
                                    id: 'yt-2',
                                    title: 'Mistry v uzavírání obchodů (Closing techniky)',
                                    description: 'Pokročilé vědomé i nevědomé techniky closingu pro úspěšné dotažení kontraktu z oboru distribuce.',
                                    duration: '24:15',
                                    youtubeId: 'b_Vp6q1n2oE',
                                    category: 'Uzavírání kontraktů',
                                    logo: '🤝'
                                  },
                                  {
                                    id: 'yt-3',
                                    title: 'Optimalizace tras a plánování schůzek v regionu',
                                    description: 'Jak zorganizovat svůj pracovní čas, ujet méně kilometrů, navštívit více partnerů a zefektivnit návštěvy poboček.',
                                    duration: '15:30',
                                    youtubeId: 'L_x6q3gY3oI',
                                    category: 'Efektivní organizace',
                                    logo: '📈'
                                  }
                                ].map(video => (
                                    <div key={video.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                                        <div className="p-6 space-y-4">
                                            <div className="h-40 bg-slate-900 rounded-2xl relative flex items-center justify-center text-5xl">
                                                <span>{video.logo}</span>
                                                <button 
                                                    onClick={() => setActiveYoutubeId(video.youtubeId)} 
                                                    className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center rounded-2xl group transition"
                                                >
                                                    <div className="w-14 h-14 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center text-white transition transform group-hover:scale-110 shadow-lg shadow-rose-600/30">
                                                        <Play size={24} className="ml-1 fill-white" />
                                                    </div>
                                                </button>
                                                <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded font-mono">
                                                    {video.duration}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{video.category}</span>
                                                <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-2">{video.title}</h3>
                                                <p className="text-slate-500 text-xs leading-relaxed mt-2 line-clamp-3">{video.description}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 pt-0">
                                            <button 
                                                onClick={() => setActiveYoutubeId(video.youtubeId)} 
                                                className="w-full py-2.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100/70 text-indigo-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                                            >
                                                <Play size={14}/> Spustit Video Školení
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive embedded player overlay for YouTube */}
                        {activeYoutubeId && (
                            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                                <div className="bg-black/95 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                                    <div className="p-4 bg-slate-900 flex justify-between items-center text-white border-b border-slate-800">
                                        <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5 font-mono">
                                            <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
                                            Přehrávač Školení Kvapy
                                        </span>
                                        <button 
                                            onClick={() => setActiveYoutubeId(null)} 
                                            className="p-1.5 hover:bg-slate-800 rounded-full text-white/70 hover:text-white transition"
                                        >
                                            <X size={20}/>
                                        </button>
                                    </div>
                                    <div className="relative aspect-video w-full">
                                        <iframe 
                                            width="100%" 
                                            height="100%" 
                                            src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1`} 
                                            title="YouTube video player" 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                        ></iframe>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}



                {/* --- BONUS TASKS TAB --- */}
                {activeTab === 'bonus' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Bonusové Výzvy & Úkoly</h2>
                            <p className="text-slate-500">Vyřešte náročnější reálné úkoly z praxe, doložte důkaz a získejte obří balík XP.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {bonusTasks && bonusTasks.length > 0 ? bonusTasks.map(task => {
                                const submissionObj = submissions?.find(sub => sub.taskId === task.id && sub.userId === user.id);
                                return (
                                    <div key={task.id} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition hover:border-slate-300">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-mono font-bold text-yellow-500 bg-yellow-105/50 px-2 py-1 rounded flex items-center gap-1">
                                                    <Zap size={11} fill="currentColor"/> +{task.rewardXP} XP
                                                </span>
                                                {task.deadline && (
                                                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                                        Uzávěrka: {new Date(task.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg mb-1">{task.title}</h3>
                                                <p className="text-slate-500 text-xs leading-relaxed">{task.description}</p>
                                            </div>

                                            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Forma odevzdání:</span>
                                                <span className="text-xs font-semibold text-indigo-700 capitalize">
                                                    {task.proofType === 'text' ? '📝 Textové vypracování' : 
                                                     task.proofType === 'link' ? '🔗 Odkaz na sdílený soubor' : 
                                                     '🖼️ Screenshot / Obrázek'}
                                                </span>
                                            </div>

                                            {/* Submission Area */}
                                            {submissionObj ? (
                                                <div className={`p-4 rounded-2xl border ${
                                                    submissionObj.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                                    submissionObj.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
                                                    'bg-amber-50 border-amber-200 text-amber-800'
                                                }`}>
                                                    <div className="flex gap-2 items-center mb-1 text-xs font-bold uppercase tracking-wider">
                                                        <CheckCircle size={14}/>
                                                        {submissionObj.status === 'approved' ? 'SCHVÁLENO 🎉' :
                                                         submissionObj.status === 'rejected' ? 'ZAMÍTNUTO ❌' :
                                                         'ODESLÁNO K POSOUZENÍ ⏳'}
                                                    </div>
                                                    <p className="text-[11px] leading-relaxed block italic mb-2">„{submissionObj.content}“</p>
                                                    {submissionObj.status === 'rejected' && (
                                                        <button 
                                                            onClick={() => setActiveTaskSubmission(task.id)}
                                                            className="text-xs font-black underline hover:text-red-950 flex items-center gap-1 block"
                                                        >
                                                            Odeslat novou opravu úkolu
                                                        </button>
                                                    )}
                                                </div>
                                            ) : activeTaskSubmission === task.id ? (
                                                <div className="bg-slate-50 p-4 border border-indigo-200 rounded-2xl space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Odevzdat řešení</label>
                                                        <textarea
                                                            value={submissionContent}
                                                            onChange={e => setSubmissionContent(e.target.value)}
                                                            rows={3}
                                                            placeholder={task.proofType === 'link' ? 'Odkaz (URL): https://docs.google.com/...' : 'Sem napište vypracování nebo odkaz na soubor...'}
                                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:border-indigo-500 outline-none resize-none"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setActiveTaskSubmission(null);
                                                                setSubmissionContent('');
                                                            }}
                                                            className="px-3 py-1 bg-slate-200 text-slate-600 rounded text-xs hover:bg-slate-300 font-semibold"
                                                        >
                                                            Storno
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if (!submissionContent.trim()) {
                                                                    notify('warning', 'Prázdný úkol', 'Vyplňte vypracování, než ho odešlete.');
                                                                    return;
                                                                }
                                                                if (onSubmitTask) {
                                                                    onSubmitTask(task.id, user.id, submissionContent);
                                                                    notify('success', 'Úkol odevzdán', 'Vaše odpověď byla uložena a čeká na ověření.');
                                                                    setActiveTaskSubmission(null);
                                                                    setSubmissionContent('');
                                                                }
                                                            }}
                                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                                                        >
                                                            Odeslat řešení 🚀
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setActiveTaskSubmission(task.id);
                                                        setSubmissionContent('');
                                                    }}
                                                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition animate-pulse"
                                                >
                                                    Vypracovat úkol 📝
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full text-center py-20 text-slate-500">
                                    <Gift size={48} className="mx-auto mb-4 opacity-30"/>
                                    <p>V systému aktuálně nejsou žádné bonusové výzvy.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* --- COMMUNITY TAB (NEW) --- */}
                {activeTab === 'community' && (
                    <div className="lg:h-[calc(100vh-160px)] h-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Active Sessions */}
                        <div className="lg:col-span-2 space-y-6 lg:overflow-y-auto overflow-y-visible custom-scrollbar pr-2">
                             <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-200 rounded-2xl p-6">
                                 <h2 className="text-2xl font-bold mb-2 text-slate-900">Mastermind & Sessions</h2>
                                 <p className="text-slate-600 text-sm">Připojte se k živým hovorům s mentory a ostatními pracovníky.</p>
                             </div>

                             <div className="space-y-4">
                                 {communitySessions && communitySessions.length > 0 ? communitySessions.map(session => (
                                     <div key={session.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-slate-300 transition">
                                          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white rounded-xl w-24 h-24 border border-slate-200">
                                              <span className="text-xs text-slate-500 uppercase font-bold">{new Date(session.date).toLocaleDateString('cs-CZ', {month: 'short'})}</span>
                                              <span className="text-3xl font-bold text-slate-900">{new Date(session.date).getDate()}</span>
                                              <span className="text-xs text-indigo-600">{new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <div className="flex-1">
                                              <h3 className="text-xl font-bold text-slate-900 mb-2">{session.topic}</h3>
                                              <p className="text-slate-500 text-sm mb-4">{session.description}</p>
                                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                                  <span className="flex items-center gap-1"><UsersIcon size={14}/> {session.attendees.length} / {session.maxAttendees}</span>
                                                  <span className="flex items-center gap-1"><UserIcon size={14}/> {session.hostName}</span>
                                              </div>
                                          </div>
                                          <div className="flex items-center">
                                              <button onClick={() => onJoinSession && onJoinSession(session.id)} className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition shadow-lg shadow-indigo-600/20">
                                                  Připojit se
                                              </button>
                                          </div>
                                     </div>
                                 )) : (
                                     <div className="text-center py-12 text-slate-500">Momentálně nejsou naplánované žádné sessions.</div>
                                 )}
                             </div>
                        </div>

                        {/* Right: Community Chat / Feed */}
                        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden h-[450px] lg:h-full">
                            <div className="p-4 border-b border-slate-200 bg-white/80">
                                <h3 className="font-bold flex items-center gap-2"><MessageCircle size={18} className="text-green-500"/> Komunitní Feed</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
                                {localFeed.map(post => (
                                    <div key={post.id} className="flex gap-3 animate-fade-in">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs border border-slate-300">
                                            {post.user.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <span className={`text-sm font-bold ${post.user === 'Admin' ? 'text-red-400' : 'text-slate-600'}`}>{post.user}</span>
                                                <span className="text-[10px] text-slate-500">{post.time}</span>
                                            </div>
                                            <div className={`text-sm p-3 rounded-xl rounded-tl-none ${post.pinned ? 'bg-indigo-50 text-indigo-900 border border-indigo-200' : 'bg-slate-100 text-slate-700'}`}>
                                                {post.text}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LEADERBOARD TAB (NEW) --- */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">Žebříček <span className="text-amber-500">ELITY QAPI</span></h2>
                            <p className="text-slate-500">Soutěžte s ostatními reprezentanty a získejte prestižní ocenění.</p>
                        </div>
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center bg-slate-100/50 border border-slate-200 p-4 rounded-2xl gap-3">
                            <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                📊 Zobrazeno: {leaderboardUsers.length} nejlepších reprezentantů
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">Filtrovat region:</span>
                                <select 
                                    value={leaderboardRegion} 
                                    onChange={e => setLeaderboardRegion(e.target.value)} 
                                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 transition cursor-pointer"
                                >
                                    <option value="all">🌍 Celá ČR (Všechny regiony)</option>
                                    {CZECH_REGIONS.map(reg => (
                                        <option key={reg} value={reg}>{reg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden max-w-4xl mx-auto shadow-2xl">
                            <div className="grid grid-cols-12 bg-white/80 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-6">Reprezentant</div>
                                <div className="col-span-3 text-right">XP / Pozice</div>
                                <div className="col-span-2 text-right">Odznak</div>
                            </div>
                            {leaderboardUsers.map((u, i) => (
                                <div key={u.id} className={`grid grid-cols-12 p-4 items-center border-b border-slate-200 hover:bg-slate-50 transition ${u.id === user.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}>
                                    <div className="col-span-1 text-center font-bold text-lg">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </div>
                                    <div className="col-span-6 flex items-center gap-3">
                                        {u.avatarUrl ? <img src={u.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-300"/> : <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase border border-slate-300">{u.name?.charAt(0) || u.email.charAt(0)}</div>}
                                        <div>
                                            <div className={`font-bold ${u.id === user.id ? 'text-indigo-600' : 'text-slate-900'}`}>{u.name || 'Neznámý'}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <span>📍 {u.region || 'Karlovy Vary'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <div className="font-mono text-yellow-500 font-bold">{u.xp.toLocaleString()} XP</div>
                                        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                            {u.level === 2 ? 'Senior' : u.level >= 3 ? 'Expert' : 'Junior'}
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right flex justify-end">
                                        {u.role === 'vip' && <Crown size={18} className="text-yellow-500"/>}
                                        {u.role === 'premium' && <Gem size={18} className="text-violet-600"/>}
                                        {u.role === 'admin' && <Shield size={18} className="text-red-500"/>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- INVENTORY & SHOP TAB (UPDATED) --- */}
                {activeTab === 'artifacts' && (
                    <div className="space-y-12">
                        {/* Current Inventory */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Váš Inventář</h2>
                                <div className="px-4 py-2 bg-white rounded-lg text-sm text-yellow-500 font-bold border border-yellow-500/20">
                                    {user.xp} XP (Kreditů)
                                </div>
                            </div>
                            {user.inventory.length === 0 ? (
                                <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl">
                                    <Package size={48} className="mx-auto text-slate-500 mb-4"/>
                                    <h3 className="text-lg font-bold text-slate-500">Prázdný inventář</h3>
                                    <p className="text-slate-500">Nakupte předměty v obchodě níže.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {user.inventory.map((item, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 relative group hover:border-indigo-200 transition">
                                            <div className="absolute top-0 right-0 p-4">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                                                    item.rarity === 'legendary' ? 'bg-amber-100 text-yellow-500 border border-yellow-500/20' : 
                                                    item.rarity === 'rare' ? 'bg-violet-100 text-violet-600 border border-purple-500/20' : 
                                                    'bg-slate-100 text-slate-500'
                                                }`}>{item.rarity}</span>
                                            </div>
                                            <div className="text-4xl mb-4">{item.image}</div>
                                            <h3 className="font-bold text-slate-900 mb-2">{item.name}</h3>
                                            <p className="text-xs text-slate-500 h-10 mb-4">{item.description}</p>
                                            <div className="flex items-center justify-between mt-4 border-t border-slate-200 pt-4">
                                                <span className="text-xs text-slate-500">Množství: {item.quantity}x</span>
                                                {item.type === 'consumable' && (
                                                    <button onClick={() => onUseArtifact && onUseArtifact(item.id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition">
                                                        Použít
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* XP SHOP */}
                        <div className="border-t border-slate-200 pt-12">
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><ShoppingBag className="text-yellow-500"/> Obchod za Kredity</h2>
                            <p className="text-slate-500 mb-8">Vyměňte své tvrdě vydřené XP za boostery a odměny.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {(artifacts || []).map((item, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 relative group hover:border-amber-300 hover:shadow-md transition">
                                        <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-slate-100 uppercase text-slate-500">{item.rarity}</div>
                                        <div className="text-4xl mb-4">{item.image}</div>
                                        <h3 className="font-bold text-slate-900 mb-2">{item.name}</h3>
                                        <p className="text-xs text-slate-500 h-10 mb-4">{item.description}</p>
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <button 
                                                onClick={() => handleBuyItem(item)}
                                                className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${
                                                    user.xp >= (item.price || 0) 
                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                                                    : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                                                }`}
                                            >
                                                {item.price} XP {user.xp >= (item.price || 0) ? '' : '(Nedostatek)'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VIP ZONE TAB (NEW) --- */}
                {activeTab === 'vip-zone' && (
                    <div className="space-y-8 relative overflow-hidden">
                        {/* Gold Glow Background */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] -z-10"></div>
                        
                        <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-200 rounded-3xl p-12 text-center relative overflow-hidden shadow-sm">
                            <div className="relative z-10">
                                <Crown size={64} className="mx-auto text-amber-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                                <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Vítejte ve <span className="text-amber-600">VIP LOUNGE</span></h2>
                                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                                    Tady se odděluje zrno od plev. Máte přístup k exkluzivním dealům, kontaktům a strategiím, které nejsou veřejné.
                                </p>
                            </div>
                            {/* Decorative particles */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                                <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                                <div className="absolute bottom-20 right-20 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-amber-200 rounded-2xl p-6 hover:bg-amber-50/40 transition group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><UsersIcon size={24}/></div>
                                    <ExternalLink size={16} className="text-slate-400 group-hover:text-amber-600"/>
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-2">Deal Room Access</h3>
                                <p className="text-slate-500 text-sm">Vstupte do privátní skupiny na Telegramu pouze pro VIP členy, kde sdílíme investiční příležitosti.</p>
                            </div>
                            <div className="bg-white border border-amber-200 rounded-2xl p-6 hover:bg-amber-50/40 transition group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Video size={24}/></div>
                                    <Play size={16} className="text-slate-400 group-hover:text-amber-600"/>
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-2">Mastermind Záznamy</h3>
                                <p className="text-slate-500 text-sm">Archiv uzavřených Zoom callů s hosty, kteří generují 8-ciferné obraty.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB (UPDATED) --- */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <h2 className="text-2xl font-bold">Nastavení Profilu</h2>
                        
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 relative">
                            <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
                                <div 
                                    onClick={() => setIsAvatarPickerOpen(true)}
                                    className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-500 border-2 border-dashed border-slate-300 cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition relative group overflow-hidden"
                                >
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover"/>
                                    ) : (
                                        <>{user.name?.charAt(0) || user.email.charAt(0)}</>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <Camera size={24} className="text-slate-900"/>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{user.email}</h3>
                                    <p className="text-slate-500 text-sm">Role: <span className="uppercase text-indigo-600 font-bold">{user.role}</span></p>
                                    {Array.isArray(user.positions) && user.positions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {user.positions.map(pid => {
                                                const p = QHUB_POSITIONS.find(q => q.id === pid);
                                                if (!p) return null;
                                                const colorMap: Record<string, string> = {
                                                    indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
                                                    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                    amber:   'bg-amber-50 text-amber-700 border-amber-200',
                                                    violet:  'bg-violet-50 text-violet-700 border-violet-200',
                                                    slate:   'bg-slate-50 text-slate-700 border-slate-200',
                                                };
                                                return (
                                                    <span key={pid} className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${colorMap[p.color] || colorMap.slate}`}>
                                                        {p.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isAvatarPickerOpen && (
                                <motion.div initial={{opacity:0, y: -10}} animate={{opacity:1, y:0}} className="bg-white border border-slate-200 p-4 rounded-xl absolute top-32 left-8 z-20 shadow-2xl w-64">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-500">Vyberte Avatar</span>
                                        <button onClick={() => setIsAvatarPickerOpen(false)}><X size={14}/></button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PRESET_AVATARS.map((url, i) => (
                                            <button key={i} onClick={() => handleAvatarSelect(url)} className="w-10 h-10 rounded-full overflow-hidden border border-transparent hover:border-indigo-500 transition">
                                                <img src={url} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Jméno</label>
                                    <input type="text" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:border-indigo-500 transition outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Telefon</label>
                                    <input type="text" value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:border-indigo-500 transition outline-none"/>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Bio</label>
                                    <textarea value={settingsForm.bio} onChange={e => setSettingsForm({...settingsForm, bio: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:border-indigo-500 transition outline-none h-24 resize-none"/>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Pracovní pozice (můžete zvolit více)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {QHUB_POSITIONS.map(p => {
                                            const active = settingsForm.positions.includes(p.id);
                                            const colorMap: Record<string, string> = {
                                                indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
                                                emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                amber:   'bg-amber-50 text-amber-700 border-amber-200',
                                                violet:  'bg-violet-50 text-violet-700 border-violet-200',
                                                slate:   'bg-slate-50 text-slate-700 border-slate-200',
                                            };
                                            return (
                                                <button
                                                    type="button"
                                                    key={p.id}
                                                    onClick={() => {
                                                        const next = active
                                                            ? settingsForm.positions.filter(x => x !== p.id)
                                                            : [...settingsForm.positions, p.id];
                                                        setSettingsForm({ ...settingsForm, positions: next });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                                        active
                                                            ? (colorMap[p.color] || colorMap.slate) + ' ring-2 ring-offset-1 ring-indigo-300'
                                                            : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                                                    }`}
                                                >
                                                    {active ? '✓ ' : ''}{p.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settingsForm.isPublicProfile ? 'bg-green-600' : 'bg-slate-200'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${settingsForm.isPublicProfile ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={settingsForm.isPublicProfile} onChange={e => setSettingsForm({...settingsForm, isPublicProfile: e.target.checked})}/>
                                    <span className="text-sm text-slate-500">Veřejný profil (viditelný v žebříčku)</span>
                                </label>
                            </div>

                            <button onClick={handleSaveSettings} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20">Uložit Změny</button>
                        </div>
                    </div>
                )}

                {/* ... (Challenges, Courses, Quizzes, Mentoring, Certificates remain the same) ... */}
                {/* Omitted for brevity: They are included in the logic above through ... */}
                
                </>
            )}

            {/* ... (Course Player with Notes Feature) ... */}
            <AnimatePresence>
               {activeCourseId && !isExpired && (
                  <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-50 flex">
                      {/* ... (Course Player Logic - Same as before) ... */}
                      {(() => {
                          const course = courses.find(c => c.id === activeCourseId);
                          if(!course) return null;
                          const flatLessons = course.modules.flatMap(m => m.lessons);
                          const currentLesson = activeLessonId ? flatLessons.find(l => l.id === activeLessonId) : flatLessons[0];
                          const currentLessonIndex = flatLessons.findIndex(l => l.id === currentLesson?.id);
                          const isCompleted = user.courseProgress.find(p => p.courseId === course.id)?.completedLessonIds.includes(currentLesson?.id || '');
                          
                          const nextLesson = currentLessonIndex < flatLessons.length - 1 ? flatLessons[currentLessonIndex + 1] : null;

                          return (
                              <>
                                {/* Syllabus Sidebar (Desktop) */}
                                <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full hidden lg:flex">
                                    <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                                        <button onClick={() => setActiveCourseId(null)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
                                        <h3 className="font-bold truncate">{course.title}</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {course.modules.map(mod => (
                                            <div key={mod.id} className="border-b border-slate-200">
                                                <div className="p-4 bg-white/80 font-bold text-sm text-slate-600">{mod.title}</div>
                                                <div>
                                                    {mod.lessons.map(lesson => {
                                                        const lessonCompleted = user.courseProgress.find(p => p.courseId === course.id)?.completedLessonIds.includes(lesson.id);
                                                        const isActive = currentLesson?.id === lesson.id;
                                                        return (
                                                            <div 
                                                                key={lesson.id} 
                                                                onClick={() => { setActiveLessonId(lesson.id); setLessonQuizState({step:'start',currentQuestionIndex:0,answers:{},score:0,passed:false}); }}
                                                                className={`p-3 pl-6 flex items-center gap-3 cursor-pointer text-sm hover:bg-slate-100 transition ${isActive ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500 font-medium' : 'text-slate-600'} ${lessonCompleted ? 'opacity-50' : ''}`}
                                                            >
                                                                {lessonCompleted ? <CheckCircle size={14} className="text-green-500"/> : (lesson.type === 'video' ? <Play size={14}/> : lesson.type === 'quiz' ? <HelpCircle size={14}/> : <FileText size={14}/>)}
                                                                <span className="truncate">{lesson.title}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Syllabus Sidebar (Mobile & Tablet overlay drawer) */}
                                <AnimatePresence>
                                    {isPlayerLessonsOpen && (
                                        <div className="fixed inset-0 z-[110] lg:hidden flex">
                                            <motion.div 
                                                initial={{ opacity: 0 }} 
                                                animate={{ opacity: 0.5 }} 
                                                exit={{ opacity: 0 }}
                                                onClick={() => setPlayerLessonsOpen(false)}
                                                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
                                            />
                                            <motion.div 
                                                initial={{ x: '-100%' }} 
                                                animate={{ x: 0 }} 
                                                exit={{ x: '-100%' }} 
                                                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                                                className="relative w-80 max-w-[calc(100vw-3rem)] h-full bg-white flex flex-col shadow-2xl z-10"
                                            >
                                                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                                    <h3 className="font-bold truncate text-slate-950 text-sm">Osnova Kurzu</h3>
                                                    <button onClick={() => setPlayerLessonsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={16}/></button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                    {course.modules.map(mod => (
                                                        <div key={mod.id} className="border-b border-slate-200">
                                                            <div className="p-4 bg-slate-50 font-bold text-xs text-slate-500 uppercase tracking-wider">{mod.title}</div>
                                                            <div>
                                                                {mod.lessons.map(lesson => {
                                                                    const lessonCompleted = user.courseProgress.find(p => p.courseId === course.id)?.completedLessonIds.includes(lesson.id);
                                                                    const isActive = currentLesson?.id === lesson.id;
                                                                    return (
                                                                        <div 
                                                                            key={lesson.id} 
                                                                            onClick={() => { setActiveLessonId(lesson.id); setPlayerLessonsOpen(false); setLessonQuizState({step:'start',currentQuestionIndex:0,answers:{},score:0,passed:false}); }}
                                                                             className={`p-3.5 pl-6 flex items-center gap-3 cursor-pointer text-sm hover:bg-slate-100 transition ${isActive ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500 font-medium' : 'text-slate-600'} ${lessonCompleted ? 'opacity-50' : ''}`}
                                                                        >
                                                                            {lessonCompleted ? <CheckCircle size={14} className="text-green-500 shrink-0"/> : (lesson.type === 'video' ? <Play size={14} className="shrink-0"/> : lesson.type === 'quiz' ? <HelpCircle size={14} className="shrink-0"/> : <FileText size={14} className="shrink-0"/>)}
                                                                            <span className="truncate">{lesson.title}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>

                                <div className="flex-1 bg-slate-900 flex flex-col relative">
                                    <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setActiveCourseId(null)} className="text-slate-500 p-2 hover:bg-slate-100 rounded-lg shrink-0"><ArrowLeft size={16}/></button>
                                            <button 
                                                onClick={() => setPlayerLessonsOpen(true)} 
                                                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-250 rounded-lg text-xs font-bold transition shrink-0"
                                            >
                                                <Menu size={14} /> Lekce
                                            </button>
                                            <span className="text-sm font-bold text-slate-800 truncate hidden md:block">{currentLesson?.title}</span>
                                        </div>
                                        <button 
                                            onClick={() => setIsNotesOpen(!isNotesOpen)} 
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition shrink-0 ${isNotesOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                                        >
                                            <Edit3 size={16}/> Poznámky
                                        </button>
                                    </div>
                                    <div className="flex-1 flex overflow-hidden relative bg-slate-50">
                                        <div className="flex-1 flex items-center justify-center p-3 sm:p-8 overflow-y-auto">
                                            {currentLesson && (
                                                currentLesson.type === 'video' ? (
                                                    <div className="w-full max-w-5xl space-y-4">
                                                        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                                                            <iframe src={currentLesson.content} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                                                        </div>
                                                        {currentLesson.description && (
                                                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Popis Lekce</h4>
                                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{currentLesson.description}</p>
                                                            </div>
                                                        )}
                                                        {currentLesson.hasWatchConstraint && !watchComplete && (
                                                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 text-sm flex items-center justify-between shadow-xs">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="p-2 bg-amber-500 text-white rounded-lg animate-pulse">
                                                                        <Clock size={16}/>
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold">Odemknutí lekce aktivní</div>
                                                                        <div className="text-xs text-amber-600/90 font-medium font-sans">Sledujte video po zadanou dobu, aby se lekce odemkla.</div>
                                                                    </div>
                                                                </div>
                                                                <span className="font-mono font-black text-blue-900 bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-lg text-lg tracking-wider min-w-[50px] text-center">
                                                                    {watchTimeLeft}s
                                                                </span>
                                                            </div>
                                                        )}
                                                        {currentLesson.hasWatchConstraint && watchComplete && (
                                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5 shadow-xs">
                                                                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                                                                    <CheckCircle size={16}/>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold">Časový limit splněn!</div>
                                                                    <div className="text-xs text-emerald-600/90 font-medium">Nyní můžete lekci kliknutím dole dokončit.</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : currentLesson.type === 'text' ? (
                                                    <div className="max-w-4xl w-full bg-white p-5 sm:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-y-auto">
                                                        <div className="border-b border-slate-100 pb-6 mb-8 text-center">
                                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Textová Lekce</span>
                                                            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">{currentLesson.title}</h1>
                                                            {currentLesson.description && <p className="text-sm text-slate-500 mt-1">{currentLesson.description}</p>}
                                                        </div>
                                                        <div className="prose max-w-none text-slate-700 font-sans text-base leading-relaxed">
                                                            {renderMarkdown(currentLesson.content)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="max-w-3xl w-full">
                                                        {lessonQuizState.step === 'start' && (
                                                            <div className="text-center bg-white p-6 sm:p-12 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl">
                                                                <Brain size={64} className="mx-auto mb-6 text-violet-600 animate-bounce"/>
                                                                <h2 className="text-3xl font-bold mb-3 text-slate-900">Kvíz k Lekci</h2>
                                                                <p className="text-slate-500 mb-8 max-w-md mx-auto">Ověřte své znalosti z této lekce k zisku certifikátu a postupu dál.</p>
                                                                <button onClick={() => setLessonQuizState(prev => ({...prev, step: 'playing'}))} className="px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-white transition shadow-lg shadow-violet-600/20 active:scale-95">Spustit Kvíz</button>
                                                            </div>
                                                        )}
                                                        {lessonQuizState.step === 'playing' && currentLesson.questions && (
                                                            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <span className="text-sm text-slate-500 font-medium">Otázka {lessonQuizState.currentQuestionIndex + 1} / {currentLesson.questions.length}</span>
                                                                    <span className="text-xs font-bold px-3 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full">Kvíz Lekce</span>
                                                                </div>
                                                                <h3 className="text-xl font-bold mb-8 text-slate-900">{currentLesson.questions[lessonQuizState.currentQuestionIndex].question}</h3>
                                                                
                                                                {/* Render based on Type of Question */}
                                                                {(() => {
                                                                    const currentQ = currentLesson.questions[lessonQuizState.currentQuestionIndex];
                                                                    const qType = currentQ.type || 'choice';
                                                                    
                                                                    if (qType === 'text-fill') {
                                                                        return (
                                                                            <div className="space-y-4 mb-8">
                                                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Odpověď (doplňte text bez ohledu na velikost písmen)</label>
                                                                                <input 
                                                                                    type="text" 
                                                                                    placeholder="Zadejte vaši odpověď..." 
                                                                                    value={lessonQuizState.answers[currentQ.id] || ''} 
                                                                                    onChange={e => setLessonQuizState(prev => ({ ...prev, answers: { ...prev.answers, [currentQ.id]: e.target.value } }))}
                                                                                    className="w-full p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 font-medium"
                                                                                />
                                                                            </div>
                                                                        );
                                                                    }
                                                                    
                                                                    // Standard multi-choice or true-false
                                                                    const optionsToRender = qType === 'true-false' ? ['Pravda', 'Nepravda'] : currentQ.options;
                                                                    return (
                                                                        <div className="space-y-3 mb-8">
                                                                            {optionsToRender.map((opt, oIdx) => {
                                                                                const isSelected = lessonQuizState.answers[currentQ.id] === oIdx;
                                                                                return (
                                                                                    <button 
                                                                                        key={oIdx} 
                                                                                        onClick={() => handleLessonQuizAnswer(currentQ.id, oIdx)} 
                                                                                        className={`w-full p-4 text-left rounded-xl border transition flex items-center justify-between ${
                                                                                            isSelected 
                                                                                            ? 'bg-violet-50 border-purple-500 text-purple-900 font-semibold' 
                                                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                                                        }`}
                                                                                    >
                                                                                        <span>{opt}</span>
                                                                                        {isSelected && <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">✓</div>}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                
                                                                <div className="flex justify-between border-t border-slate-100 pt-6">
                                                                     <button onClick={() => setLessonQuizState(prev => ({...prev, currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1)}))} disabled={lessonQuizState.currentQuestionIndex === 0} className="text-slate-500 font-bold disabled:opacity-50">Předchozí</button>
                                                                     {lessonQuizState.currentQuestionIndex < (currentLesson.questions.length - 1) ? (
                                                                         <button onClick={() => setLessonQuizState(prev => ({...prev, currentQuestionIndex: prev.currentQuestionIndex + 1}))} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition">Další</button>
                                                                     ) : (
                                                                         <button onClick={() => submitLessonQuiz(currentLesson.questions!)} className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 shadow-md transition shadow-green-600/10">Vyhodnotit</button>
                                                                     )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {lessonQuizState.step === 'result' && (
                                                            <div className="text-center bg-white p-6 sm:p-12 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl">
                                                                <div className="mb-6 inline-flex p-4 rounded-full bg-slate-50 border border-slate-100">
                                                                    {lessonQuizState.passed ? <Award size={48} className="text-green-500"/> : <X size={48} className="text-red-500"/>}
                                                                </div>
                                                                <h2 className="text-3xl font-bold mb-2 text-slate-900">{lessonQuizState.passed ? 'Skvělá práce, splněno!' : 'Zkuste to znovu'}</h2>
                                                                <p className="text-slate-500 mb-8 max-w-md mx-auto">Váš výsledek: <span className={lessonQuizState.passed ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{lessonQuizState.score}%</span> (pro úspěch potřebujete alespoň 70%)</p>
                                                                {lessonQuizState.passed ? (
                                                                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl mb-4 text-sm font-semibold border border-emerald-100 max-w-sm mx-auto">Lekce byla označena jako splněná.</div>
                                                                ) : (
                                                                    <button onClick={() => setLessonQuizState({step: 'start', currentQuestionIndex: 0, answers: {}, score: 0, passed: false})} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition">Spustit znovu</button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {/* Notes Sidebar */}
                                        <AnimatePresence>
                                            {isNotesOpen && (
                                                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute right-0 top-0 h-full w-full sm:w-80 bg-white border-l border-slate-200 z-[120] flex flex-col shadow-2xl">
                                                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                                                        <h3 className="font-bold text-sm flex items-center gap-2"><StickyNote size={16}/> Moje Poznámky</h3>
                                                        <button onClick={() => setIsNotesOpen(false)}><X size={16}/></button>
                                                    </div>
                                                    <div className="flex-1 p-4">
                                                        <textarea 
                                                            value={currentNote}
                                                            onChange={e => setCurrentNote(e.target.value)}
                                                            className="w-full h-full bg-transparent resize-none outline-none text-sm text-slate-600 placeholder-gray-600"
                                                            placeholder="Pište si poznámky k této lekci..."
                                                        />
                                                    </div>
                                                    <div className="p-4 border-t border-slate-200">
                                                        <button onClick={handleSaveNote} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-bold text-white">Uložit Poznámky</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-8">
                                        <div className="text-sm text-slate-500 hidden md:block">{currentLesson?.title}</div>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => onCourseProgress(course.id, currentLesson!.id)}
                                                disabled={
                                                    (currentLesson?.type === 'quiz' && !lessonQuizState.passed && !isCompleted) ||
                                                    (currentLesson?.type === 'video' && currentLesson?.hasWatchConstraint && !watchComplete && !isCompleted)
                                                }
                                                className={`px-6 py-2.5 font-bold rounded-xl flex items-center gap-2 transition ${
                                                    ((currentLesson?.type === 'quiz' && !lessonQuizState.passed && !isCompleted) ||
                                                     (currentLesson?.type === 'video' && currentLesson?.hasWatchConstraint && !watchComplete && !isCompleted))
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                                    : 'bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-600/10'
                                                }`}
                                            >
                                                <CheckCircle size={18}/> 
                                                {isCompleted 
                                                    ? 'Dokončeno' 
                                                    : (currentLesson?.type === 'video' && currentLesson?.hasWatchConstraint && !watchComplete)
                                                        ? `Sledujte video (${watchTimeLeft}s)`
                                                        : 'Označit jako dokončené'
                                                }
                                            </button>
                                            {nextLesson && isCompleted && (
                                                <button 
                                                    onClick={() => { setActiveLessonId(nextLesson.id); setLessonQuizState({step:'start',currentQuestionIndex:0,answers:{},score:0,passed:false}); }}
                                                    className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-slate-800 transition"
                                                >
                                                    Další lekce <ArrowRight size={18}/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                              </>
                          );
                      })()}
                  </MotionDiv>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;