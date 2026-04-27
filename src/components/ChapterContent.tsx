import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Edit2 } from 'lucide-react';
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
  setTempInterpretation
}: ChapterContentProps) {
  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  return (
    <section className="flex-1">
      <AnimatePresence mode="wait">
        <motion.article
          key={selectedChapterId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          // transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white border border-[#E2DED0] p-12 shadow-sm min-h-[500px]"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="absolute -left-4 top-12 flex flex-col items-center gap-2">
            <div className="text-[10px] text-[#A63A2B] font-bold font-sans rotate-180 writing-vertical-rl tracking-widest uppercase">Chapter</div>
            <div className="bg-[#1A1A1A] text-white w-8 h-8 flex items-center justify-center text-xs font-sans font-bold">
              {selectedChapterId.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="flex justify-between items-end mb-8  border-[#1A1A1A] pb-4">
            <h2 className="text-4xl font-bold text-[#1A1A1A]">
              {selectedChapter.title}
            </h2>
            <div className="flex gap-2">
              <button
                disabled={selectedChapterId <= 1}
                onClick={() => setSelectedChapterId(id => Math.max(1, typeof id === 'number' ? id - 1 : id - 1))}
                className="w-8 h-8 border border-[#E2DED0] rounded-full flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
              <button
                disabled={selectedChapterId >= 81}
                onClick={() => setSelectedChapterId(id => Math.min(81, typeof id === 'number' ? id + 1 : id + 1))}
                className="w-8 h-8 border border-[#E2DED0] rounded-full flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="relative">
            <p className="text-2xl leading-loose text-[#2D2926] text-justify whitespace-pre-wrap tracking-wide first-letter:text-6xl first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-[#A63A2B] first-letter:font-bold">
              {selectedChapter.content}
            </p>
          </div>

          {/* Interpretation Area */}
          <div className="mt-16 pt-8 border-t border-[#E2DED0]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C8471] font-sans flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#A63A2B] rounded-full" />
                释义
              </h3>
              {editingLocId !== selectedChapterId ? (
                <button
                  onClick={() => {
                    setEditingLocId(selectedChapterId);
                    setTempInterpretation(customInterpretations[selectedChapterId] || '');
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
                      setCustomInterpretations(prev => ({ ...prev, [selectedChapterId]: tempInterpretation }));
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
              <textarea
                value={tempInterpretation}
                onChange={e => setTempInterpretation(e.target.value)}
                className="w-full h-40 p-6 bg-[#FDFBF7] border border-[#E2DED0] outline-none text-sm font-serif leading-relaxed focus:border-[#A63A2B] transition-colors resize-none shadow-inner"
                placeholder="谈谈您的见解..."
              />
            ) : (
              <div className="text-[13px] text-[#3D3D3D] leading-loose whitespace-pre-wrap px-4 border-l-2 border-[#E2DED0] italic">
                {customInterpretations[selectedChapterId] ? (
                  customInterpretations[selectedChapterId]
                ) : (
                  <span className="text-[#8C8471] opacity-60">谈谈您的见解</span>
                )}
              </div>
            )}
          </div>
        </motion.article>
      </AnimatePresence>
    </section>
  );
}
