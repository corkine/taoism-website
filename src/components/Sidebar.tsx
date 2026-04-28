import { Plus, Trash2, Edit2, AtSign } from 'lucide-react';
import { MainSection, Chapter } from '../types';

interface SidebarProps {
  chaptersCount: number;
  selectedChapterId: number;
  setSelectedChapterId: (id: number) => void;
  mainSections: MainSection[];
  openEditMain: (sectionId?: string) => void;
  handleRemoveSection: (id: string) => void;
  openEditSub: (parentId: string, subId?: string) => void;
  handleRemoveSubSection: (parentId: string, subId: string) => void;
  annotatedChapterIds: Set<number>;
  chapters: Chapter[];
  customInterpretations: Record<number, string>;
  onAskAI?: (systemPrompt: string) => void;
  bookTitle: string;
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

export function Sidebar({
  chaptersCount,
  selectedChapterId,
  setSelectedChapterId,
  mainSections,
  openEditMain,
  handleRemoveSection,
  openEditSub,
  handleRemoveSubSection,
  onAskAI,
  chapters,
  customInterpretations,
  annotatedChapterIds,
  bookTitle
}: SidebarProps) {
  const handleAskAI = (title: string, start: number, end: number) => {
    if (!onAskAI) return;

    const relevantChapters = chapters.filter(c => c.id >= start && c.id <= end);

    // Global structure description
    const structureText = mainSections.map((ms, i) => {
      const subs = ms.subSections.map((ss, j) => `    - ${i + 1}.${j + 1} ${ss.title} (CH ${ss.startChapter}-${ss.endChapter})`).join('\n');
      return `- ${i + 1}. ${ms.title} (CH ${ms.startChapter}-${ms.endChapter})${subs ? '\n' + subs : ''}`;
    }).join('\n');

    const prompt = `你是一位精通中国古典哲学的学者，尤其擅长道家经典。
用户正在阅读《${bookTitle}》，当前关注的划分范围是：【${title}】（第 ${start} 至 ${end} 章）。

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

    onAskAI(prompt);
  };

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      {/* Chapter Quick Grid */}
      <div className="border border-[#E2DED0] p-4 bg-white shadow-sm rounded-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] mb-4 font-sans">索引</h3>
        <div className="grid grid-cols-9 gap-1">
          {Array.from({ length: chaptersCount }, (_, i) => i + 1).map(num => {
            const hasAnnotation = annotatedChapterIds.has(num);
            let itemClasses = 'bg-[#FDF2F0] text-[#A63A2B] hover:bg-[#F5E1DE]';
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
                title={hasAnnotation ? `第 ${num} 章*` : `第 ${num} 章`}
                className={`w-full aspect-square text-[10px] flex items-center justify-center transition-colors font-sans ${itemClasses}`}
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
      </div>
    </aside>
  );
}
