import React from 'react';
import { motion } from 'motion/react';

interface HeaderProps {
  setIsAboutOpen: (isOpen: boolean) => void;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Header({ setIsAboutOpen, handleExport, handleImport }: HeaderProps) {
  return (
    <header className="relative pt-12 px-12 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-6xl font-bold mb-2 text-[#1A1A1A] flex items-baseline gap-4"
        >
          老子
        </motion.h1>
        <div className="h-1.5 w-32 bg-[#A63A2B]" />
      </div>

      <div className="text-right hidden md:block">
        <div className="flex gap-1 items-center justify-end mb-1">
          <button onClick={() => setIsAboutOpen(true)} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
            关于
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">|</span>
          <button onClick={handleExport} className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">
            导出
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm">|</span>
          <label className="text-xs font-bold uppercase tracking-widest text-[#8C8471] hover:text-[#A63A2B] transition-colors font-sans flex items-center gap-1 py-1 rounded-sm cursor-pointer">
            导入
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        <div className="text-xl font-medium mt-1 text-[#1A1A1A]">解经助手</div>
      </div>
    </header>
  );
}
