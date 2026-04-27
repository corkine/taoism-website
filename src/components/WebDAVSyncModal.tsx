import React, { useState, useEffect, useCallback } from 'react';
import { X, Cloud, Upload, Download, CheckCircle, AlertCircle, Loader, Settings } from 'lucide-react';
import { BOOKS, PARTITIONS_KEY, INTERPRETATION_KEY } from '../data/book';

const WEBDAV_CONFIG_KEY = 'webdav_config';
const WEBDAV_REMOTE_PATH = '/daoism_sync.json';

interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

type SyncStatus =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string; time: string }
  | { type: 'error'; message: string };

function getAuthHeader(username: string, password: string) {
  return 'Basic ' + btoa(`${username}:${password}`);
}

function buildBackupData() {
  const booksData: Record<string, any> = {};
  for (const book of BOOKS) {
    booksData[book.id] = {
      partitions: JSON.parse(localStorage.getItem(`${book.id}_${PARTITIONS_KEY}`) || 'null'),
      interpretations: JSON.parse(localStorage.getItem(`${book.id}_${INTERPRETATION_KEY}`) || 'null'),
    };
  }
  return {
    version: 2,
    type: 'daoism_backup',
    syncedAt: new Date().toISOString(),
    books: booksData,
  };
}

function restoreBackupData(data: any) {
  if (data.type !== 'daoism_backup' || !data.books) {
    throw new Error('无法识别的备份文件格式');
  }
  for (const bookId of Object.keys(data.books)) {
    if (data.books[bookId].partitions) {
      localStorage.setItem(`${bookId}_${PARTITIONS_KEY}`, JSON.stringify(data.books[bookId].partitions));
    }
    if (data.books[bookId].interpretations) {
      localStorage.setItem(`${bookId}_${INTERPRETATION_KEY}`, JSON.stringify(data.books[bookId].interpretations));
    }
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface WebDAVSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebDAVSyncModal({ isOpen, onClose }: WebDAVSyncModalProps) {
  const [config, setConfig] = useState<WebDAVConfig>({ url: '', username: '', password: '' });
  const [status, setStatus] = useState<SyncStatus>({ type: 'idle' });
  const [remoteInfo, setRemoteInfo] = useState<{ syncedAt?: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<WebDAVConfig>({ url: '', username: '', password: '' });

  // Load saved config
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem(WEBDAV_CONFIG_KEY) || 'null');
        if (saved) {
          setConfig(saved);
          setDraft(saved);
          setShowSettings(false);
        } else {
          setShowSettings(true);
        }
      } catch {
        setShowSettings(true);
      }
      setStatus({ type: 'idle' });
      setRemoteInfo(null);
    }
  }, [isOpen]);

  const isConfigured = config.url.trim() !== '';

  const handleSaveConfig = () => {
    const trimmed: WebDAVConfig = {
      url: draft.url.trim().replace(/\/$/, ''),
      username: draft.username.trim(),
      password: draft.password,
    };
    setConfig(trimmed);
    localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(trimmed));
    setShowSettings(false);
    setStatus({ type: 'idle' });
    setRemoteInfo(null);
  };

  const checkRemote = useCallback(async (cfg: WebDAVConfig) => {
    setStatus({ type: 'loading', message: '正在检查远程文件…' });
    try {
      const res = await fetch(cfg.url + WEBDAV_REMOTE_PATH, {
        method: 'HEAD',
        headers: { Authorization: getAuthHeader(cfg.username, cfg.password) },
      });
      if (res.ok) {
        // Try to fetch metadata
        const getRes = await fetch(cfg.url + WEBDAV_REMOTE_PATH, {
          method: 'GET',
          headers: { Authorization: getAuthHeader(cfg.username, cfg.password) },
        });
        if (getRes.ok) {
          const data = await getRes.json();
          setRemoteInfo({ syncedAt: data.syncedAt });
          setStatus({ type: 'success', message: '远程文件存在', time: data.syncedAt ? formatTime(data.syncedAt) : '' });
        } else {
          setStatus({ type: 'success', message: '远程文件存在（无法读取元数据）', time: '' });
        }
      } else if (res.status === 401) {
        setStatus({ type: 'error', message: '认证失败，请检查用户名和密码' });
      } else if (res.status === 404) {
        setStatus({ type: 'idle' });
        setRemoteInfo(null);
      } else {
        setStatus({ type: 'error', message: `服务器返回 ${res.status}` });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: `连接失败：${e.message || '未知错误'}` });
    }
  }, []);

  const handleUpload = async () => {
    setStatus({ type: 'loading', message: '正在上传数据…' });
    try {
      const data = buildBackupData();
      const body = JSON.stringify(data, null, 2);
      const res = await fetch(config.url + WEBDAV_REMOTE_PATH, {
        method: 'PUT',
        headers: {
          Authorization: getAuthHeader(config.username, config.password),
          'Content-Type': 'application/json',
        },
        body,
      });
      if (res.ok || res.status === 201 || res.status === 204) {
        const t = formatTime(data.syncedAt);
        setStatus({ type: 'success', message: '上传成功', time: t });
        setRemoteInfo({ syncedAt: data.syncedAt });
      } else if (res.status === 401) {
        setStatus({ type: 'error', message: '认证失败，请检查用户名和密码' });
      } else {
        setStatus({ type: 'error', message: `上传失败：服务器返回 ${res.status}` });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: `上传失败：${e.message || '未知错误'}` });
    }
  };

  const handleDownload = async () => {
    setStatus({ type: 'loading', message: '正在下载数据…' });
    try {
      const res = await fetch(config.url + WEBDAV_REMOTE_PATH, {
        method: 'GET',
        headers: { Authorization: getAuthHeader(config.username, config.password) },
      });
      if (res.ok) {
        const data = await res.json();
        restoreBackupData(data);
        const t = data.syncedAt ? formatTime(data.syncedAt) : '';
        setStatus({ type: 'success', message: '下载并恢复成功，即将刷新页面…', time: t });
        setRemoteInfo({ syncedAt: data.syncedAt });
        setTimeout(() => window.location.reload(), 1500);
      } else if (res.status === 401) {
        setStatus({ type: 'error', message: '认证失败，请检查用户名和密码' });
      } else if (res.status === 404) {
        setStatus({ type: 'error', message: '远程尚无备份文件，请先上传' });
      } else {
        setStatus({ type: 'error', message: `下载失败：服务器返回 ${res.status}` });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: `下载失败：${e.message || '未知错误'}` });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md shadow-2xl"
        style={{ background: '#FDFBF7', borderTop: '4px solid #A63A2B' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5">
          <div className="flex items-center gap-3">
            <Cloud size={16} className="text-[#A63A2B]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[#1A1A1A] font-sans">
              WebDAV 同步
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {isConfigured && (
              <button
                onClick={() => { setDraft(config); setShowSettings(v => !v); }}
                className={`transition-colors ${showSettings ? 'text-[#A63A2B]' : 'text-[#8C8471] hover:text-[#1A1A1A]'}`}
                title="配置"
              >
                <Settings size={16} />
              </button>
            )}
            <button onClick={onClose} className="text-[#8C8471] hover:text-[#1A1A1A] transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Settings Form */}
        {showSettings && (
          <div className="px-8 pb-6 space-y-4 border-b border-[#E2DED0]">
            <p className="text-[10px] uppercase tracking-widest text-[#8C8471] font-sans font-bold mb-3">
              服务器配置
            </p>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1.5">
                服务器地址
              </label>
              <input
                type="text"
                value={draft.url}
                onChange={e => setDraft(prev => ({ ...prev, url: e.target.value }))}
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
                value={draft.username}
                onChange={e => setDraft(prev => ({ ...prev, username: e.target.value }))}
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
                value={draft.password}
                onChange={e => setDraft(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
              />
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
                onClick={handleSaveConfig}
                className="text-[10px] uppercase tracking-widest font-bold px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#A63A2B] transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* Sync Actions */}
        {isConfigured && !showSettings && (
          <div className="px-8 pb-8 space-y-6">
            {/* Server info */}
            <div className="flex items-start gap-2 p-3 bg-[#F5F2EB]">
              <Cloud size={13} className="text-[#8C8471] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-[#8C8471] font-sans font-bold mb-0.5">
                  同步服务器
                </p>
                <p className="text-xs text-[#1A1A1A] font-sans truncate" title={config.url}>
                  {config.url}
                </p>
                <p className="text-[10px] text-[#8C8471] font-sans mt-0.5">
                  文件路径：{WEBDAV_REMOTE_PATH}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="min-h-[40px]">
              {status.type === 'idle' && (
                <div className="flex items-center gap-2 text-[#8C8471]">
                  <div className="w-2 h-2 rounded-full bg-[#C8C4B7]" />
                  <span className="text-xs font-sans">
                    就绪。点击下方按钮手动上传或下载数据。
                  </span>
                </div>
              )}
              {status.type === 'loading' && (
                <div className="flex items-center gap-2 text-[#8C8471]">
                  <Loader size={14} className="animate-spin text-[#A63A2B]" />
                  <span className="text-xs font-sans">{status.message}</span>
                </div>
              )}
              {status.type === 'success' && (
                <div className="flex items-start gap-2 text-[#2D7A5B]">
                  <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-sans font-bold">{status.message}</span>
                    {status.time && (
                      <p className="text-[10px] text-[#8C8471] font-sans mt-0.5">时间：{status.time}</p>
                    )}
                  </div>
                </div>
              )}
              {status.type === 'error' && (
                <div className="flex items-start gap-2 text-[#A63A2B]">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-sans">{status.message}</span>
                </div>
              )}
            </div>

            {/* Remote file info */}
            {remoteInfo?.syncedAt && (
              <div className="text-[10px] font-sans text-[#8C8471] -mt-2">
                远程备份时间：{formatTime(remoteInfo.syncedAt)}
              </div>
            )}

            {/* Action buttons */}
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

            {/* Check remote */}
            <button
              onClick={() => checkRemote(config)}
              disabled={status.type === 'loading'}
              className="w-full text-center text-[10px] uppercase tracking-widest font-bold font-sans text-[#8C8471] hover:text-[#A63A2B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              检查远程文件状态
            </button>

            <p className="text-[10px] font-sans text-[#C8C4B7] leading-relaxed">
              上传会覆盖云端数据；下载会覆盖本地数据并刷新页面。建议操作前先本地导出备份。
            </p>
          </div>
        )}

        {/* Prompt to configure if not configured and settings are closed */}
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
