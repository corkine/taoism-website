import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit2, AtSign, ChevronDown } from 'lucide-react';
import { MainSectionModal, SubSectionModal } from './SectionModals';
import { BOOKS } from '../data/book';
import { useAppStore, usePartitions, useInterpretations } from '../store/useAppStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { MainSection, SubSection } from '../types';

interface SidebarProps {
  bookId: string;
  selectedChapterId: number;
  setSelectedChapterId: (idOrUpdater: number | ((prev: number) => number)) => void;
  onOpenAI: (prompt: string) => void;
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
  onOpenAI,
}: SidebarProps) => {
  const bookConfig = BOOKS.find(b => b.id === bookId)!;
  const chaptersCount = bookConfig.content.length;

  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

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
    const relevantChapters = bookConfig.content.filter(c => c.id >= start && c.id <= end);
    const customInterpretations = interpretationsForBook;

    const structureText = mainSections.map((ms, i) => {
      const subs = ms.subSections.map((ss, j) => `    - ${i + 1}.${j + 1} ${ss.title} (CH ${ss.startChapter}-${ss.endChapter})`).join('\n');
      return `- ${i + 1}. ${ms.title} (CH ${ms.startChapter}-${ms.endChapter})${subs ? '\n' + subs : ''}`;
    }).join('\n');

    const prompt = `你是一位精通中国古典哲学的学者，尤其擅长道家经典。
用户正在阅读《${bookConfig.title}》，当前关注的划分范围是：【${title}】（第 ${start} 至 ${end} 章）。

为了提供准确的讨论，以下是本书当前的整体划分结构：
${structureText}

以下是当前关注范围（${title}）内的详细章节内容及用户的批注：

${relevantChapters.map(c => {
      const annotation = customInterpretations[c.id];
      return `--- 第 ${c.id} 章：${c.title} ---
【原文】
${c.content}
${annotation ? `【用户批注】\n${annotation}` : ''}`;
    }).join('\n\n')}

请根据以上整体结构和详细内容，为用户提供深度的讨论与见解。请用纯文本回答，不要使用 Markdown 格式（不使用 **加粗**、# 标题、- 列表符号等），段落之间用换行分隔即可。`;

    onOpenAI(prompt);
  };

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      {/* Chapter Quick Grid */}
      <div className="border border-[#E2DED0] p-4 bg-white shadow-sm rounded-sm hidden lg:block">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] mb-4 font-sans">索引</h3>
        <div className="grid grid-cols-9 gap-1">
          {Array.from({ length: chaptersCount }, (_, i) => i + 1).map(num => {
            const hasAnnotation = annotatedChapterIds.has(num);
            let itemClasses = 'bg-[#A63A2B]/5 text-[#A63A2B] hover:bg-[#A63A2B]/10';
            if (selectedChapterId === num) {
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
                onClick={() => setSelectedChapterId(num)}
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
              <div key={section.id} className="group relative">
                <div className="flex justify-between items-center text-sm border-b border-[#E2DED0] pb-1 hover:border-[#A63A2B] transition-colors">
                  <span className={`font-bold transition-colors ${isActiveMainSection ? 'text-[#A63A2B]' : 'text-[#1A1A1A]'}`}>
                    {idx + 1}. {section.title}
                  </span>

                  <div className="relative flex items-center justify-end min-w-[60px]">
                    <div className="relative group/ch-range">
                      <span className="text-[#A63A2B] font-sans text-xs font-bold whitespace-nowrap group-hover/ch-range:opacity-0 transition-opacity cursor-default">
                        CH {section.startChapter.toString().padStart(2, '0')}-{section.endChapter.toString().padStart(2, '0')}
                      </span>
                      <div className="absolute inset-y-0 right-0 flex items-center gap-1 opacity-0 group-hover/ch-range:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskAI(section.title, section.startChapter, section.endChapter);
                          }}
                          className="text-[#8C8471] hover:text-[#A63A2B] transition-all p-1"
                          title="问 AI"
                        >
                          <AtSign size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditMain(section.id);
                          }}
                          className="text-[#8C8471] hover:text-[#A63A2B] transition-all p-1"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSection(section.id);
                          }}
                          className="text-[#8C8471] hover:text-red-800 transition-all p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {section.description && (
                  <p className="text-[11px] text-[#8C8471] italic mt-1 leading-relaxed">
                    {section.description}
                  </p>
                )}

                {/* Sub-sections */}
                <div className="mt-3 ml-4 space-y-2 border-l border-dashed border-[#E2DED0] pl-3">
                  {section.subSections.map((sub, sIdx) => {
                    const isActiveSubSection =
                      selectedChapterId >= sub.startChapter &&
                      selectedChapterId <= sub.endChapter;
                    return (
                      <div key={sub.id} className="relative group/sub">
                        <div className="flex justify-between items-center text-[13px] text-[#3D3D3D]">
                          <span
                            className={`cursor-pointer transition-colors ${isActiveSubSection
                              ? 'font-semibold text-[#A63A2B]'
                              : 'hover:text-[#A63A2B]'
                              }`}
                            onClick={() => setSelectedChapterId(sub.startChapter)}
                          >
                            {idx + 1}.{sIdx + 1} {sub.title}
                          </span>
                          <div className="relative flex items-center justify-end min-w-[32px]">
                            <span className="text-[10px] font-sans text-[#8C8471] group-hover/sub:opacity-0 transition-opacity">
                              {sub.startChapter}-{sub.endChapter}
                            </span>
                            <div className="absolute inset-y-0 right-0 flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleAskAI(sub.title, sub.startChapter, sub.endChapter)}
                                className="text-[#8C8471] hover:text-[#A63A2B] transition-all p-0.5"
                                title="问 AI"
                              >
                                <AtSign size={10} />
                              </button>
                              <button
                                onClick={() => openEditSub(section.id, sub.id)}
                                className="text-[#8C8471] hover:text-[#A63A2B] transition-all p-0.5"
                              >
                                <Edit2 size={10} />
                              </button>
                              <button
                                onClick={() => handleRemoveSubSection(section.id, sub.id)}
                                className="text-[#8C8471] hover:text-red-800 transition-all p-0.5"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => openEditSub(section.id)}
                    className="text-[10px] text-[#A63A2B] flex items-center gap-1 transition-all uppercase tracking-widest font-bold mt-2 hover:translate-x-1"
                  >
                    <Plus size={10} /> 添加子章
                  </button>
                </div>
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
    </aside>
  );
});

