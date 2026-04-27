import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WebDAVConfig,
  WebDAVSyncConfig,
  GlobalSyncStatus,
  loadWebDAVConfig,
  loadSyncConfig,
  fetchRemoteData,
  pushBackupToRemote,
  restoreBackupData,
  getLocalWriteTime,
  touchLocalWriteTime,
  formatTime,
  WEBDAV_SYNC_CONFIG_KEY,
} from '../utils/webdav';

export interface SyncState {
  status: GlobalSyncStatus;
  message: string;
  lastSyncTime: string | null;
}

export interface UseWebDAVSyncReturn {
  syncState: SyncState;
  webdavConfig: WebDAVConfig | null;
  syncConfig: WebDAVSyncConfig;
  saveSyncConfig: (cfg: WebDAVSyncConfig) => void;
  triggerUpload: () => Promise<void>;
  triggerDownload: () => Promise<{ needsReload: boolean }>;
  notifyLocalChange: () => void;
}

export function useWebDAVSync(): UseWebDAVSyncReturn {
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig | null>(loadWebDAVConfig);
  const [syncConfig, setSyncConfig] = useState<WebDAVSyncConfig>(loadSyncConfig);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: '',
    lastSyncTime: null,
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents auto-pull from running more than once on mount
  const hasPulledOnLoad = useRef(false);

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

  // ── Auto pull on load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (hasPulledOnLoad.current) return;
    hasPulledOnLoad.current = true;

    const cfg = loadWebDAVConfig();
    const scfg = loadSyncConfig();
    setWebdavConfig(cfg);
    setSyncConfig(scfg);

    if (!cfg?.url || !scfg.autoSyncOnLoad) return;

    (async () => {
      setStatus('syncing', '正在检查远程数据…');
      try {
        const remote = await fetchRemoteData(cfg);
        if (!remote) {
          setStatus('idle');
          return;
        }
        const localWrite = getLocalWriteTime();
        const remoteTime = remote.syncedAt as string | undefined;

        const remoteIsNewer =
          remoteTime && (!localWrite || new Date(remoteTime) > new Date(localWrite));

        if (remoteIsNewer) {
          setStatus('syncing', '远程数据较新，正在同步…');
          restoreBackupData(remote);
          touchLocalWriteTime();
          setStatus('success', '已自动同步远程数据', formatTime(remoteTime!));
          // Notify page to reload state from localStorage
          window.dispatchEvent(new Event('webdav-data-restored'));
        } else {
          setStatus('idle');
        }
      } catch (e: any) {
        // Non-blocking: just show the error badge, don't interrupt the user
        setStatus('error', e.message || '自动同步失败');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced auto push on local change ───────────────────────────────────
  const notifyLocalChange = useCallback(() => {
    // Re-read config fresh each time so we pick up changes saved after mount
    const cfg = loadWebDAVConfig();
    const scfg = loadSyncConfig();
    if (!cfg?.url || !scfg.autoSyncOnChange) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setStatus('syncing', '正在自动上传…');
      try {
        const syncedAt = await pushBackupToRemote(cfg);
        touchLocalWriteTime();
        setStatus('success', '自动上传成功', formatTime(syncedAt));
      } catch (e: any) {
        setStatus('error', e.message || '自动上传失败');
      }
    }, scfg.debounceMs);
  }, [setStatus]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ── Save sync config ──────────────────────────────────────────────────────
  const saveSyncConfig = useCallback((cfg: WebDAVSyncConfig) => {
    localStorage.setItem(WEBDAV_SYNC_CONFIG_KEY, JSON.stringify(cfg));
    setSyncConfig(cfg);
  }, []);

  // Keep webdavConfig in sync when user saves new config in the modal
  // The modal dispatches a custom event so we can react without prop drilling
  useEffect(() => {
    const handler = () => setWebdavConfig(loadWebDAVConfig());
    window.addEventListener('webdav-config-saved', handler);
    return () => window.removeEventListener('webdav-config-saved', handler);
  }, []);

  return {
    syncState,
    webdavConfig,
    syncConfig,
    saveSyncConfig,
    triggerUpload,
    triggerDownload,
    notifyLocalChange,
  };
}
