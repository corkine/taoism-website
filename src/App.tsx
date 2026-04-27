import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  Plus,
  Trash2,
  Save,
  X,
  Edit2
} from 'lucide-react';
import { daoJing } from './data/daoJing';
import { MainSection, SubSection } from './types';
import { version, author } from '../package.json';

const STORAGE_KEY = 'dao_jing_custom_partitions';

const DEFAULT_PARTITIONS: MainSection[] = [
  {
    id: 'default-1',
    title: '玄妙之门',
    startChapter: 1,
    endChapter: 15,
    description: '',
    subSections: [
      { id: '1-1', title: '相生', startChapter: 1, endChapter: 3, description: '' },
      { id: '1-2', title: '道冲', startChapter: 4, endChapter: 6, description: '' },
      { id: '1-3', title: '无私', startChapter: 7, endChapter: 9, description: '' },
      { id: '1-4', title: '为用', startChapter: 10, endChapter: 12, description: '' },
      { id: '1-5', title: '玄通', startChapter: 13, endChapter: 15, description: '' },
    ]
  },
  {
    id: 'default-2',
    title: '致虚守静',
    startChapter: 16,
    endChapter: 24,
    description: '',
    subSections: [
      { id: '2-1', title: '贵言', startChapter: 16, endChapter: 18, description: '' },
      { id: '2-2', title: '绝学', startChapter: 19, endChapter: 21, description: '' },
      { id: '2-3', title: '抱一', startChapter: 22, endChapter: 24, description: '' },
    ]
  },
  {
    id: 'default-3',
    title: '道法自然',
    startChapter: 25,
    endChapter: 37,
    description: '',
    subSections: [
      { id: '3-1', title: '袭明', startChapter: 26, endChapter: 28, description: '' },
      { id: '3-2', title: '去甚', startChapter: 29, endChapter: 31, description: '' },
      { id: '3-3', title: '守朴', startChapter: 32, endChapter: 34, description: '' },
      { id: '3-4', title: '执象', startChapter: 35, endChapter: 37, description: '' },
    ]
  }
];

export default function App() {
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [mainSections, setMainSections] = useState<MainSection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_PARTITIONS; }
    }
    return DEFAULT_PARTITIONS;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [isEditingSub, setIsEditingSub] = useState(false);
  const [editingSubParentId, setEditingSubParentId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const [customInterpretations, setCustomInterpretations] = useState<Record<number, string>>(() => {
    const savedInt = localStorage.getItem('dao_jing_interpretations');
    if (savedInt) {
      try { return JSON.parse(savedInt); } catch (e) { return {}; }
    }
    return {};
  });
  const [editingLocId, setEditingLocId] = useState<number | null>(null);
  const [tempInterpretation, setTempInterpretation] = useState('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Form State
  const [formMain, setFormMain] = useState<Omit<MainSection, 'id' | 'subSections'>>({
    title: '',
    startChapter: 1,
    endChapter: 81,
    description: ''
  });

  const [formSub, setFormSub] = useState<Omit<SubSection, 'id'>>({
    title: '',
    startChapter: 1,
    endChapter: 81,
    description: ''
  });



  // Save to LocalStorage
  useEffect(() => {
    if (mainSections.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mainSections));
    }
  }, [mainSections]);

  useEffect(() => {
    localStorage.setItem('dao_jing_interpretations', JSON.stringify(customInterpretations));
  }, [customInterpretations]);

  const handleExport = () => {
    const data = {
      partitions: mainSections,
      interpretations: customInterpretations
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daodejing_config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.partitions) {
          setMainSections(data.partitions);
        }
        if (data.interpretations) {
          setCustomInterpretations(data.interpretations);
        }
      } catch (err) {
        alert('无效的文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
    newSections.sort((a, b) => a.startChapter - b.startChapter);
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

    subs.sort((a, b) => a.startChapter - b.startChapter);
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
            className="text-6xl font-bold mb-2 text-[#1A1A1A] flex items-baseline gap-4"
          >
            老子
          </motion.h1>
          <div className="h-1.5 w-32 bg-[#A63A2B]" />
        </div>

        <div className="text-right hidden md:block">
          <div className="flex gap-1 items-center justify-end mb-1">
            <button onClick={() => setIsAboutOpen(true)} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              关于
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">|</span>
            <button onClick={handleExport} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              导出
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">|</span>
            <label className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm cursor-pointer">
              导入
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          {/* <div className="text-[10px] leading-tight tracking-[0.4em] uppercase text-[#8C8471] font-sans">Structural Analysis</div> */}
          <div className="text-xl font-medium mt-1 text-[#1A1A1A]">解经助手</div>
        </div>
      </header>

      <main className="mt-10 px-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">

        {/* Left Column: Index and Classification */}
        <aside className="lg:col-span-3 flex flex-col gap-8">

          {/* Chapter Quick Grid */}
          <div className="border border-[#E2DED0] p-6 bg-white shadow-sm rounded-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] mb-4 font-sans">索引</h3>
            <div className="grid grid-cols-9 gap-1">
              {Array.from({ length: 81 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setSelectedChapterId(num)}
                  className={`w-full aspect-square border text-[10px] flex items-center justify-center transition-colors font-sans ${selectedChapterId === num
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
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#1A1A1A] font-sans">分章定义</h3>
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
                      <Plus size={10} /> 添加子章
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

                <div className="flex justify-between items-end mb-8  border-[#1A1A1A] pb-4">
                  <h2 className="text-4xl font-bold text-[#1A1A1A]">
                    {selectedChapter.title}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      disabled={selectedChapterId <= 1}
                      onClick={() => setSelectedChapterId(id => Math.max(1, id - 1))}
                      className="w-8 h-8 border border-[#E2DED0] rounded-full flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                    <button
                      disabled={selectedChapterId >= 81}
                      onClick={() => setSelectedChapterId(id => Math.min(81, id + 1))}
                      className="w-8 h-8 border border-[#E2DED0] rounded-full flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <p className="text-2xl leading-loose text-[#2D2926] text-justify whitespace-pre-wrap tracking-wide first-letter:text-6xl first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-[#A63A2B] first-letter:font-bold">
                    {selectedChapter.content}
                  </p>
                </div>

                {/* Interpretation Area */}
                <div className="mt-16 pt-8 border-t border-[#E2DED0]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C8471] font-sans flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#A63A2B] rounded-full" />
                      释义
                    </h3>
                    {editingLocId !== selectedChapterId ? (
                      <button
                        onClick={() => {
                          setEditingLocId(selectedChapterId);
                          setTempInterpretation(customInterpretations[selectedChapterId] || '');
                        }}
                        className="text-xs text-[#A63A2B] hover:underline font-sans font-bold flex items-center gap-1"
                      >
                        <Edit2 size={10} /> 编辑
                      </button>
                    ) : (
                      <div className="flex gap-4">
                        <button onClick={() => setEditingLocId(null)} className="text-[10px] uppercase font-bold text-[#8C8471] hover:text-[#1A1A1A] transition-colors font-sans">
                          取消
                        </button>
                        <button
                          onClick={() => {
                            setCustomInterpretations(prev => ({ ...prev, [selectedChapterId]: tempInterpretation }));
                            setEditingLocId(null);
                          }}
                          className="text-[10px] uppercase tracking-widest font-bold text-white bg-[#1A1A1A] hover:bg-[#A63A2B] transition-colors px-3 py-1.5 font-sans"
                        >
                          保存
                        </button>
                      </div>
                    )}
                  </div>

                  {editingLocId === selectedChapterId ? (
                    <textarea
                      value={tempInterpretation}
                      onChange={e => setTempInterpretation(e.target.value)}
                      className="w-full h-40 p-6 bg-[#FDFBF7] border border-[#E2DED0] outline-none text-sm font-serif leading-relaxed focus:border-[#A63A2B] transition-colors resize-none shadow-inner"
                      placeholder="谈谈您的见解..."
                    />
                  ) : (
                    <div className="text-[13px] text-[#3D3D3D] leading-loose whitespace-pre-wrap px-4 border-l-2 border-[#E2DED0] italic">
                      {customInterpretations[selectedChapterId] ? (
                        customInterpretations[selectedChapterId]
                      ) : (
                        <span className="text-[#8C8471] opacity-60">谈谈您的见解</span>
                      )}
                    </div>
                  )}
                </div>

              </motion.article>
            </AnimatePresence>
          </section>
        </div>
      </main>

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
                    onChange={e => setFormMain({ ...formMain, title: e.target.value })}
                    placeholder="例如：玄妙之门"
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formMain.startChapter) ? '' : formMain.startChapter}
                      onChange={e => setFormMain({ ...formMain, startChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formMain.endChapter) ? '' : formMain.endChapter}
                      onChange={e => setFormMain({ ...formMain, endChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">描述</label>
                  <textarea
                    value={formMain.description}
                    onChange={e => setFormMain({ ...formMain, description: e.target.value })}
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
                  取消
                </button>
                <button
                  onClick={handleSaveSection}
                  className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
                >
                  <Save size={14} /> 保存
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
                    onChange={e => setFormSub({ ...formSub, title: e.target.value })}
                    placeholder="例如：相成无为"
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formSub.startChapter) ? '' : formSub.startChapter}
                      onChange={e => setFormSub({ ...formSub, startChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formSub.endChapter) ? '' : formSub.endChapter}
                      onChange={e => setFormSub({ ...formSub, endChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">主题描述</label>
                  <textarea
                    value={formSub.description}
                    onChange={e => setFormSub({ ...formSub, description: e.target.value })}
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
                  取消
                </button>
                <button
                  onClick={handleSaveSubSection}
                  className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
                >
                  <Save size={14} /> 保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
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
                onClick={() => setIsAboutOpen(false)}
                className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-6 text-[#1A1A1A]">关于本项目</h2>

              <div className="space-y-4 text-[#3D3D3D] text-sm leading-relaxed font-serif">
                <p>
                  <strong>内容译本：</strong> 本应用使用的《老子》（道德经）原文主要参考自通行本（王弼本），并结合帛书本、竹简本等进行了部分校勘与标点整理。
                </p>
                <p>
                  <strong>版权声明：</strong> 《老子》原文属于公有领域（Public Domain）。本应用的界面设计、交互逻辑及提供的章节划分工具受版权保护。
                </p>
                <p>
                  用户可以使用本应用进行个人的阅读、分章和释义。用户导出的个人见解数据归用户所有。软件仅供个人非商业用途使用。
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2DED0] flex justify-between items-center text-xs text-[#8C8471] font-sans">
                <span>© {new Date().getFullYear()} {author} </span>
                <span>{version}</span>
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


