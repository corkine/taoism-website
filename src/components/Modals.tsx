import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { MainSection, SubSection } from '../types';
import { version, author } from '../../package.json';
import { COPY_NOTE, TRANS_NOTE } from '../data/book';

interface ModalsProps {
  isEditing: boolean;
  setIsEditing: (b: boolean) => void;
  formMain: Omit<MainSection, 'id' | 'subSections'>;
  setFormMain: (form: Omit<MainSection, 'id' | 'subSections'>) => void;
  handleSaveSection: () => void;

  isEditingSub: boolean;
  setIsEditingSub: (b: boolean) => void;
  formSub: Omit<SubSection, 'id'>;
  setFormSub: (form: Omit<SubSection, 'id'>) => void;
  handleSaveSubSection: () => void;

  isAboutOpen: boolean;
  setIsAboutOpen: (b: boolean) => void;
}

export function Modals({
  isEditing, setIsEditing, formMain, setFormMain, handleSaveSection,
  isEditingSub, setIsEditingSub, formSub, setFormSub, handleSaveSubSection,
  isAboutOpen, setIsAboutOpen
}: ModalsProps) {
  return (
    <>
      {/* Edit Modal (Main Section) */}
      <AnimatePresence>
        {isEditing && (
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
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-8 text-[#1A1A1A]">定义新的大章划分</h2>

              <div className="space-y-6 italic">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">章节标题</label>
                  <input
                    type="text"
                    value={formMain.title}
                    onChange={e => setFormMain({ ...formMain, title: e.target.value })}
                    placeholder="例如：玄妙之门"
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formMain.startChapter) ? '' : formMain.startChapter}
                      onChange={e => setFormMain({ ...formMain, startChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formMain.endChapter) ? '' : formMain.endChapter}
                      onChange={e => setFormMain({ ...formMain, endChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">主题描述</label>
                  <textarea
                    value={formMain.description}
                    onChange={e => setFormMain({ ...formMain, description: e.target.value })}
                    rows={3}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-base font-serif italic"
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-6 font-sans">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A]"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveSection}
                  className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
                >
                  <Save size={14} /> 保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal (Sub-Section) */}
      <AnimatePresence>
        {isEditingSub && (
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
              <button
                onClick={() => setIsEditingSub(false)}
                className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-8 text-[#1A1A1A]">定义子章节划分</h2>

              <div className="space-y-6 italic">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">子标题</label>
                  <input
                    type="text"
                    value={formSub.title}
                    onChange={e => setFormSub({ ...formSub, title: e.target.value })}
                    placeholder="例如：相成无为"
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">起始章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formSub.startChapter) ? '' : formSub.startChapter}
                      onChange={e => setFormSub({ ...formSub, startChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">结束章节</label>
                    <input
                      type="number"
                      min="1" max="81"
                      value={Number.isNaN(formSub.endChapter) ? '' : formSub.endChapter}
                      onChange={e => setFormSub({ ...formSub, endChapter: parseInt(e.target.value) })}
                      className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-xl font-serif"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A63A2B] block">主题描述</label>
                  <textarea
                    value={formSub.description}
                    onChange={e => setFormSub({ ...formSub, description: e.target.value })}
                    rows={3}
                    className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-base font-serif italic"
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-6 font-sans">
                <button
                  onClick={() => setIsEditingSub(false)}
                  className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#1A1A1A]"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveSubSection}
                  className="px-8 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#A63A2B] transition-colors flex items-center gap-3"
                >
                  <Save size={14} /> 保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
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
              <button
                onClick={() => setIsAboutOpen(false)}
                className="absolute top-6 right-6 text-[#8C8471] hover:text-[#1A1A1A]"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-6 text-[#1A1A1A]">关于本项目</h2>

              <div className="space-y-4 text-[#3D3D3D] text-sm leading-relaxed font-serif">
                <p>
                  <strong>内容译本：</strong> {TRANS_NOTE}
                </p>
                <p>
                  <strong>版权声明：</strong> {COPY_NOTE}
                </p>
                <p>
                  用户可以使用本应用进行个人的阅读、分章和释义。用户导出的个人见解数据归用户所有。软件仅供个人非商业用途使用。
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2DED0] flex justify-between items-center text-xs text-[#8C8471] font-sans">
                <span>© {new Date().getFullYear()} {author} </span>
                <span>{version}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
