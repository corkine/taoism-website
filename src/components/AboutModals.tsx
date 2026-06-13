import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { version, author } from '../../package.json';
import { COPY_NOTE, TRANS_NOTE } from '../data/book';

interface AboutModalsProps {
  isAboutOpen: boolean;
  setIsAboutOpen: (b: boolean) => void;
}

export function AboutModals({
  isAboutOpen, setIsAboutOpen
}: AboutModalsProps) {
  return (
    <>
      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAboutOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
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

                <div className="pt-2">
                  <strong className="text-[#1A1A1A]">参考链接：</strong>
                  <ul className="mt-1 space-y-1 list-inside">
                    <li>
                      <a
                        href="https://www.dpm.org.cn/subject_zhaomengfu/zhaomengfu_more/245894"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A63A2B] hover:underline"
                      >
                        故宫博物院 · 赵孟頫书画特展 · 赵孟頫小楷道德经卷
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://digicol.dpm.org.cn/cultural/toView/4b7e13e48f38493da09ef82de2204983?s=2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A63A2B] hover:underline"
                      >
                        故宫博物院 · 数字文物库 · 赵孟頫书道德经三章卷
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2DED0] flex justify-between items-center text-xs text-[#8C8471] font-sans">
                <span>
                  © {new Date().getFullYear()} <a className="hover:text-[#1A1A1A]" href="https://mvst.mazhangjing.com" target="_blank" rel="noopener noreferrer">{author}</a><br className="sm:hidden" /> <a className="hover:text-[#1A1A1A]" href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">鄂ICP备17002041号-1</a>
                </span>
                <span>{version}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
