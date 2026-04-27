import React, { useState, useEffect } from 'react';
import { MainSection, SubSection } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChapterContent } from './components/ChapterContent';
import { Modals } from './components/Modals';

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
      <Header
        setIsAboutOpen={setIsAboutOpen}
        handleExport={handleExport}
        handleImport={handleImport}
      />

      <main className="mt-10 px-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        {/* Left Column: Index and Classification */}
        <Sidebar
          selectedChapterId={selectedChapterId}
          setSelectedChapterId={setSelectedChapterId}
          mainSections={mainSections}
          openEditMain={openEditMain}
          handleRemoveSection={handleRemoveSection}
          openEditSub={openEditSub}
          handleRemoveSubSection={handleRemoveSubSection}
        />

        {/* Center Content Area */}
        <div className="lg:col-span-9 flex flex-col md:flex-row gap-12">
          {/* Chapter Content */}
          <ChapterContent
            selectedChapterId={selectedChapterId}
            setSelectedChapterId={setSelectedChapterId}
            customInterpretations={customInterpretations}
            setCustomInterpretations={setCustomInterpretations}
            editingLocId={editingLocId}
            setEditingLocId={setEditingLocId}
            tempInterpretation={tempInterpretation}
            setTempInterpretation={setTempInterpretation}
          />
        </div>
      </main>

      {/* Modals */}
      <Modals
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        formMain={formMain}
        setFormMain={setFormMain}
        handleSaveSection={handleSaveSection}
        isEditingSub={isEditingSub}
        setIsEditingSub={setIsEditingSub}
        formSub={formSub}
        setFormSub={setFormSub}
        handleSaveSubSection={handleSaveSubSection}
        isAboutOpen={isAboutOpen}
        setIsAboutOpen={setIsAboutOpen}
      />

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


