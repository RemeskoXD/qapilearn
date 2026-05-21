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
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
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
          level: 'premium', 
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
      if(window.confirm('Opravdu smazat tento kurz? Akce je nevratná a smaže i progress studentů.')) {
          onUpdateCourses(courses.filter(c => c.id !== id));
          notify('success', 'Smazáno', 'Kurz byl odstraněn.');
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
      if (!window.confirm('Smazat modul a všechny jeho lekce?')) return;
      setCurrentCourse({ ...currentCourse, modules: currentCourse.modules.filter(m => m.id !== moduleId) });
      if (activeModuleId === moduleId) setActiveModuleId(null);
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
      if (!window.confirm('Smazat lekci?')) return;
      setCurrentCourse({
          ...currentCourse,
          modules: currentCourse.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m)
      });
      if (activeLessonId === lessonId) setActiveLessonId(null);
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
                                <button onClick={() => handleEditCourse(course)} className="flex-1 py-2 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-slate-900 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2">
                                    <Edit size={14}/> Upravit
                                </button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="px-3 py-2 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-slate-900 rounded-lg transition">
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
                <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed inset-0 z-[60] bg-slate-50 flex flex-col">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsBuilderOpen(false)} className="hover:text-red-500 transition"><X/></button>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    {currentCourse.title || 'Nový Kurz'}
                                    {currentCourse.published ? <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">PUBLIKOVÁNO</span> : <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">KONCEPT</span>}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer mr-4">
                                <span className="text-sm text-slate-500">Publikovat</span>
                                <input type="checkbox" checked={currentCourse.published} onChange={e => setCurrentCourse({...currentCourse, published: e.target.checked})} className="accent-blue-500 w-5 h-5"/>
                            </label>
                            <button onClick={handleSaveCourse} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-bold flex items-center gap-2 shadow-lg shadow-green-900/20">
                                <Save size={18}/> Uložit Kurz
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar: Modules Tree */}
                        <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="p-4 space-y-4 border-b border-slate-200">
                                <div><label className="label">Název Kurzu</label><input value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} className="input"/></div>
                                <div><label className="label">Popis</label><textarea value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} className="input h-20 text-xs"/></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="label">Level</label><select value={currentCourse.level} onChange={e => setCurrentCourse({...currentCourse, level: e.target.value as any})} className="input"><option value="student">Student</option><option value="premium">Premium</option><option value="vip">VIP</option></select></div>
                                    <div><label className="label">Odměna XP</label><input type="number" value={currentCourse.xpReward} onChange={e => setCurrentCourse({...currentCourse, xpReward: parseInt(e.target.value)})} className="input"/></div>
                                </div>
                                
                                {/* Image Preview & Edit */}
                                <div>
                                    <label className="label">Obrázek</label>
                                    <div className="relative group rounded-lg overflow-hidden border border-slate-300 bg-black h-32 mb-2">
                                        <img src={currentCourse.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"/>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/30 transition">
                                            <button onClick={openImageEditor} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-xs font-bold flex items-center gap-2">
                                                <Edit size={12}/> Upravit
                                            </button>
                                        </div>
                                    </div>
                                    <input value={currentCourse.image} onChange={e => setCurrentCourse({...currentCourse, image: e.target.value})} className="input text-xs" placeholder="URL obrázku..."/>
                                </div>
                            </div>

                            <div className="p-2 flex-1 space-y-2">
                                {currentCourse.modules.map((mod, mIdx) => (
                                    <div key={mod.id} className={`border rounded-lg overflow-hidden transition ${activeModuleId === mod.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                                        <div 
                                            onClick={() => setActiveModuleId(mod.id)} 
                                            className="p-3 font-bold text-sm cursor-pointer flex justify-between items-center hover:bg-slate-100"
                                        >
                                            <span className="truncate flex-1">{mIdx + 1}. {mod.title}</span>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => {e.stopPropagation(); deleteModule(mod.id)}} className="p-1 hover:text-red-500"><Trash2 size={12}/></button>
                                                <button onClick={(e) => {e.stopPropagation(); addLesson(mod.id)}} className="p-1 hover:text-indigo-600"><Plus size={12}/></button>
                                            </div>
                                        </div>
                                        
                                        {activeModuleId === mod.id && (
                                            <div className="p-2 bg-slate-900/30 space-y-1 border-t border-slate-200">
                                                <input value={mod.title} onChange={e => setCurrentCourse({...currentCourse, modules: currentCourse.modules.map(m => m.id === mod.id ? {...m, title: e.target.value} : m)})} className="input text-xs mb-2 bg-white border-slate-300"/>
                                                {mod.lessons.map((l, lIdx) => (
                                                    <div 
                                                        key={l.id} 
                                                        onClick={(e) => {e.stopPropagation(); setActiveLessonId(l.id);}} 
                                                        className={`p-2 pl-3 text-xs rounded cursor-pointer flex items-center justify-between group ${activeLessonId === l.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            {l.type === 'video' ? <Video size={10}/> : l.type === 'quiz' ? <Brain size={10}/> : <FileText size={10}/>}
                                                            <span className="truncate">{lIdx + 1}. {l.title}</span>
                                                        </div>
                                                        <button onClick={(e) => {e.stopPropagation(); deleteLesson(mod.id, l.id)}} className="opacity-0 group-hover:opacity-100 hover:text-red-300"><Trash2 size={10}/></button>
                                                    </div>
                                                ))}
                                                {mod.lessons.length === 0 && <div className="text-[10px] text-slate-500 text-center p-2">Žádné lekce</div>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addModule} className="w-full py-3 border border-dashed border-slate-300 text-slate-500 text-xs rounded hover:border-indigo-500 hover:text-indigo-600 transition">+ Přidat Modul</button>
                            </div>
                        </div>

                        {/* Main Content: Lesson Editor */}
                        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
                            {activeModuleId && activeLessonId ? (
                                (() => {
                                    const module = currentCourse.modules.find(m => m.id === activeModuleId);
                                    const lesson = module?.lessons.find(l => l.id === activeLessonId);
                                    if(!lesson) return <div className="text-slate-500">Lekce nenalezena.</div>;
                                    
                                    return (
                                        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                                            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                                    {lesson.type === 'video' ? <Video className="text-indigo-600"/> : lesson.type === 'quiz' ? <Brain className="text-violet-600"/> : <FileText className="text-green-500"/>}
                                                    Editor Lekce
                                                </h3>
                                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                                    <input type="checkbox" checked={lesson.isMandatory} onChange={e => updateLesson({isMandatory: e.target.checked})} className="accent-blue-500"/>
                                                    <span className="text-sm font-bold text-slate-500">Povinná lekce</span>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-2">
                                                    <label className="label">Název Lekce</label>
                                                    <input value={lesson.title} onChange={e => updateLesson({title: e.target.value})} className="input text-lg font-bold"/>
                                                </div>
                                                <div>
                                                    <label className="label">Délka (min)</label>
                                                    <input type="number" value={lesson.duration} onChange={e => updateLesson({duration: parseInt(e.target.value)})} className="input"/>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="label">Typ Obsahu</label>
                                                <div className="flex gap-2">
                                                    {(['video', 'text', 'quiz'] as const).map(t => (
                                                        <button key={t} onClick={() => updateLesson({type: t})} className={`px-6 py-3 rounded-xl border font-bold flex items-center gap-2 transition ${lesson.type === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'}`}>
                                                            {t === 'video' ? <Video size={16}/> : t === 'quiz' ? <Brain size={16}/> : <FileText size={16}/>}
                                                            {t.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* TYPE SPECIFIC FIELDS */}
                                            {lesson.type === 'video' && (
                                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                    <label className="label flex items-center gap-2"><PlayCircle size={14}/> Video URL (Embed / YouTube / Vimeo)</label>
                                                    <input value={lesson.content} onChange={e => updateLesson({content: e.target.value})} className="input font-mono text-indigo-600" placeholder="https://www.youtube.com/embed/..."/>
                                                    <div className="mt-4 aspect-video bg-black rounded-lg border border-slate-200 flex items-center justify-center text-slate-500">
                                                        {lesson.content ? <iframe src={lesson.content} className="w-full h-full" frameBorder="0"/> : 'Náhled videa'}
                                                    </div>
                                                </div>
                                            )}

                                            {lesson.type === 'text' && (
                                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                    <label className="label">Obsah (Markdown podporován)</label>
                                                    <textarea value={lesson.content} onChange={e => updateLesson({content: e.target.value})} className="input h-96 font-mono text-sm leading-relaxed" placeholder="# Nadpis lekce..."/>
                                                </div>
                                            )}

                                            {lesson.type === 'quiz' && (
                                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <label className="label mb-0">Otázky v kvízu</label>
                                                        <button 
                                                            onClick={() => updateLesson({questions: [...(lesson.questions || []), {id: `q-${Date.now()}`, question: 'Nová otázka', options: ['A', 'B'], correctOptionIndex: 0}]})}
                                                            className="text-xs bg-violet-600 px-3 py-1.5 rounded font-bold hover:bg-violet-500"
                                                        >
                                                            + Přidat Otázku
                                                        </button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {(lesson.questions || []).map((q, qIdx) => (
                                                            <div key={q.id} className="bg-black border border-slate-200 p-4 rounded-xl">
                                                                <div className="flex justify-between mb-2">
                                                                    <span className="text-xs text-violet-600 font-bold">OTÁZKA {qIdx + 1}</span>
                                                                    <button onClick={() => {
                                                                        const newQs = [...(lesson.questions || [])];
                                                                        newQs.splice(qIdx, 1);
                                                                        updateLesson({questions: newQs});
                                                                    }} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                                                                </div>
                                                                <input 
                                                                    value={q.question} 
                                                                    onChange={e => {
                                                                        const newQs = [...(lesson.questions || [])];
                                                                        newQs[qIdx].question = e.target.value;
                                                                        updateLesson({questions: newQs});
                                                                    }} 
                                                                    className="input mb-3 bg-white border-slate-300" 
                                                                    placeholder="Znění otázky..."
                                                                />
                                                                <div className="space-y-2">
                                                                    {q.options.map((opt, oIdx) => (
                                                                        <div key={oIdx} className="flex items-center gap-2">
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`correct-${q.id}`} 
                                                                                checked={q.correctOptionIndex === oIdx} 
                                                                                onChange={() => {
                                                                                    const newQs = [...(lesson.questions || [])];
                                                                                    newQs[qIdx].correctOptionIndex = oIdx;
                                                                                    updateLesson({questions: newQs});
                                                                                }}
                                                                                className="accent-green-500 w-4 h-4"
                                                                            />
                                                                            <input 
                                                                                value={opt}
                                                                                onChange={e => {
                                                                                    const newQs = [...(lesson.questions || [])];
                                                                                    newQs[qIdx].options[oIdx] = e.target.value;
                                                                                    updateLesson({questions: newQs});
                                                                                }}
                                                                                className="flex-1 input py-1.5 text-sm bg-white border-slate-300"
                                                                            />
                                                                            <button onClick={() => {
                                                                                 const newQs = [...(lesson.questions || [])];
                                                                                 newQs[qIdx].options.splice(oIdx, 1);
                                                                                 updateLesson({questions: newQs});
                                                                            }} className="text-slate-500 hover:text-red-500"><X size={14}/></button>
                                                                        </div>
                                                                    ))}
                                                                    <button onClick={() => {
                                                                        const newQs = [...(lesson.questions || [])];
                                                                        newQs[qIdx].options.push(`Možnost ${newQs[qIdx].options.length + 1}`);
                                                                        updateLesson({questions: newQs});
                                                                    }} className="text-xs text-indigo-600 hover:underline ml-6">+ Přidat možnost</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <Layers size={48} className="mb-4 opacity-20"/>
                                    <p>Vyberte lekci v levém panelu pro editaci.</p>
                                    <p className="text-xs mt-2">Nebo přidejte novou sekci a lekci.</p>
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
    </div>
  );
};

export default AdminCourses;