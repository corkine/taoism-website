/**
 * useWebDAVSync.ts
 *
 * Thin compatibility wrapper over the zustand store.  All WebDAV sync logic
 * now lives in `src/store/useAppStore.ts` so that UI components can both
 * trigger operations and react to the resulting state changes without
 * needing a page reload.
 */

import { useAppStore } from '../store/useAppStore';
import { SyncState, WebDAVConfig } from '../types';

export interface UseWebDAVSyncReturn {
  syncState: SyncState;
  webdavConfig: WebDAVConfig | null;
  triggerUpload: () => Promise<void>;
  triggerDownload: () => Promise<{ needsReload: boolean }>;
  triggerSync: () => Promise<{ needsConfirm: boolean; conflicts?: any[]; mergedData?: any; needsReload?: boolean }>;
  finalizeSync: (mergedData: any) => Promise<void>;
}

export function useWebDAVSync(): UseWebDAVSyncReturn {
  const syncState = useAppStore(s => s.syncState);
  const webdavConfig = useAppStore(s => s.webdavConfig);
  const triggerUpload = useAppStore(s => s.triggerUpload);
  const triggerDownload = useAppStore(s => s.triggerDownload);
  const triggerSync = useAppStore(s => s.triggerSync);
  const finalizeSync = useAppStore(s => s.finalizeSync);

  return {
    syncState,
    webdavConfig,
    triggerUpload,
    triggerDownload,
    triggerSync,
    finalizeSync,
  };
}
