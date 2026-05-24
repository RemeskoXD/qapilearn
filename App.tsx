import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Info,
  Loader2,
} from 'lucide-react';

import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import { DbCheckPage } from './components/DbCheckPage';

import { api } from './lib/api';
import { useCollection, useResource } from './lib/useQhubData';
import { syncCollection } from './lib/sync';

import type {
  User,
  Challenge,
  Artifact,
  CalendarEvent,
  BonusTask,
  BonusSubmission,
  SystemSettings,
  Course,
  Quiz,
  Mentor,
  Booking,
  Ebook,
  Stream,
  SupportTicket,
  LevelRequirement,
  CommunitySession,
  ToastMessage,
  Message,
  Certificate,
} from './types';

const MotionDiv = motion.div as any;

const DEFAULT_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  allowRegistrations: true,
  globalBanner: '',
  version: '1.0.0 Q-Hub',
};

const App: React.FC = () => {
  const [bootLoading, setBootLoading] = useState(true);
  const [view, setView] = useState<'login' | 'dashboard' | 'admin' | 'verify' | 'db-check'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- TOAST ---
  const notify = useCallback(
    (type: ToastMessage['type'], title: string, message: string) => {
      const id = Math.random().toString(36).substring(2, 11);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        5000
      );
    },
    []
  );

  // --- AUTH BOOT ---
  useEffect(() => {
    (async () => {
      // Vždy začínáme na přihlašovací obrazovce (login) na / s vyčištěným hashem, aby se uživateli hned ukázal login na čisté adrese
      if (window.location.hash === '#db-check') {
        window.location.hash = '';
      }
      setView('login');
      setBootLoading(false);
    })();
  }, []);

  // --- HASH CHANGE LISTENER ---
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#db-check') {
        setView('db-check');
      } else if (view === 'db-check') {
        setView(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'dashboard') : 'login');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser, view]);

  // --- DATA ---
  const isLogged = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  const settingsRes = useResource<SystemSettings>('/settings');
  const courses = useCollection<Course>(isLogged ? '/courses' : null);
  const quizzes = useCollection<Quiz>(isLogged ? '/quizzes' : null);
  const mentors = useCollection<Mentor>(isLogged ? '/mentors' : null);
  const ebooks = useCollection<Ebook>(isLogged ? '/ebooks' : null);
  const streams = useCollection<Stream>(isLogged ? '/streams' : null);
  const artifacts = useCollection<Artifact>(isLogged ? '/artifacts' : null);
  const challenges = useCollection<Challenge>(isLogged ? '/challenges' : null);
  const events = useCollection<CalendarEvent>(isLogged ? '/events' : null);
  const bookings = useCollection<Booking>(isLogged ? '/bookings' : null);
  const tickets = useCollection<SupportTicket>(isLogged ? '/tickets' : null);
  const submissions = useCollection<BonusSubmission>(isLogged ? '/submissions' : null);
  const bonusTasks = useCollection<BonusTask>(isLogged ? '/tasks' : null);
  const sessions = useCollection<CommunitySession>(isLogged ? '/sessions' : null);
  const levels = useCollection<LevelRequirement>(isLogged ? '/levels' : null);
  const allUsers = useCollection<User>(isLogged ? '/users' : null);

  const systemSettings = settingsRes.data ?? DEFAULT_SETTINGS;
  const nextLevelRequirement = useMemo(
    () => levels.data.find((l) => l.level === (currentUser?.level ?? 0) + 1),
    [levels.data, currentUser?.level]
  );

  // --- AUTH HANDLERS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView(user.role === 'admin' ? 'admin' : 'dashboard');
    notify('success', 'Vítej v Q-Hub', `Přihlášen jako ${user.email}`);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setCurrentUser(null);
    setView('login');
    notify('success', 'Odhlášeno', 'Byli jste úspěšně odhlášeni.');
  };

  // --- USER UPDATE ---
  const handleCreateUser = useCallback(
    async (userData: any) => {
      try {
        await api.post<User>('/users', userData);
        notify('success', 'Uživatel vytvořen', `Účet ${userData.email} byl úspěšně vytvořen.`);
        allUsers.reload();
      } catch (e: any) {
        notify('error', 'Chyba při vytváření', e.message ?? 'Nepodařilo se vytvořit uživatele.');
        throw e;
      }
    },
    [allUsers, notify]
  );

  const handleUpdateUser = useCallback(
    async (updated: User) => {
      try {
        const isSelf = currentUser?.id === updated.id;
        const path = isSelf ? '/users/me' : `/users/${updated.id}`;
        const saved = await api.patch<User>(path, updated);
        if (isSelf) setCurrentUser(saved);
        allUsers.reload();
      } catch (e: any) {
        notify('error', 'Chyba', e.message ?? 'Uložení selhalo.');
      }
    },
    [currentUser?.id, isAdmin, allUsers, notify]
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      if (!window.confirm('Opravdu smazat uživatele?')) return;
      try {
        await api.delete(`/users/${userId}`);
        notify('success', 'Smazáno', 'Uživatel byl smazán.');
        allUsers.reload();
      } catch (e: any) {
        notify('error', 'Chyba', e.message);
      }
    },
    [allUsers, notify]
  );

  const handleSendMessage = useCallback(
    async (userId: string, message: Message) => {
      try {
        await api.post(`/users/${userId}/messages`, {
          sender: message.sender,
          subject: message.subject,
          body: message.body,
          attachmentName: message.attachmentName,
        });
        notify('success', 'Odesláno', 'Zpráva byla odeslána.');
        allUsers.reload();
      } catch (e: any) {
        notify('error', 'Chyba', e.message);
      }
    },
    [allUsers, notify]
  );

  // --- SETTINGS ---
  const handleUpdateSettings = useCallback(
    async (newSettings: SystemSettings) => {
      try {
        await api.put('/settings', newSettings);
        settingsRes.reload();
        notify('success', 'Uloženo', 'Nastavení systému aktualizováno.');
      } catch (e: any) {
        notify('error', 'Chyba', e.message);
      }
    },
    [settingsRes, notify]
  );

  // --- BULK COLLECTION UPDATES ---
  const makeBulkUpdater = <T extends { id: string }>(
    path: string,
    coll: ReturnType<typeof useCollection<T>>
  ) => async (items: T[]) => {
    try {
      await syncCollection(path, coll.data, items);
      coll.reload();
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleUpdateCourses = makeBulkUpdater('/courses', courses);
  const handleUpdateQuizzes = makeBulkUpdater('/quizzes', quizzes);
  const handleUpdateMentors = makeBulkUpdater('/mentors', mentors);
  const handleUpdateEbooks = makeBulkUpdater('/ebooks', ebooks);
  const handleUpdateStreams = makeBulkUpdater('/streams', streams);
  const handleUpdateArtifacts = makeBulkUpdater('/artifacts', artifacts);
  const handleUpdateChallenges = makeBulkUpdater('/challenges', challenges);
  const handleUpdateEvents = makeBulkUpdater('/events', events);
  const handleUpdateTasks = makeBulkUpdater('/tasks', bonusTasks);
  const handleUpdateBookings = makeBulkUpdater('/bookings', bookings);

  const handleUpdateLevels = useCallback(
    async (newLevels: LevelRequirement[]) => {
      try {
        await api.put('/levels', { items: newLevels });
        levels.reload();
      } catch (e: any) {
        notify('error', 'Chyba', e.message);
      }
    },
    [levels, notify]
  );

  // --- GAMIFICATION HELPERS ---
  const getBoostedXP = (baseXP: number, user: User) => {
    const active = user.xpBoostUntil && new Date(user.xpBoostUntil) > new Date();
    return active ? baseXP * 2 : baseXP;
  };

  const handleCourseProgress = (courseId: string, lessonId: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser };
    if (!updated.courseProgress) updated.courseProgress = [];
    let p = updated.courseProgress.find((x) => x.courseId === courseId);
    if (!p) {
      p = { courseId, completedLessonIds: [], isCompleted: false, quizScores: {} };
      updated.courseProgress.push(p);
    }
    if (!p.completedLessonIds.includes(lessonId)) {
      p.completedLessonIds.push(lessonId);
      const gain = getBoostedXP(50, updated);
      updated.xp += gain;
      notify('success', '+ XP', `Získali jste ${gain} XP za lekci.`);
    }
    p.lastPlayedLessonId = lessonId;
    const course = courses.data.find((c) => c.id === courseId);
    if (course) {
      const mandatory = course.modules.flatMap((m) => m.lessons).filter((l) => l.isMandatory);
      const allDone = mandatory.every((l) => p!.completedLessonIds.includes(l.id));
      if (allDone && !p.isCompleted) {
        p.isCompleted = true;
        const bonus = getBoostedXP(course.xpReward || 500, updated);
        updated.xp += bonus;
        const code = `QHB-${course.title.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        const cert: Certificate = {
          id: `CERT-${Date.now()}`,
          courseId: course.id,
          courseName: course.title,
          studentName: updated.name || updated.email,
          issueDate: new Date().toLocaleDateString('cs-CZ'),
          code,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '?verify=' + code)}&bgcolor=ffffff`,
        };
        if (!updated.certificates.some((c) => c.courseId === courseId)) {
          updated.certificates.push(cert);
          notify('success', 'Kurz dokončen', `Získáváte certifikát a ${bonus} XP.`);
        }
      }
    }
    handleUpdateUser(updated);
  };

  const handleQuizComplete = (quizId: string, score: number, passed: boolean) => {
    if (!currentUser) return;
    const updated = { ...currentUser };
    const quiz = quizzes.data.find((q) => q.id === quizId);
    if (!quiz) return;
    const exists = updated.quizHistory.find((h) => h.quizId === quizId && h.passed);
    if (passed && !exists) {
      const gain = getBoostedXP(quiz.xpReward, updated);
      updated.xp += gain;
      notify('success', 'Kvíz splněn', `Získáváte ${gain} XP.`);
    }
    const entry = {
      quizId,
      score,
      passed,
      completedAt: new Date().toISOString(),
      attempts: (updated.quizHistory.find((h) => h.quizId === quizId)?.attempts || 0) + 1,
    };
    const idx = updated.quizHistory.findIndex((h) => h.quizId === quizId);
    if (idx >= 0) updated.quizHistory[idx] = entry;
    else updated.quizHistory.push(entry);
    handleUpdateUser(updated);
  };

  const handleUseItem = (itemId: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser };
    const idx = updated.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const item = updated.inventory[idx];
    if (item.type !== 'consumable') return;
    if (item.effectType === 'xp_boost' && item.effectDuration) {
      const end = new Date(Date.now() + item.effectDuration * 3600 * 1000);
      updated.xpBoostUntil = end.toISOString();
      notify('success', 'XP boost aktivován', `2x XP po dobu ${item.effectDuration}h.`);
    }
    if (item.quantity > 1) updated.inventory[idx].quantity -= 1;
    else updated.inventory.splice(idx, 1);
    handleUpdateUser(updated);
  };

  const handleChallenge = (cid: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser };
    let p = updated.activeChallenges.find((x) => x.challengeId === cid);
    const ch = challenges.data.find((c) => c.id === cid);
    if (!ch) return;
    if (!p) {
      p = { challengeId: cid, currentCount: 0, completed: false, lastUpdated: new Date().toISOString(), history: [] };
      updated.activeChallenges.push(p);
    }
    if (!p.completed) {
      p.currentCount += 1;
      p.lastUpdated = new Date().toISOString();
      if (p.currentCount >= ch.targetCount) {
        p.completed = true;
        const xp = getBoostedXP(ch.rewardXP, updated);
        updated.xp += xp;
        notify('success', 'Výzva splněna', `Získáváte ${xp} XP.`);
      }
    }
    handleUpdateUser(updated);
  };

  // Booking / event / ticket / submission – jednoduché passthrough na API
  const handleRegisterEvent = async (eid: string) => {
    try {
      await api.post(`/events/${eid}/register`);
      events.reload();
      notify('success', 'Registrace', 'Jsi přihlášen.');
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleSubmitTask = async (taskId: string, _uid: string, content: string) => {
    try {
      await api.post('/submissions', { taskId, content });
      submissions.reload();
      notify('success', 'Odesláno', 'Tvůj příspěvek čeká na schválení.');
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleBookMentor = async (mentorId: string, date: string, note: string) => {
    try {
      await api.post('/bookings', { mentorId, date, note });
      bookings.reload();
      notify('success', 'Rezervace', 'Tvoje žádost byla odeslána.');
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleCreateTicket = async (subject: string) => {
    try {
      await api.post('/tickets', { subject });
      tickets.reload();
      notify('success', 'Ticket vytvořen', subject);
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleReplyTicket = async (id: string, text: string) => {
    try {
      await api.post(`/tickets/${id}/reply`, { text });
      tickets.reload();
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      await api.put(`/tickets/${id}`, { status: 'closed' });
      tickets.reload();
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleReviewSubmission = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/submissions/${id}`, { status });
      submissions.reload();
      notify('success', 'Schváleno', `Status: ${status}`);
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleCreateSession = async (topic: string, date: string, description: string, maxAttendees: number) => {
    try {
      await api.post('/sessions', {
        topic,
        date,
        description,
        maxAttendees,
        hostName: currentUser?.name || currentUser?.email,
      });
      sessions.reload();
      notify('success', 'Session vytvořena', topic);
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  const handleJoinSession = async (id: string) => {
    try {
      await api.post(`/sessions/${id}/join`);
      sessions.reload();
    } catch (e: any) {
      notify('error', 'Chyba', e.message);
    }
  };

  // --- BOOT LOADING ---
  if (bootLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  // --- TOAST CONTAINER ---
  const ToastContainer = (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <MotionDiv
            key={t.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`pointer-events-auto min-w-[300px] p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white ${
              t.type === 'success'
                ? 'border-emerald-200'
                : t.type === 'error'
                  ? 'border-red-200'
                  : t.type === 'info'
                    ? 'border-indigo-200'
                    : 'border-amber-200'
            }`}
          >
            {t.type === 'success' && <CheckCircle className="text-emerald-500 mt-0.5" size={20} />}
            {t.type === 'error' && <XCircle className="text-red-500 mt-0.5" size={20} />}
            {t.type === 'info' && <Info className="text-indigo-500 mt-0.5" size={20} />}
            {t.type === 'warning' && <AlertTriangle className="text-amber-500 mt-0.5" size={20} />}
            <div>
              <h4 className="font-semibold text-sm text-slate-900">{t.title}</h4>
              <p className="text-xs text-slate-600">{t.message}</p>
            </div>
          </MotionDiv>
        ))}
      </AnimatePresence>
    </div>
  );

  // --- DATABASE DIAGNOSTICS VIEW ---
  if (view === 'db-check') {
    return (
      <DbCheckPage
        onBack={() => {
          window.location.hash = '';
          setView(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'dashboard') : 'login');
        }}
        notify={notify}
      />
    );
  }

  // --- VERIFY VIEW ---
  if (view === 'verify') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {ToastContainer}
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center relative shadow-sm">
          <button
            onClick={() => setView(currentUser ? (isAdmin ? 'admin' : 'dashboard') : 'login')}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <XCircle />
          </button>
          <Shield size={56} className="mx-auto text-indigo-600 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ověření certifikátu</h2>
          <p className="text-slate-500 mb-6">
            Zadejte unikátní kód certifikátu pro ověření jeho pravosti.
          </p>
          <input
            type="text"
            placeholder="QHB-XXX-XXXX"
            className="w-full bg-white border border-slate-300 rounded-xl p-4 text-center text-lg tracking-widest font-mono text-slate-900 focus:border-indigo-500 outline-none uppercase"
          />
          <button
            onClick={() => notify('info', 'Funkce omezena', 'Veřejné ověření vyžaduje samostatný endpoint.')}
            className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white transition"
          >
            Ověřit
          </button>
        </div>
      </div>
    );
  }

  // --- LOGIN ---
  if (!currentUser) {
    return (
      <>
        {ToastContainer}
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // --- BANNERS ---
  const collectionsWithErrors = [
    { name: 'Kurzy', error: courses.error, path: '/courses' },
    { name: 'Kvízy', error: quizzes.error, path: '/quizzes' },
    { name: 'Uživatelé', error: allUsers.error, path: '/users' },
    { name: 'Mentoři', error: mentors.error, path: '/mentors' },
    { name: 'E-knihy', error: ebooks.error, path: '/ebooks' },
    { name: 'Streamy', error: streams.error, path: '/streams' },
    { name: 'Artefakty', error: artifacts.error, path: '/artifacts' },
    { name: 'Výzvy', error: challenges.error, path: '/challenges' },
    { name: 'Události', error: events.error, path: '/events' },
    { name: 'Rezervace', error: bookings.error, path: '/bookings' },
    { name: 'Tickety', error: tickets.error, path: '/tickets' },
    { name: 'Submise', error: submissions.error, path: '/submissions' },
    { name: 'Bonusy', error: bonusTasks.error, path: '/tasks' },
  ].filter((c) => c.error);

  const banners = (
    <>
      {systemSettings.maintenanceMode && (
        <div className="bg-amber-50 border-b border-amber-200 p-2 text-center text-amber-800 font-medium text-sm flex items-center justify-center gap-2">
          <AlertTriangle size={16} /> Probíhá údržba systému.
        </div>
      )}
      {systemSettings.globalBanner && (
        <div className="bg-indigo-50 border-b border-indigo-200 p-2 text-center text-indigo-800 text-sm">
          {systemSettings.globalBanner}
        </div>
      )}
      {collectionsWithErrors.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 p-3 text-rose-800 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-rose-500" />
            Některá data se nepodařilo načíst (Chyba API):
          </div>
          <ul className="list-disc pl-5 font-mono space-y-0.5">
            {collectionsWithErrors.map((c, i) => (
              <li key={i}>
                <strong>{c.name} ({c.path}):</strong> {c.error?.message || 'Neznámá chyba'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  // --- ADMIN ---
  if (view === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        {ToastContainer}
        {banners}
        <AdminDashboard
          currentUser={currentUser}
          allUsers={allUsers.data}
          settings={systemSettings}
          challenges={challenges.data}
          artifacts={artifacts.data}
          events={events.data}
          bonusTasks={bonusTasks.data}
          submissions={submissions.data}
          courses={courses.data}
          quizzes={quizzes.data}
          mentors={mentors.data}
          bookings={bookings.data}
          ebooks={ebooks.data}
          streams={streams.data}
          tickets={tickets.data}
          levelRequirements={levels.data}
          notify={notify}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onImpersonate={() => notify('info', 'Omezeno', 'Impersonace není v této verzi dostupná.')}
          onSendMessage={handleSendMessage}
          onUpdateEvents={handleUpdateEvents}
          onUpdateTasks={handleUpdateTasks}
          onUpdateSettings={handleUpdateSettings}
          onUpdateCourses={handleUpdateCourses}
          onUpdateQuizzes={handleUpdateQuizzes}
          onUpdateArtifacts={handleUpdateArtifacts}
          onUpdateChallenges={handleUpdateChallenges}
          onUpdateEbooks={handleUpdateEbooks}
          onUpdateStreams={handleUpdateStreams}
          onUpdateMentors={handleUpdateMentors}
          onUpdateBookings={handleUpdateBookings}
          onUpdateLevels={handleUpdateLevels}
          onSendCampaign={() => notify('info', 'Kampaň', 'Hromadné kampaně nejsou implementované.')}
          onReviewSubmission={handleReviewSubmission}
          onReplyTicket={handleReplyTicket}
          onCloseTicket={handleCloseTicket}
          onFactoryReset={() => notify('warning', 'Factory reset', 'Nepodporováno v cloudu.')}
          onLogout={handleLogout}
          onNavigate={(v) => setView(v as any)}
        />
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50">
      {ToastContainer}
      {banners}
      <Dashboard
        user={currentUser}
        challenges={challenges.data}
        allUsers={allUsers.data}
        events={events.data}
        bonusTasks={bonusTasks.data}
        submissions={submissions.data}
        courses={courses.data}
        quizzes={quizzes.data}
        mentors={mentors.data}
        bookings={bookings.data}
        ebooks={ebooks.data}
        streams={streams.data}
        tickets={tickets.data}
        nextLevelRequirement={nextLevelRequirement}
        communitySessions={sessions.data}
        notify={notify}
        onLogout={handleLogout}
        onNavigate={(v) => setView(v as any)}
        onUpdateProfile={handleUpdateUser}
        onRegisterEvent={(eid) => handleRegisterEvent(eid)}
        onSubmitTask={handleSubmitTask}
        onCourseProgress={handleCourseProgress}
        onQuizComplete={handleQuizComplete}
        onBookMentor={handleBookMentor}
        onCreateTicket={handleCreateTicket}
        onReplyTicket={handleReplyTicket}
        onUseArtifact={handleUseItem}
        onChallengeAction={handleChallenge}
        onCreateSession={handleCreateSession}
        onJoinSession={handleJoinSession}
      />
    </div>
  );
};

export default App;
