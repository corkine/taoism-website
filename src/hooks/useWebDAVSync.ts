import { useState, useEffect, useCallback } from 'react';
import {
  fetchRemoteData,
  pushBackupToRemote,
} from '../utils/webdav';
import { formatTime } from '../utils/time';
import { loadWebDAVConfig, restoreBackupData, clearDirty, touchLocalWriteTime, buildBackupData, mergeBackupData, isDirty, getRemoteSyncTime, saveRemoteSyncTime } from '../utils/storage';

import { GlobalSyncStatus, SyncState, WebDAVConfig } from '../types';

export interface UseWebDAVSyncReturn {
  syncState: SyncState;
  webdavConfig: WebDAVConfig | null;
  triggerUpload: () => Promise<void>;
  triggerDownload: () => Promise<{ needsReload: boolean }>;
  triggerSync: () => Promise<{ needsConfirm: boolean; conflicts?: any[]; mergedData?: any; needsReload?: boolean }>;
  finalizeSync: (mergedData: any) => Promise<void>;
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
      saveRemoteSyncTime(syncedAt);
      touchLocalWriteTime();
      clearDirty(); // Data is now safe on remote
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
      let data = await fetchRemoteData(cfg);
      if (!data) {
        setStatus('error', '远程尚无备份文件，请先上传');
        return { needsReload: false };
      }
      restoreBackupData(data);
      saveRemoteSyncTime(data.syncedAt);
      touchLocalWriteTime();
      clearDirty(); // Local data is now consistent with remote
      const t = data.syncedAt ? formatTime(data.syncedAt) : '';
      setStatus('success', '下载并恢复成功', t);
      return { needsReload: true };
    } catch (e: any) {
      setStatus('error', e.message || '下载失败');
      return { needsReload: false };
    }
  }, [setStatus]);

  // ── Public: sync ──────────────────────────────────────────────────────────
  const triggerSync = useCallback(async (): Promise<{ needsConfirm: boolean; conflicts?: any[]; mergedData?: any; needsReload?: boolean }> => {
    const cfg = loadWebDAVConfig();
    if (!cfg?.url) return { needsConfirm: false };

    if (!isDirty()) {
      // If not dirty, someone may change in remote, just download and update
      const res = await triggerDownload();
      return { needsConfirm: false, needsReload: res.needsReload };
    }

    // If dirty, we need to merge local and remote
    setStatus('syncing', '正在获取远程数据并准备合并…');
    try {
      const remoteData = await fetchRemoteData(cfg);
      if (!remoteData) {
        // No remote data, just upload local
        await triggerUpload();
        return { needsConfirm: false };
      }

      // Check if remote has changed since our last sync
      const lastRemoteTime = getRemoteSyncTime();
      const currentRemoteTime = remoteData.syncedAt;

      if (lastRemoteTime && currentRemoteTime && currentRemoteTime <= lastRemoteTime) {
        // Remote hasn't changed, we can safely overwrite it with our local changes
        await triggerUpload();
        return { needsConfirm: false };
      }

      const localData = buildBackupData();
      const { mergedData, conflicts } = mergeBackupData(localData, remoteData);

      if (conflicts.length > 0) {
        setStatus('idle', '发现合并冲突，请确认');
        return { needsConfirm: true, conflicts, mergedData };
      }

      // No conflicts, proceed with sync
      setStatus('syncing', '正在同步合并后的数据…');
      await pushBackupToRemote(cfg, mergedData);
      restoreBackupData(mergedData);
      touchLocalWriteTime();
      clearDirty();
      setStatus('success', '同步成功', formatTime(mergedData.syncedAt));
      return { needsConfirm: false, needsReload: true };
    } catch (e: any) {
      setStatus('error', e.message || '同步失败');
      return { needsConfirm: false };
    }
  }, [setStatus, triggerDownload, triggerUpload]);

  // ── Public: finalize ──────────────────────────────────────────────────────
  const finalizeSync = useCallback(async (mergedData: any) => {
    const cfg = loadWebDAVConfig();
    if (!cfg?.url || !mergedData) return;

    setStatus('syncing', '正在应用合并结果…');
    try {
      await pushBackupToRemote(cfg, mergedData);
      restoreBackupData(mergedData);
      saveRemoteSyncTime(mergedData.syncedAt);
      touchLocalWriteTime();
      clearDirty();
      setStatus('success', '同步成功', formatTime(mergedData.syncedAt));
    } catch (e: any) {
      setStatus('error', e.message || '同步失败');
      throw e;
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
    triggerSync,
    finalizeSync,
  };
}
