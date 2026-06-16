import React, { useRef, useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Chapter } from '../types';
import { useAppStore, useInterpretations } from '../store/useAppStore';

interface ReviewChapterContentProps {
  bookId: string;
  chapters: Chapter[];
  selectedChapterId: number;
  isReciteMode?: boolean;
  isReciteHovering?: boolean;
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
          className="col-start-1 row-start-1 w-full min-h-[160px] p-6 outline-none text-sm font-serif leading-relaxed transition-colors resize-none shadow-inner overflow-hidden"
          placeholder="谈谈您的见解..."
          style={{ 
            background: 'var(--panel-bg)', 
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)' 
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-red)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        />
        <div className="col-start-1 row-start-1 w-full min-h-[160px] p-6 text-sm font-serif leading-relaxed border border-transparent whitespace-pre-wrap invisible pointer-events-none break-words">
          {value + ' '}
        </div>
      </div>
    );
  }
);

export const ReviewChapterContent = React.memo(function ReviewChapterContent({
  bookId,
  chapters,
  selectedChapterId,
  isReciteMode = false,
  isReciteHovering = false,
}: ReviewChapterContentProps) {
  const customInterpretations = useInterpretations(bookId);
  const setInterpretation = useAppStore(s => s.setInterpretation);
  const [editingLocId, setEditingLocId] = useState<number | null>(null);
  const editorRef = useRef<{ getValue: () => string }>(null);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  return (
    <section className="flex-1 px-6 md:px-4">
      <article className="relative bg-transparent">
        <div className="relative">
          <p 
            className="text-md md:text-xl leading-loose text-justify whitespace-pre-wrap tracking-wide"
            style={{ 
              color: 'var(--text-content)',
              opacity: isReciteMode && !isReciteHovering ? 0 : 1,
              transition: 'opacity 0.3s ease',
              userSelect: isReciteMode && !isReciteHovering ? 'none' : 'auto',
            }}
          >
            {selectedChapter.content}
          </p>
        </div>

        {/* Interpretation Area */}
        <div className="mt-8 pt-2" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] font-sans flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-red)' }} />
              释义
            </h3>
            {editingLocId !== selectedChapterId ? (
              <button
                onClick={() => {
                  setEditingLocId(selectedChapterId);
                }}
                className="text-xs hover:underline font-sans font-bold flex items-center gap-1"
                style={{ color: 'var(--accent-red)' }}
              >
                <Edit2 size={10} /> 编辑
              </button>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={() => setEditingLocId(null)} 
                  className="text-[10px] uppercase font-bold transition-colors font-sans theme-hover-btn"
                  style={{ color: 'var(--text-muted)' }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const finalValue = editorRef.current?.getValue() || '';
                    setInterpretation(bookId, selectedChapterId, finalValue);
                    setEditingLocId(null);
                  }}
                  className="text-[10px] uppercase tracking-widest font-bold transition-colors px-3 py-1.5 font-sans"
                  style={{ background: 'var(--text-main)', color: 'var(--bg-main)' }}
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
            <div className="text-[13px] leading-loose whitespace-pre-wrap px-4 border-l-2" style={{ color: 'var(--text-content)', borderColor: 'var(--border-color)' }}>
              {customInterpretations[selectedChapterId] ? (
                customInterpretations[selectedChapterId]
              ) : (
                <span className="opacity-60" style={{ color: 'var(--text-muted)' }}>谈谈您的见解</span>
              )}
            </div>
          )}
        </div>
      </article>
    </section>
  );
});
