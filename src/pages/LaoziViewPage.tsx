import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, Menu, Printer, ScrollText, X } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LaoziViewToc } from '../components/LaoziViewToc';
import { PrintContent } from '../components/PrintContent';
import { BOOKS } from '../data/book';
import { loadBuiltInBook, LoadedReferenceBook } from '../data/reference';

const BOOK_ID = 'laozi';

export default function LaoziViewPage() {
  const { referenceId = 'default' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const book = BOOKS.find(item => item.id === BOOK_ID)!;
  const [reference, setReference] = useState<LoadedReferenceBook | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeChapterId, setActiveChapterId] = useState(1);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [printReady, setPrintReady] = useState(false);
  const [showBackButton] = useState(() => searchParams.get('from') === 'app');
  const originalParam = searchParams.get('original')?.toLowerCase();
  const showAnnotations = originalParam !== 'true' && originalParam !== '1';

  // `from=app` is an entry-only marker. Remove it immediately so copied URLs
  // remain clean and behave like standalone shared pages.
  useEffect(() => {
    if (searchParams.get('from') !== 'app') return;
    const cleanParams = new URLSearchParams(searchParams);
    cleanParams.delete('from');
    setSearchParams(cleanParams, { replace: true });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');
    setReference(null);

    loadBuiltInBook(referenceId, BOOK_ID)
      .then(data => {
        if (!cancelled) setReference(data);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : '注释加载失败');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [referenceId]);

  const scrollToChapter = useCallback((chapterId: number) => {
    const boundedId = Math.max(1, Math.min(book.content.length, chapterId));
    setActiveChapterId(boundedId);
    document.getElementById(`laozi-view-chapter-${boundedId}`)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [book.content.length]);

  useEffect(() => {
    if (!reference) return;
    const requested = Number(searchParams.get('chapter'));
    const chapterId = Number.isInteger(requested) && requested >= 1 && requested <= book.content.length ? requested : 1;
    setActiveChapterId(chapterId);
    const frame = requestAnimationFrame(() => scrollToChapter(chapterId));
    return () => cancelAnimationFrame(frame);
  }, [reference, referenceId]); // Search changes from TOC are handled directly.

  useEffect(() => {
    if (!reference) return;
    const elements = book.content
      .map(chapter => document.getElementById(`laozi-view-chapter-${chapter.id}`))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting);
        if (visible.length === 0) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = Number((visible[0].target as HTMLElement).dataset.chapterId);
        if (id) setActiveChapterId(id);
      },
      { rootMargin: '-15% 0px -72% 0px', threshold: 0 },
    );
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [reference, book.content]);

  useEffect(() => {
    document.title = reference
      ? `道德经 · ${reference.meta.name}`
      : '道德经 · 注释阅读';
  }, [reference]);

  useEffect(() => {
    const preparePrint = () => flushSync(() => setPrintReady(true));
    const cleanupPrint = () => setPrintReady(false);
    window.addEventListener('beforeprint', preparePrint);
    window.addEventListener('afterprint', cleanupPrint);
    return () => {
      window.removeEventListener('beforeprint', preparePrint);
      window.removeEventListener('afterprint', cleanupPrint);
    };
  }, []);

  const handleChapterSelect = useCallback((chapterId: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('chapter', String(chapterId));
    setSearchParams(nextParams, { replace: true });
    scrollToChapter(chapterId);
    setIsTocOpen(false);
  }, [scrollToChapter, searchParams, setSearchParams]);

  const handleOriginalToggle = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    if (showAnnotations) {
      nextParams.set('original', 'true');
    } else {
      nextParams.delete('original');
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, showAnnotations]);

  const handlePrint = useCallback(() => {
    flushSync(() => setPrintReady(true));
    requestAnimationFrame(() => window.print());
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-serif text-[#8C8471]">正在加载注释…</div>;
  }

  if (error || !reference) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6 font-serif">
        <div className="max-w-md border-t-4 border-[#A63A2B] bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">无法打开注释</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#8C8471]">{error || '该注释版本不存在'}</p>
          <Link to="/laozi" className="inline-block mt-6 text-xs font-bold text-[#A63A2B] hover:underline">返回《老子》</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-serif selection:bg-[#A63A2B]/15 selection:text-[#A63A2B]">
      <header className="sticky top-0 z-40 border-b border-[#E2DED0] bg-[#FDFBF7]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            {showBackButton && (
              <button type="button" onClick={() => navigate('/laozi')} title="返回《老子》" className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <h1 className="text-lg md:text-xl font-bold whitespace-nowrap">道德经</h1>
                <span className="text-[#E2DED0]">/</span>
                <span className="truncate text-xs md:text-sm text-[#8C8471]">{reference.meta.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 font-sans">
            <button type="button" onClick={() => setIsTocOpen(true)} className="lg:hidden flex items-center gap-1.5 px-2.5 py-2 text-[10px] font-bold text-[#8C8471] hover:text-[#A63A2B]">
              <Menu size={15} /> 目录
            </button>
            <button
              type="button"
              aria-pressed={!showAnnotations}
              aria-label={showAnnotations ? '隐藏注释，只显示原文' : '显示注释'}
              title={showAnnotations ? '隐藏注释，只显示原文' : '显示注释'}
              onClick={handleOriginalToggle}
              className={`flex items-center gap-1.5 py-2 text-[10px] font-bold hover:text-[#A63A2B] transition-colors ${showAnnotations ? 'text-[#8C8471]' : 'text-[#A63A2B]'}`}
            >
              <ScrollText size={15} />
              <span className="hidden sm:inline">原文</span>
            </button>
            <button type="button" aria-label="打印" onClick={handlePrint} className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 text-[10px] font-bold text-[#8C8471] hover:text-[#A63A2B] transition-colors">
              <Printer size={15} /> <span className="hidden sm:inline">打印</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-12 lg:gap-16">
        <aside className="hidden lg:block py-10">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-3 hide-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold text-[#A63A2B]">目录</span>
              <span className="font-sans text-[9px] text-[#8C8471]">CH {activeChapterId.toString().padStart(2, '0')}</span>
            </div>
            <LaoziViewToc chapters={book.content} partitions={reference.partitions} activeChapterId={activeChapterId} onSelect={handleChapterSelect} />
          </div>
        </aside>

        <main className="min-w-0 max-w-[820px] pt-10 md:pt-14 pb-32">
          {showAnnotations && (
            <div className="mb-16 border-b border-[#1A1A1A] pb-8">
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold text-[#A63A2B]">Public Annotation</p>
              <h2 className="mt-4 text-4xl md:text-5xl font-bold">{reference.meta.name}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8C8471]">{reference.meta.description}</p>
            </div>
          )}

          <div className={showAnnotations ? 'space-y-20 md:space-y-24' : 'space-y-14 md:space-y-16'}>
            {book.content.map(chapter => (
              <article
                key={chapter.id}
                id={`laozi-view-chapter-${chapter.id}`}
                data-chapter-id={chapter.id}
                className="scroll-mt-24"
              >
                <header className="flex items-end justify-between gap-4 border-b border-[#E2DED0] pb-4">
                  <h3 className="text-2xl md:text-3xl font-bold">{chapter.title}</h3>
                  <span className="font-sans text-[10px] tracking-widest font-bold text-[#A63A2B]">CH {chapter.id.toString().padStart(2, '0')}</span>
                </header>
                <p className="mt-7 text-lg md:text-xl leading-[2.1] text-justify whitespace-pre-wrap tracking-wide text-[#2D2926]">
                  {chapter.content}
                </p>
                {showAnnotations && (
                  <div className="mt-9">
                    <h4 className="mb-4 font-sans text-[9px] uppercase tracking-[0.3em] font-bold text-[#8C8471]">释义</h4>
                    <p className="text-[14px] md:text-[15px] leading-[2] whitespace-pre-wrap text-[#4A4640]">
                      {reference.interpretations[chapter.id]?.trim() || '（暂无释义）'}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </main>
      </div>

      {isTocOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="关闭目录" onClick={() => setIsTocOpen(false)} className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
          <aside className="absolute inset-y-0 left-0 w-[min(88vw,340px)] bg-[#FDFBF7] shadow-2xl flex flex-col">
            <div className="h-16 flex-shrink-0 px-5 flex items-center justify-between border-b border-[#E2DED0]">
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold text-[#A63A2B]">目录</span>
              <button type="button" aria-label="关闭目录" onClick={() => setIsTocOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B]"><X size={17} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <LaoziViewToc chapters={book.content} partitions={reference.partitions} activeChapterId={activeChapterId} onSelect={handleChapterSelect} />
            </div>
          </aside>
        </div>
      )}

      {printReady && (
        <PrintContent
          bookTitle={book.title}
          referenceName={reference.meta.name}
          chapters={book.content}
          partitions={reference.partitions}
          interpretations={reference.interpretations}
          showInterpretations={showAnnotations}
        />
      )}

      <style>{`
        :root { --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif; --font-serif: 'Noto Serif SC', serif; background: #FDFBF7; }
        .font-serif { font-family: var(--font-serif); }
        .font-sans { font-family: var(--font-sans); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
