import React, { useState, useEffect, useCallback } from 'react';
import { X, Cloud, Upload, Download, CheckCircle, AlertCircle, Loader, Settings } from 'lucide-react';
import {
  WebDAVConfig,
  GlobalSyncStatus,
  WEBDAV_CONFIG_KEY,
  WEBDAV_REMOTE_PATH,
  formatTime,
  fetchRemoteData,
  pushBackupToRemote,
  loadWebDAVConfig,
} from '../utils/webdav';
import { restoreBackupData } from '../data/book';

type ModalSyncStatus =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string; time: string }
  | { type: 'error'; message: string };

interface WebDAVSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (time: string) => void;
  onDownloadSuccess?: () => void;
  globalSyncStatus?: GlobalSyncStatus;
  globalSyncMessage?: string;
  globalLastSyncTime?: string | null;
}

export function WebDAVSyncModal({
  isOpen,
  onClose,
  onUploadSuccess,
  onDownloadSuccess,
  globalSyncStatus,
  globalSyncMessage,
  globalLastSyncTime,
}: WebDAVSyncModalProps) {
  const [config, setConfig] = useState<WebDAVConfig>({ url: '', username: '', password: '' });
  const [status, setStatus] = useState<ModalSyncStatus>({ type: 'idle' });
  const [remoteInfo, setRemoteInfo] = useState<{ syncedAt?: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
    setConfig(trimmed);
    localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(trimmed));
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
    setStatus({ type: 'loading', message: '正在上传数据…' });
    try {
      const syncedAt = await pushBackupToRemote(config);
      const t = formatTime(syncedAt);
      setStatus({ type: 'success', message: '上传成功', time: t });
      setRemoteInfo({ syncedAt });
      onUploadSuccess?.(t);
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || '上传失败' });
    }
  };

  const handleDownload = async () => {
    setStatus({ type: 'loading', message: '正在下载数据…' });
    try {
      const data = await fetchRemoteData(config);
      if (!data) {
        setStatus({ type: 'error', message: '远程尚无备份文件，请先上传' });
        return;
      }
      restoreBackupData(data);
      const t = data.syncedAt ? formatTime(data.syncedAt) : '';
      setStatus({ type: 'success', message: '下载并恢复成功，即将刷新页面…', time: t });
      setRemoteInfo({ syncedAt: data.syncedAt });
      onDownloadSuccess?.();
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || '下载失败' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md shadow-2xl overflow-hidden"
        style={{ background: '#FDFBF7', borderTop: '4px solid #A63A2B' }}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5">
          <div className="flex items-center gap-3">
            <Cloud size={16} className="text-[#A63A2B]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[#1A1A1A] font-sans">
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
                className={`transition-colors ${showSettings ? 'text-[#A63A2B]' : 'text-[#8C8471] hover:text-[#1A1A1A]'}`}
                title="设置"
              >
                <Settings size={16} />
              </button>
            )}
            <button onClick={onClose} className="text-[#8C8471] hover:text-[#1A1A1A] transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Settings Panel ── */}
        {showSettings && (
          <div className="px-8 pb-6 space-y-5 border-b border-[#E2DED0]">
            <p className="text-[10px] uppercase tracking-widest text-[#8C8471] font-sans font-bold">
              服务器配置
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1.5">
                  服务器地址
                </label>
                <input
                  type="text"
                  value={draftServer.url}
                  onChange={e => setDraftServer(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://dav.example.com/dav"
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1.5">
                  用户名
                </label>
                <input
                  type="text"
                  value={draftServer.username}
                  onChange={e => setDraftServer(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="username"
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1.5">
                  密码
                </label>
                <input
                  type="password"
                  value={draftServer.password}
                  onChange={e => setDraftServer(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-1 font-sans">
              {isConfigured && (
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[10px] uppercase tracking-widest font-bold text-[#8C8471] hover:text-[#1A1A1A] transition-colors"
                >
                  取消
                </button>
              )}
              <button
                onClick={handleSaveAll}
                className="text-[10px] uppercase tracking-widest font-bold px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#A63A2B] transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* ── Sync Actions ── */}
        {isConfigured && !showSettings && (
          <div className="px-8 pb-8 space-y-5">
            <div className="flex items-start gap-2 p-3 bg-[#F5F2EB]">
              <Cloud size={13} className="text-[#8C8471] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-[#8C8471] font-sans font-bold mb-0.5">
                  备份服务器
                </p>
                <p className="text-xs text-[#1A1A1A] font-sans truncate" title={config.url}>
                  {config.url}
                </p>
                <p className="text-[10px] text-[#8C8471] font-sans mt-0.5">
                  文件路径：{WEBDAV_REMOTE_PATH}
                </p>
              </div>
            </div>

            {/* Manual op status */}
            {status.type !== 'idle' && (
              <div className={`flex items-center gap-2 px-3 py-2 bg-[#F5F2EB] border-l-2 ${status.type === 'success' ? 'border-[#2D7A5B]' :
                status.type === 'error' ? 'border-[#A63A2B]' : 'border-[#A63A2B]'
                }`}>
                {status.type === 'loading' && <Loader size={12} className="animate-spin text-[#A63A2B] flex-shrink-0" />}
                {status.type === 'success' && <CheckCircle size={12} className="text-[#2D7A5B] flex-shrink-0" />}
                {status.type === 'error' && <AlertCircle size={12} className="text-[#A63A2B] flex-shrink-0" />}
                <div>
                  <p className="text-[10px] font-sans font-bold text-[#8C8471] uppercase tracking-widest">操作状态</p>
                  <p className="text-[11px] font-sans text-[#1A1A1A]">{status.message}</p>
                  {status.type === 'success' && status.time && (
                    <p className="text-[10px] font-sans text-[#8C8471]">{status.time}</p>
                  )}
                  {status.type === 'success' && remoteInfo?.syncedAt && (
                    <p className="text-[10px] font-sans text-[#8C8471]">远程：{formatTime(remoteInfo.syncedAt)}</p>
                  )}
                </div>
              </div>
            )}
            {status.type === 'idle' && (
              <div className="flex items-center gap-2 text-[#8C8471]">
                <div className="w-2 h-2 rounded-full bg-[#C8C4B7] flex-shrink-0" />
                <span className="text-xs font-sans">就绪。点击下方按钮手动上传或下载数据。</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleUpload}
                disabled={status.type === 'loading'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest font-bold font-sans hover:bg-[#A63A2B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={13} />
                上传到云端
              </button>
              <button
                onClick={handleDownload}
                disabled={status.type === 'loading'}
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#1A1A1A] text-[#1A1A1A] text-[11px] uppercase tracking-widest font-bold font-sans hover:border-[#A63A2B] hover:text-[#A63A2B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={13} />
                从云端下载
              </button>
            </div>

            <button
              onClick={() => checkRemote(config)}
              disabled={status.type === 'loading'}
              className="w-full text-center text-[10px] uppercase tracking-widest font-bold font-sans text-[#8C8471] hover:text-[#A63A2B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              检查远程文件状态
            </button>

            <p className="text-[10px] font-sans text-[#C8C4B7] leading-relaxed">
              手动上传会覆盖云端数据；手动下载会覆盖本地数据并刷新页面。
            </p>
          </div>
        )}

        {!isConfigured && !showSettings && (
          <div className="px-8 pb-8 text-center">
            <p className="text-sm font-sans text-[#8C8471] mb-4">尚未配置 WebDAV 服务器</p>
            <button
              onClick={() => setShowSettings(true)}
              className="text-[10px] uppercase tracking-widest font-bold px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#A63A2B] transition-colors"
            >
              立即配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
