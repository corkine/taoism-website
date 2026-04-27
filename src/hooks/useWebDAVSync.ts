import { useState, useEffect, useCallback } from 'react';
import {
  WebDAVConfig,
  GlobalSyncStatus,
  loadWebDAVConfig,
  fetchRemoteData,
  pushBackupToRemote,
  touchLocalWriteTime,
  formatTime,
} from '../utils/webdav';
import { restoreBackupData } from '../data/book';

export interface SyncState {
  status: GlobalSyncStatus;
  message: string;
  lastSyncTime: string | null;
}

export interface UseWebDAVSyncReturn {
  syncState: SyncState;
  webdavConfig: WebDAVConfig | null;
  triggerUpload: () => Promise<void>;
  triggerDownload: () => Promise<{ needsReload: boolean }>;
}

export function useWebDAVSync(): UseWebDAVSyncReturn {
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig | null>(loadWebDAVConfig);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: '',
    lastSyncTime: null,
  });

  const setStatus = useCallback(
    (status: GlobalSyncStatus, message = '', time?: string) => {
      setSyncState({ status, message, lastSyncTime: time ?? null });
    },
    []
  );

  // ── Public: upload ────────────────────────────────────────────────────────
  const triggerUpload = useCallback(async () => {
    const cfg = loadWebDAVConfig();
    if (!cfg?.url) return;
    setStatus('syncing', '正在上传数据…');
    try {
      const syncedAt = await pushBackupToRemote(cfg);
      touchLocalWriteTime();
      setStatus('success', '上传成功', formatTime(syncedAt));
    } catch (e: any) {
      setStatus('error', e.message || '上传失败');
    }
  }, [setStatus]);

  // ── Public: download ──────────────────────────────────────────────────────
  const triggerDownload = useCallback(async (): Promise<{ needsReload: boolean }> => {
    const cfg = loadWebDAVConfig();
    if (!cfg?.url) return { needsReload: false };
    setStatus('syncing', '正在下载数据…');
    try {
      const data = await fetchRemoteData(cfg);
      if (!data) {
        setStatus('error', '远程尚无备份文件，请先上传');
        return { needsReload: false };
      }
      restoreBackupData(data);
      touchLocalWriteTime();
      const t = data.syncedAt ? formatTime(data.syncedAt) : '';
      setStatus('success', '下载并恢复成功', t);
      return { needsReload: true };
    } catch (e: any) {
      setStatus('error', e.message || '下载失败');
      return { needsReload: false };
    }
  }, [setStatus]);

  // Keep webdavConfig in sync when user saves new config in the modal
  useEffect(() => {
    const handler = () => setWebdavConfig(loadWebDAVConfig());
    window.addEventListener('webdav-config-saved', handler);
    return () => window.removeEventListener('webdav-config-saved', handler);
  }, []);

  return {
    syncState,
    webdavConfig,
    triggerUpload,
    triggerDownload,
  };
}
