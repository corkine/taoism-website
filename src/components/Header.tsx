import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { BOOKS } from '../data/book';
import { WebDAVSyncModal } from './WebDAVSyncModal';
import { ImportModal } from './ImportModal';
import { useAppStore } from '../store/useAppStore';
import { AboutModals } from './AboutModals';
import { SyncStatusDot } from './SyncStatusDot';

interface HeaderProps {
  title: string;
}

const BookNavLinks = React.memo(() => (
  <div className="flex gap-2 text-xl font-serif mt-3 md:mt-2 justify-start md:justify-end md:ml-4 flex-wrap">
    {BOOKS.map((book, index) => (
      <React.Fragment key={book.id}>
        <NavLink
          to={`/${book.id}`}
          className={({ isActive }) =>
            isActive ? 'text-[#A63A2B] font-bold' : 'text-[#8C8471] hover:text-[#A63A2B]'
          }
        >
          {book.title}
        </NavLink>
        {index < BOOKS.length - 1 && <span className="text-[#E2DED0]">/</span>}
      </React.Fragment>
    ))}
  </div>
));

export const Header = React.memo(({
  title,
}: HeaderProps) => {
  const [isWebDAVOpen, setIsWebDAVOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const isDirty = useAppStore(s => s.dirtySince !== null);
  const clearDirty = useAppStore(s => s.clearDirty);
  const syncState = useAppStore(s => s.syncState);
  const webdavConfig = useAppStore(s => s.webdavConfig);
  const triggerSync = useAppStore(s => s.triggerSync);
  const finalizeSync = useAppStore(s => s.finalizeSync);
  const exportToFile = useAppStore(s => s.exportToFile);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleGlobalExport = () => {
    exportToFile(false);
    // After a successful export the local copy is safely persisted elsewhere.
    clearDirty();
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
            <button onClick={() => setIsAboutOpen(true)} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              关于
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] font-sans">|</span>
            <button onClick={handleGlobalExport} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
              导出
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] font-sans">|</span>
            <button onClick={() => setIsImportOpen(true)} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm cursor-pointer">
              导入
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] font-sans">|</span>
            <SyncStatusDot
              syncState={syncState}
              isDirty={isDirty}
            />
            <button
              onClick={() => setIsWebDAVOpen(true)}
              title={syncState.message || '点击打开在线同步面板'}
              className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1.5 py-1 rounded-sm"
            >
              同步
            </button>
          </div>

          <BookNavLinks />
        </div>
      </header>

      <WebDAVSyncModal
        isOpen={isWebDAVOpen}
        onClose={() => setIsWebDAVOpen(false)}
        globalSyncStatus={syncState.status}
        globalSyncMessage={syncState.message}
        globalLastSyncTime={syncState.lastSyncTime}
        onTriggerSync={triggerSync}
        onFinalizeSync={finalizeSync}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      {/* About Modals */}
      <AboutModals isAboutOpen={isAboutOpen} setIsAboutOpen={setIsAboutOpen} />
    </>
  );
});
