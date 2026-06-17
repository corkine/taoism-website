import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Plus, 
  Trash2, 
  Save, 
  X,
  Edit2} from 'lucide-react';
import { daoJing } from './data/daoJing';
import { MainSection, SubSection } from './types';

const STORAGE_KEY = 'dao_jing_custom_partitions';

const DEFAULT_PARTITIONS: MainSection[] = [
  {
    id: 'default-1',
    title: '玄妙之门',
    startChapter: 1,
    endChapter: 15,
    description: '道经之始，论道之本体与玄妙。',
    subSections: [
      {
        id: 'default-1-1',
        title: '相成无为',
        startChapter: 1,
        endChapter: 6,
        description: '探讨有无相生，无为而治。'
      }
    ]
  }
];

export default function App() {
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [mainSections, setMainSections] = useState<MainSection[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [isEditingSub, setIsEditingSub] = useState(false);
  const [editingSubParentId, setEditingSubParentId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  
  // Form State
  const [formMain, setFormMain] = useState<Omit<MainSection, 'id' | 'subSections'>>({
    title: '',
    startChapter: 1,
    endChapter: 37,
    description: ''
  });

  const [formSub, setFormSub] = useState<Omit<SubSection, 'id'>>({
    title: '',
    startChapter: 1,
    endChapter: 37,
    description: ''
  });

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMainSections(JSON.parse(saved));
      } catch (e) {
        setMainSections(DEFAULT_PARTITIONS);
      }
    } else {
      setMainSections(DEFAULT_PARTITIONS);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (mainSections.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mainSections));
    }
  }, [mainSections]);

  const selectedChapter = useMemo(() => 
    daoJing.find(c => c.id === selectedChapterId) || daoJing[0],
    [selectedChapterId]
  );

  const openEditMain = (sectionId?: string) => {
    if (sectionId) {
      const idx = mainSections.findIndex(s => s.id === sectionId);
      if (idx !== -1) {
        const sec = mainSections[idx];
        setFormMain({
          title: sec.title,
          startChapter: sec.startChapter,
          endChapter: sec.endChapter,
          description: sec.description
        });
        setEditingIndex(idx);
      }
    } else {
      setFormMain({ title: '', startChapter: 1, endChapter: 37, description: '' });
      setEditingIndex(null);
    }
    setIsEditing(true);
  };

  const handleSaveSection = () => {
    if (!formMain.title.trim()) return;

    const start = Number.isNaN(formMain.startChapter) ? 1 : formMain.startChapter;
    const end = Number.isNaN(formMain.endChapter) ? 37 : formMain.endChapter;

    let newSections = [...mainSections];
    if (editingIndex !== null) {
      newSections[editingIndex] = {
        ...newSections[editingIndex],
        ...formMain,
        startChapter: Math.min(start, end),
        endChapter: Math.max(start, end)
      };
    } else {
      newSections.push({
        ...formMain,
        startChapter: Math.min(start, end),
        endChapter: Math.max(start, end),
        id: Date.now().toString(),
        subSections: []
      });
    }
    newSections.sort((a,b) => a.startChapter - b.startChapter);
    setMainSections(newSections);
    setIsEditing(false);
  };

  const handleRemoveSection = (id: string) => {
    setMainSections(mainSections.filter(s => s.id !== id));
  };

  const openEditSub = (parentId: string, subId?: string) => {
    setEditingSubParentId(parentId);
    const parent = mainSections.find(s => s.id === parentId);
    if (!parent) return;

    if (subId) {
      const sub = parent.subSections.find(s => s.id === subId);
      if (sub) {
        setFormSub({
          title: sub.title,
          startChapter: sub.startChapter,
          endChapter: sub.endChapter,
          description: sub.description
        });
        setEditingSubId(subId);
      }
    } else {
      setFormSub({ title: '', startChapter: 1, endChapter: 37, description: '' });
      setEditingSubId(null);
    }
    setIsEditingSub(true);
  };

  const handleSaveSubSection = () => {
    if (!editingSubParentId) return;
    if (!formSub.title.trim()) return;

    const pIndex = mainSections.findIndex(s => s.id === editingSubParentId);
    if (pIndex === -1) return;

    const start = Number.isNaN(formSub.startChapter) ? 1 : formSub.startChapter;
    const end = Number.isNaN(formSub.endChapter) ? 37 : formSub.endChapter;

    let newSections = [...mainSections];
    let parent = { ...newSections[pIndex] };
    let subs = [...parent.subSections];

    if (editingSubId) {
      const sIndex = subs.findIndex(s => s.id === editingSubId);
      if (sIndex !== -1) {
        subs[sIndex] = {
          ...subs[sIndex],
          ...formSub,
          startChapter: Math.min(start, end),
          endChapter: Math.max(start, end)
        };
      }
    } else {
      subs.push({
        id: Date.now().toString(),
        ...formSub,
        startChapter: Math.min(start, end),
        endChapter: Math.max(start, end)
      });
    }

    subs.sort((a,b) => a.startChapter - b.startChapter);
    parent.subSections = subs;
    newSections[pIndex] = parent;
    
    setMainSections(newSections);
    setIsEditingSub(false);
  };

  const handleRemoveSubSection = (parentId: string, subId: string) => {
    setMainSections(mainSections.map(section => {
      if (section.id === parentId) {
        return {
          ...section,
          subSections: section.subSections.filter(sub => sub.id !== subId)
        };
      }
      return section;
    }));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2926] font-serif selection:bg-[#A63A2B]/10 selection:text-[#A63A2B]">
      {/* Aesthetic Accents */}
      <div className="fixed top-0 right-0 w-32 h-full border-l border-[#E2DED0] opacity-20 pointer-events-none z-0" />
      
      {/* Header Area */}
      <header className="relative pt-12 px-12 z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-bold tracking-tighter mb-2 text-[#1A1A1A] flex items-baseline gap-4"
          >
            道经
            <span className="text-2xl font-normal text-[#A63A2B] tracking-widest uppercase italic font-sans">Dao De Jing</span>
          </motion.h1>
          <div className="h-1.5 w-32 bg-[#A63A2B]" />
        </div>
        
        <div className="text-right hidden md:block">
          <div className="text-[10px] leading-tight tracking-[0.4em] uppercase text-[#8C8471] font-sans">Structural Analysis / Division Tool</div>
          <div className="text-xl font-medium mt-1 text-[#1A1A1A]">章节划分与文本澄清</div>
        </div>
      </header>

      <main className="mt-20 px-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Left Column: Index and Classification */}
        <aside className="lg:col-span-3 flex flex-col gap-8">
          
          {/* Chapter Quick Grid */}
          <div className="border border-[#E2DED0] p-6 bg-white shadow-sm rounded-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] mb-4 font-sans">Chapter Index (1-37)</h3>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 37 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setSelectedChapterId(num)}
                  className={`w-full aspect-square border text-[10px] flex items-center justify-center transition-colors font-sans ${
                    selectedChapterId === num 
                    ? 'bg-[#A63A2B] border-[#A63A2B] text-white' 
                    : 'bg-[#FDF2F0] border-[#F5E1DE] text-[#A63A2B] hover:bg-[#F5E1DE]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Classification Section */}
          <div className="border-t-2 border-[#1A1A1A] pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-tighter text-[#1A1A1A] font-sans">My Classification Division</h3>
              <button 
                onClick={() => openEditMain()}
                className="p-1.5 hover:bg-[#A63A2B]/10 rounded-full text-[#A63A2B] transition-colors"
                title="Add Section"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-6">
              {mainSections.map((section, idx) => (
                <div key={section.id} className="group relative">
                  <div className="flex justify-between items-center text-sm border-b border-[#E2DED0] pb-1 hover:border-[#A63A2B] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1A1A1A]">
                        {idx + 1}. {section.title}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditMain(section.id)}
                          className="text-stone-300 hover:text-[#A63A2B] transition-all p-1"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleRemoveSection(section.id)}
                          className="text-stone-300 hover:text-red-800 transition-all p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <span className="text-[#A63A2B] font-sans text-xs font-bold whitespace-nowrap ml-4">
                      CH {section.startChapter.toString().padStart(2, '0')}-{section.endChapter.toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  {section.description && (
                    <p className="text-[11px] text-[#8C8471] italic mt-1 leading-relaxed">
                      {section.description}
                    </p>
                  )}

                  {/* Sub-sections */}
                  <div className="mt-3 ml-4 space-y-2 border-l border-dashed border-[#E2DED0] pl-3">
                    {section.subSections.map((sub, sIdx) => (
                      <div key={sub.id} className="relative group/sub">
                        <div className="flex justify-between items-center text-[13px] text-[#3D3D3D]">
                          <span className="hover:text-[#A63A2B] cursor-pointer transition-colors" 
                                onClick={() => setSelectedChapterId(sub.startChapter)}>
                            {idx + 1}.{sIdx + 1} {sub.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#8C8471] font-sans">
                              {sub.startChapter}-{sub.endChapter}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEditSub(section.id, sub.id)}
                                className="text-stone-300 hover:text-[#A63A2B] transition-all p-0.5"
                              >
                                <Edit2 size={10} />
                              </button>
                              <button 
                                onClick={() => handleRemoveSubSection(section.id, sub.id)}
                                className="text-stone-300 hover:text-red-800 transition-all p-0.5"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => openEditSub(section.id)}
                      className="text-[10px] text-[#A63A2B] flex items-center gap-1 transition-all uppercase tracking-widest font-bold mt-2 hover:translate-x-1"
                    >
                      <Plus size={10} /> Add Sub
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Content Area */}
        <div className="lg:col-span-9 flex flex-col md:flex-row gap-12">
          
          {/* Chapter Content */}
          <section className="flex-1">
            <AnimatePresence mode="wait">
              <motion.article 
                key={selectedChapterId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="relative bg-white border border-[#E2DED0] p-12 shadow-sm min-h-[500px]"
              >
                <div className="absolute -left-4 top-12 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-[#A63A2B] font-bold font-sans rotate-180 writing-vertical-rl tracking-widest uppercase">Chapter</div>
                  <div className="bg-[#1A1A1A] text-white w-8 h-8 flex items-center justify-center text-xs font-sans font-bold">
                    {selectedChapterId.toString().padStart(2, '0')}
                  </div>
                </div>

                <h2 className="text-4xl font-bold mb-8 border-b-2 border-[#1A1A1A] pb-4 text-[#1A1A1A] inline-block">
                  {selectedChapter.title}
                </h2>

                <div className="relative">
                  <p className="text-2xl leading-loose text-[#2D2926] text-justify whitespace-pre-wrap tracking-wide first-letter:text-6xl first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-[#A63A2B] first-letter:font-bold">
                    {selectedChapter.content}
                  </p>
                </div>

                {/* Vertical Marker */}
                <div className="absolute right-6 top-1/4 h-1/2 w-px bg-[#E2DED0] flex flex-col items-center justify-center gap-4">
                  <div className="writing-vertical-rl text-[9px] tracking-[0.6em] text-[#8C8471] font-sans opacity-40 whitespace-nowrap">
                    MORAL PHILOSOPHY & METAPHYSICS
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>

            {/* Pagination Controls */}
            <div className="mt-8 flex items-center justify-between gap-4 font-sans">
              <button 
                disabled={selectedChapterId <= 1}
                onClick={() => setSelectedChapterId(id => Math.max(1, id - 1))}
                className="group flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A] disabled:opacity-30 transition-colors"
              >
                <div className="w-10 h-10 border border-[#E2DED0] rounded-full flex items-center justify-center group-hover:border-[#1A1A1A] transition-colors">
                  <ChevronRight size={16} className="rotate-180" />
                </div>
                <span>Previous</span>
              </button>

              <div className="flex gap-2 items-baseline">
                <span className="text-3xl font-bold text-[#1A1A1A]">{selectedChapterId}</span>
                <span className="text-xs text-[#8C8471] font-bold">/ 37</span>
              </div>

              <button 
                disabled={selectedChapterId >= 37}
                onClick={() => setSelectedChapterId(id => Math.min(37, id + 1))}
                className="group flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A] disabled:opacity-30 transition-colors"
              >
                <span>Next</span>
                <div className="w-10 h-10 border border-[#E2DED0] rounded-full flex items-center justify-center group-hover:border-[#1A1A1A] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Info Bars */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-[#E2DED0] h-12 flex items-center px-12 gap-8 text-[10px] font-sans tracking-widest text-[#8C8471] z-50">
        <span className="px-2 py-1 bg-[#1A1A1A] text-white">REFERENCE</span>
        <span className="hover:text-[#1A1A1A] cursor-pointer transition-colors">WANG BI VERSION</span>
        <span className="opacity-30">|</span>
        <span className="hover:text-[#1A1A1A] cursor-pointer transition-colors">HE SHANG GONG VERSION</span>
        <div className="ml-auto text-[9px] opacity-40">AUTO-SAVED TO LOCAL STORAGE</div>
      </footer>

      {/* Edit Modal (Main Section) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-[#FDFBF7] w-full max-w-lg p-10 border-t-8 border-[#A63A2B] shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditing(false)}
                className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-8 text-[#1A1A1A]">定义新的大章划分</h2>
              
              <div className="space-y-6 italic">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">章节标题</label>
                  <input 
                    type="text" 
                    value={formMain.title}
                    onChange={e => setFormMain({...formMain, title: e.target.value})}
                    placeholder="例如：玄妙之门"
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节 (1-37)</label>
                    <input 
                      type="number" 
                      min="1" max="37"
                      value={Number.isNaN(formMain.startChapter) ? '' : formMain.startChapter}
                      onChange={e => setFormMain({...formMain, startChapter: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节 (1-37)</label>
                    <input 
                      type="number" 
                      min="1" max="37"
                      value={Number.isNaN(formMain.endChapter) ? '' : formMain.endChapter}
                      onChange={e => setFormMain({...formMain, endChapter: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">描述 / 主题解释</label>
                  <textarea 
                    value={formMain.description}
                    onChange={e => setFormMain({...formMain, description: e.target.value})}
                    rows={3}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-base font-serif italic"
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-6 font-sans">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSection}
                  className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
                >
                  <Save size={14} /> Save Partition
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal (Sub-Section) */}
      <AnimatePresence>
        {isEditingSub && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-[#FDFBF7] w-full max-w-lg p-10 border-t-8 border-[#A63A2B] shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditingSub(false)}
                className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-8 text-[#1A1A1A]">定义子章节划分</h2>
              
              <div className="space-y-6 italic">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">子标题</label>
                  <input 
                    type="text" 
                    value={formSub.title}
                    onChange={e => setFormSub({...formSub, title: e.target.value})}
                    placeholder="例如：相成无为"
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节 (1-37)</label>
                    <input 
                      type="number" 
                      min="1" max="37"
                      value={Number.isNaN(formSub.startChapter) ? '' : formSub.startChapter}
                      onChange={e => setFormSub({...formSub, startChapter: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节 (1-37)</label>
                    <input 
                      type="number" 
                      min="1" max="37"
                      value={Number.isNaN(formSub.endChapter) ? '' : formSub.endChapter}
                      onChange={e => setFormSub({...formSub, endChapter: parseInt(e.target.value)})}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">主题描述</label>
                  <textarea 
                    value={formSub.description}
                    onChange={e => setFormSub({...formSub, description: e.target.value})}
                    rows={3}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-base font-serif italic"
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-6 font-sans">
                <button 
                  onClick={() => setIsEditingSub(false)}
                  className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSubSection}
                  className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
                >
                  <Save size={14} /> Save Sub-Partition
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.cn/css2?family=Noto+Serif+SC:wght@300;600;900&family=Plus+Jakarta+Sans:wght@300;500;700&display=swap');
        
        :root {
          --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
          --font-serif: 'Noto Serif SC', serif;
        }

        .font-serif {
          font-family: var(--font-serif);
        }

        .font-sans {
          font-family: var(--font-sans);
        }

        .writing-vertical-rl {
          writing-mode: vertical-rl;
        }
      `}</style>
    </div>
  );
}


