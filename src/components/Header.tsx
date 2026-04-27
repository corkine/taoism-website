import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { BOOKS, buildBackupData, restoreBackupData } from '../data/book';
import { WebDAVSyncModal } from './WebDAVSyncModal';
import { GlobalSyncStatus } from '../utils/webdav';

interface HeaderProps {
  title: string;
  setIsAboutOpen: (isOpen: boolean) => void;
  syncStatus?: GlobalSyncStatus;
  syncMessage?: string;
  lastSyncTime?: string | null;
}

export function Header({
  title,
  setIsAboutOpen,
  syncStatus,
  syncMessage,
  lastSyncTime,
}: HeaderProps) {
  const [isWebDAVOpen, setIsWebDAVOpen] = useState(false);

  const handleGlobalExport = () => {
    const data = buildBackupData(false);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daoism_all_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <div className="flex gap-3 md:gap-1 items-center justify-start md:justify-end mb-2 md:mb-1 flex-wrap">
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
            {/* Sync button with live status icon */}
            <button
              onClick={() => setIsWebDAVOpen(true)}
              title={syncMessage || '点击打开在线备份面板'}
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
        globalSyncStatus={syncStatus}
        globalSyncMessage={syncMessage}
        globalLastSyncTime={lastSyncTime}
      />
    </>
  );
}
