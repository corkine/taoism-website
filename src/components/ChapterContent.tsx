import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { ChevronRight, Edit2, Bot } from 'lucide-react';
import { Chapter } from '../types';

interface ChapterContentProps {
  chapters: Chapter[];
  selectedChapterId: number;
  setSelectedChapterId: (id: number | ((prev: number) => number)) => void;
  customInterpretations: Record<number, string>;
  setCustomInterpretations: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  editingLocId: number | null;
  setEditingLocId: (id: number | null) => void;
  tempInterpretation: string;
  setTempInterpretation: (val: string) => void;
  /** Called when user clicks "问 AI" — passes the system prompt for the current chapter */
  onAskAI?: (systemPrompt: string) => void;
}

export function ChapterContent({
  chapters,
  selectedChapterId,
  setSelectedChapterId,
  customInterpretations,
  setCustomInterpretations,
  editingLocId,
  setEditingLocId,
  tempInterpretation,
  setTempInterpretation,
  onAskAI,
}: ChapterContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Use useLayoutEffect to ensure height is adjusted BEFORE the browser paints,
  // preventing any visible "jump" or lag during typing.
  useLayoutEffect(() => {
    if (editingLocId === selectedChapterId) {
      adjustHeight();
    }
  }, [tempInterpretation, editingLocId, selectedChapterId]);
  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  const handleAskAI = () => {
    if (!onAskAI) return;
    const prompt = `你是一位精通中国古典哲学的学者，尤其擅长道家经典。以下是用户正在阅读的章节内容，请根据此内容回答用户的问题，可以结合原文分析其哲学思想、历史背景及现代意义。请用纯文本回答，不要使用 Markdown 格式（不使用 **加粗**、# 标题、- 列表符号等），段落之间用换行分隔即可。

【当前章节】
${selectedChapter.title}

【原文】
${selectedChapter.content}

${customInterpretations[selectedChapterId] ? `【用户注记】\n${customInterpretations[selectedChapterId]}` : ''}`;
    onAskAI(prompt);
  };

  return (
    <section className="flex-1">
      <article className="relative bg-white border border-border-subtle p-6 md:p-12 shadow-sm min-h-[500px]">
        <div className="hidden md:flex absolute -left-4 top-12 flex-col items-center gap-2">
          <div className="text-[10px] text-brand font-bold font-sans rotate-180 writing-vertical-rl tracking-widest uppercase">Chapter</div>
          <div className="bg-ink-header text-white w-8 h-8 flex items-center justify-center text-xs font-sans font-bold">
            {selectedChapterId.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="flex justify-between items-end mb-6 md:mb-8 border-ink-header pb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-header">
            {selectedChapter.title}
          </h2>
          <div className="flex gap-2 items-center">
            <button
              disabled={selectedChapterId <= 1}
              onClick={() => setSelectedChapterId(id => Math.max(1, typeof id === 'number' ? id - 1 : id - 1))}
              className="w-8 h-8 border border-border-subtle rounded-full flex items-center justify-center text-ink-muted hover:text-ink-header hover:border-ink-header disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <button
              disabled={selectedChapterId >= 81}
              onClick={() => setSelectedChapterId(id => Math.min(81, typeof id === 'number' ? id + 1 : id + 1))}
              className="w-8 h-8 border border-border-subtle rounded-full flex items-center justify-center text-ink-muted hover:text-ink-header hover:border-ink-header disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative">
          <p className="text-xl md:text-2xl leading-loose text-ink text-justify whitespace-pre-wrap tracking-wide first-letter:text-5xl md:first-letter:text-6xl first-letter:float-left first-letter:mr-3 md:first-letter:mr-4 first-letter:mt-1 md:first-letter:mt-2 first-letter:text-brand first-letter:font-bold">
            {selectedChapter.content}
          </p>
        </div>

        {/* Interpretation Area */}
        <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-border-subtle">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted font-sans flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand" rounded-full />
              释义
            </h3>
            {editingLocId !== selectedChapterId ? (
              <button
                onClick={() => {
                  setEditingLocId(selectedChapterId);
                  setTempInterpretation(customInterpretations[selectedChapterId] || '');
                }}
                className="text-xs text-brand hover:underline font-sans font-bold flex items-center gap-1"
              >
                <Edit2 size={10} /> 编辑
              </button>
            ) : (
              <div className="flex gap-4">
                <button onClick={() => setEditingLocId(null)} className="text-[10px] uppercase font-bold text-ink-muted hover:text-ink-header transition-colors font-sans">
                  取消
                </button>
                <button
                  onClick={() => {
                    setCustomInterpretations(prev => ({ ...prev, [selectedChapterId]: tempInterpretation }));
                    setEditingLocId(null);
                  }}
                  className="text-[10px] uppercase tracking-widest font-bold text-white bg-ink-header hover:bg-brand transition-colors px-3 py-1.5 font-sans"
                >
                  保存
                </button>
              </div>
            )}
          </div>

          {editingLocId === selectedChapterId ? (
            <textarea
              ref={textareaRef}
              value={tempInterpretation}
              onChange={e => setTempInterpretation(e.target.value)}
              className="w-full min-h-[160px] p-6 bg-paper border border-border-subtle outline-none text-sm font-serif leading-relaxed focus:border-brand transition-colors resize-none shadow-inner overflow-hidden"
              placeholder="谈谈您的见解..."
            />
          ) : (
            <div className="text-[13px] text-ink-sub leading-loose whitespace-pre-wrap px-4 border-l-2 border-border-subtle italic">
              {customInterpretations[selectedChapterId] ? (
                customInterpretations[selectedChapterId]
              ) : (
                <span className="text-ink-muted opacity-60">谈谈您的见解</span>
              )}
            </div>
          )}
        </div>

        {/* Ask AI button */}
        {onAskAI && (
          <button
            onClick={handleAskAI}
            title="问 AI"
            className="mt-12 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-border-subtle text-ink-muted hover:border-brand hover:text-brand transition-colors font-sans"
          >
            <Bot size={12} />
            问 AI
          </button>
        )}
      </article>
    </section>
  );
}
