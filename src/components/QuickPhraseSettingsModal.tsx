import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Check, Zap } from 'lucide-react';
import type { QuickPhrase } from '../types';

interface QuickPhraseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: QuickPhrase[];
  onSave: (phrases: QuickPhrase[]) => void;
}

interface DraftPhrase {
  id: string;
  title: string;
  subtitle: string;
  message: string;
}

function makeEmptyDraft(): DraftPhrase {
  return { id: '', title: '', subtitle: '', message: '' };
}

function phraseToDraft(p: QuickPhrase): DraftPhrase {
  return { ...p };
}

function draftToPhrase(d: DraftPhrase): QuickPhrase {
  return { ...d };
}

export function QuickPhraseSettingsModal({
  isOpen,
  onClose,
  phrases,
  onSave,
}: QuickPhraseSettingsModalProps) {
  const [drafts, setDrafts] = useState<DraftPhrase[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftPhrase>(makeEmptyDraft());

  useEffect(() => {
    if (isOpen) {
      setDrafts(phrases.map(phraseToDraft));
      setEditingId(null);
    }
  }, [isOpen, phrases]);

  if (!isOpen) return null;

  const startAdd = () => {
    setEditDraft(makeEmptyDraft());
    setEditingId('__new__');
  };

  const startEdit = (p: DraftPhrase) => {
    setEditDraft({ ...p });
    setEditingId(p.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editDraft.title.trim() || !editDraft.message.trim()) return;

    if (editingId === '__new__') {
      // Generate a unique id
      const newId = 'qp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setDrafts(prev => [...prev, draftToPhrase({ ...editDraft, id: newId })]);
    } else {
      setDrafts(prev =>
        prev.map(d => (d.id === editingId ? draftToPhrase(editDraft) : d))
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (editingId === id) {
      setEditingId(null);
    }
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleSaveAll = () => {
    onSave(drafts.map(draftToPhrase));
    onClose();
  };

  const isEditing = editingId !== null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col"
        style={{
          background: '#FDFBF7',
          borderTop: '4px solid #A63A2B',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-4 border-b border-[#E2DED0]" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-[#A63A2B]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[#1A1A1A] font-sans">
              快问配置
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C8471] hover:text-[#1A1A1A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Phrase list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ minHeight: 0 }}>
          {drafts.length === 0 && !isEditing && (
            <p className="text-[12px] text-[#8C8471] text-center py-6 font-sans">
              暂无快问短语，点击下方按钮添加
            </p>
          )}

          {drafts.map(phrase => (
            <div
              key={phrase.id}
              className="flex items-start gap-2 p-2.5 border border-[#E2DED0] hover:border-[#A63A2B]/30 transition-colors group"
              style={{ background: '#FDFBF7' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-[#1A1A1A] font-sans truncate">
                  {phrase.title}
                </div>
                <div className="text-[11px] text-[#8C8471] font-sans truncate mt-0.5">
                  {phrase.subtitle}
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(phrase)}
                  title="编辑"
                  className="w-6 h-6 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => handleDelete(phrase.id)}
                  title="删除"
                  className="w-6 h-6 flex items-center justify-center text-[#8C8471] hover:text-[#A63A2B] transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}

          {/* Edit form */}
          {isEditing && (
            <div
              className="p-3 space-y-3"
              style={{
                border: '1px solid #A63A2B',
                background: '#A63A2B/5',
              }}
            >
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1">
                  标题
                </label>
                <input
                  type="text"
                  value={editDraft.title}
                  onChange={e => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="如：原义模式"
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-1.5 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1">
                  副标题
                </label>
                <input
                  type="text"
                  value={editDraft.subtitle}
                  onChange={e => setEditDraft(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="简短描述"
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-1.5 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1">
                  提问内容
                </label>
                <textarea
                  value={editDraft.message}
                  onChange={e => setEditDraft(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="向 AI 发送的完整问题"
                  rows={3}
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-1.5 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7] resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 font-sans">
                <button
                  onClick={cancelEdit}
                  className="text-[10px] uppercase tracking-widest font-bold text-[#8C8471] hover:text-[#1A1A1A] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editDraft.title.trim() || !editDraft.message.trim()}
                  className="text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#A63A2B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Check size={11} />
                  确定
                </button>
              </div>
            </div>
          )}

          {/* Add button */}
          {!isEditing && (
            <button
              onClick={startAdd}
              className="w-full py-2.5 border border-dashed border-[#E2DED0] text-[#8C8471] hover:text-[#A63A2B] hover:border-[#A63A2B] transition-colors font-sans text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
            >
              <Plus size={12} />
              新增快问
            </button>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-4 px-4 py-4 border-t border-[#E2DED0] font-sans" style={{ flexShrink: 0 }}>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest font-bold text-[#8C8471] hover:text-[#1A1A1A] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSaveAll}
            className="text-[10px] uppercase tracking-widest font-bold px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#A63A2B] transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
