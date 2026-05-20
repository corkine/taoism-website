import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Edit2, Trash2, AtSign, ArrowRight } from 'lucide-react';
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
          onClick={onClose}
          className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
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
          onClick={onClose}
          className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FDFBF7] w-full max-w-lg p-10 border-t-8 border-[#A63A2B] shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold mb-8 text-[#1A1A1A]">定义子章划分</h2>

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

// ── Section Action Modal（查看信息 + 操作按钮）──────────────────────

export interface SectionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'main' | 'sub';
  data: {
    title: string;
    description: string;
    startChapter: number;
    endChapter: number;
    label: string;
    parentTitle?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onAskAI: () => void;
  onNavigate: () => void;
}

export function SectionActionModal({
  isOpen,
  onClose,
  type,
  data,
  onEdit,
  onDelete,
  onAskAI,
  onNavigate,
}: SectionActionModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) setConfirmDelete(false);
  }, [isOpen]);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1A1A1A]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FDFBF7] w-full max-w-lg p-10 border-t-8 border-[#A63A2B] shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold mb-2 text-[#1A1A1A]">
              {type === 'main' ? '大章' : '子章'}
            </h2>
            <p className="text-lg text-[#A63A2B] font-serif mb-8">{data.label}</p>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block mb-1">标题</label>
                <p className="text-xl font-serif text-[#1A1A1A]">{data.title}</p>
              </div>

              {data.parentTitle && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block mb-1">所属大章</label>
                  <p className="text-base font-serif text-[#3D3D3D]">{data.parentTitle}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block mb-1">章节范围</label>
                <p className="text-base font-sans text-[#3D3D3D]">
                  第 {data.startChapter} 章 — 第 {data.endChapter} 章
                </p>
              </div>

              {data.description && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block mb-1">主题描述</label>
                  <p className="text-base font-serif italic text-[#3D3D3D] leading-relaxed">{data.description}</p>
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 font-sans">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { onAskAI(); onClose(); }}
                  className="px-5 py-2.5 border border-[#A63A2B] text-[#A63A2B] text-xs font-bold uppercase tracking-widest hover:bg-[#A63A2B] hover:text-white transition-colors flex items-center gap-2"
                >
                  <AtSign size={14} /> 问 AI
                </button>
                <button
                  onClick={() => { onEdit(); onClose(); }}
                  className="px-5 py-2.5 border border-[#E2DED0] text-[#3D3D3D] text-xs font-bold uppercase tracking-widest hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors flex items-center gap-2"
                >
                  <Edit2 size={14} /> 编辑
                </button>
              </div>
              <button
                onClick={handleDelete}
                className={`px-5 py-2.5 border text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                  confirmDelete
                    ? 'border-red-800 bg-red-800 text-white'
                    : 'border-[#E2DED0] text-[#8C8471] hover:border-red-800 hover:text-red-800'
                }`}
              >
                <Trash2 size={14} /> {confirmDelete ? '确认删除' : '删除'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E2DED0]">
              <button
                onClick={() => { onNavigate(); onClose(); }}
                className="w-full py-3 bg-[#1A1A1A] text-white text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center justify-center gap-3"
              >
                跳转至第 {data.startChapter} 章 <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
