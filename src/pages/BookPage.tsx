import React, { useState, useEffect } from 'react';
import { MainSection, SubSection } from '../types';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ChapterContent } from '../components/ChapterContent';
import { Modals } from '../components/Modals';
import { AIModal } from '../components/AIModal';
import { useParams, useNavigate } from 'react-router-dom';
import { BOOKS } from '../data/book';
import { loadPartitions, savePartitions, loadInterpretations, saveInterpretations, markDirty } from '../utils/storage';

export default function BookPage({ bookId }: { bookId: string }) {
  const bookConfig = BOOKS.find(b => b.id === bookId)!;
  const chaptersCount = bookConfig.content.length;

  const { chapterId } = useParams();
  const navigate = useNavigate();

  const parsedChapterId = chapterId ? parseInt(chapterId, 10) : 1;
  const selectedChapterId = (isNaN(parsedChapterId) || parsedChapterId < 1 || parsedChapterId > chaptersCount)
    ? 1
    : parsedChapterId;

  const setSelectedChapterId = (idOrUpdater: number | ((prev: number) => number)) => {
    let newId: number;
    if (typeof idOrUpdater === 'function') {
      newId = idOrUpdater(selectedChapterId);
    } else {
      newId = idOrUpdater;
    }
    navigate(`/${bookId}/${newId}`);
  };
  const [mainSections, setMainSections] = useState<MainSection[]>(() =>
    loadPartitions(bookId, bookConfig.defaultPartitions)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [isEditingSub, setIsEditingSub] = useState(false);
  const [editingSubParentId, setEditingSubParentId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const [customInterpretations, setCustomInterpretations] = useState<Record<number, string>>(() =>
    loadInterpretations(bookId)
  );
  const [editingLocId, setEditingLocId] = useState<number | null>(null);
  const [tempInterpretation, setTempInterpretation] = useState('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // AI Modal state
  // isAIOpen: modal is mounted (has content); isAIVisible: modal is shown on screen
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAIVisible, setIsAIVisible] = useState(false);
  const [aiSystemPrompt, setAISystemPrompt] = useState<string | undefined>(undefined);


  // Form State
  const [formMain, setFormMain] = useState<Omit<MainSection, 'id' | 'subSections'>>({
    title: '',
    startChapter: 1,
    endChapter: chaptersCount,
    description: ''
  });

  const [formSub, setFormSub] = useState<Omit<SubSection, 'id'>>({
    title: '',
    startChapter: 1,
    endChapter: chaptersCount,
    description: ''
  });

  useEffect(() => {
    setMainSections(loadPartitions(bookId, bookConfig.defaultPartitions));
    setCustomInterpretations(loadInterpretations(bookId));
  }, [bookId, bookConfig.defaultPartitions]);

  // Save to LocalStorage
  useEffect(() => {
    savePartitions(bookId, mainSections);
  }, [mainSections, bookId]);

  useEffect(() => {
    saveInterpretations(bookId, customInterpretations);
  }, [customInterpretations, bookId]);

  useEffect(() => {
    document.title = `道经释义 · ${bookConfig.title} 第 ${selectedChapterId} 章`;
  }, [bookConfig.title, selectedChapterId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (selectedChapterId > 1) {
          e.preventDefault();
          setSelectedChapterId(selectedChapterId - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedChapterId < chaptersCount) {
          e.preventDefault();
          setSelectedChapterId(selectedChapterId + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChapterId, setSelectedChapterId, chaptersCount]);

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
      setFormMain({ title: '', startChapter: 1, endChapter: bookConfig.defaultPartitions[0]?.endChapter || chaptersCount, description: '' });
      setEditingIndex(null);
    }
    setIsEditing(true);
  };

  const handleSaveSection = () => {
    if (!formMain.title.trim()) return;

    const start = Number.isNaN(formMain.startChapter) ? 1 : formMain.startChapter;
    const end = Number.isNaN(formMain.endChapter) ? chaptersCount : formMain.endChapter;

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
    markDirty();
    setIsEditing(false);
  };

  const handleRemoveSection = (id: string) => {
    setMainSections(mainSections.filter(s => s.id !== id));
    markDirty();
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
      setFormSub({ title: '', startChapter: 1, endChapter: bookConfig.defaultPartitions[0]?.endChapter || chaptersCount, description: '' });
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
    const end = Number.isNaN(formSub.endChapter) ? chaptersCount : formSub.endChapter;

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
    markDirty();
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
    markDirty();
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#FDFBF7] text-[#2D2926] font-serif selection:bg-[#A63A2B]/10 selection:text-[#A63A2B]">
      {/* Header Area */}
      <Header
        title={bookConfig.title}
        setIsAboutOpen={setIsAboutOpen}
      />

      <main className="mt-6 md:mt-8 px-6 md:px-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 relative z-10">
        {/* Left Column: Index and Classification */}
        <Sidebar
          chaptersCount={chaptersCount}
          selectedChapterId={selectedChapterId}
          setSelectedChapterId={setSelectedChapterId}
          mainSections={mainSections}
          openEditMain={openEditMain}
          handleRemoveSection={handleRemoveSection}
          openEditSub={openEditSub}
          handleRemoveSubSection={handleRemoveSubSection}
          annotatedChapterIds={new Set(
            Object.entries(customInterpretations)
              .filter(([, v]) => !!(v as string)?.trim())
              .map(([k]) => Number(k))
          )}
          chapters={bookConfig.content}
          customInterpretations={customInterpretations}
          onAskAI={(prompt) => {
            setAISystemPrompt(prompt);
            setIsAIOpen(true);
            setIsAIVisible(true);
          }}
          bookTitle={bookConfig.title}
        />

        {/* Center Content Area */}
        <div className="lg:col-span-9 flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Chapter Content */}
          <ChapterContent
            chapters={bookConfig.content}
            selectedChapterId={selectedChapterId}
            setSelectedChapterId={setSelectedChapterId}
            customInterpretations={customInterpretations}
            setCustomInterpretations={(newVal) => {
              setCustomInterpretations(newVal);
              markDirty();
            }}
            editingLocId={editingLocId}
            setEditingLocId={setEditingLocId}
            tempInterpretation={tempInterpretation}
            setTempInterpretation={setTempInterpretation}
            onAskAI={(prompt) => {
              setAISystemPrompt(prompt);
              setIsAIOpen(true);
              setIsAIVisible(true);
            }}
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

      {/* AI Floating Modal */}
      <AIModal
        isOpen={isAIOpen && isAIVisible}
        onHide={() => setIsAIVisible(false)}
        onClose={() => { setIsAIOpen(false); setIsAIVisible(false); }}
        systemPrompt={aiSystemPrompt}
      />

      <style>{`
        @import url('https://fonts.googleapis.cn/css2?family=Noto+Serif+SC:wght@300;600;900&family=Plus+Jakarta+Sans:wght@300;500;700&display=swap');
        
        :root {
          --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
          --font-serif: 'Noto Serif SC', serif;
          background-color: #FDFBF7;
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
