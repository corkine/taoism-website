import { useEffect, useRef } from 'react';
import { Chapter, MainSection } from '../types';
import { buildSectionBlocks } from '../utils/sectionGrouping';

interface LaoziViewTocProps {
  chapters: Chapter[];
  partitions: MainSection[];
  activeChapterId: number;
  onSelect: (chapterId: number) => void;
}

export function LaoziViewToc({
  chapters,
  partitions,
  activeChapterId,
  onSelect,
}: LaoziViewTocProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const { blocks, ungrouped } = buildSectionBlocks(partitions, chapters);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeChapterId]);

  const chapterButton = (chapter: Chapter) => {
    const active = chapter.id === activeChapterId;
    return (
      <button
        key={chapter.id}
        ref={active ? activeRef : undefined}
        type="button"
        onClick={() => onSelect(chapter.id)}
        aria-current={active ? 'location' : undefined}
        className={`w-full flex items-baseline gap-2 px-2 py-0.5 text-left transition-colors font-serif ${
          active
            ? 'bg-[#A63A2B] text-white'
            : 'text-[#5E584D] hover:bg-[#A63A2B]/7 hover:text-[#A63A2B]'
        }`}
      >
        <span className={`w-5 flex-shrink-0 text-[9px] font-sans ${active ? 'text-white/75' : 'text-[#A63A2B]'}`}>
          {chapter.id.toString().padStart(2, '0')}
        </span>
        <span className="truncate text-[11px] leading-5">{chapter.title}</span>
      </button>
    );
  };

  return (
    <nav aria-label="章节目录" className="space-y-4 pb-6">
      {blocks.map(({ section, groups }, sectionIndex) => (
        <section key={section.id}>
          <button
            type="button"
            onClick={() => onSelect(section.startChapter)}
            className="w-full flex items-baseline justify-between gap-2 border-b border-[#E2DED0] pb-1 text-left group"
          >
            <span className="font-bold text-[13px] text-[#1A1A1A] group-hover:text-[#A63A2B] transition-colors">
              {sectionIndex + 1}. {section.title}
            </span>
            <span className="font-sans text-[9px] font-bold text-[#A63A2B] whitespace-nowrap">
              {section.startChapter}–{section.endChapter}
            </span>
          </button>

          <div className="mt-1.5 space-y-1.5">
            {groups.map((group, groupIndex) => (
              <div key={`${section.id}-${group.label}-${groupIndex}`}>
                {!group.isMain && (
                  <button
                    type="button"
                    onClick={() => onSelect(group.chapters[0].id)}
                    className="w-full px-2 text-left text-[11px] leading-5 font-bold text-[#8C8471] hover:text-[#A63A2B] transition-colors"
                  >
                    {sectionIndex + 1}.{groupIndex + 1} {group.label}
                  </button>
                )}
                <div>{group.chapters.map(chapterButton)}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {ungrouped.length > 0 && (
        <section>
          <h3 className="border-b border-[#E2DED0] pb-1 text-[13px] font-bold text-[#1A1A1A]">未分篇</h3>
          <div className="mt-1.5">{ungrouped.map(chapterButton)}</div>
        </section>
      )}
    </nav>
  );
}
