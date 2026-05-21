import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  KeyboardEvent,
} from 'react';
import {
  X,
  Settings,
  Send,
  Square,
  Bot,
  User,
  Minus,
  Zap,
  ChevronRight,
  Copy,
  FileText,
} from 'lucide-react';
import { useAIChat, type Message } from '../hooks/useAIChat';
import { AISettingsModal } from './AISettingsModal';
import { QuickPhraseSettingsModal } from './QuickPhraseSettingsModal';
import { useAppStore } from '../store/useAppStore';
import { useAIUIStore } from '../store/useAIUIStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { BOOKS } from '../data/book';
import { buildChapterPrompt } from '../utils/prompt';
import type { QuickPhrase } from '../types';

/** Plain-text renderer: only handle line-breaks */
function renderContent(text: string) {
  return text.split('\n').map((line, j, arr) => (
    <React.Fragment key={j}>
      {line}
      {j < arr.length - 1 && <br />}
    </React.Fragment>
  ));
}

// ── MessageList ─────────────────────────────────────────────────────────────
// Isolated as React.memo so it only re-renders when messages/error change,
// not when the user is typing in the input area.

interface MessageListProps {
  messages: Message[];
  error: string | null;
}

const MessageList = React.memo(({ messages, error }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 0 }}>
      {messages.length === 0 && !error && (
        <div className="h-full flex flex-col items-center justify-center text-center py-8 gap-3">
          <Bot size={32} className="text-[#E2DED0]" />
          <p className="text-[12px] text-[#8C8471] font-sans leading-relaxed">
            将当前章节作为上下文<br />向 AI 提问任何问题
          </p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
            style={{ background: msg.role === 'user' ? '#1A1A1A' : '#A63A2B' }}
          >
            {msg.role === 'user' ? <User size={11} color="white" /> : <Bot size={11} color="white" />}
          </div>
          <div
            className="max-w-[82%] text-[13px] leading-relaxed font-serif"
            style={{
              background: msg.role === 'user' ? '#1A1A1A' : '#F0EDE6',
              color: msg.role === 'user' ? '#FDFBF7' : '#2D2926',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
            }}
          >
            {msg.content ? renderContent(msg.content) : <span className="opacity-40 text-xs">▋</span>}
          </div>
        </div>
      ))}

      {error && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 p-3 font-sans rounded">
          {error}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

// ── InputArea ────────────────────────────────────────────────────────────────
// Owns the `input` state locally so that keystrokes only re-render this
// component, not the entire AIModal or the message list above.

interface InputAreaProps {
  isStreaming: boolean;
  systemPrompt?: string;
  onSend: (text: string, systemPrompt?: string) => void;
  onStop: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const InputArea = React.memo(({ isStreaming, systemPrompt, onSend, onStop, inputRef }: InputAreaProps) => {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    onSend(text, systemPrompt);
  }, [input, isStreaming, onSend, systemPrompt]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid #E2DED0',
        background: '#FDFBF7',
        flexShrink: 0,
        padding: '10px 12px',
        display: 'flex',
        gap: 8,
        alignItems: 'stretch',
      }}
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="追问… (Enter 发送，Shift+Enter 换行)"
        rows={2}
        style={{
          flex: 1,
          resize: 'none',
          background: 'transparent',
          border: '1px solid #E2DED0',
          outline: 'none',
          fontSize: 13,
          fontFamily: 'var(--font-sans, sans-serif)',
          color: '#1A1A1A',
          padding: '8px 10px',
          lineHeight: 1.5,
          borderRadius: 4,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#A63A2B'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#E2DED0'; }}
      />
      {isStreaming ? (
        <button
          onClick={onStop}
          title="停止"
          style={{ alignSelf: 'stretch', width: 36 }}
          className="flex-shrink-0 flex items-center justify-center bg-[#A63A2B] text-white hover:bg-[#A63A2B]/80 transition-colors rounded"
        >
          <Square size={14} />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          title="发送"
          style={{ alignSelf: 'stretch', width: 36 }}
          className="flex-shrink-0 flex items-center justify-center bg-[#1A1A1A] text-white hover:bg-[#A63A2B] transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      )}
    </div>
  );
});

const DRAG_MARGIN = 8;

export function AIModal() {
  const settings = useAppStore(s => s.aiSettings);
  const saveSettings = useAppStore(s => s.setAISettings);
  const quickPhrases = useAppStore(s => s.quickPhrases);
  const setQuickPhrases = useAppStore(s => s.setQuickPhrases);

  // AI UI store — drives open/visible/mode
  const isOpen = useAIUIStore(s => s.isOpen && s.isVisible);
  const mode = useAIUIStore(s => s.mode);
  const initialUserMessage = useAIUIStore(s => s.initialMessage);
  const sessionId = useAIUIStore(s => s.sessionId);
  const onHide = useAIUIStore(s => s.hide);
  const closeSession = useAIUIStore(s => s.close);

  // For chapter-mode prompts, subscribe only to the current book's
  // interpretations map so prompt re-derivation fires exactly when needed.
  const chapterBookId = mode?.kind === 'chapter' ? mode.bookId : null;
  const interpretationsForBook = useAppStore(s =>
    chapterBookId ? s.interpretations[chapterBookId] : undefined
  );

  // Derive systemPrompt live.  Stable reference as long as inputs are stable.
  const systemPrompt = useMemo<string | undefined>(() => {
    if (!mode) return undefined;
    if (mode.kind === 'snapshot') return mode.prompt;
    const book = BOOKS.find(b => b.id === mode.bookId);
    const chapter = book?.content.find(c => c.id === mode.chapterId);
    if (!chapter) return undefined;
    const interp = interpretationsForBook?.[mode.chapterId];
    return buildChapterPrompt(chapter, interp);
  }, [mode, interpretationsForBook]);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } =
    useAIChat(settings);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const quickBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Drag state
  const modalRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ dragging: boolean; ox: number; oy: number }>({
    dragging: false,
    ox: 0,
    oy: 0,
  });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const sentInitial = useRef(false);
  const isMobile = useIsMobile();

  // Send initial message once when opened.
  useEffect(() => {
    if (isOpen && initialUserMessage && !sentInitial.current) {
      sentInitial.current = true;
      sendMessage(initialUserMessage, systemPrompt);
    }
    if (!isOpen) {
      sentInitial.current = false;
    }
  }, [isOpen, initialUserMessage, systemPrompt, sendMessage]);

  // Clear chat messages whenever the store signals a new session id
  useEffect(() => {
    clearMessages();
  }, [sessionId, clearMessages]);

  // Reset position when reopened; focus input
  useEffect(() => {
    if (isOpen) {
      setPos(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Focus input after streaming ends
  useEffect(() => {
    if (!isStreaming && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isStreaming, isOpen]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile || !modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
    };
    e.preventDefault();
  }, [isMobile]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.dragging || !modalRef.current) return;
      const mw = modalRef.current.offsetWidth;
      const mh = modalRef.current.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const newX = Math.min(
        Math.max(e.clientX - dragState.current.ox, DRAG_MARGIN),
        vw - mw - DRAG_MARGIN
      );
      const newY = Math.min(
        Math.max(e.clientY - dragState.current.oy, DRAG_MARGIN),
        vh - mh - DRAG_MARGIN
      );
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      dragState.current.dragging = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handleClose = useCallback(() => {
    closeSession();
  }, [closeSession]);

  const handleQuickPhrase = useCallback((phrase: QuickPhrase) => {
    setIsQuickMenuOpen(false);
    sendMessage(phrase.message, systemPrompt);
  }, [sendMessage, systemPrompt]);

  const openQuickSettings = useCallback(() => {
    setIsQuickMenuOpen(false);
    setIsQuickSettingsOpen(true);
  }, []);

  const copyPromptToClipboard = useCallback(() => {
    if (systemPrompt) {
      navigator.clipboard.writeText(systemPrompt).catch(() => {});
    }
  }, [systemPrompt]);

  if (!isOpen) return null;

  const modalStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0 }
    : pos
      ? { position: 'fixed', left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
      : { position: 'fixed', right: 24, bottom: 24 };

  return (
    <>
      {/* AI Settings sub-modal */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Quick Phrase Settings modal */}
      <QuickPhraseSettingsModal
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        phrases={quickPhrases}
        onSave={setQuickPhrases}
      />

      {/* System Prompt Viewer modal */}
      {isPromptModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(26,26,26,0.4)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setIsPromptModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: isMobile ? '92%' : 520,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#FDFBF7',
              borderTop: '3px solid #A63A2B',
              boxShadow: '0 24px 64px rgba(26,26,26,0.22)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: '1px solid #E2DED0',
                background: '#F5F1EA',
                flexShrink: 0,
              }}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#A63A2B]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A] font-sans">
                  系统提示词
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copyPromptToClipboard}
                  title="复制到剪贴板"
                  className="w-7 h-7 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors rounded"
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={() => setIsPromptModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors rounded"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '16px 20px',
                overflowY: 'auto',
                flex: 1,
                fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', 'KaiTi', serif",
                fontSize: 14,
                lineHeight: 1.85,
                color: '#3C3C3C',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {systemPrompt || <span style={{ color: '#8C8471', fontStyle: 'italic' }}>暂无系统提示词</span>}
            </div>
          </div>
        </div>
      )}

      {/* Main floating modal */}
      <div
        ref={modalRef}
        style={{
          ...modalStyle,
          width: isMobile ? '100%' : 420,
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '100vh' : '75vh',
          boxShadow: '0 24px 64px rgba(26,26,26,0.22), 0 4px 16px rgba(26,26,26,0.12)',
          background: '#FDFBF7',
          borderTop: '3px solid #A63A2B',
          overflow: 'hidden',
          userSelect: dragState.current.dragging ? 'none' : 'auto',
        }}
      >
        {/* ── Title Bar (drag handle) ── */}
        <div
          onMouseDown={onMouseDown}
          className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing select-none"
          style={{
            borderBottom: '1px solid #E2DED0',
            background: '#F5F1EA',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-2">
            <Bot size={14} className="text-[#A63A2B] cursor-pointer hover:opacity-80" onClick={() => setIsPromptModalOpen(true)} title="查看系统提示词" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A] font-sans">
              问 AI
            </span>
            {isStreaming && (
              <span className="flex gap-0.5 ml-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: '#A63A2B',
                      animation: `ai-dot-bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
                      display: 'inline-block',
                    }}
                  />
                ))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Quick-phrase button */}
            <div style={{ position: 'relative' }}>
              <button
                ref={quickBtnRef}
                onClick={() => setIsQuickMenuOpen(prev => !prev)}
                title="快问"
                className={`w-7 h-7 flex items-center justify-center transition-colors rounded ${
                  isQuickMenuOpen ? 'text-[#A63A2B] bg-[#A63A2B]/10' : 'text-[#8C8471] hover:text-[#A63A2B]'
                }`}
              >
                <Zap size={13} />
              </button>

              {/* Quick-phrase dropdown menu */}
              {isQuickMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    width: 220,
                    background: '#FDFBF7',
                    border: '1px solid #E2DED0',
                    boxShadow: '0 8px 24px rgba(26,26,26,0.15), 0 2px 4px rgba(26,26,26,0.08)',
                    zIndex: 10,
                  }}
                >
                  {quickPhrases.map((phrase) => (
                    <button
                      key={phrase.id}
                      onClick={() => handleQuickPhrase(phrase)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#F5F1EA] transition-colors border-b border-[#E2DED0]/60 flex items-center justify-between gap-2 group last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-[#1A1A1A] font-sans truncate">
                          {phrase.title}
                        </div>
                        <div className="text-[10px] text-[#8C8471] font-sans truncate mt-0.5">
                          {phrase.subtitle}
                        </div>
                      </div>
                      <ChevronRight size={11} className="text-[#E2DED0] group-hover:text-[#A63A2B] flex-shrink-0 transition-colors" />
                    </button>
                  ))}

                  {/* Divider + Config button */}
                  <div className="border-t border-[#E2DED0]">
                    <button
                      onClick={openQuickSettings}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#F5F1EA] transition-colors flex items-center gap-2"
                    >
                      <Settings size={11} className="text-[#8C8471]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C8471] font-sans">
                        配置
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="设置"
              className="w-7 h-7 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors rounded"
            >
              <Settings size={13} />
            </button>
            {/* Hide button: hides modal, keeps messages */}
            <button
              onClick={onHide}
              title="隐藏"
              className="w-7 h-7 flex items-center justify-center text-[#8C8471] hover:text-[#1A1A1A] transition-colors rounded"
            >
              <Minus size={14} />
            </button>
            {/* Close button: clears messages + closes */}
            <button
              onClick={handleClose}
              title="关闭并清空"
              className="w-7 h-7 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors rounded"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Message List ── */}
        <MessageList messages={messages} error={error} />

        {/* ── Input Area ── */}
        <InputArea
          isStreaming={isStreaming}
          systemPrompt={systemPrompt}
          onSend={sendMessage}
          onStop={stopStreaming}
          inputRef={inputRef}
        />
      </div>

      {/* Keyframe animation for streaming dots */}
      <style>{`
        @keyframes ai-dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  );
}
