import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Save, X, Layers, FileText, Video, Brain, CheckCircle, Clock, MoreVertical, PlayCircle, Eye, AlertCircle, Image as ImageIcon, Move, RotateCw, ZoomIn, RefreshCw, Download } from 'lucide-react';
import { Course, User, CourseModule, Lesson, QuizQuestion } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Fix types for framer motion
const MotionDiv = motion.div as any;

interface AdminCoursesProps {
  courses: Course[];
  allUsers: User[];
  onUpdateCourses: (courses: Course[]) => void;
  notify: (type: any, title: string, message: string) => void;
}

// --- IMAGE EDITOR COMPONENT ---
const ImageEditor = ({ src, onSave, onClose, notify }: { src: string, onSave: (newSrc: string) => void, onClose: () => void, notify: any }) => {
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset on open
    useEffect(() => {
        setScale(1);
        setRotate(0);
        setPosition({ x: 0, y: 0 });
    }, [src]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Optional: Zoom on scroll
        // e.stopPropagation();
        // const delta = e.deltaY * -0.001;
        // setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
    };

    const handleSave = async () => {
        if (!imgRef.current) return;
        
        try {
            notify('info', 'Zpracovávám...', 'Generuji nový obrázek.');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size (e.g., 800x600 or preserve aspect ratio of container)
            // For course thumbnails, let's aim for a standard 16:9 or similar high quality
            const targetWidth = 800;
            const targetHeight = 450; 
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Fill background (in case image doesn't cover)
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculations to draw the transformed image onto canvas
            // We need to map the visual transform (CSS) to Canvas drawImage
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotate * Math.PI) / 180);
            ctx.scale(scale, scale);
            ctx.translate(position.x, position.y); // This needs calibration based on container vs canvas size ratio
            
            // Draw image centered
            const img = imgRef.current;
            // Since we want the "visual" result, we draw the image centered at the translated point
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

            const base64 = canvas.toDataURL('image/jpeg', 0.9);
            onSave(base64);
            notify('success', 'Hotovo', 'Obrázek byl upraven a uložen.');
        } catch (e) {
            console.error(e);
            notify('error', 'Chyba', 'Nepodařilo se uložit obrázek (CORS error?).');
            // Fallback: just keep original if canvas fails due to CORS
            onSave(src);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="h-16 border-b border-slate-200 flex justify-between items-center px-6 bg-white">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <ImageIcon size={20} className="text-indigo-600"/> Editor Obrázku
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => { setScale(1); setRotate(0); setPosition({x:0,y:0}); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Reset">
                            <RefreshCw size={18}/>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div 
                    className="flex-1 bg-[#1a1a1a] relative overflow-hidden cursor-move flex items-center justify-center select-none"
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >   
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                    
                    <img 
                        ref={imgRef}
                        src={src} 
                        alt="Edit target"
                        draggable={false}
                        crossOrigin="anonymous"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotate}deg) scale(${scale})`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                            maxWidth: 'none', // Allow image to be larger than container
                            maxHeight: 'none',
                        }}
                        className="origin-center shadow-2xl"
                    />

                    {/* Overlay Helper (Viewport) - Optional, shows what will be saved roughly */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-indigo-200 opacity-50 flex items-center justify-center">
                        <div className="w-4 h-4 border-l-2 border-t-2 border-indigo-500 absolute top-0 left-0"></div>
                        <div className="w-4 h-4 border-r-2 border-t-2 border-indigo-500 absolute top-0 right-0"></div>
                        <div className="w-4 h-4 border-l-2 border-b-2 border-indigo-500 absolute bottom-0 left-0"></div>
                        <div className="w-4 h-4 border-r-2 border-b-2 border-indigo-500 absolute bottom-0 right-0"></div>
                        <Plus size={24} className="text-indigo-600/50"/>
                    </div>
                </div>

                {/* Controls */}
                <div className="h-24 bg-white border-t border-slate-200 px-8 flex items-center gap-8">
                    
                    {/* Zoom Control */}
                    <div className="flex-1">
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><ZoomIn size={12}/> Zoom</label>
                            <span className="text-xs text-indigo-600 font-mono">{Math.round(scale * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="3" 
                            step="0.01" 
                            value={scale} 
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                        />
                    </div>

                    {/* Rotate Control */}
                    <div className="flex-1">
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><RotateCw size={12}/> Rotace</label>
                            <span className="text-xs text-violet-600 font-mono">{rotate}°</span>
                        </div>
                        <input 
                            type="range" 
                            min="-180" 
                            max="180" 
                            step="1" 
                            value={rotate} 
                            onChange={(e) => setRotate(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="w-48 flex justify-end">
                        <button onClick={handleSave} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition transform hover:scale-105 active:scale-95">
                            <Save size={18}/> Uložit Úpravy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminCourses: React.FC<AdminCoursesProps> = ({ courses, allUsers, onUpdateCourses, notify }) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  
  // Image Editor State
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState('');

  // Builder State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [learningPointInput, setLearningPointInput] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{
      type: 'course' | 'module' | 'lesson';
      id: string;
      extraId?: string;
      name: string;
  } | null>(null);

  // --- STATS CALCULATION ---
  const getCourseStats = (courseId: string) => {
      let completed = 0;
      let inProgress = 0;
      allUsers.forEach(u => {
          const prog = u.courseProgress?.find(p => p.courseId === courseId);
          if (prog) {
              if (prog.isCompleted) completed++;
              else inProgress++;
          }
      });
      return { completed, inProgress };
  };

  // --- CRUD HANDLERS ---
  const handleCreateCourse = () => {
      const newCourse: Course = { 
          id: `c-${Date.now()}`, 
          title: 'Nový Kurz', 
          description: '', 
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', 
          level: 'ostatni', 
          author: 'Q-Hub', 
          totalDuration: 0, 
          published: false, 
          xpReward: 500,
          learningPoints: [],
          modules: [] 
      };
      setCurrentCourse(newCourse); 
      setIsBuilderOpen(true);
      setActiveModuleId(null);
      setActiveLessonId(null);
  };

  const handleEditCourse = (course: Course) => {
      setCurrentCourse(JSON.parse(JSON.stringify(course))); // Deep copy
      setIsBuilderOpen(true);
  };

  const handleDeleteCourse = (id: string) => {
      const crs = courses.find(c => c.id === id);
      if (crs) {
          setDeletingItem({ type: 'course', id, name: crs.title });
      }
  };

  const handleSaveCourse = () => {
      if (!currentCourse) return;
      // Calculate total duration
      const totalDuration = currentCourse.modules.reduce((acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.duration, 0), 0);
      const courseToSave = { ...currentCourse, totalDuration };

      const exists = courses.find(c => c.id === courseToSave.id);
      onUpdateCourses(exists ? courses.map(c => c.id === courseToSave.id ? courseToSave : c) : [...courses, courseToSave]);
      
      setIsBuilderOpen(false); 
      setCurrentCourse(null); 
      notify('success', 'Uloženo', 'Kurz byl úspěšně uložen.');
  };

  // --- MODULE & LESSON LOGIC ---
  const addModule = () => {
      if (!currentCourse) return;
      const newModule: CourseModule = { id: `m-${Date.now()}`, title: 'Nová Sekce', lessons: [] };
      setCurrentCourse({ ...currentCourse, modules: [...currentCourse.modules, newModule] });
  };

  const deleteModule = (moduleId: string) => {
      if (!currentCourse) return;
      const mod = currentCourse.modules.find(m => m.id === moduleId);
      if (mod) {
          setDeletingItem({ type: 'module', id: moduleId, name: mod.title });
      }
  };

  const addLesson = (moduleId: string) => {
      if (!currentCourse) return;
      const newLesson: Lesson = { id: `l-${Date.now()}`, title: 'Nová Lekce', type: 'video', content: '', duration: 10, isMandatory: true, questions: [] };
      setCurrentCourse({ ...currentCourse, modules: currentCourse.modules.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m) });
      setActiveModuleId(moduleId);
      setActiveLessonId(newLesson.id);
  };

  const updateLesson = (updates: Partial<Lesson>) => {
      if (!currentCourse || !activeModuleId || !activeLessonId) return;
      setCurrentCourse({
          ...currentCourse,
          modules: currentCourse.modules.map(m => m.id === activeModuleId ? {
              ...m,
              lessons: m.lessons.map(l => l.id === activeLessonId ? { ...l, ...updates } : l)
          } : m)
      });
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
      if (!currentCourse) return;
      const mod = currentCourse.modules.find(m => m.id === moduleId);
      const les = mod?.lessons.find(l => l.id === lessonId);
      if (les) {
          setDeletingItem({ type: 'lesson', id: moduleId, extraId: lessonId, name: les.title });
      }
  };

  const confirmDeleteItem = () => {
      if (!deletingItem) return;
      
      if (deletingItem.type === 'course') {
          onUpdateCourses(courses.filter(c => c.id !== deletingItem.id));
          notify('success', 'Smazáno', 'Kurz byl odstraněn.');
      } else if (deletingItem.type === 'module') {
          setCurrentCourse({ ...currentCourse, modules: currentCourse.modules.filter(m => m.id !== deletingItem.id) });
          if (activeModuleId === deletingItem.id) setActiveModuleId(null);
          notify('success', 'Smazáno', 'Sekce byla odstraněna.');
      } else if (deletingItem.type === 'lesson') {
          setCurrentCourse({
              ...currentCourse,
              modules: currentCourse.modules.map(m => m.id === deletingItem.id ? { ...m, lessons: m.lessons.filter(l => l.id !== deletingItem.extraId) } : m)
          });
          if (activeLessonId === deletingItem.extraId) setActiveLessonId(null);
          notify('success', 'Smazáno', 'Lekce byla odstraněna.');
      }
      setDeletingItem(null);
  };

  // --- IMAGE EDITOR HANDLERS ---
  const openImageEditor = () => {
      if (currentCourse) {
          setImageToEdit(currentCourse.image);
          setIsImageEditorOpen(true);
      }
  };

  const handleImageSave = (newSrc: string) => {
      if (currentCourse) {
          setCurrentCourse({ ...currentCourse, image: newSrc });
      }
      setIsImageEditorOpen(false);
  };

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Správa Kurzů</h2>
                <p className="text-slate-500 text-sm">Vytvářejte a spravujte vzdělávací obsah.</p>
            </div>
            <button onClick={handleCreateCourse} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white flex items-center gap-2 transition shadow-lg shadow-indigo-600/20">
                <Plus size={18}/> Nový Kurz
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(course => {
                const stats = getCourseStats(course.id);
                return (
                    <div key={course.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-indigo-200 transition shadow-xl">
                        <div className="h-40 bg-white relative overflow-hidden">
                            <img src={course.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-500"/>
                            <div className="absolute top-2 right-2 bg-slate-900/40 backdrop-blur-md px-2 py-1 rounded text-xs font-bold uppercase border border-white/10">{course.level}</div>
                            {!course.published && <div className="absolute top-2 left-2 bg-yellow-600/90 px-2 py-1 rounded text-xs font-bold text-white uppercase flex items-center gap-1"><Eye size={12}/> Koncept</div>}
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{course.title}</h3>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                <span className="flex items-center gap-1"><Layers size={12}/> {course.modules.length} modulů</span>
                                <span className="flex items-center gap-1"><Clock size={12}/> {course.totalDuration} min</span>
                            </div>
                            
                            {/* Stats Bar */}
                            <div className="bg-white/80 rounded-lg p-3 mb-4 flex justify-between items-center border border-slate-200">
                                <div className="text-center">
                                    <div className="text-green-500 font-bold text-lg">{stats.completed}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Dokončilo</div>
                                </div>
                                <div className="w-px h-8 bg-slate-100"></div>
                                <div className="text-center">
                                    <div className="text-indigo-600 font-bold text-lg">{stats.inProgress}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Studuje</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleEditCourse(course)} className="flex-1 py-2 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2">
                                    <Edit size={14}/> Upravit
                                </button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="px-3 py-2 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white rounded-lg transition">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* --- COURSE BUILDER OVERLAY --- */}
        <AnimatePresence>
            {isBuilderOpen && currentCourse && (
                <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed inset-0 z-[60] bg-slate-100 flex flex-col">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shadow-xs">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsBuilderOpen(false)} className="hover:bg-slate-100 p-2 rounded-full text-slate-500 hover:text-red-500 transition"><X size={20}/></button>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    {currentCourse.title || 'Nový Kurz'}
                                    {currentCourse.published ? <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold tracking-wide">PUBLIKOVÁNO</span> : <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 font-semibold tracking-wide">KONCEPT</span>}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 transition">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Veřejně publikovat</span>
                                <input type="checkbox" checked={currentCourse.published} onChange={e => setCurrentCourse({...currentCourse, published: e.target.checked})} className="accent-blue-600 w-5 h-5 cursor-pointer"/>
                            </label>
                            <button onClick={handleSaveCourse} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-green-600/10 active:scale-95 transition">
                                <Save size={18}/> Uložit a zavřít
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar: Modules Tree */}
                        <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto custom-scrollbar shadow-xs">
                            <div className="p-4 space-y-4 border-b border-slate-200 bg-slate-50/50">
                                <div><label className="label text-xs font-bold text-slate-500 uppercase">Název Kurzu</label><input value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} className="input py-2 bg-white border-slate-300"/></div>
                                <div><label className="label text-xs font-bold text-slate-500 uppercase">Popis</label><textarea value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} className="input h-16 text-xs bg-white border-slate-300 py-1.5"/></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="label text-xs font-bold text-slate-500 uppercase">Level</label><select value={currentCourse.level} onChange={e => setCurrentCourse({...currentCourse, level: e.target.value as any})} className="input py-1.5 bg-white border-slate-300 text-xs"><option value="obchodnik">Obchodník</option><option value="technik">Technik</option><option value="team_leader">Team Leader</option><option value="linka">Linka</option><option value="ostatni">Ostatní</option><option value="admin">Admin</option></select></div>
                                    <div><label className="label text-xs font-bold text-slate-500 uppercase">XP Odměna</label><input type="number" value={currentCourse.xpReward} onChange={e => setCurrentCourse({...currentCourse, xpReward: parseInt(e.target.value) || 0})} className="input py-1.5 bg-white border-slate-300 text-xs text-center font-mono font-bold"/></div>
                                </div>
                                
                                {/* Image Preview & Edit */}
                                <div>
                                    <label className="label text-xs font-bold text-slate-500 uppercase">Obyčejný náhledový obrázek</label>
                                    <div className="relative group rounded-xl overflow-hidden border border-slate-300 bg-black h-24 mb-2 shadow-inner">
                                        <img src={currentCourse.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"/>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/40 transition">
                                            <button onClick={openImageEditor} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-[10px] font-bold flex items-center gap-1.5">
                                                <Edit size={10}/> Ořezat / Upravit
                                            </button>
                                        </div>
                                    </div>
                                    <input value={currentCourse.image} onChange={e => setCurrentCourse({...currentCourse, image: e.target.value})} className="input text-[11px] bg-white border-slate-300 font-mono py-1" placeholder="URL obrázku..."/>
                                </div>
                            </div>

                            <div className="p-3 flex-1 space-y-3 bg-slate-50/20 overflow-y-auto custom-scrollbar">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Osnova & Lekce</div>
                                {currentCourse.modules.map((mod, mIdx) => (
                                    <div key={mod.id} className={`border rounded-xl overflow-hidden transition ${activeModuleId === mod.id ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}>
                                        <div 
                                            onClick={() => { setActiveModuleId(mod.id); setIsPreviewMode(false); }} 
                                            className="p-3 font-semibold text-sm cursor-pointer flex justify-between items-center bg-white hover:bg-slate-50/50"
                                        >
                                            <span className="truncate flex-1 font-bold text-slate-800">{mIdx + 1}. {mod.title}</span>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => {e.stopPropagation(); deleteModule(mod.id)}} className="p-1 px-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition" title="Smazat sekci"><Trash2 size={12}/></button>
                                                <button onClick={(e) => {e.stopPropagation(); addLesson(mod.id)}} className="p-1 px-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded transition" title="Přidat lekci"><Plus size={12}/></button>
                                            </div>
                                        </div>
                                        
                                        {activeModuleId === mod.id && (
                                            <div className="p-3 bg-white border-t border-indigo-100 space-y-2">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Název sekce</label>
                                                    <input value={mod.title} onChange={e => setCurrentCourse({...currentCourse, modules: currentCourse.modules.map(m => m.id === mod.id ? {...m, title: e.target.value} : m)})} className="input text-xs py-1.5 bg-slate-50 border-slate-200 mt-1"/>
                                                </div>
                                                <div className="space-y-1.5 mt-2">
                                                    {mod.lessons.map((l, lIdx) => (
                                                        <div 
                                                            key={l.id} 
                                                            onClick={(e) => {e.stopPropagation(); setActiveLessonId(l.id); setIsPreviewMode(false);}} 
                                                            className={`p-2.5 pl-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between group transition ${activeLessonId === l.id ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10' : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'}`}
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                {l.type === 'video' ? <Video size={12}/> : l.type === 'quiz' ? <Brain size={12}/> : <FileText size={12}/>}
                                                                <span className="truncate font-medium">{lIdx + 1}. {l.title}</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => {e.stopPropagation(); deleteLesson(mod.id, l.id)}} 
                                                                className={`p-1 rounded transition hover:scale-115 ${activeLessonId === l.id ? 'text-indigo-200 hover:text-white hover:bg-indigo-700' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                                                title="Smazat lekci"
                                                            >
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                {mod.lessons.length === 0 && <div className="text-[10px] text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">Žádné lekce v této sekci</div>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addModule} className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white text-slate-500 hover:text-indigo-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-xs">+ Přidat Novou Sekci</button>
                            </div>
                        </div>

                        {/* Main Content: Lesson Editor */}
                        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto custom-scrollbar">
                            {activeModuleId && activeLessonId ? (
                                (() => {
                                    const module = currentCourse.modules.find(m => m.id === activeModuleId);
                                    const lesson = module?.lessons.find(l => l.id === activeLessonId);
                                    if(!lesson) return <div className="text-slate-500">Lekce nenalezena.</div>;
                                    
                                    // Local Markdown renderer helper for live Word-like preview inside admin panel
                                    const renderAdminMarkdown = (text: string) => {
                                        if (!text) return <p className="text-slate-400 italic">Prázdný obsah...</p>;
                                        
                                        const lines = text.split('\n');
                                        let insideList = false;
                                        let listItems: string[] = [];
                                        const elements: React.ReactNode[] = [];
                                        
                                        const flushList = (keyIdx: number) => {
                                            if (listItems.length > 0) {
                                                elements.push(
                                                    <ul key={`ul-${keyIdx}`} className="list-disc pl-6 space-y-1 my-3 text-slate-700 font-sans">
                                                        {listItems.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
                                                    </ul>
                                                );
                                                listItems = [];
                                                insideList = false;
                                            }
                                        };

                                        const parseInline = (str: string) => {
                                            if (str.startsWith('![') && str.endsWith(')')) {
                                                const altMatch = str.match(/!\[(.*?)\]/);
                                                const urlMatch = str.match(/\((.*?)\)/);
                                                if (urlMatch) {
                                                    return (
                                                        <span className="block my-4 text-center">
                                                            <img src={urlMatch[1]} referrerPolicy="no-referrer" alt={altMatch?.[1] || 'Obrázek'} className="max-h-72 my-1.5 rounded-lg shadow border border-slate-200 inline" />
                                                            {altMatch && altMatch[1] && <span className="block text-[10px] text-slate-400 mt-1 italic">{altMatch[1]}</span>}
                                                        </span>
                                                    );
                                                }
                                            }
                                            return str.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={idx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
                                                }
                                                return part;
                                            });
                                        };

                                        lines.forEach((line, index) => {
                                            const trimmed = line.trim();
                                            if (trimmed.startsWith('- ')) {
                                                insideList = true;
                                                listItems.push(trimmed.substring(2));
                                            } else {
                                                if (insideList) flushList(index);
                                                if (trimmed.startsWith('# ')) {
                                                    elements.push(<h1 key={index} className="text-2xl font-black text-slate-900 mt-4 mb-2 pb-1 border-b">{parseInline(trimmed.substring(2))}</h1>);
                                                } else if (trimmed.startsWith('## ')) {
                                                    elements.push(<h2 key={index} className="text-xl font-bold text-slate-900 mt-3 mb-2">{parseInline(trimmed.substring(3))}</h2>);
                                                } else if (trimmed.startsWith('### ')) {
                                                    elements.push(<h3 key={index} className="text-lg font-bold text-slate-800 mt-2 mb-1">{parseInline(trimmed.substring(4))}</h3>);
                                                } else if (trimmed.startsWith('> ')) {
                                                    elements.push(<blockquote key={index} className="border-l-4 border-indigo-500 pl-3 italic text-slate-600 my-2">{parseInline(trimmed.substring(2))}</blockquote>);
                                                } else if (trimmed !== '') {
                                                    elements.push(<p key={index} className="text-sm text-slate-700 leading-relaxed my-2">{parseInline(trimmed)}</p>);
                                                } else {
                                                    elements.push(<div key={index} className="h-2" />);
                                                }
                                            }
                                        });
                                        if (insideList) flushList(lines.length);
                                        return <div className="space-y-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-inner">{elements}</div>;
                                    };

                                    return (
                                        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                                            {/* Top Banner Status */}
                                            <div className="flex justify-between items-center pb-5 border-b border-slate-100 flex-wrap gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                                        {lesson.type === 'video' ? <Video size={24}/> : lesson.type === 'quiz' ? <Brain size={24}/> : <FileText size={24}/>}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 leading-tight">Nastavení kroku</h3>
                                                        <p className="text-xs text-slate-400 font-medium font-sans">Upravte název, typ lekce a detailní parametry obsahu.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 transition hover:bg-slate-100/70">
                                                        <input type="checkbox" checked={lesson.isMandatory} onChange={e => updateLesson({isMandatory: e.target.checked})} className="accent-blue-500 w-4 h-4"/>
                                                        <span>Označit jako povinnou lekci</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Inputs Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="md:col-span-3">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Název Lekce / Kroku</label>
                                                    <input value={lesson.title} onChange={e => updateLesson({title: e.target.value})} className="input text-base font-extrabold focus:ring-1 focus:ring-indigo-500" placeholder="Zadejte název lekce..."/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Nezávazná Délka (min)</label>
                                                    <input type="number" value={lesson.duration} onChange={e => updateLesson({duration: parseInt(e.target.value) || 0})} className="input text-center font-mono font-bold py-2 focus:ring-1 focus:ring-indigo-500"/>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Uvítací / Doprovodný popisek lekce</label>
                                                <textarea value={lesson.description || ''} onChange={e => updateLesson({description: e.target.value})} className="input text-xs h-16 w-full py-2 bg-slate-50 border-slate-200 text-slate-800" placeholder="Vepište krátký přehledný popis nebo hlavní lekci v jedné větě..."/>
                                            </div>

                                            {/* Content Types Selector Toggle */}
                                            <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Druh obsahu této lekce</label>
                                                <div className="grid grid-cols-3 gap-3 pt-1">
                                                    {(['video', 'text', 'quiz'] as const).map(t => (
                                                        <button 
                                                            key={t} 
                                                            onClick={() => { updateLesson({type: t}); setIsPreviewMode(false); }} 
                                                            className={`px-4 py-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition active:scale-95 ${lesson.type === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-xs'}`}
                                                        >
                                                            {t === 'video' ? <Video size={16}/> : t === 'quiz' ? <Brain size={16}/> : <FileText size={16}/>}
                                                            <span className="text-xs tracking-wider uppercase">{t === 'video' ? 'Video' : t === 'quiz' ? 'Kvíz' : 'Text'}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* TYPE SPECIFIC FIELDS */}
                                            {lesson.type === 'video' && (
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-2">YouTube / Vimeo / Embed URL videa</label>
                                                        <input value={lesson.content} onChange={e => updateLesson({content: e.target.value})} className="input font-mono text-xs text-indigo-700 bg-white" placeholder="https://www.youtube.com/embed/..."/>
                                                    </div>

                                                    {/* Video constraint settings */}
                                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                                            <input type="checkbox" checked={lesson.hasWatchConstraint || false} onChange={e => updateLesson({hasWatchConstraint: e.target.checked})} className="accent-blue-600 w-4 h-4 cursor-pointer"/>
                                                            <span className="text-xs font-extrabold uppercase text-indigo-900 tracking-wider">Aktivovat podmínku sledování videa</span>
                                                        </label>
                                                        {lesson.hasWatchConstraint && (
                                                            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-indigo-100 max-w-sm">
                                                                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Požadovaný čas sledování videa:</span>
                                                                <input type="number" value={lesson.videoWatchTime || 0} onChange={e => updateLesson({videoWatchTime: parseInt(e.target.value) || 0})} className="w-20 p-1 border border-slate-200 font-mono text-center font-bold outline-indigo-500 text-xs text-slate-900 rounded bg-slate-50" min="0"/>
                                                                <span className="text-xs text-slate-400">sekund</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="aspect-video bg-black rounded-xl border border-slate-200 overflow-hidden text-slate-500 flex items-center justify-center">
                                                        {lesson.content ? <iframe src={lesson.content} className="w-full h-full" frameBorder="0"/> : <div className="text-center"><Video size={40} className="mx-auto text-slate-600 mb-2 animate-pulse"/><span className="text-xs text-slate-400">Zde se zobrazí náhled zadaného videa</span></div>}
                                                    </div>
                                                </div>
                                            )}

                                            {lesson.type === 'text' && (
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                                    <div className="flex justify-between items-center bg-white/80 border border-slate-200 px-4 py-2 rounded-xl">
                                                        <span className="text-xs text-slate-500 font-bold">Obsah lekce (Formátování markdown, pro vložení obrázku slouží standardní syntaxe)</span>
                                                        <button 
                                                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                                                            className={`text-xs font-black px-4 py-1.5 rounded-lg border transition ${isPreviewMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-indigo-600 hover:bg-slate-100 border-slate-200'}`}
                                                        >
                                                            {isPreviewMode ? 'Zpět k editaci kódování' : 'Náhled v podobě Wordu'}
                                                        </button>
                                                    </div>
                                                    
                                                    {isPreviewMode ? (
                                                        <div className="space-y-2">
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-widest pl-1">Aktivní náhled obsahu jako Word:</div>
                                                            {renderAdminMarkdown(lesson.content)}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <textarea value={lesson.content} onChange={e => updateLesson({content: e.target.value})} className="input h-[450px] font-mono text-xs leading-relaxed bg-white" placeholder="# Nadpis nadsekce&#10;&#10;**Vítejte!** Toto je nová lekce s popisem.&#10;&#10;- Hlavní bod 1&#10;- Hlavní bod 2&#10;&#10;Pro vložení obrázku slouží formát obrázků, např.:&#10;![Název](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600)"/>
                                                            <div className="p-3 bg-slate-100 rounded-xl text-[10px] text-slate-500 font-medium">💡 Tip: Pro nadpisy použijte znak # na začátku řádku. Pro tučný text ho obalte do dvou hvězdiček, např. **tučný**. Pro odrážkový seznam napište pomlčku a mezeru na začátek řádku (- ).</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {lesson.type === 'quiz' && (
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                                                        <div>
                                                            <label className="text-sm font-black text-slate-800">Otázky v kvízu</label>
                                                            <p className="text-[10px] text-slate-400">Přidávejte libovolné množství testových, true/false, nebo doplňovacích otázek.</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => updateLesson({questions: [...(lesson.questions || []), {id: `q-${Date.now()}`, question: 'Nová otázka', type: 'choice', options: ['A', 'B'], correctOptionIndex: 0}]})}
                                                            className="text-xs bg-indigo-600 text-white font-extrabold px-4 py-2.5 rounded-xl hover:bg-indigo-500 transition shadow shadow-indigo-600/10"
                                                        >
                                                            + Přidat Otázku
                                                        </button>
                                                    </div>
                                                    <div className="space-y-6">
                                                        {(lesson.questions || []).map((q, qIdx) => {
                                                            const qType = q.type || 'choice';
                                                            return (
                                                                <div key={q.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                                                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs bg-slate-100 text-indigo-700 border border-slate-200 px-2.5 py-1 rounded-full font-black">OTÁZKA {qIdx + 1}</span>
                                                                            <select 
                                                                                value={qType}
                                                                                onChange={e => {
                                                                                    const newQs = [...(lesson.questions || [])];
                                                                                    const nextT = e.target.value as any;
                                                                                    newQs[qIdx].type = nextT;
                                                                                    if (nextT === 'true-false') {
                                                                                        newQs[qIdx].options = ['Pravda', 'Nepravda'];
                                                                                        newQs[qIdx].correctOptionIndex = 0;
                                                                                    } else if (nextT === 'text-fill') {
                                                                                        newQs[qIdx].correctTextAnswer = '';
                                                                                    } else {
                                                                                        newQs[qIdx].options = ['A', 'B'];
                                                                                        newQs[qIdx].correctOptionIndex = 0;
                                                                                    }
                                                                                    updateLesson({questions: newQs});
                                                                                }}
                                                                                className="p-1 px-2 border border-slate-200 hover:border-slate-350 text-xs text-slate-600 font-bold bg-slate-50 rounded-lg outline-none"
                                                                            >
                                                                                <option value="choice">Výběr z možností (A,B,C,D)</option>
                                                                                <option value="true-false">Pravda / Nepravda</option>
                                                                                <option value="text-fill">Doplňovací textová políčka</option>
                                                                            </select>
                                                                        </div>
                                                                        <button onClick={() => {
                                                                            const newQs = [...(lesson.questions || [])];
                                                                            newQs.splice(qIdx, 1);
                                                                            updateLesson({questions: newQs});
                                                                        }} className="p-1 px-2 rounded-lg text-red-500 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1"><Trash2 size={13}/> Smazat otázku</button>
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Znění otázky</label>
                                                                        <input 
                                                                            value={q.question} 
                                                                            onChange={e => {
                                                                                const newQs = [...(lesson.questions || [])];
                                                                                newQs[qIdx].question = e.target.value;
                                                                                updateLesson({questions: newQs});
                                                                            }} 
                                                                            className="input py-2 bg-slate-50 border-slate-200 hover:border-slate-300 font-bold mt-1 text-slate-800" 
                                                                            placeholder="Sem napište znění otázky..."
                                                                        />
                                                                    </div>

                                                                    {/* Render options inputs based on the question type */}
                                                                    {qType === 'text-fill' ? (
                                                                        <div className="p-3.5 bg-indigo-50/50 border border-indigo-105 rounded-xl space-y-2">
                                                                            <label className="text-[10px] font-bold uppercase text-indigo-900 tracking-wider">Správná textová odpověď (kontrola probíhá bez ohledu na velikost písma)</label>
                                                                            <input 
                                                                                value={q.correctTextAnswer || ''}
                                                                                onChange={e => {
                                                                                    const newQs = [...(lesson.questions || [])];
                                                                                    newQs[qIdx].correctTextAnswer = e.target.value;
                                                                                    updateLesson({questions: newQs});
                                                                                }}
                                                                                className="input py-2 bg-white border-indigo-200 mt-1 placeholder-slate-400 font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                                                                                placeholder="Zadejte správnou odpověď... (např. 'Praha' nebo '7')"
                                                                            />
                                                                        </div>
                                                                    ) : qType === 'true-false' ? (
                                                                        <div className="space-y-2">
                                                                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Zvolte platné tvrzení jako správné:</span>
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                {['Pravda', 'Nepravda'].map((opt, oIdx) => {
                                                                                    const isSelected = q.correctOptionIndex === oIdx;
                                                                                    return (
                                                                                        <button 
                                                                                            key={oIdx}
                                                                                            onClick={() => {
                                                                                                const newQs = [...(lesson.questions || [])];
                                                                                                newQs[qIdx].correctOptionIndex = oIdx;
                                                                                                updateLesson({questions: newQs});
                                                                                            }}
                                                                                            className={`p-3 rounded-xl border font-bold text-xs transition ${isSelected ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                                                                        >
                                                                                            {opt} {isSelected && '✓ (Správné)'}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-3">
                                                                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Definujte možnosti a označte tu správnou:</span>
                                                                            <div className="space-y-2">
                                                                                {q.options.map((opt, oIdx) => (
                                                                                    <div key={oIdx} className="flex items-center gap-3">
                                                                                        <input 
                                                                                            type="radio" 
                                                                                            name={`correct-${q.id}`} 
                                                                                            checked={q.correctOptionIndex === oIdx} 
                                                                                            onChange={() => {
                                                                                                const newQs = [...(lesson.questions || [])];
                                                                                                newQs[qIdx].correctOptionIndex = oIdx;
                                                                                                updateLesson({questions: newQs});
                                                                                            }}
                                                                                            className="accent-green-500 w-5 h-5 cursor-pointer"
                                                                                            title="Nastavit jako správnou odpověď"
                                                                                        />
                                                                                        <input 
                                                                                            value={opt}
                                                                                            onChange={e => {
                                                                                                const newQs = [...(lesson.questions || [])];
                                                                                                newQs[qIdx].options[oIdx] = e.target.value;
                                                                                                updateLesson({questions: newQs});
                                                                                            }}
                                                                                            className="flex-1 input py-2 bg-slate-50 border-slate-200 hover:border-slate-300 text-xs text-slate-800 focus:bg-white"
                                                                                        />
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                 const newQs = [...(lesson.questions || [])];
                                                                                                 newQs[qIdx].options.splice(oIdx, 1);
                                                                                                 // Fallback if deleted correct index
                                                                                                 if (newQs[qIdx].correctOptionIndex >= newQs[qIdx].options.length) {
                                                                                                     newQs[qIdx].correctOptionIndex = 0;
                                                                                                 }
                                                                                                 updateLesson({questions: newQs});
                                                                                            }} 
                                                                                            disabled={q.options.length <= 2}
                                                                                            className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none transition"
                                                                                            title="Smazat možnost"
                                                                                        >
                                                                                            <X size={16}/>
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        const newQs = [...(lesson.questions || [])];
                                                                                        newQs[qIdx].options.push(`Další Možnost`);
                                                                                        updateLesson({questions: newQs});
                                                                                    }} 
                                                                                    className="text-xs text-indigo-600 hover:text-indigo-500 font-extrabold hover:underline ml-8 flex items-center gap-1"
                                                                                >
                                                                                    + Přidat možnost výběru
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white border border-slate-200 rounded-3xl p-12 shadow-sm">
                                    <Layers size={52} className="mb-4 text-slate-300 animate-pulse"/>
                                    <h3 className="font-bold text-slate-800 text-lg">Pěkné a jednoduché kurzy</h3>
                                    <p className="text-sm text-slate-400 text-center max-w-sm mt-1">Vyberte vlevo jakoukoliv existující sekci a lekci nebo přidejte novou, abyste ji upravili jako ve Wordu.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- IMAGE EDITOR MODAL --- */}
        {isImageEditorOpen && (
            <ImageEditor 
                src={imageToEdit} 
                onSave={handleImageSave} 
                onClose={() => setIsImageEditorOpen(false)}
                notify={notify}
            />
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        <AnimatePresence>
            {deletingItem && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 size={24}/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Opravdu smazat?</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Chystáte se smazat {deletingItem.type === 'course' ? 'kurz' : deletingItem.type === 'module' ? 'sekci' : 'lekci'} "{deletingItem.name}". Tato akce je nevratná.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setDeletingItem(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                                Zrušit
                            </button>
                            <button onClick={confirmDeleteItem} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/10 transition">
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

export default AdminCourses;