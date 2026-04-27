import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { Loader, CheckCircle, AlertCircle, Cloud } from 'lucide-react';
import { BOOKS, PARTITIONS_KEY, INTERPRETATION_KEY } from '../data/book';
import { WebDAVSyncModal } from './WebDAVSyncModal';
import { GlobalSyncStatus, WebDAVSyncConfig } from '../utils/webdav';

interface HeaderProps {
  title: string;
  setIsAboutOpen: (isOpen: boolean) => void;
  syncStatus?: GlobalSyncStatus;
  syncMessage?: string;
  lastSyncTime?: string | null;
  syncConfig: WebDAVSyncConfig;
  onSaveSyncConfig: (cfg: WebDAVSyncConfig) => void;
}

function SyncStatusIcon({ status }: { status?: GlobalSyncStatus }) {
  if (!status || status === 'idle') {
    return <Cloud size={13} className="text-[#C8C4B7]" />;
  }
  if (status === 'syncing') {
    return <Loader size={13} className="animate-spin text-[#A63A2B]" />;
  }
  if (status === 'success') {
    return <CheckCircle size={13} className="text-[#2D7A5B]" />;
  }
  if (status === 'error') {
    return <AlertCircle size={13} className="text-[#A63A2B]" />;
  }
  return <Cloud size={13} className="text-[#C8C4B7]" />;
}

export function Header({
  title,
  setIsAboutOpen,
  syncStatus,
  syncMessage,
  lastSyncTime,
  syncConfig,
  onSaveSyncConfig,
}: HeaderProps) {
  const [isWebDAVOpen, setIsWebDAVOpen] = useState(false);

  const handleGlobalExport = () => {
    const booksData: any = {};
    for (const book of BOOKS) {
      booksData[book.id] = {
        partitions: JSON.parse(localStorage.getItem(`${book.id}_${PARTITIONS_KEY}`) || 'null'),
        interpretations: JSON.parse(localStorage.getItem(`${book.id}_${INTERPRETATION_KEY}`) || 'null')
      };
    }
    const data = {
      version: 2,
      type: 'daoism_backup',
      books: booksData
    };
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
        if (data.type === 'daoism_backup' && data.books) {
          for (const bookId of Object.keys(data.books)) {
            if (data.books[bookId].partitions) {
              localStorage.setItem(`${bookId}_${PARTITIONS_KEY}`, JSON.stringify(data.books[bookId].partitions));
            }
            if (data.books[bookId].interpretations) {
              localStorage.setItem(`${bookId}_${INTERPRETATION_KEY}`, JSON.stringify(data.books[bookId].interpretations));
            }
          }
          alert('数据导入成功！');
          window.location.reload();
        } else {
          alert('无法识别的备份文件格式！');
        }
      } catch (err) {
        alert('无效的文件格式！');
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
              title={syncMessage || '点击打开同步面板'}
              className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1.5 py-1 rounded-sm"
            >
              <SyncStatusIcon status={syncStatus} />
              同步
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
        syncConfig={syncConfig}
        onSaveSyncConfig={onSaveSyncConfig}
        globalSyncStatus={syncStatus}
        globalSyncMessage={syncMessage}
        globalLastSyncTime={lastSyncTime}
      />
    </>
  );
}
