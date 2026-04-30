import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ChapterContent } from '../components/ChapterContent';
import { AIModal } from '../components/AIModal';
import { useParams, useNavigate } from 'react-router-dom';
import { BOOKS } from '../data/book';

export default function BookPage({ bookId }: { bookId: string }) {
  const bookConfig = BOOKS.find(b => b.id === bookId)!;
  const chaptersCount = bookConfig.content.length;

  const { chapterId } = useParams();
  const navigate = useNavigate();

  const parsedChapterId = chapterId ? parseInt(chapterId, 10) : 1;
  const selectedChapterId = (isNaN(parsedChapterId) || parsedChapterId < 1 || parsedChapterId > chaptersCount)
    ? 1
    : parsedChapterId;

  const setSelectedChapterId = useCallback((idOrUpdater: number | ((prev: number) => number)) => {
    let newId: number;
    if (typeof idOrUpdater === 'function') {
      newId = idOrUpdater(selectedChapterId);
    } else {
      newId = idOrUpdater;
    }
    navigate(`/${bookId}/${newId}`);
  }, [navigate, bookId, selectedChapterId]);

  // AI Modal state
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAIVisible, setIsAIVisible] = useState(false);
  const [aiSystemPrompt, setAISystemPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.title = `道经释义 · ${bookConfig.title} 第 ${selectedChapterId} 章`;
  }, [bookConfig.title, selectedChapterId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Handle Ctrl + K for AI Modal Toggle
      if (e.ctrlKey) {
        if (e.key === 'k') {
          e.preventDefault();
          if (!isAIOpen) {
            setIsAIOpen(true);
            setIsAIVisible(true);
          } else {
            setIsAIVisible(prev => !prev);
          }
          return;
        }
      }

      if (isInput) return;

      if (e.key === 'ArrowLeft') {
        if (selectedChapterId > 1) {
          e.preventDefault();
          setSelectedChapterId(selectedChapterId - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedChapterId < chaptersCount) {
          e.preventDefault();
          setSelectedChapterId(selectedChapterId + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChapterId, setSelectedChapterId, chaptersCount, isAIOpen]);

  const handleOpenAI = useCallback((prompt: string) => {
    setAISystemPrompt(prompt);
    setIsAIOpen(true);
    setIsAIVisible(true);
  }, []);

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-serif selection:bg-[#A63A2B]/10 selection:text-[#A63A2B]">
      <Header title={bookConfig.title} />
      <main className="mt-6 md:mt-8 px-6 md:px-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 relative z-10">
        <Sidebar
          bookId={bookId}
          selectedChapterId={selectedChapterId}
          setSelectedChapterId={setSelectedChapterId}
          onOpenAI={handleOpenAI}
        />

        <div className="lg:col-span-9 flex flex-col md:flex-row gap-8 md:gap-12">
          <ChapterContent
            bookId={bookId}
            chapters={bookConfig.content}
            selectedChapterId={selectedChapterId}
            setSelectedChapterId={setSelectedChapterId}
            onAskAI={handleOpenAI}
            onUpdatePrompt={setAISystemPrompt}
          />
        </div>
      </main>

      {/* AI Floating Modal */}
      <AIModal
        isOpen={isAIOpen && isAIVisible}
        onHide={() => setIsAIVisible(false)}
        onClose={() => { setIsAIOpen(false); setIsAIVisible(false); }}
        systemPrompt={aiSystemPrompt}
      />

      <style>{`
      :root {
        --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
        --font-serif: 'Noto Serif SC', serif;
        background-color: #FDFBF7;
      }

      .font-serif {
        font-family: var(--font-serif);
      }

      .font-sans {
        font-family: var(--font-sans);
      }

      .writing-vertical-rl {
        writing-mode: vertical-rl;
      }
    `}</style>
    </div>
  );
}