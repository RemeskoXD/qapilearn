import React from 'react';

export type UserRole = 'obchodnik' | 'technik' | 'team_leader' | 'linka' | 'ostatni' | 'admin';

// Pracovní pozice v Q-Hub – uživatel jich může mít víc najednou.
export type QhubPosition = 'technik' | 'prodejce' | 'team_leader' | 'linka' | 'ostatni';

export const QHUB_POSITIONS: { id: QhubPosition; label: string; color: string }[] = [
  { id: 'technik',     label: 'Technik',     color: 'indigo' },
  { id: 'prodejce',    label: 'Prodejce',    color: 'emerald' },
  { id: 'team_leader', label: 'Team Leader', color: 'amber' },
  { id: 'linka',       label: 'Linka',       color: 'violet' },
  { id: 'ostatni',     label: 'Ostatní',     color: 'slate' },
];

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  globalBanner: string; // Message shown to all users
  version: string;
  enableCourses?: boolean;
  enableQuizzes?: boolean;
  enableMentoring?: boolean;
  enableCalendar?: boolean;
  enableEbooks?: boolean;
  enableStreams?: boolean;
  enableBonusTasks?: boolean;
  }

export interface Message {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  hasAttachment?: boolean;
  attachmentName?: string;
}

export interface LevelRequirement {
  level: number;
  xpRequired: number;
  title: string; // e.g. "Novice", "Expert"
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  image: string; // URL or emoji
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'badge' | 'consumable' | 'ticket';
  quantity: number;
  price?: number; // Cost in XP
  effectType?: 'xp_boost';
  effectDuration?: number; // hours
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  targetCount: number; // e.g., 100 pushups
  rewardXP: number;
  rewardArtifactId?: string;
  pdfUrl?: string;
}

export interface UserChallengeProgress {
  challengeId: string;
  currentCount: number;
  completed: boolean;
  lastUpdated: string; // ISO date
  history: boolean[]; // Last 7 days [true, false, true...]
}

export interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  studentName: string;
  issueDate: string;
  code: string; // Unique hash
  qrCodeUrl?: string; // URL to QR code image
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  type: 'webinar' | 'workshop' | 'meetup';
  link?: string;
  registeredUserIds: string[];
  // New Admin Features
  maxAttendees?: number;
  price?: number; // CZK, if 0 then free
  isFreeForVip?: boolean;
  isFreeForPremium?: boolean;
}

export interface Stream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  streamUrl: string; // YouTube/Vimeo embed
  date: string;
  status: 'upcoming' | 'live' | 'ended';
  viewers: number;
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  downloadUrl: string;
  pages: number;
  author: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  hourlyRate: number; // In XP or CZK? Assuming free for premium/vip mostly
  isAvailable?: boolean; // New: Availability toggle
  nextAvailableDate?: string; // New: Optional override
}

export interface Booking {
  id: string;
  mentorId: string;
  userId: string;
  userEmail: string;
  date: string; // ISO
  status: 'pending' | 'approved' | 'rejected';
  note: string; // User note
  meetingLink?: string;
  // New Admin Features
  adminNote?: string; // Internal note
  rating?: number; // 1-5 stars internal rating of the student/session
}

export interface CommunitySession {
  id: string;
  hostUserId: string;
  hostName: string;
  topic: string;
  date: string;
  description: string;
  maxAttendees: number;
  attendees: string[]; // user IDs
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  messages: {
    sender: 'user' | 'support';
    text: string;
    timestamp: string;
  }[];
}

export interface BonusTask {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  deadline?: string;
  proofType: 'text' | 'image' | 'link';
}

export interface BonusSubmission {
  id: string;
  taskId: string;
  userId: string;
  content: string; // Text or URL
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

// --- LMS TYPES ---

export type LessonType = 'video' | 'text' | 'quiz';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content: string; // URL for video, Markdown for text, JSON for quiz
  duration: number; // minutes
  isMandatory: boolean;
  questions?: QuizQuestion[]; // If type is quiz
  description?: string; // Short description/subtitle for general lessons
  videoWatchTime?: number; // Mandatory watch time in seconds before lesson is marked complete
  hasWatchConstraint?: boolean; // True if the student must watch the video for videoWatchTime seconds
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  type?: 'choice' | 'text-fill' | 'true-false'; // default to choice
  correctTextAnswer?: string; // for 'text-fill' (case insensitive match)
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  level: UserRole; // Minimum role required
  author: string;
  modules: CourseModule[];
  totalDuration: number; // minutes
  published: boolean;
  xpReward: number; // Points for completion
  learningPoints: string[]; // Bullet points "What you'll learn"
}

export interface UserCourseProgress {
  courseId: string;
  completedLessonIds: string[];
  lastPlayedLessonId?: string;
  isCompleted: boolean;
  quizScores: Record<string, number>; // lessonId -> score
}

// --- QUIZ SYSTEM TYPES ---

export interface Quiz {
  id: string;
  title: string;
  description: string;
  image: string;
  level: UserRole;
  xpReward: number;
  passingScore: number; // Percentage (0-100)
  questions: QuizQuestion[];
  published: boolean;
}

export interface UserQuizHistory {
  quizId: string;
  score: number; // Percentage
  passed: boolean;
  completedAt: string;
  attempts: number;
}

export interface AdminNote {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface DashboardMessage {
  text: string;
  imageUrl?: string;
  pdfUrl?: string; // Link to a PDF file
  active: boolean;
}

export interface ProfitEntry {
    id: string;
    date: string; // ISO Date "2024-05-20"
    amount: number;
    note?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  region?: string;
  role: UserRole;
  positions: QhubPosition[]; // pracovní pozice (multi-select)
  level: number;
  xp: number;
  xpBoostUntil?: string; // Date ISO string
  planExpires?: string; // Date ISO string
  isBanned: boolean;
  joinDate: string;
  lastLogin: string;
  bio?: string;
  avatarUrl?: string;
  
  // Stats
  financialProfit: number; // For the leaderboard (total)
  profitHistory: ProfitEntry[]; // New: Track monthly progress
  isPublicProfile: boolean; // For leaderboard visibility

  // Gamification
  inventory: Artifact[];
  activeChallenges: UserChallengeProgress[];
  certificates: Certificate[];
  
  // LMS
  courseProgress: UserCourseProgress[];
  lessonNotes: Record<string, string>; // lessonId -> note text
  quizHistory: UserQuizHistory[];
  
  // Admin & Communication
  adminNotes: AdminNote[];
  dashboardMessage?: DashboardMessage;
  messages: Message[];
}