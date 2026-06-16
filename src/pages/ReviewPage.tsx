import { useEffect, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Bot, Moon, Sun, Eye, EyeOff, Brain, Quote, ScrollText } from 'lucide-react';
import { BOOKS } from '../data/book';
import { ReviewChapterContent } from '../components/ReviewChapterContent';
import { ReviewNavPanel } from '../components/ReviewNavPanel';
import { AIModal } from '../components/AIModal';
import { useAutoSync } from '../hooks/useAutoSync';
import { useAIUIStore } from '../store/useAIUIStore';
import { useIsMobile } from '../hooks/useIsMobile';

const BOOK_ID = 'laozi';
const LS_KEY = 'review_laozi_chapter';

export default function ReviewPage() {
  const bookConfig = BOOKS.find(b => b.id === BOOK_ID)!;
  const chaptersCount = bookConfig.content.length; // 81
  const isMobile = useIsMobile();

  useAutoSync();

  const openChapterAI = useAIUIStore(s => s.openChapter);
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('review_dark_mode') === 'true');
  const [isPinnedRaw, setIsPinnedRaw] = useState(() => localStorage.getItem('review_panel_pinned') === 'true');
  const [isReciteMode, setIsReciteMode] = useState(() => localStorage.getItem('review_recite_mode') === 'true');
  const [isReciteHovering, setIsReciteHovering] = useState(false);
  const isPinned = isPinnedRaw && !isMobile;
  
  const [isGridOpen, setIsGridOpen] = useState(isPinned);

  useEffect(() => {
    localStorage.setItem('review_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('review_recite_mode', String(isReciteMode));
  }, [isReciteMode]);

  useEffect(() => {
    localStorage.setItem('review_panel_pinned', String(isPinnedRaw));
  }, [isPinnedRaw]);

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

  const handleCloseGrid = useCallback(() => {
    setIsGridOpen(false);
    setIsPinnedRaw(false);
  }, []);

  const handleTogglePin = useCallback(() => {
    setIsPinnedRaw(prev => {
      const next = !prev;
      if (next) setIsGridOpen(true);
      return next;
    });
  }, []);

  // Page title
  useEffect(() => {
    document.title = `Review Mode - CH${selectedChapterId}`;
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
      } else if (e.key === 'Escape' && isGridOpen && !isPinned) {
        setIsGridOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChapterId, setSelectedChapterId, chaptersCount, isGridOpen, isPinned]);

  return (
    <div
      className={`min-h-screen font-serif ${isDarkMode ? 'review-theme-dark dark' : 'review-theme-light'}`}
      style={{ 
        background: 'var(--bg-main)', 
        color: 'var(--text-main)', 
        transition: 'background 0.3s, color 0.3s, padding-right 0.3s',
        paddingRight: isPinned && isGridOpen ? 320 : 0
      }}
    >
      {/* ── Minimal sticky nav ────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border-color)',
          transition: 'background 0.3s, border-color 0.3s'
        }}
      >
        {/* Left side of header: Chapter Title */}
        <div className="flex items-center gap-3">
          <span
            className="font-sans font-bold"
            style={{ fontSize: 14, color: 'var(--text-main)' }}
          >
            CH {selectedChapterId.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Right side of header: Navigation and Dark Mode */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              id="review-prev-btn"
              disabled={selectedChapterId <= 1}
              onClick={() => setSelectedChapterId(p => p - 1)}
              className="flex items-center justify-center disabled:opacity-25 transition-colors theme-hover-btn"
              style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: selectedChapterId <= 1 ? 'default' : 'pointer', color: 'var(--text-muted)' }}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              id="review-next-btn"
              disabled={selectedChapterId >= chaptersCount}
              onClick={() => setSelectedChapterId(p => p + 1)}
              className="flex items-center justify-center disabled:opacity-25 transition-colors theme-hover-btn"
              style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: selectedChapterId >= chaptersCount ? 'default' : 'pointer', color: 'var(--text-muted)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsGridOpen(prev => !prev)}
              title="索引 / 跳转"
              className="flex items-center justify-center transition-colors theme-hover-accent"
              style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', color: isGridOpen ? 'var(--accent-red)' : 'var(--text-muted)' }}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              id="review-recite-btn"
              onClick={() => setIsReciteMode(prev => !prev)}
              onMouseEnter={() => setIsReciteHovering(true)}
              onMouseLeave={() => setIsReciteHovering(false)}
              title={isReciteMode ? '退出背诵模式' : undefined}
              className="flex items-center justify-center transition-colors theme-hover-accent"
              style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', color: isReciteMode ? 'var(--accent-red)' : 'var(--text-muted)' }}
            >
              <ScrollText size={18} />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="切换模式"
              className="flex items-center justify-center transition-colors theme-hover-accent"
              style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 0 120px' }}>
        <ReviewChapterContent
          bookId={BOOK_ID}
          chapters={bookConfig.content}
          selectedChapterId={selectedChapterId}
          isReciteMode={isReciteMode}
          isReciteHovering={isReciteHovering}
        />
      </main>

      {/* ── Ask AI FAB ────────────────────────────────────────────────── */}
      <button
        id="review-ask-ai-fab"
        onClick={() => openChapterAI(BOOK_ID, selectedChapterId)}
        title="问 AI"
        className="fab-ai-btn"
        style={{
          position: 'fixed',
          bottom: 24,
          right: isPinned && isGridOpen ? 344 : 24,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--fab-bg)',
          color: 'var(--fab-icon)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
          transition: 'background 0.3s, color 0.3s, right 0.3s',
        }}
      >
        <Bot size={18} />
      </button>

      {isGridOpen && (
        <ReviewNavPanel
          bookId={BOOK_ID}
          selectedChapterId={selectedChapterId}
          onSelect={setSelectedChapterId}
          onClose={handleCloseGrid}
          isPinned={isPinned}
          onTogglePin={handleTogglePin}
        />
      )}

      <AIModal />

      <style>{`
        :root {
          --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
          --font-serif: 'Noto Serif SC', serif;
        }
        .review-theme-light {
          --bg-main: #FDFBF7;
          --text-main: #1A1A1A;
          --text-content: #2D2926;
          --text-muted: #8C8471;
          --border-color: #E2DED0;
          --accent-red: #A63A2B;
          --header-bg: rgba(253, 251, 247, 0.9);
          --panel-bg: #FDFBF7;
          --btn-hover: #1A1A1A;
          --fab-bg: #1A1A1A;
          --fab-icon: #FDFBF7;
        }
        .review-theme-dark {
          --bg-main: #161616;
          --text-main: #FDFBF7;
          --text-content: #EAEAEA;
          --text-muted: #8A8A8A;
          --border-color: #333333;
          --accent-red: #C24C3C;
          --header-bg: rgba(22, 22, 22, 0.9);
          --panel-bg: #1E1E1E;
          --btn-hover: #FDFBF7;
          --fab-bg: #FDFBF7;
          --fab-icon: #161616;
        }
        .theme-hover-accent:hover { color: var(--accent-red) !important; }
        .theme-hover-btn:hover { color: var(--btn-hover) !important; }
        .fab-ai-btn:hover { background: var(--accent-red) !important; color: #FFF !important; }
        
        .font-serif { font-family: var(--font-serif); }
        .font-sans  { font-family: var(--font-sans);  }
        .writing-vertical-rl { writing-mode: vertical-rl; }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        ::-moz-selection { background: var(--accent-red); color: white; }
        ::selection { background: var(--accent-red); color: white; }
      `}</style>
    </div>
  );
}
