import React from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { MainSection } from '../types';

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
  annotatedChapterIds
}: SidebarProps) {
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
                  <div className="flex items-center gap-2">
                    <span className={`font-bold transition-colors ${isActiveMainSection ? 'text-[#A63A2B]' : 'text-[#1A1A1A]'
                      }`}>
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-sans text-[#8C8471]">
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
