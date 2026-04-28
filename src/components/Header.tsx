import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { BOOKS } from '../data/book';
import { WebDAVSyncModal } from './WebDAVSyncModal';
import { useWebDAVSync } from '../hooks/useWebDAVSync';
import { CloudOff } from 'lucide-react';
import { isDirty as checkDirty, restoreBackupData, exportDataToFile } from '../utils/storage';

interface HeaderProps {
  title: string;
  setIsAboutOpen: (isOpen: boolean) => void;
}

export function Header({
  title,
  setIsAboutOpen,
}: HeaderProps) {
  const [isWebDAVOpen, setIsWebDAVOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(checkDirty());
  const { syncState, triggerUpload, triggerDownload } = useWebDAVSync();

  useEffect(() => {
    const handler = () => setIsDirty(checkDirty());
    window.addEventListener('daoism-dirty-changed', handler);
    // Also check on mount
    setIsDirty(checkDirty());
    return () => window.removeEventListener('daoism-dirty-changed', handler);
  }, []);

  const handleGlobalExport = () => {
    exportDataToFile(false);
  };

  const handleGlobalImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        restoreBackupData(data);
        alert('数据导入成功！');
        window.location.reload();
      } catch (err: any) {
        alert(err.message || '无效的文件格式！');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <header className="relative pt-8 px-6 md:pt-12 md:px-12 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex gap-4 items-baseline mb-2">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-6xl font-bold text-[#1A1A1A]"
            >
              {title}
            </motion.h1>
          </div>
          <div className="h-1.5 w-32 bg-[#A63A2B]" />
        </div>

        <div className="w-full md:w-auto md:text-right mt-2 md:mt-0">
          <div className="flex gap-3 md:gap-1 items-center justify-start md:justify-end mb-2 md:mb-1 flex-wrap relative">
            <AnimatePresence>
              {isDirty && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  title="有本地未同步的变更"
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#A63A2B]/10 text-[#A63A2B] rounded-full mr-2"
                >
                  <CloudOff size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-sans">本地变更</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={() => setIsAboutOpen(true)} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              关于
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] font-sans">|</span>
            <button onClick={handleGlobalExport} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              导出
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] font-sans">|</span>
            <label className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm cursor-pointer">
              导入
              <input type="file" accept=".json" onChange={handleGlobalImport} className="hidden" />
            </label>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] font-sans">|</span>
            <button
              onClick={() => setIsWebDAVOpen(true)}
              title={syncState.message || '点击打开在线备份面板'}
              className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1.5 py-1 rounded-sm"
            >
              备份
            </button>
          </div>

          <div className="flex gap-2 text-xl font-serif mt-3 md:mt-2 justify-start md:justify-end md:ml-4 flex-wrap">
            {BOOKS.map((book, index) => (
              <React.Fragment key={book.id}>
                <NavLink to={`/${book.id}`} className={({ isActive }) => isActive ? "text-[#A63A2B] font-bold" : "text-[#8C8471] hover:text-[#A63A2B]"}>{book.title}</NavLink>
                {index < BOOKS.length - 1 && <span className="text-[#E2DED0]">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      <WebDAVSyncModal
        isOpen={isWebDAVOpen}
        onClose={() => setIsWebDAVOpen(false)}
        globalSyncStatus={syncState.status}
        globalSyncMessage={syncState.message}
        globalLastSyncTime={syncState.lastSyncTime}
        onTriggerUpload={triggerUpload}
        onTriggerDownload={triggerDownload}
      />
    </>
  );
}
