import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { BOOKS } from '../data/book';
import { WebDAVSyncModal } from './WebDAVSyncModal';
import { useWebDAVSync } from '../hooks/useWebDAVSync';
import { CloudUpload } from 'lucide-react';
import { isDirty as checkDirty, restoreBackupData, exportDataToFile } from '../utils/storage';

interface HeaderProps {
  title: string;
  setIsAboutOpen: (isOpen: boolean) => void;
}

export const Header = React.memo(({
  title,
  setIsAboutOpen,
}: HeaderProps) => {
  const [isWebDAVOpen, setIsWebDAVOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(checkDirty());
  const { syncState, webdavConfig, triggerUpload, triggerDownload, triggerSync, finalizeSync } = useWebDAVSync();

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

  const handleDirtySync = async () => {
    if (!webdavConfig) {
      setIsWebDAVOpen(true);
      return;
    }
    const res = await triggerSync();
    if (res.needsConfirm) {
      if (confirm('当前存在未同步的变更, 是否自动合并后进行同步？')) {
        await finalizeSync(res.mergedData)
        setTimeout(() => window.location.reload(), 1000);
      }
    } else if (res.needsReload) {
      setTimeout(() => window.location.reload(), 1000);
    }
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
              className="text-6xl font-bold text-ink-header"
            >
              {title}
            </motion.h1>
          </div>
          <div className="h-1.5 w-32 bg-brand" />
        </div>

        <div className="w-full md:w-auto md:text-right mt-2 md:mt-0">
          <div className="flex gap-3 md:gap-1 items-center justify-start md:justify-end mb-2 md:mb-1 flex-wrap relative">
            <AnimatePresence>
              {isDirty && (
                <motion.div
                  key="dirty-pill"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1 }}
                  title={syncState.status === 'syncing' ? '正在同步数据...' : '有本地未同步的变更，点击同步'}
                  className={`cursor-pointer flex items-center gap-1.5 px-2 py-1 bg-brand/10 text-brand rounded-full mr-2 transition-all ${syncState.status === 'syncing' ? 'opacity-70 cursor-wait' : 'hover:bg-brand/20'}`}
                  onClick={syncState.status === 'syncing' ? undefined : handleDirtySync}
                >
                  <CloudUpload size={12} className={syncState.status === 'syncing' ? 'animate-pulse' : ''} />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
                    {syncState.status === 'syncing' ? '正在同步' : '本地变更'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={() => setIsAboutOpen(true)} className="text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-brand transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              关于
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-ink-muted font-sans">|</span>
            <button onClick={handleGlobalExport} className="text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-brand transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              导出
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-ink-muted font-sans">|</span>
            <label className="text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-brand transition-colors font-sans flex items-center gap-1 py-1 rounded-sm cursor-pointer">
              导入
              <input type="file" accept=".json" onChange={handleGlobalImport} className="hidden" />
            </label>
            <span className="text-xs font-bold uppercase tracking-widest text-ink-muted font-sans">|</span>
            <button
              onClick={() => setIsWebDAVOpen(true)}
              title={syncState.message || '点击打开在线备份面板'}
              className="text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-brand transition-colors font-sans flex items-center gap-1.5 py-1 rounded-sm"
            >
              备份
            </button>
          </div>

          <div className="flex gap-2 text-xl font-serif mt-3 md:mt-2 justify-start md:justify-end md:ml-4 flex-wrap">
            {BOOKS.map((book, index) => (
              <React.Fragment key={book.id}>
                <NavLink to={`/${book.id}`} className={({ isActive }) => isActive ? "text-brand font-bold" : "text-ink-muted hover:text-brand"}>{book.title}</NavLink>
                {index < BOOKS.length - 1 && <span className="text-border-subtle">/</span>}
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
        onTriggerSync={triggerSync}
        onFinalizeSync={finalizeSync}
      />
    </>
  );
});
