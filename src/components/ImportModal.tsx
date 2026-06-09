import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Package, Loader, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BUILT_IN_BACKUPS, loadBuiltInBackup, stripNonBookData, type BuiltInBackup } from '../data/reference';

type TabId = 'file' | 'builtin';

type ImportStatus =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const applyBackupData = useAppStore((s) => s.applyBackupData);

  const [activeTab, setActiveTab] = useState<TabId>('file');
  const [status, setStatus] = useState<ImportStatus>({ type: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reset on open ──────────────────────────────────────────────────
  const wasOpen = useRef(false);
  if (isOpen && !wasOpen.current) {
    wasOpen.current = true;
    setStatus({ type: 'idle' });
    setActiveTab('file');
  }
  if (!isOpen) {
    wasOpen.current = false;
  }

  // ── File import ────────────────────────────────────────────────────
  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setStatus({ type: 'loading', message: '正在读取文件…' });
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const raw = JSON.parse(evt.target?.result as string);
          const booksOnly = stripNonBookData(raw);
          applyBackupData(booksOnly);
          setStatus({ type: 'success', message: '文件导入成功！' });
        } catch (err: any) {
          setStatus({ type: 'error', message: err.message || '无效的文件格式' });
        }
      };
      reader.onerror = () => {
        setStatus({ type: 'error', message: '文件读取失败' });
      };
      reader.readAsText(file);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [applyBackupData],
  );

  // ── Built-in backup import ─────────────────────────────────────────
  const handleBuiltInImport = useCallback(
    async (backup: BuiltInBackup) => {
      setStatus({ type: 'loading', message: `正在加载「${backup.name}」…` });
      try {
        const raw = await loadBuiltInBackup(backup.id);
        const booksOnly = stripNonBookData(raw as Record<string, unknown>);
        applyBackupData(booksOnly);
        setStatus({ type: 'success', message: `「${backup.name}」导入成功！` });
      } catch (err: any) {
        setStatus({ type: 'error', message: err.message || '内置备份加载失败' });
      }
    },
    [applyBackupData],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md shadow-2xl overflow-hidden bg-[#FDFBF7] border-t-4 border-[#A63A2B]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5">
          <div className="flex items-center gap-3">
            <Upload size={16} className="text-[#A63A2B]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[#1A1A1A] font-sans">
              导入数据
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8C8471] hover:text-[#1A1A1A] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="px-8 flex border-b border-[#E2DED0]">
          <button
            onClick={() => { setActiveTab('file'); setStatus({ type: 'idle' }); }}
            className={`flex items-center gap-2 pb-3 mr-6 text-[11px] font-bold uppercase tracking-widest font-sans border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-[#A63A2B] text-[#A63A2B]'
                : 'border-transparent text-[#8C8471] hover:text-[#1A1A1A]'
            }`}
          >
            <FileJson size={13} />
            导入文件
          </button>
          <button
            onClick={() => { setActiveTab('builtin'); setStatus({ type: 'idle' }); }}
            className={`flex items-center gap-2 pb-3 text-[11px] font-bold uppercase tracking-widest font-sans border-b-2 transition-colors ${
              activeTab === 'builtin'
                ? 'border-[#A63A2B] text-[#A63A2B]'
                : 'border-transparent text-[#8C8471] hover:text-[#1A1A1A]'
            }`}
          >
            <Package size={13} />
            恢复默认
          </button>
        </div>

        {/* ── Content ── */}
        <div className="px-8 pb-8 pt-4 space-y-5">
          {activeTab === 'file' && (
            <>
              <p className="text-xs text-[#8C8471] font-sans leading-relaxed">
                选择一个之前导出的 JSON 备份文件（.json），系统将仅恢复其中的分章定义和注释数据，不会修改 AI 设置和快捷短语。
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="import-file-input"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={status.type === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest font-bold font-sans hover:bg-[#A63A2B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={13} />
                选择文件并导入
              </button>
            </>
          )}

          {activeTab === 'builtin' && (
            <>
              <p className="text-xs text-[#8C8471] font-sans leading-relaxed">
                从内置备份中恢复数据。导入将仅恢复分章定义和注释，不会覆盖当前的 AI 设置和快捷短语配置。
              </p>

              <div className="space-y-3">
                {BUILT_IN_BACKUPS.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 border border-[#E2DED0] bg-white"
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm font-bold text-[#1A1A1A] font-sans truncate">
                        {backup.name}
                      </p>
                      <p className="text-[11px] text-[#8C8471] font-sans mt-0.5 leading-relaxed">
                        {backup.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuiltInImport(backup)}
                      disabled={status.type === 'loading'}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-widest font-bold font-sans hover:bg-[#A63A2B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Package size={11} />
                      恢复
                    </button>
                  </div>
                ))}

                {BUILT_IN_BACKUPS.length === 0 && (
                  <div className="text-center py-8">
                    <Package size={24} className="text-[#E2DED0] mx-auto mb-2" />
                    <p className="text-xs text-[#8C8471] font-sans">暂无内置备份</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Status ── */}
          {status.type !== 'idle' && (
            <div
              className={`flex items-center gap-2 px-3 py-2 border-l-2 ${
                status.type === 'success'
                  ? 'border-[#2D7A5B] bg-[#2D7A5B]/5'
                  : status.type === 'error'
                    ? 'border-[#A63A2B] bg-[#A63A2B]/5'
                    : 'border-[#A63A2B] bg-[#A63A2B]/5'
              }`}
            >
              {status.type === 'loading' && (
                <Loader size={12} className="animate-spin text-[#A63A2B] flex-shrink-0" />
              )}
              {status.type === 'success' && (
                <CheckCircle size={12} className="text-[#2D7A5B] flex-shrink-0" />
              )}
              {status.type === 'error' && (
                <AlertCircle size={12} className="text-[#A63A2B] flex-shrink-0" />
              )}
              <p className="text-[11px] font-sans text-[#1A1A1A]">{status.message}</p>
            </div>
          )}

          {status.type === 'success' && (
            <button
              onClick={onClose}
              className="w-full py-2.5 border-2 border-[#1A1A1A] text-[#1A1A1A] text-[11px] uppercase tracking-widest font-bold font-sans hover:border-[#A63A2B] hover:text-[#A63A2B] transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
