import React, { useRef, useState } from 'react';
import { ChevronRight, Edit2, Bot } from 'lucide-react';
import { Chapter } from '../types';
import { useAppStore, useInterpretations } from '../store/useAppStore';
import { useAIUIStore } from '../store/useAIUIStore';

interface ChapterContentProps {
  bookId: string;
  chapters: Chapter[];
  selectedChapterId: number;
  setSelectedChapterId: (id: number | ((prev: number) => number)) => void;
}

const InterpretationEditor = React.forwardRef<{ getValue: () => string }, { initialValue: string }>(
  ({ initialValue }, ref) => {
    const [value, setValue] = useState(initialValue);
    
    React.useImperativeHandle(ref, () => ({
      getValue: () => value
    }));

    return (
      <div className="grid">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          className="col-start-1 row-start-1 w-full min-h-[160px] p-6 bg-[#FDFBF7] border border-[#E2DED0] outline-none text-sm font-serif leading-relaxed focus:border-[#A63A2B] transition-colors resize-none shadow-inner overflow-hidden"
          placeholder="谈谈您的见解..."
        />
        <div className="col-start-1 row-start-1 w-full min-h-[160px] p-6 text-sm font-serif leading-relaxed border border-transparent whitespace-pre-wrap invisible pointer-events-none break-words">
          {value + ' '}
        </div>
      </div>
    );
  }
);

export const ChapterContent = React.memo(function ChapterContent({
  bookId,
  chapters,
  selectedChapterId,
  setSelectedChapterId,
}: ChapterContentProps) {
  // Interpretations are now sourced from the zustand store and therefore
  // update automatically when a WebDAV restore or file-import happens.
  const customInterpretations = useInterpretations(bookId);
  const setInterpretation = useAppStore(s => s.setInterpretation);
  const openChapterAI = useAIUIStore(s => s.openChapter);
  const [editingLocId, setEditingLocId] = useState<number | null>(null);
  const editorRef = useRef<{ getValue: () => string }>(null);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  const handleAskAI = () => {
    openChapterAI(bookId, selectedChapterId);
  };

  return (
    <section className="flex-1">
      <article className="relative bg-white border border-[#E2DED0] p-6 md:p-12 shadow-sm">
        <div className="hidden md:flex absolute -left-4 top-12 flex-col items-center gap-2">
          <div className="text-[10px] text-[#A63A2B] font-bold font-sans rotate-180 writing-vertical-rl tracking-widest uppercase">Chapter</div>
          <div className="bg-[#1A1A1A] text-white w-8 h-8 flex items-center justify-center text-xs font-sans font-bold">
            {selectedChapterId.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="flex justify-between items-end mb-6 md:mb-8 border-[#1A1A1A] pb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            {selectedChapter.title}
          </h2>
          <div className="flex gap-2 items-center">
            <button
              disabled={selectedChapterId <= 1}
              onClick={() => setSelectedChapterId(id => Math.max(1, typeof id === 'number' ? id - 1 : id - 1))}
              className="w-8 h-8 border border-[#E2DED0] rounded-full flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <button
              disabled={selectedChapterId >= chapters.length}
              onClick={() => setSelectedChapterId(id => Math.min(chapters.length, id + 1))}
              className="w-8 h-8 border border-[#E2DED0] rounded-full flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative">
          {bookId !== 'laozi' ? (
          <div className="text-xl md:text-2xl leading-loose text-[#2D2926] text-justify tracking-wide">
            {selectedChapter.content.split(/\n\s*\n/).filter(paragraph => paragraph.trim()).map((paragraph, index) => (
              <p
                key={index}
                className={`indent-[2em] whitespace-pre-wrap ${index > 0 ? 'mt-[1em]' : 'first-letter:text-[#A63A2B] first-letter:font-bold'}`}
              >
                {paragraph.trim()}
              </p>
            ))}
          </div>
          ) : (
            <p className="text-xl md:text-2xl leading-loose text-[#2D2926] text-justify whitespace-pre-wrap tracking-wide first-letter:text-5xl md:first-letter:text-6xl first-letter:float-left first-letter:mr-3 md:first-letter:mr-4 first-letter:mt-1 md:first-letter:mt-2 first-letter:text-[#A63A2B] first-letter:font-bold">
              {selectedChapter.content}
            </p>
          )}
        </div>

        {/* Interpretation Area */}
        <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-[#E2DED0]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C8471] font-sans flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#A63A2B] rounded-full" />
              释义
            </h3>
            {editingLocId !== selectedChapterId ? (
              <button
                onClick={() => {
                  setEditingLocId(selectedChapterId);
                }}
                className="text-xs text-[#A63A2B] hover:underline font-sans font-bold flex items-center gap-1"
              >
                <Edit2 size={10} /> 编辑
              </button>
            ) : (
              <div className="flex gap-4">
                <button onClick={() => setEditingLocId(null)} className="text-[10px] uppercase font-bold text-[#8C8471] hover:text-[#1A1A1A] transition-colors font-sans">
                  取消
                </button>
                <button
                  onClick={() => {
                    const finalValue = editorRef.current?.getValue() || '';
                    setInterpretation(bookId, selectedChapterId, finalValue);
                    setEditingLocId(null);
                  }}
                  className="text-[10px] uppercase tracking-widest font-bold text-white bg-[#1A1A1A] hover:bg-[#A63A2B] transition-colors px-3 py-1.5 font-sans"
                >
                  保存
                </button>
              </div>
            )}
          </div>

          {editingLocId === selectedChapterId ? (
            <InterpretationEditor
              ref={editorRef}
              initialValue={customInterpretations[selectedChapterId] || ''}
            />
          ) : (
            <div className="text-[13px] text-[#3D3D3D] leading-loose whitespace-pre-wrap px-4 border-l-2 border-[#E2DED0]">
              {customInterpretations[selectedChapterId] ? (
                customInterpretations[selectedChapterId]
              ) : (
                <span className="text-[#8C8471] opacity-60">谈谈您的见解</span>
              )}
            </div>
          )}
        </div>

        {/* Ask AI button */}
        <button
          onClick={handleAskAI}
          title="问 AI"
          className="mt-12 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-[#E2DED0] text-[#8C8471] hover:border-[#A63A2B] hover:text-[#A63A2B] transition-colors font-sans"
        >
          <Bot size={12} />
          问 AI
        </button>
      </article>
    </section>
  );
});
