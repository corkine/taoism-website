import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, ChevronDown, AtSign, Edit2, Trash2, ListChecks, X, Sparkles, Brain, ScrollText, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainSectionModal, SubSectionModal, SectionActionModal } from './SectionModals';
import { BOOKS } from '../data/book';
import { useAppStore, usePartitions, useInterpretations } from '../store/useAppStore';
import { useAIUIStore } from '../store/useAIUIStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { MainSection, SubSection } from '../types';
import { buildSectionPrompt, buildMultiSelectPrompt, buildAllChaptersTitlesPrompt, buildAllChaptersFullPrompt } from '../utils/prompt';

interface SidebarProps {
  bookId: string;
  selectedChapterId: number;
  setSelectedChapterId: (idOrUpdater: number | ((prev: number) => number)) => void;
}

const colors = [
  'bg-[#F0F7FD] text-[#2B6EA6] hover:bg-[#DEEBF5]',
  'bg-[#F0FDF5] text-[#2BA658] hover:bg-[#DEF5E6]',
  'bg-[#FCFDF0] text-[#A6A02B] hover:bg-[#F3F5DE]',
  'bg-[#F4F0FD] text-[#6E2BA6] hover:bg-[#E5DEF5]',
  'bg-[#FDF6F0] text-[#A6612B] hover:bg-[#F5E8DE]',
  'bg-[#FDF0F7] text-[#A62B6E] hover:bg-[#F5DEEB]',
];

const ringColors = [
  'ring-1 ring-inset ring-[#2B6EA6]/40',
  'ring-1 ring-inset ring-[#2BA658]/40',
  'ring-1 ring-inset ring-[#A6A02B]/40',
  'ring-1 ring-inset ring-[#6E2BA6]/40',
  'ring-1 ring-inset ring-[#A6612B]/40',
  'ring-1 ring-inset ring-[#A62B6E]/40',
];

export const Sidebar = React.memo(({
  bookId,
  selectedChapterId,
  setSelectedChapterId,
}: SidebarProps) => {
  const bookConfig = BOOKS.find(b => b.id === bookId)!;
  const chaptersCount = bookConfig.content.length;

  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedChaptersForAI, setSelectedChaptersForAI] = useState<Set<number>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- Section Management Logic (Simplified) ---
  // Partitions come from the centralized zustand store, so they stay in
  // sync automatically when data is restored from WebDAV / file import.
  const mainSections = usePartitions(bookId);
  const setPartitions = useAppStore(s => s.setPartitions);

  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [isEditingSub, setIsEditingSub] = useState(false);
  const [editingSubParentId, setEditingSubParentId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Action modal state (view info + perform actions)
  const [actionModal, setActionModal] = useState<{
    type: 'main' | 'sub';
    sectionIndex: number;
    subSectionIndex?: number;
  } | null>(null);

  const closeActionModal = useCallback(() => setActionModal(null), []);

  const openEditMain = useCallback((sectionId?: string) => {
    if (sectionId) {
      const idx = mainSections.findIndex(s => s.id === sectionId);
      if (idx !== -1) {
        setEditingIndex(idx);
      }
    } else {
      setEditingIndex(null);
    }
    setIsEditing(true);
  }, [mainSections]);

  const handleSaveSection = useCallback((formData: Omit<MainSection, 'id' | 'subSections'>) => {
    const start = Number.isNaN(formData.startChapter) ? 1 : formData.startChapter;
    const end = Number.isNaN(formData.endChapter) ? chaptersCount : formData.endChapter;

    let newSections = [...mainSections];
    if (editingIndex !== null) {
      newSections[editingIndex] = {
        ...newSections[editingIndex],
        ...formData,
        startChapter: Math.min(start, end),
        endChapter: Math.max(start, end)
      };
    } else {
      newSections.push({
        ...formData,
        startChapter: Math.min(start, end),
        endChapter: Math.max(start, end),
        id: Date.now().toString(),
        subSections: []
      });
    }
    newSections.sort((a, b) => a.startChapter - b.startChapter);
    setPartitions(bookId, newSections);
    setIsEditing(false);
  }, [editingIndex, mainSections, chaptersCount, bookId, setPartitions]);

  const handleRemoveSection = useCallback((id: string) => {
    setPartitions(bookId, mainSections.filter(s => s.id !== id));
  }, [bookId, mainSections, setPartitions]);

  const openEditSub = useCallback((parentId: string, subId?: string) => {
    setEditingSubParentId(parentId);
    if (subId) {
      setEditingSubId(subId);
    } else {
      setEditingSubId(null);
    }
    setIsEditingSub(true);
  }, []);

  const handleSaveSubSection = useCallback((formData: Omit<SubSection, 'id'>) => {
    if (!editingSubParentId) return;

    const pIndex = mainSections.findIndex(s => s.id === editingSubParentId);
    if (pIndex === -1) return;

    const start = Number.isNaN(formData.startChapter) ? 1 : formData.startChapter;
    const end = Number.isNaN(formData.endChapter) ? chaptersCount : formData.endChapter;

    let newSections = [...mainSections];
    let parent = { ...newSections[pIndex] };
    let subs = [...parent.subSections];

    if (editingSubId) {
      const sIndex = subs.findIndex(s => s.id === editingSubId);
      if (sIndex !== -1) {
        subs[sIndex] = {
          ...subs[sIndex],
          ...formData,
          startChapter: Math.min(start, end),
          endChapter: Math.max(start, end)
        };
      }
    } else {
      subs.push({
        id: Date.now().toString(),
        ...formData,
        startChapter: Math.min(start, end),
        endChapter: Math.max(start, end)
      });
    }

    subs.sort((a, b) => a.startChapter - b.startChapter);
    parent.subSections = subs;
    newSections[pIndex] = parent;

    setPartitions(bookId, newSections);
    setIsEditingSub(false);
  }, [editingSubParentId, editingSubId, mainSections, chaptersCount, bookId, setPartitions]);

  const handleRemoveSubSection = useCallback((parentId: string, subId: string) => {
    setPartitions(
      bookId,
      mainSections.map(section => {
        if (section.id === parentId) {
          return {
            ...section,
            subSections: section.subSections.filter(sub => sub.id !== subId)
          };
        }
        return section;
      })
    );
  }, [bookId, mainSections, setPartitions]);

  const initialMainData = useMemo(() => {
    if (editingIndex !== null) {
      const s = mainSections[editingIndex];
      return { title: s.title, startChapter: s.startChapter, endChapter: s.endChapter, description: s.description };
    }
    return { title: '', startChapter: 1, endChapter: chaptersCount, description: '' };
  }, [editingIndex, mainSections, chaptersCount]);

  const initialSubData = useMemo(() => {
    if (editingSubParentId && editingSubId) {
      const p = mainSections.find(s => s.id === editingSubParentId);
      const s = p?.subSections.find(ss => ss.id === editingSubId);
      if (s) return { title: s.title, startChapter: s.startChapter, endChapter: s.endChapter, description: s.description };
    }
    return { title: '', startChapter: 1, endChapter: chaptersCount, description: '' };
  }, [editingSubParentId, editingSubId, mainSections, chaptersCount]);
  // --- End of Section Management Logic ---

  // Annotated chapters state — derived reactively from the store.
  const interpretationsForBook = useInterpretations(bookId);
  const annotatedChapterIds = useMemo(() => {
    return new Set(
      Object.entries(interpretationsForBook)
        .filter(([, v]) => !!(v as string)?.trim())
        .map(([k]) => Number(k))
    );
  }, [interpretationsForBook]);

  const handleAskAI = (title: string, start: number, end: number) => {
    const prompt = buildSectionPrompt({
      bookTitle: bookConfig.title,
      rangeTitle: title,
      startChapter: start,
      endChapter: end,
      mainSections,
      chapters: bookConfig.content,
      interpretations: interpretationsForBook,
    });
    useAIUIStore.getState().openSnapshot(prompt);
  };

  const handleMultiAskAI = () => {
    if (selectedChaptersForAI.size === 0) return;
    const selectedArr = Array.from<number>(selectedChaptersForAI).sort((a, b) => a - b);
    const prompt = buildMultiSelectPrompt({
      bookTitle: bookConfig.title,
      selectedChapters: selectedArr,
      chapters: bookConfig.content,
      interpretations: interpretationsForBook,
    });
    useAIUIStore.getState().openSnapshot(prompt);
    // Optional: exit multi-select mode after asking
    setIsMultiSelectMode(false);
    setSelectedChaptersForAI(new Set());
  };

  const handleStructureAskAI = useCallback(() => {
    setIsMenuOpen(false);
    const prompt = buildAllChaptersTitlesPrompt(bookConfig.title, mainSections);
    useAIUIStore.getState().openSnapshot(prompt);
  }, [bookConfig.title, mainSections]);

  const handleFullAskAI = useCallback(() => {
    setIsMenuOpen(false);
    const prompt = buildAllChaptersFullPrompt(
      bookConfig.title,
      mainSections,
      bookConfig.content,
      interpretationsForBook,
    );
    useAIUIStore.getState().openSnapshot(prompt);
  }, [bookConfig.title, bookConfig.content, mainSections, interpretationsForBook]);

  // Derived action modal data
  const actionModalData = useMemo(() => {
    if (!actionModal) return null;
    const { type, sectionIndex, subSectionIndex } = actionModal;
    const section = mainSections[sectionIndex];
    if (!section) return null;

    if (type === 'sub' && subSectionIndex !== undefined) {
      const sub = section.subSections[subSectionIndex];
      if (!sub) return null;
      return {
        type: 'sub' as const,
        data: {
          title: sub.title,
          description: sub.description,
          startChapter: sub.startChapter,
          endChapter: sub.endChapter,
          label: `${sectionIndex + 1}.${subSectionIndex + 1} ${sub.title}`,
          parentTitle: section.title,
        },
        onEdit: () => {
          closeActionModal();
          setTimeout(() => openEditSub(section.id, sub.id), 200);
        },
        onDelete: () => handleRemoveSubSection(section.id, sub.id),
        onAskAI: () => {
          closeActionModal();
          setTimeout(() => handleAskAI(sub.title, sub.startChapter, sub.endChapter), 200);
        },
        onNavigate: () => setSelectedChapterId(sub.startChapter),
      };
    }

    return {
      type: 'main' as const,
      data: {
        title: section.title,
        description: section.description,
        startChapter: section.startChapter,
        endChapter: section.endChapter,
        label: `${sectionIndex + 1}. ${section.title}`,
      },
      onEdit: () => {
        closeActionModal();
        setTimeout(() => openEditMain(section.id), 200);
      },
      onDelete: () => handleRemoveSection(section.id),
      onAskAI: () => {
        closeActionModal();
        setTimeout(() => handleAskAI(section.title, section.startChapter, section.endChapter), 200);
      },
      onNavigate: () => setSelectedChapterId(section.startChapter),
      onAddSubSection: () => openEditSub(section.id),
    };
  }, [actionModal, mainSections, closeActionModal, openEditMain, openEditSub, handleRemoveSection, handleRemoveSubSection, handleAskAI, setSelectedChapterId]);

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      {/* Chapter Quick Grid */}
      <div className="border border-[#E2DED0] p-4 bg-white shadow-sm rounded-sm">
        {/* hidden lg:block */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] font-sans">索引</h3>
          <div className="flex items-center gap-1">
            {/* Multi-select actions — kept outside menu for quick access */}
            {isMultiSelectMode && (
              <>
                <button
                  onClick={() => { setIsMultiSelectMode(false); setSelectedChaptersForAI(new Set()); }}
                  className="p-1 text-[#8C8471] hover:bg-[#8C8471]/10 rounded-sm transition-colors"
                  title="退出多选"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={handleMultiAskAI}
                  className="px-1.5 py-0.5 text-[11px] font-bold text-[#A63A2B] hover:bg-[#A63A2B]/10 rounded-sm transition-colors font-sans"
                >
                  问 AI{selectedChaptersForAI.size > 0 ? `（${selectedChaptersForAI.size}）` : ''}
                </button>
              </>
            )}

            {/* Menu popup */}
            <div style={{ position: 'relative', transform: 'translateX(6px)' }}>
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className={`p-1 rounded-sm transition-colors ${isMenuOpen ? 'text-[#A63A2B] bg-[#A63A2B]/10' : 'text-[#8C8471] hover:text-[#A63A2B]'}`}
                title="操作菜单"
              >
                <MoreVertical size={14} />
              </button>
              {isMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    width: 180,
                    background: '#FDFBF7',
                    border: '1px solid #E2DED0',
                    boxShadow: '0 8px 24px rgba(26,26,26,0.15)',
                    zIndex: 20,
                  }}
                >
                  {/* Recite mode — laozi only, hidden during multi-select */}
                  {bookId === 'laozi' && !isMultiSelectMode && (
                    <button
                      onClick={() => { setIsMenuOpen(false); navigate(`/${bookId}-review`); }}
                      className="w-full text-left px-3 py-2 hover:bg-[#F5F1EA] transition-colors border-b border-[#E2DED0]/60 flex items-center gap-2"
                    >
                      <ScrollText size={12} className="text-[#8C8471] flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-[#1A1A1A] font-sans leading-tight">背诵模式</div>
                        <div className="text-[9px] text-[#8C8471] font-sans leading-tight">前往复习背诵页面</div>
                      </div>
                    </button>
                  )}

                  {/* Multi-select entry — hidden when multi-select is active */}
                  {!isMultiSelectMode && (
                    <button
                      onClick={() => { setIsMenuOpen(false); setIsMultiSelectMode(true); }}
                      className="w-full text-left px-3 py-2 hover:bg-[#F5F1EA] transition-colors border-b border-[#E2DED0]/60 flex items-center gap-2"
                    >
                      <ListChecks size={12} className="text-[#8C8471] flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-[#1A1A1A] font-sans leading-tight">多选模式</div>
                        <div className="text-[9px] text-[#8C8471] font-sans leading-tight">勾选章节批量问 AI</div>
                      </div>
                    </button>
                  )}

                  {/* Structure → AI */}
                  <button
                    onClick={handleStructureAskAI}
                    className="w-full text-left px-3 py-2 hover:bg-[#F5F1EA] transition-colors border-b border-[#E2DED0]/60 flex items-center gap-2"
                  >
                    <Brain size={12} className="text-[#8C8471] flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-[#1A1A1A] font-sans leading-tight">结构问 AI</div>
                      <div className="text-[9px] text-[#8C8471] font-sans leading-tight">以篇章划分结构作为上下文</div>
                    </div>
                  </button>

                  {/* Full text → AI */}
                  <button
                    onClick={handleFullAskAI}
                    className="w-full text-left px-3 py-2 hover:bg-[#F5F1EA] transition-colors flex items-center gap-2"
                  >
                    <Sparkles size={12} className="text-[#8C8471] flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-[#1A1A1A] font-sans leading-tight">全文问 AI</div>
                      <div className="text-[9px] text-[#8C8471] font-sans leading-tight">以全部原文+释义作为上下文</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-9 gap-1">
          {Array.from({ length: chaptersCount }, (_, i) => i + 1).map(num => {
            const isMultiSelected = isMultiSelectMode && selectedChaptersForAI.has(num);
            const hasAnnotation = annotatedChapterIds.has(num);
            let itemClasses = 'bg-[#A63A2B]/5 text-[#A63A2B] hover:bg-[#A63A2B]/10';
            if (isMultiSelected) {
              itemClasses = 'bg-[#A63A2B]/20 text-[#A63A2B] ring-1 ring-inset ring-[#A63A2B]';
            } else if (!isMultiSelectMode && selectedChapterId === num) {
              itemClasses = 'bg-[#A63A2B] text-white';
            } else {
              const sectionIndex = mainSections.findIndex(
                (sec) => num >= sec.startChapter && num <= sec.endChapter
              );
              if (sectionIndex !== -1) {
                itemClasses = colors[sectionIndex % colors.length];
                if (hasAnnotation) {
                  itemClasses += ' ' + ringColors[sectionIndex % ringColors.length];
                }
              } else {
                if (hasAnnotation) {
                  itemClasses += ' ring-1 ring-inset ring-[#A63A2B]/40';
                }
              }
            }

            return (
              <button
                key={num}
                onClick={() => {
                  if (isMultiSelectMode) {
                    const newSet = new Set(selectedChaptersForAI);
                    if (newSet.has(num)) newSet.delete(num);
                    else newSet.add(num);
                    setSelectedChaptersForAI(newSet);
                  } else {
                    setSelectedChapterId(num);
                  }
                }}
                title={`第 ${num} 章`}
                className={`w-full aspect-square text-[10px] flex items-center justify-center transition-colors font-sans outline-none ${itemClasses}`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Classification Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#1A1A1A] font-sans hover:text-[#A63A2B] transition-colors"
          >
            分章定义
            <ChevronDown
              size={14}
              className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            />
          </button>
          <button
            onClick={() => openEditMain()}
            className="p-1.5 hover:bg-[#A63A2B]/10 rounded-full text-[#A63A2B] transition-colors"
            title="Add Section"
          >
            <Plus size={16} />
          </button>
        </div>

        {!isCollapsed && (
        <div className="space-y-6">
          {mainSections.map((section, idx) => {
            const isActiveMainSection =
              selectedChapterId >= section.startChapter &&
              selectedChapterId <= section.endChapter;
            return (
              <div key={section.id}>
                <div
                  onClick={() => setActionModal({ type: 'main', sectionIndex: idx })}
                  className="flex justify-between items-center text-sm border-b border-[#E2DED0] pb-1 hover:border-[#A63A2B] transition-colors cursor-pointer"
                >
                  <span className={`font-bold transition-colors ${isActiveMainSection ? 'text-[#A63A2B]' : 'text-[#1A1A1A]'}`}>
                    {idx + 1}. {section.title}
                  </span>
                  <span className="text-[#A63A2B] font-sans text-xs font-bold whitespace-nowrap">
                    CH {section.startChapter.toString().padStart(2, '0')}-{section.endChapter.toString().padStart(2, '0')}
                  </span>
                </div>

                {section.description && (
                  <p className="text-[11px] text-[#8C8471] italic mt-1 leading-relaxed">
                    {section.description}
                  </p>
                )}

                {/* Sub-sections — only render when there are sub-sections */}
                {section.subSections.length > 0 && (
                  <div className="mt-3 ml-4 space-y-2 border-l border-dashed border-[#E2DED0] pl-3">
                    {section.subSections.map((sub, sIdx) => {
                    const isActiveSubSection =
                      selectedChapterId >= sub.startChapter &&
                      selectedChapterId <= sub.endChapter;
                    return (
                      <div key={sub.id}>
                        <div
                          onClick={() => setActionModal({ type: 'sub', sectionIndex: idx, subSectionIndex: sIdx })}
                          className="flex justify-between items-center text-[13px] text-[#3D3D3D] cursor-pointer"
                        >
                          <span className={isActiveSubSection ? 'font-semibold text-[#A63A2B]' : ''}>
                            {idx + 1}.{sIdx + 1} {sub.title}
                          </span>
                          <span className="text-[10px] font-sans text-[#8C8471]">
                            {sub.startChapter}-{sub.endChapter}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      <MainSectionModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveSection}
        initialData={initialMainData}
      />

      <SubSectionModal
        isOpen={isEditingSub}
        onClose={() => setIsEditingSub(false)}
        onSave={handleSaveSubSection}
        initialData={initialSubData}
      />

      {actionModalData && (
        <SectionActionModal
          isOpen={true}
          onClose={closeActionModal}
          type={actionModalData.type}
          data={actionModalData.data}
          onEdit={actionModalData.onEdit}
          onDelete={actionModalData.onDelete}
          onAskAI={actionModalData.onAskAI}
          onNavigate={actionModalData.onNavigate}
          onAddSubSection={actionModalData.onAddSubSection}
        />
      )}
    </aside>
  );
});

