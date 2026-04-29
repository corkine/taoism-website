import React, { useState, useEffect, useCallback } from 'react';
import { X, Cloud, Upload, Download, CheckCircle, AlertCircle, Loader, Settings, WifiSync, ArrowUpDown } from 'lucide-react';
import {
  WEBDAV_REMOTE_PATH,
  fetchRemoteData,
} from '../utils/webdav';
import { formatTime } from '../utils/time';
import { loadWebDAVConfig, saveWebDAVConfig } from '../utils/storage';
import { WebDAVConfig, GlobalSyncStatus } from '../types';

type ModalSyncStatus =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string; time: string }
  | { type: 'error'; message: string };

interface WebDAVSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerUpload?: () => Promise<void>;
  onTriggerDownload?: () => Promise<{ needsReload: boolean }>;
  onTriggerSync?: () => Promise<{ needsConfirm: boolean; conflicts?: any[]; mergedData?: any; needsReload?: boolean }>;
  onFinalizeSync?: (mergedData: any) => Promise<void>;
  globalSyncStatus?: GlobalSyncStatus;
  globalSyncMessage?: string;
  globalLastSyncTime?: string | null;
}

export function WebDAVSyncModal({
  isOpen,
  onClose,
  onTriggerUpload,
  onTriggerDownload,
  onTriggerSync,
  onFinalizeSync,
  globalSyncStatus,
  globalSyncMessage,
  globalLastSyncTime,
}: WebDAVSyncModalProps) {
  const [config, setConfig] = useState<WebDAVConfig>({ url: '', username: '', password: '' });
  const [status, setStatus] = useState<ModalSyncStatus>({ type: 'idle' });
  const [remoteInfo, setRemoteInfo] = useState<{ syncedAt?: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [syncConflicts, setSyncConflicts] = useState<any[] | null>(null);
  const [pendingMergedData, setPendingMergedData] = useState<any>(null);

  // Sync modal local status with global status if global is active
  useEffect(() => {
    if (globalSyncStatus === 'syncing') {
      setStatus({ type: 'loading', message: globalSyncMessage || '正在同步…' });
    } else if (globalSyncStatus === 'success') {
      setStatus({ type: 'success', message: globalSyncMessage || '成功', time: globalLastSyncTime || '' });
    } else if (globalSyncStatus === 'error') {
      setStatus({ type: 'error', message: globalSyncMessage || '失败' });
    }
  }, [globalSyncStatus, globalSyncMessage, globalLastSyncTime]);

  // Unified draft: server config
  const [draftServer, setDraftServer] = useState<WebDAVConfig>({ url: '', username: '', password: '' });

  // Load saved config when modal opens
  useEffect(() => {
    if (isOpen) {
      const saved = loadWebDAVConfig();
      if (saved) {
        setConfig(saved);
        setDraftServer(saved);
        setShowSettings(false);
      } else {
        setShowSettings(true);
      }
      setStatus({ type: 'idle' });
      setRemoteInfo(null);
    }
  }, [isOpen]);

  const isConfigured = config.url.trim() !== '';

  // Save server config
  const handleSaveAll = () => {
    const trimmed: WebDAVConfig = {
      url: draftServer.url.trim().replace(/\/$/, ''),
      username: draftServer.username.trim(),
      password: draftServer.password,
    };
    saveWebDAVConfig(trimmed);
    setConfig(trimmed);
    window.dispatchEvent(new Event('webdav-config-saved'));
    setShowSettings(false);
    setStatus({ type: 'idle' });
    setRemoteInfo(null);
  };

  const checkRemote = useCallback(async (cfg: WebDAVConfig) => {
    setStatus({ type: 'loading', message: '正在检查远程文件…' });
    try {
      const data = await fetchRemoteData(cfg);
      if (data) {
        setRemoteInfo({ syncedAt: data.syncedAt });
        setStatus({ type: 'success', message: '远程文件存在', time: data.syncedAt ? formatTime(data.syncedAt) : '' });
      } else {
        setStatus({ type: 'idle' });
        setRemoteInfo(null);
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || '连接失败' });
    }
  }, []);

  const handleUpload = async () => {
    if (onTriggerUpload) {
      await onTriggerUpload();
    }
  };

  const handleDownload = async () => {
    if (onTriggerDownload) {
      const { needsReload } = await onTriggerDownload();
      if (needsReload) {
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  const handleSync = async () => {
    if (onTriggerSync) {
      setSyncConflicts(null);
      setPendingMergedData(null);
      const res = await onTriggerSync();
      if (res.needsConfirm) {
        setSyncConflicts(res.conflicts || []);
        setPendingMergedData(res.mergedData);
      } else if (res.needsReload) {
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  const finalizeSync = async () => {
    if (!pendingMergedData || !onFinalizeSync) return;
    try {
      await onFinalizeSync(pendingMergedData);
      setSyncConflicts(null);
      setPendingMergedData(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      // Error is handled by the hook and set in status
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md shadow-2xl overflow-hidden bg-paper border-t-4 border-brand"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5">
          <div className="flex items-center gap-3">
            <Cloud size={16} className="text-brand" />
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-ink-header font-sans">
              WebDAV 备份
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {isConfigured && (
              <button
                onClick={() => {
                  setDraftServer(config);
                  setShowSettings(v => !v);
                }}
                className={`transition-colors ${showSettings ? 'text-brand' : 'text-ink-muted hover:text-ink-header'}`}
                title="设置"
              >
                <Settings size={16} />
              </button>
            )}
            <button onClick={onClose} className="text-ink-muted hover:text-ink-header transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Settings Panel ── */}
        {showSettings && (
          <div className="px-8 pb-6 space-y-5 border-b border-border-subtle">
            <p className="text-[10px] uppercase tracking-widest text-ink-muted font-sans font-bold">
              服务器配置
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-brand font-sans font-bold block mb-1.5">
                  服务器地址
                </label>
                <input
                  type="text"
                  value={draftServer.url}
                  onChange={e => setDraftServer(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://dav.example.com/dav"
                  className="w-full bg-transparent border-b-2 border-border-subtle py-2 focus:border-brand outline-none text-sm font-sans text-ink-header placeholder:text-ink-muted/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-brand font-sans font-bold block mb-1.5">
                  用户名
                </label>
                <input
                  type="text"
                  value={draftServer.username}
                  onChange={e => setDraftServer(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="username"
                  className="w-full bg-transparent border-b-2 border-border-subtle py-2 focus:border-brand outline-none text-sm font-sans text-ink-header placeholder:text-ink-muted/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-brand font-sans font-bold block mb-1.5">
                  密码
                </label>
                <input
                  type="password"
                  value={draftServer.password}
                  onChange={e => setDraftServer(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b-2 border-border-subtle py-2 focus:border-brand outline-none text-sm font-sans text-ink-header placeholder:text-ink-muted/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-1 font-sans">
              {isConfigured && (
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[10px] uppercase tracking-widest font-bold text-ink-muted hover:text-ink-header transition-colors"
                >
                  取消
                </button>
              )}
              <button
                onClick={handleSaveAll}
                className="text-[10px] uppercase tracking-widest font-bold px-6 py-2 bg-ink-header text-white hover:bg-brand transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* ── Sync Actions ── */}
        {isConfigured && !showSettings && (
          <div className="px-8 pb-8 space-y-5">
            <div className="flex items-start gap-2 p-3 bg-brand/5">
              <Cloud size={13} className="text-ink-muted mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-ink-muted font-sans font-bold mb-0.5">
                  备份服务器
                </p>
                <p className="text-xs text-ink-header font-sans truncate" title={config.url}>
                  {config.url}
                </p>
                <p className="text-[10px] text-ink-muted font-sans mt-0.5">
                  文件路径：{WEBDAV_REMOTE_PATH}
                </p>
              </div>
            </div>

            {/* Manual op status */}
            {status.type !== 'idle' && (
              <div className={`flex items-center gap-2 px-3 py-2 bg-brand/5 border-l-2 ${status.type === 'success' ? 'border-[#2D7A5B]' :
                status.type === 'error' ? 'border-brand' : 'border-brand'
                }`}>
                {status.type === 'loading' && <Loader size={12} className="animate-spin text-brand flex-shrink-0" />}
                {status.type === 'success' && <CheckCircle size={12} className="text-[#2D7A5B] flex-shrink-0" />}
                {status.type === 'error' && <AlertCircle size={12} className="text-brand flex-shrink-0" />}
                <div>
                  <p className="text-[10px] font-sans font-bold text-ink-muted uppercase tracking-widest">操作状态</p>
                  <p className="text-[11px] font-sans text-ink-header">{status.message}</p>
                  {status.type === 'success' && status.time && (
                    <p className="text-[10px] font-sans text-ink-muted">{status.time}</p>
                  )}
                  {status.type === 'success' && remoteInfo?.syncedAt && (
                    <p className="text-[10px] font-sans text-ink-muted">远程：{formatTime(remoteInfo.syncedAt)}</p>
                  )}
                </div>
              </div>
            )}
            {status.type === 'idle' && (
              <div className="flex items-center gap-2 text-ink-muted">
                <div className="w-2 h-2 rounded-full bg-border-subtle flex-shrink-0" />
                <span className="text-xs font-sans">就绪。点击下方按钮手动上传或下载数据。</span>
              </div>
            )}

            <div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleUpload}
                  disabled={status.type === 'loading'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-ink-header text-white text-[11px] uppercase tracking-widest font-bold font-sans hover:bg-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload size={13} />
                  上传到云端
                </button>
                <button
                  onClick={handleDownload}
                  disabled={status.type === 'loading'}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-ink-header text-ink-header text-[11px] uppercase tracking-widest font-bold font-sans hover:border-brand hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={13} />
                  从云端下载
                </button>
              </div>

              <button
                onClick={handleSync}
                disabled={status.type === 'loading'}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white text-[11px] uppercase tracking-widest font-bold font-sans hover:bg-ink-header transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowUpDown size={13} />
                双向同步
              </button>


            </div>

            <p className="text-[10px] font-sans text-ink-muted/50 leading-relaxed">
              上传/下载会直接覆盖；双向同步会合并本地未保存修改，冲突时需手动确认。
              <button
                onClick={() => checkRemote(config)}
                disabled={status.type === 'loading'}
                className="inline-block text-center text-[10px] uppercase tracking-widest font-sans text-ink-muted hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                检查远程文件状态
              </button>
            </p>
          </div>
        )}

        {!isConfigured && !showSettings && (
          <div className="px-8 pb-8 text-center">
            <p className="text-sm font-sans text-ink-muted mb-4">尚未配置 WebDAV 服务器</p>
            <button
              onClick={() => setShowSettings(true)}
              className="text-[10px] uppercase tracking-widest font-bold px-6 py-2 bg-ink-header text-white hover:bg-brand transition-colors"
            >
              立即配置
            </button>
          </div>
        )}

        {/* ── Conflict Confirmation Overlay ── */}
        {syncConflicts && syncConflicts.length > 0 && (
          <div className="absolute inset-0 bg-paper z-[210] flex flex-col">
            <div className="p-8 pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-brand" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-header font-sans">
                  发现合并冲突 ({syncConflicts.length})
                </h4>
              </div>
              <p className="text-xs text-ink-muted font-sans">
                以下内容在本地和远端均有修改，程序已尝试自动合并，请确认是否继续。
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {syncConflicts.map((c, i) => (
                <div key={i} className="p-3 bg-brand/5 border border-border-subtle space-y-2">
                  <p className="text-[10px] font-bold uppercase text-brand font-sans">
                    {c.type === 'partition' ? '分卷冲突' : '备注冲突'} - {c.bookId} / {c.key}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-tighter text-ink-muted font-bold">本地</p>
                      <p className="text-[11px] text-ink-header line-clamp-3">{c.local}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-tighter text-ink-muted font-bold">远端</p>
                      <p className="text-[11px] text-ink-header line-clamp-3">{c.remote}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 pt-4 border-t border-border-subtle grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSyncConflicts(null);
                  setPendingMergedData(null);
                  setStatus({ type: 'idle' });
                }}
                className="py-3 border-2 border-ink-header text-ink-header text-[11px] uppercase tracking-widest font-bold font-sans hover:border-brand hover:text-brand transition-colors"
              >
                取消同步
              </button>
              <button
                onClick={finalizeSync}
                className="py-3 bg-ink-header text-white text-[11px] uppercase tracking-widest font-bold font-sans hover:bg-brand transition-colors"
              >
                确认并同步
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
