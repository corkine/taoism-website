import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { MainSection, SubSection } from '../types';

type MainSectionForm = Omit<MainSection, 'id' | 'subSections'>;
type SubSectionForm = Omit<SubSection, 'id'>;

interface MainSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MainSectionForm) => void;
  initialData: MainSectionForm;
}

export function MainSectionModal({ isOpen, onClose, onSave, initialData }: MainSectionModalProps) {
  const [form, setForm] = useState<MainSectionForm>(initialData);

  useEffect(() => {
    if (isOpen) setForm(initialData);
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#FDFBF7] w-full max-w-lg p-10 border-t-8 border-[#A63A2B] shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold mb-8 text-[#1A1A1A]">定义大章划分</h2>

            <div className="space-y-6 italic">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">章节标题</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="例如：玄妙之门"
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节</label>
                  <input
                    type="number"
                    value={Number.isNaN(form.startChapter) ? '' : form.startChapter}
                    onChange={e => setForm({ ...form, startChapter: parseInt(e.target.value) })}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节</label>
                  <input
                    type="number"
                    value={Number.isNaN(form.endChapter) ? '' : form.endChapter}
                    onChange={e => setForm({ ...form, endChapter: parseInt(e.target.value) })}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">主题描述</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-base font-serif italic"
                />
              </div>
            </div>

            <div className="mt-12 flex justify-end gap-6 font-sans">
              <button onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A]">
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
              >
                <Save size={14} /> 保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SubSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubSectionForm) => void;
  initialData: SubSectionForm;
}

export function SubSectionModal({ isOpen, onClose, onSave, initialData }: SubSectionModalProps) {
  const [form, setForm] = useState<SubSectionForm>(initialData);

  useEffect(() => {
    if (isOpen) setForm(initialData);
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#FDFBF7] w-full max-w-lg p-10 border-t-8 border-[#A63A2B] shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold mb-8 text-[#1A1A1A]">定义子章节划分</h2>

            <div className="space-y-6 italic">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">子标题</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="例如：相成无为"
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节</label>
                  <input
                    type="number"
                    value={Number.isNaN(form.startChapter) ? '' : form.startChapter}
                    onChange={e => setForm({ ...form, startChapter: parseInt(e.target.value) })}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节</label>
                  <input
                    type="number"
                    value={Number.isNaN(form.endChapter) ? '' : form.endChapter}
                    onChange={e => setForm({ ...form, endChapter: parseInt(e.target.value) })}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">主题描述</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-base font-serif italic"
                />
              </div>
            </div>

            <div className="mt-12 flex justify-end gap-6 font-sans">
              <button onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A]">
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
              >
                <Save size={14} /> 保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
