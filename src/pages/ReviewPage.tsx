import { useEffect, useCallback, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react';
import { BOOKS } from '../data/book';
import { ChapterContent } from '../components/ChapterContent';
import { AIModal } from '../components/AIModal';
import { useAutoSync } from '../hooks/useAutoSync';
import { usePartitions, useInterpretations } from '../store/useAppStore';

const BOOK_ID = 'laozi';
const LS_KEY = 'review_laozi_chapter';

// ── Colour palettes (same as Sidebar) ────────────────────────────────────────
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

// ── Navigation panel: index grid + section tree ───────────────────────────────
function ReviewNavPanel({
  bookId,
  selectedChapterId,
  onSelect,
  onClose,
}: {
  bookId: string;
  selectedChapterId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
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
      <div
        className="fixed inset-0 z-[160]"
        style={{ background: 'rgba(26,26,26,0.4)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-[170] bottom-20 right-6 flex flex-col"
        style={{
          width: 320,
          maxHeight: 'calc(100vh - 100px)',
          background: '#FDFBF7',
          border: '1px solid #E2DED0',
          borderTop: '3px solid #A63A2B',
          boxShadow: '0 24px 64px rgba(26,26,26,0.22), 0 4px 16px rgba(26,26,26,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #E2DED0' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C8471] font-sans">
            索引 / 分章
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors rounded"
          >
            <X size={13} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          {/* Index grid */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#A63A2B] mb-3 font-sans">
              索引
            </h3>
            <div className="grid grid-cols-9 gap-1">
              {Array.from({ length: chaptersCount }, (_, i) => i + 1).map(num => {
                const hasAnnotation = annotatedChapterIds.has(num);
                let itemClasses = 'bg-[#A63A2B]/5 text-[#A63A2B] hover:bg-[#A63A2B]/10';
                if (selectedChapterId === num) {
                  itemClasses = 'bg-[#A63A2B] text-white';
                } else {
                  const sIdx = mainSections.findIndex(
                    s => num >= s.startChapter && num <= s.endChapter,
                  );
                  if (sIdx !== -1) {
                    itemClasses = colors[sIdx % colors.length];
                    if (hasAnnotation) itemClasses += ' ' + ringColors[sIdx % ringColors.length];
                  } else if (hasAnnotation) {
                    itemClasses += ' ring-1 ring-inset ring-[#A63A2B]/40';
                  }
                }
                return (
                  <button
                    key={num}
                    id={`review-grid-ch-${num}`}
                    onClick={() => { onSelect(num); onClose(); }}
                    title={`第 ${num} 章`}
                    className={`w-full aspect-square text-[10px] flex items-center justify-center transition-colors font-sans outline-none ${itemClasses}`}
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
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-3 font-sans">
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
                        onClick={() => { onSelect(section.startChapter); onClose(); }}
                        className="flex justify-between items-center text-sm border-b border-[#E2DED0] pb-1 hover:border-[#A63A2B] transition-colors cursor-pointer"
                      >
                        <span className={`font-bold transition-colors ${isActiveMain ? 'text-[#A63A2B]' : 'text-[#1A1A1A]'}`}>
                          {idx + 1}. {section.title}
                        </span>
                        <span className="text-[#A63A2B] font-sans text-xs font-bold whitespace-nowrap">
                          CH {section.startChapter.toString().padStart(2, '0')}–
                          {section.endChapter.toString().padStart(2, '0')}
                        </span>
                      </div>

                      {section.description && (
                        <p className="text-[11px] text-[#8C8471] italic mt-1 leading-relaxed">
                          {section.description}
                        </p>
                      )}

                      {section.subSections.length > 0 && (
                        <div className="mt-2 ml-3 space-y-1.5 border-l border-dashed border-[#E2DED0] pl-3">
                          {section.subSections.map((sub, sIdx) => {
                            const isActiveSub =
                              selectedChapterId >= sub.startChapter &&
                              selectedChapterId <= sub.endChapter;
                            return (
                              <div
                                key={sub.id}
                                onClick={() => { onSelect(sub.startChapter); onClose(); }}
                                className="flex justify-between items-center text-[13px] text-[#3D3D3D] cursor-pointer hover:text-[#A63A2B] transition-colors"
                              >
                                <span className={isActiveSub ? 'font-semibold text-[#A63A2B]' : ''}>
                                  {idx + 1}.{sIdx + 1} {sub.title}
                                </span>
                                <span className="text-[10px] font-sans text-[#8C8471]">
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const bookConfig = BOOKS.find(b => b.id === BOOK_ID)!;
  const chaptersCount = bookConfig.content.length; // 81

  useAutoSync();

  const [isGridOpen, setIsGridOpen] = useState(false);

  // Pure state — no URL involvement at all
  const [selectedChapterId, setSelectedChapterIdRaw] = useState<number>(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (!isNaN(n) && n >= 1 && n <= chaptersCount) return n;
    }
    return 1;
  });

  const setSelectedChapterId = useCallback(
    (idOrUpdater: number | ((prev: number) => number)) => {
      setSelectedChapterIdRaw(prev => {
        const next = typeof idOrUpdater === 'function' ? idOrUpdater(prev) : idOrUpdater;
        const clamped = Math.max(1, Math.min(chaptersCount, next));
        localStorage.setItem(LS_KEY, String(clamped));
        return clamped;
      });
    },
    [chaptersCount],
  );

  // Page title
  useEffect(() => {
    document.title = `道经释义 · 老子 背诵 第 ${selectedChapterId} 章`;
  }, [selectedChapterId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;

      if (e.key === 'ArrowLeft' && selectedChapterId > 1) {
        e.preventDefault();
        setSelectedChapterId(p => p - 1);
      } else if (e.key === 'ArrowRight' && selectedChapterId < chaptersCount) {
        e.preventDefault();
        setSelectedChapterId(p => p + 1);
      } else if (e.key === 'Escape' && isGridOpen) {
        setIsGridOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChapterId, setSelectedChapterId, chaptersCount, isGridOpen]);

  return (
    <div
      className="min-h-screen font-serif selection:bg-[#A63A2B]/10 selection:text-[#A63A2B]"
      style={{ background: '#FDFBF7', color: '#1A1A1A' }}
    >
      {/* ── Minimal sticky nav: ← N/81 → ────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '8px 24px',
          background: 'rgba(253,251,247,0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E2DED0',
        }}
      >
        <button
          id="review-prev-btn"
          disabled={selectedChapterId <= 1}
          onClick={() => setSelectedChapterId(p => p - 1)}
          className="flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] disabled:opacity-25 transition-colors"
          style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: selectedChapterId <= 1 ? 'default' : 'pointer' }}
        >
          <ChevronLeft size={18} />
        </button>

        <span
          className="font-sans font-bold"
          style={{ fontSize: 12, color: '#1A1A1A', minWidth: 80, textAlign: 'center' }}
        >
          第 {selectedChapterId} / {chaptersCount} 章
        </span>

        <button
          id="review-next-btn"
          disabled={selectedChapterId >= chaptersCount}
          onClick={() => setSelectedChapterId(p => p + 1)}
          className="flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] disabled:opacity-25 transition-colors"
          style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: selectedChapterId >= chaptersCount ? 'default' : 'pointer' }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Red progress line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 2,
            width: `${(selectedChapterId / chaptersCount) * 100}%`,
            background: '#A63A2B',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 0 120px' }}>
        <ChapterContent
          bookId={BOOK_ID}
          chapters={bookConfig.content}
          selectedChapterId={selectedChapterId}
          setSelectedChapterId={setSelectedChapterId}
        />
      </main>

      {/* ── Index/nav FAB ────────────────────────────────────────────────── */}
      <button
        id="review-grid-fab"
        onClick={() => setIsGridOpen(prev => !prev)}
        title="索引 / 跳转"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: isGridOpen ? '#A63A2B' : '#1A1A1A',
          color: '#FDFBF7',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          boxShadow: '0 4px 16px rgba(26,26,26,0.28)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { if (!isGridOpen) (e.currentTarget as HTMLElement).style.background = '#A63A2B'; }}
        onMouseLeave={e => { if (!isGridOpen) (e.currentTarget as HTMLElement).style.background = '#1A1A1A'; }}
      >
        <LayoutGrid size={18} />
      </button>

      {isGridOpen && (
        <ReviewNavPanel
          bookId={BOOK_ID}
          selectedChapterId={selectedChapterId}
          onSelect={setSelectedChapterId}
          onClose={() => setIsGridOpen(false)}
        />
      )}

      <AIModal />

      <style>{`
        :root {
          --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
          --font-serif: 'Noto Serif SC', serif;
        }
        .font-serif { font-family: var(--font-serif); }
        .font-sans  { font-family: var(--font-sans);  }
        .writing-vertical-rl { writing-mode: vertical-rl; }
      `}</style>
    </div>
  );
}
