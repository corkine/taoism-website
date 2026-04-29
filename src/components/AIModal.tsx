import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
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
} from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { AISettingsModal } from './AISettingsModal';
import { useAISettings } from '../hooks/useAISettings';

interface AIModalProps {
  isOpen: boolean;
  /** Hide the modal (keep messages) */
  onHide: () => void;
  /** Close and clear all messages */
  onClose: () => void;
  systemPrompt?: string;
  initialUserMessage?: string;
}

/** Plain-text renderer: only handle line-breaks */
function renderContent(text: string) {
  return text.split('\n').map((line, j, arr) => (
    <React.Fragment key={j}>
      {line}
      {j < arr.length - 1 && <br />}
    </React.Fragment>
  ));
}

const DRAG_MARGIN = 8;

export function AIModal({
  isOpen,
  onHide,
  onClose,
  systemPrompt,
  initialUserMessage,
}: AIModalProps) {
  const { settings, saveSettings } = useAISettings();
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } =
    useAIChat(settings);

  const [input, setInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Drag state
  const modalRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ dragging: boolean; ox: number; oy: number }>({
    dragging: false,
    ox: 0,
    oy: 0,
  });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial message once when opened
  useEffect(() => {
    if (isOpen && initialUserMessage && !sentInitial.current && messages.length === 0) {
      sentInitial.current = true;
      sendMessage(initialUserMessage, systemPrompt);
    }
    if (!isOpen) {
      sentInitial.current = false;
    }
  }, [isOpen, initialUserMessage, systemPrompt, messages.length, sendMessage]);

  // Reset position when reopened; focus input
  useEffect(() => {
    if (isOpen) {
      setPos(null);
      // Delay slightly to let the modal render first
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
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
    };
    e.preventDefault();
  }, []);

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

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text, systemPrompt);
  }, [input, isStreaming, sendMessage, systemPrompt]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    clearMessages();
    setInput('');
    onClose();
  };

  if (!isOpen) return null;

  const modalStyle: React.CSSProperties = pos
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

      {/* Main floating modal */}
      <div
        ref={modalRef}
        style={{
          ...modalStyle,
          width: 420,
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
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
            <Bot size={14} className="text-[#A63A2B]" />
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
              {/* Chevron-down as "hide" affordance */}
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
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ minHeight: 0 }}
        >
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
              {/* Avatar */}
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{
                  background: msg.role === 'user' ? '#1A1A1A' : '#A63A2B',
                }}
              >
                {msg.role === 'user' ? (
                  <User size={11} color="white" />
                ) : (
                  <Bot size={11} color="white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className="max-w-[82%] text-[13px] leading-relaxed font-serif"
                style={{
                  background: msg.role === 'user' ? '#1A1A1A' : '#F0EDE6',
                  color: msg.role === 'user' ? '#FDFBF7' : '#2D2926',
                  padding: '8px 12px',
                  borderRadius:
                    msg.role === 'user'
                      ? '12px 4px 12px 12px'
                      : '4px 12px 12px 12px',
                }}
              >
                {msg.content ? (
                  renderContent(msg.content)
                ) : (
                  <span className="opacity-40 text-xs">▋</span>
                )}
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

        {/* ── Input Area ── */}
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
            onFocus={e => {
              e.currentTarget.style.borderColor = '#A63A2B';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#E2DED0';
            }}
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
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
