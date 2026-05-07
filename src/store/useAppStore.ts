/**
 * useAppStore.ts
 *
 * Centralized application state powered by zustand.
 *
 * All mutations are driven through this store so that both local edits and
 * WebDAV restore/sync can update the UI reactively — without needing a page
 * reload to re-read data from localStorage.
 *
 * localStorage is still used as the persistence layer; the store acts as the
 * single in-memory source of truth that mirrors it.
 */

import { create } from 'zustand';
import {
    loadPartitions,
    savePartitions,
    loadInterpretations,
    saveInterpretations,
    loadAISettings,
    saveAISettings,
    loadWebDAVConfig,
    saveWebDAVConfig,
    getDirtySince,
    markDirty as storageMarkDirty,
    clearDirty as storageClearDirty,
    restoreBackupData,
    buildBackupData,
    mergeBackupData,
    touchLocalWriteTime,
    saveRemoteSyncTime,
    getRemoteSyncTime,
    isDirty as isStorageDirty,
} from '../utils/storage';
import { fetchRemoteData, pushBackupToRemote } from '../utils/webdav';
import { formatTime } from '../utils/time';
import { BOOKS } from '../data/book';
import {
    AISettings,
    GlobalSyncStatus,
    MainSection,
    SyncState,
    WebDAVConfig,
} from '../types';

const DEFAULT_AI_SETTINGS: AISettings = {
    endpoint: '',
    apiKey: '',
    model: '',
};

function hydrateBooks() {
    const partitions: Record<string, MainSection[]> = {};
    const interpretations: Record<string, Record<number, string>> = {};
    for (const book of BOOKS) {
        partitions[book.id] = loadPartitions(book.id, book.defaultPartitions);
        interpretations[book.id] = loadInterpretations(book.id);
    }
    return { partitions, interpretations };
}

export interface SyncResult {
    needsConfirm: boolean;
    conflicts?: any[];
    mergedData?: any;
}

interface AppState {
    // ── Book data ────────────────────────────────────────────────────
    partitions: Record<string, MainSection[]>;
    interpretations: Record<string, Record<number, string>>;

    // ── Dirty flag ──────────────────────────────────────────────────
    dirtySince: string | null;

    // ── WebDAV ──────────────────────────────────────────────────────
    webdavConfig: WebDAVConfig | null;
    syncState: SyncState;

    // ── AI ──────────────────────────────────────────────────────────
    aiSettings: AISettings;

    // ── Actions: book data ──────────────────────────────────────────
    setPartitions: (bookId: string, partitions: MainSection[]) => void;
    setInterpretation: (bookId: string, chapterId: number, value: string) => void;

    // ── Actions: dirty ──────────────────────────────────────────────
    markDirty: () => void;
    clearDirty: () => void;

    // ── Actions: WebDAV config ──────────────────────────────────────
    setWebdavConfig: (cfg: WebDAVConfig) => void;

    // ── Actions: AI ─────────────────────────────────────────────────
    setAISettings: (s: AISettings) => void;

    // ── Actions: sync operations ────────────────────────────────────
    setSyncStatus: (status: GlobalSyncStatus, message?: string, time?: string) => void;
    triggerUpload: () => Promise<void>;
    triggerDownload: () => Promise<{ needsReload: boolean }>;
    triggerSync: () => Promise<SyncResult & { needsReload?: boolean }>;
    finalizeSync: (mergedData: any) => Promise<void>;

    // ── Actions: backup apply (reactive hydrate) ────────────────────
    applyBackupData: (data: any) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    ...hydrateBooks(),
    dirtySince: getDirtySince(),
    webdavConfig: loadWebDAVConfig(),
    syncState: { status: 'idle', message: '', lastSyncTime: null },
    aiSettings: loadAISettings(DEFAULT_AI_SETTINGS) as AISettings,

    // ── Book actions ────────────────────────────────────────────────
    setPartitions: (bookId, parts) => {
        savePartitions(bookId, parts);
        const now = new Date().toISOString();
        storageMarkDirty();
        set(state => ({
            partitions: { ...state.partitions, [bookId]: parts },
            dirtySince: now,
        }));
    },

    setInterpretation: (bookId, chapterId, value) => {
        const current = get().interpretations[bookId] || {};
        const next = { ...current, [chapterId]: value };
        saveInterpretations(bookId, next, false); // do not double-mark
        storageMarkDirty();
        const now = new Date().toISOString();
        set(state => ({
            interpretations: { ...state.interpretations, [bookId]: next },
            dirtySince: now,
        }));
    },

    // ── Dirty ───────────────────────────────────────────────────────
    markDirty: () => {
        storageMarkDirty();
        set({ dirtySince: new Date().toISOString() });
    },
    clearDirty: () => {
        storageClearDirty();
        set({ dirtySince: null });
    },

    // ── WebDAV config ───────────────────────────────────────────────
    setWebdavConfig: (cfg) => {
        saveWebDAVConfig(cfg);
        set({ webdavConfig: cfg });
    },

    // ── AI ──────────────────────────────────────────────────────────
    setAISettings: (s) => {
        saveAISettings(s, false);
        storageMarkDirty();
        set({ aiSettings: s, dirtySince: new Date().toISOString() });
    },

    // ── Sync status helper ──────────────────────────────────────────
    setSyncStatus: (status, message = '', time) => {
        set({
            syncState: { status, message, lastSyncTime: time ?? null },
        });
    },

    // ── Upload ──────────────────────────────────────────────────────
    triggerUpload: async () => {
        const cfg = get().webdavConfig ?? loadWebDAVConfig();
        if (!cfg?.url) return;
        get().setSyncStatus('syncing', '正在上传数据…');
        try {
            const syncedAt = await pushBackupToRemote(cfg);
            saveRemoteSyncTime(syncedAt);
            touchLocalWriteTime();
            get().clearDirty();
            get().setSyncStatus('success', '上传成功', formatTime(syncedAt));
        } catch (e: any) {
            get().setSyncStatus('error', e.message || '上传失败');
        }
    },

    // ── Download ────────────────────────────────────────────────────
    triggerDownload: async () => {
        const cfg = get().webdavConfig ?? loadWebDAVConfig();
        if (!cfg?.url) return { needsReload: false };
        get().setSyncStatus('syncing', '正在下载数据…');
        try {
            const data = await fetchRemoteData(cfg);
            if (!data) {
                get().setSyncStatus('error', '远程尚无备份文件，请先上传');
                return { needsReload: false };
            }
            get().applyBackupData(data);
            saveRemoteSyncTime(data.syncedAt);
            touchLocalWriteTime();
            get().clearDirty();
            const t = data.syncedAt ? formatTime(data.syncedAt) : '';
            get().setSyncStatus('success', '下载并恢复成功', t);
            // needsReload kept for backwards-compat with callers but no longer true
            return { needsReload: false };
        } catch (e: any) {
            get().setSyncStatus('error', e.message || '下载失败');
            return { needsReload: false };
        }
    },

    // ── Sync (two-way) ──────────────────────────────────────────────
    triggerSync: async () => {
        const cfg = get().webdavConfig ?? loadWebDAVConfig();
        if (!cfg?.url) return { needsConfirm: false };

        if (!isStorageDirty()) {
            // If not dirty, remote may have changed — simply pull
            const res = await get().triggerDownload();
            return { needsConfirm: false, needsReload: res.needsReload };
        }

        get().setSyncStatus('syncing', '正在获取远程数据并准备合并…');
        try {
            const remoteData = await fetchRemoteData(cfg);
            if (!remoteData) {
                await get().triggerUpload();
                return { needsConfirm: false };
            }

            const lastRemoteTime = getRemoteSyncTime();
            const currentRemoteTime = remoteData.syncedAt;

            if (lastRemoteTime && currentRemoteTime && currentRemoteTime <= lastRemoteTime) {
                // Remote hasn't changed — safe to overwrite with local
                await get().triggerUpload();
                return { needsConfirm: false };
            }

            const localData = buildBackupData();
            const { mergedData, conflicts } = mergeBackupData(localData, remoteData);

            if (conflicts.length > 0) {
                get().setSyncStatus('idle', '发现合并冲突，请确认');
                return { needsConfirm: true, conflicts, mergedData };
            }

            get().setSyncStatus('syncing', '正在同步合并后的数据…');
            await pushBackupToRemote(cfg, mergedData);
            get().applyBackupData(mergedData);
            saveRemoteSyncTime(mergedData.syncedAt);
            touchLocalWriteTime();
            get().clearDirty();
            get().setSyncStatus('success', '同步成功', formatTime(mergedData.syncedAt));
            return { needsConfirm: false, needsReload: false };
        } catch (e: any) {
            get().setSyncStatus('error', e.message || '同步失败');
            return { needsConfirm: false };
        }
    },

    // ── Finalize (conflict-resolved) ────────────────────────────────
    finalizeSync: async (mergedData) => {
        const cfg = get().webdavConfig ?? loadWebDAVConfig();
        if (!cfg?.url || !mergedData) return;

        get().setSyncStatus('syncing', '正在应用合并结果…');
        try {
            await pushBackupToRemote(cfg, mergedData);
            get().applyBackupData(mergedData);
            saveRemoteSyncTime(mergedData.syncedAt);
            touchLocalWriteTime();
            get().clearDirty();
            get().setSyncStatus('success', '同步成功', formatTime(mergedData.syncedAt));
        } catch (e: any) {
            get().setSyncStatus('error', e.message || '同步失败');
            throw e;
        }
    },

    // ── Reactive hydrate from backup object ─────────────────────────
    applyBackupData: (data) => {
        // Persist to localStorage first
        restoreBackupData(data);
        // Then mirror into zustand so all subscribers re-render
        const { partitions, interpretations } = hydrateBooks();
        const aiSettings = loadAISettings(DEFAULT_AI_SETTINGS) as AISettings;
        set({
            partitions,
            interpretations,
            aiSettings,
        });
    },
}));

// ── Selector helpers ────────────────────────────────────────────────

/** Get partitions for a book, falling back to defaults if not yet hydrated. */
export function usePartitions(bookId: string): MainSection[] {
    return useAppStore(state => {
        const p = state.partitions[bookId];
        if (p) return p;
        const def = BOOKS.find(b => b.id === bookId)?.defaultPartitions;
        return def ?? [];
    });
}

/** Get interpretations map for a book. */
export function useInterpretations(bookId: string): Record<number, string> {
    return useAppStore(state => state.interpretations[bookId] ?? {});
}
