import { useMemo } from 'react';
import { X, PanelRight } from 'lucide-react';
import { BOOKS } from '../data/book';
import { usePartitions, useInterpretations } from '../store/useAppStore';

// ── Colour palettes (same as Sidebar) ────────────────────────────────────────
const colors = [
  'bg-[#F0F7FD] dark:bg-[#2B6EA6]/10 text-[#2B6EA6] dark:text-[#5B9EE6] hover:bg-[#DEEBF5] dark:hover:bg-[#2B6EA6]/20',
  'bg-[#F0FDF5] dark:bg-[#2BA658]/10 text-[#2BA658] dark:text-[#5BD88B] hover:bg-[#DEF5E6] dark:hover:bg-[#2BA658]/20',
  'bg-[#FCFDF0] dark:bg-[#A6A02B]/10 text-[#A6A02B] dark:text-[#D1CB54] hover:bg-[#F3F5DE] dark:hover:bg-[#A6A02B]/20',
  'bg-[#F4F0FD] dark:bg-[#6E2BA6]/10 text-[#6E2BA6] dark:text-[#9A5BD8] hover:bg-[#E5DEF5] dark:hover:bg-[#6E2BA6]/20',
  'bg-[#FDF6F0] dark:bg-[#A6612B]/10 text-[#A6612B] dark:text-[#D88B5B] hover:bg-[#F5E8DE] dark:hover:bg-[#A6612B]/20',
  'bg-[#FDF0F7] dark:bg-[#A62B6E]/10 text-[#A62B6E] dark:text-[#D85B9A] hover:bg-[#F5DEEB] dark:hover:bg-[#A62B6E]/20',
];
const ringColors = [
  'ring-1 ring-inset ring-[#2B6EA6]/40 dark:ring-[#5B9EE6]/40',
  'ring-1 ring-inset ring-[#2BA658]/40 dark:ring-[#5BD88B]/40',
  'ring-1 ring-inset ring-[#A6A02B]/40 dark:ring-[#D1CB54]/40',
  'ring-1 ring-inset ring-[#6E2BA6]/40 dark:ring-[#9A5BD8]/40',
  'ring-1 ring-inset ring-[#A6612B]/40 dark:ring-[#D88B5B]/40',
  'ring-1 ring-inset ring-[#A62B6E]/40 dark:ring-[#D85B9A]/40',
];

export function ReviewNavPanel({
  bookId,
  selectedChapterId,
  onSelect,
  onClose,
  isPinned,
  onTogglePin,
}: {
  bookId: string;
  selectedChapterId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}) {
  const bookConfig = BOOKS.find(b => b.id === bookId)!;
  const chaptersCount = bookConfig.content.length;
  const mainSections = usePartitions(bookId);
  const interpretationsForBook = useInterpretations(bookId);

  const annotatedChapterIds = useMemo(
    () =>
      new Set(
        Object.entries(interpretationsForBook)
          .filter(([, v]) => !!(v as string)?.trim())
          .map(([k]) => Number(k)),
      ),
    [interpretationsForBook],
  );

  return (
    <>
      {/* Backdrop */}
      {!isPinned && (
        <div
          className="fixed inset-0 z-[160]"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed flex flex-col"
        style={
          isPinned
            ? {
                top: 0,
                bottom: 0,
                right: 0,
                width: 320,
                zIndex: 170,
                background: 'var(--panel-bg)',
                borderLeft: '1px solid var(--border-color)',
                boxShadow: '-4px 0 16px rgba(0,0,0,0.05)',
                transition: 'background 0.3s, border-color 0.3s, right 0.3s',
              }
            : {
                top: 10,
                bottom: 10,
                right: 24,
                width: 320,
                zIndex: 170,
                background: 'var(--panel-bg)',
                border: '1px solid var(--border-color)',
                borderTop: '3px solid var(--accent-red)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)',
                transition: 'background 0.3s, border-color 0.3s, right 0.3s',
              }
        }
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] font-sans" style={{ color: 'var(--text-muted)' }}>
            索引 / 分章
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePin}
              className="w-6 h-6 flex items-center justify-center transition-colors rounded theme-hover-accent"
              style={{ color: isPinned ? 'var(--accent-red)' : 'var(--text-muted)' }}
              title={isPinned ? "取消固定" : "固定到右侧"}
            >
              <PanelRight size={13} />
            </button>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center transition-colors rounded theme-hover-accent"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto hide-scrollbar flex-1 min-h-0 p-4 space-y-6">
          {/* Index grid */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 font-sans" style={{ color: 'var(--accent-red)' }}>
              索引
            </h3>
            <div className="grid grid-cols-9 gap-1">
              {Array.from({ length: chaptersCount }, (_, i) => i + 1).map(num => {
                const hasAnnotation = annotatedChapterIds.has(num);
                const isSelected = selectedChapterId === num;
                
                let itemClasses = '';
                
                if (isSelected) {
                  itemClasses = 'text-white';
                } else {
                  const sIdx = mainSections.findIndex(
                    s => num >= s.startChapter && num <= s.endChapter,
                  );
                  if (sIdx !== -1) {
                    itemClasses = colors[sIdx % colors.length];
                    if (hasAnnotation) itemClasses += ' ' + ringColors[sIdx % ringColors.length];
                  } else {
                    itemClasses = 'text-[color:var(--accent-red)] hover:bg-black/5 dark:hover:bg-white/5';
                    if (hasAnnotation) itemClasses += ' ring-1 ring-inset ring-[color:var(--accent-red)] opacity-100';
                    else itemClasses += ' opacity-60';
                  }
                }
                
                return (
                  <button
                    key={num}
                    id={`review-grid-ch-${num}`}
                    onClick={() => { onSelect(num); if (!isPinned) onClose(); }}
                    title={`第 ${num} 章`}
                    className={`w-full aspect-square text-[10px] flex items-center justify-center transition-colors font-sans outline-none ${itemClasses}`}
                    style={isSelected ? { background: 'var(--accent-red)', border: 'none' } : {}}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section tree */}
          {mainSections.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 font-sans" style={{ color: 'var(--text-main)' }}>
                分章
              </h3>
              <div className="space-y-5">
                {mainSections.map((section, idx) => {
                  const isActiveMain =
                    selectedChapterId >= section.startChapter &&
                    selectedChapterId <= section.endChapter;
                  return (
                    <div key={section.id}>
                      <div
                        onClick={() => { onSelect(section.startChapter); if (!isPinned) onClose(); }}
                        className="flex justify-between items-center text-sm border-b pb-1 transition-colors cursor-pointer"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <span className="font-bold transition-colors" style={{ color: isActiveMain ? 'var(--accent-red)' : 'var(--text-main)' }}>
                          {idx + 1}. {section.title}
                        </span>
                        <span className="font-sans text-xs font-bold whitespace-nowrap" style={{ color: 'var(--accent-red)' }}>
                          CH {section.startChapter.toString().padStart(2, '0')}–
                          {section.endChapter.toString().padStart(2, '0')}
                        </span>
                      </div>

                      {section.description && (
                        <p className="text-[11px] italic mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {section.description}
                        </p>
                      )}

                      {section.subSections.length > 0 && (
                        <div className="mt-2 ml-3 space-y-1.5 border-l border-dashed pl-3" style={{ borderColor: 'var(--border-color)' }}>
                          {section.subSections.map((sub, sIdx) => {
                            const isActiveSub =
                              selectedChapterId >= sub.startChapter &&
                              selectedChapterId <= sub.endChapter;
                            return (
                              <div
                                key={sub.id}
                                onClick={() => { onSelect(sub.startChapter); if (!isPinned) onClose(); }}
                                className="flex justify-between items-center text-[13px] cursor-pointer transition-colors theme-hover-accent"
                                style={{ color: isActiveSub ? 'var(--accent-red)' : 'var(--text-content)' }}
                              >
                                <span className={isActiveSub ? 'font-semibold' : ''}>
                                  {idx + 1}.{sIdx + 1} {sub.title}
                                </span>
                                <span className="text-[10px] font-sans" style={{ color: 'var(--text-muted)' }}>
                                  {sub.startChapter}–{sub.endChapter}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
