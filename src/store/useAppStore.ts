/**
 * useAppStore.ts
 *
 * Centralized application state powered by zustand + persist middleware.
 *
 * Persistence strategy:
 *   - A single localStorage key (`taoism_app_state_v1`) stores the whole
 *     persisted slice via zustand's `persist` middleware.
 *   - Ephemeral runtime state (e.g. `syncState`) is excluded via `partialize`.
 *   - No manual load/save calls — `set(...)` is enough; persistence is
 *     handled automatically.
 *
 * Backup / WebDAV data interchange uses the `BackupData` format (see
 * `src/types.ts`) which is independent of the local persistence layout.  The
 * pure helpers below (build / parse / merge / export) operate only on
 * `BackupData` objects and do not touch localStorage directly.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fetchRemoteData, pushBackupToRemote } from '../utils/webdav';
import { formatTime } from '../utils/time';
import { BOOKS } from '../data/book';
import { DEFAULT_AI_SETTINGS } from '../utils/prompt';
import {
    AISettings,
    BackupData,
    Conflict,
    GlobalSyncStatus,
    MainSection,
    NormalizedState,
    SyncState,
    WebDAVConfig,
} from '../types';

const PERSIST_KEY = 'taoism_app_state_v1';

// ── Backup / restore pure helpers ───────────────────────────────────

/** Build a backup object from the current in-memory state. */
function buildBackupData(state: NormalizedState, includeAI: boolean = true): BackupData {
    const booksData: BackupData['books'] = {};
    const bookIds = new Set([
        ...Object.keys(state.partitions || {}),
        ...Object.keys(state.interpretations || {}),
    ]);
    for (const bookId of bookIds) {
        booksData[bookId] = {
            partitions: state.partitions?.[bookId],
            interpretations: state.interpretations?.[bookId],
        };
    }
    const data: BackupData = {
        version: 2,
        type: 'daoism_backup',
        syncedAt: new Date().toISOString(),
        books: booksData,
    };
    if (includeAI && state.aiSettings) {
        data.aiSettings = state.aiSettings;
    }
    return data;
}

/** Parse a backup object into normalized state.  Throws on unknown format. */
function parseBackupData(data: any): NormalizedState {
    if (!data || data.type !== 'daoism_backup' || !data.books) {
        throw new Error('无法识别的备份文件格式');
    }
    const partitions: Record<string, MainSection[]> = {};
    const interpretations: Record<string, Record<number, string>> = {};
    for (const bookId of Object.keys(data.books)) {
        const entry = data.books[bookId] || {};
        if (entry.partitions) partitions[bookId] = entry.partitions;
        if (entry.interpretations) interpretations[bookId] = entry.interpretations;
    }
    return {
        partitions,
        interpretations,
        aiSettings: data.aiSettings ?? null,
    };
}

/** Merge two backup objects and return merged result plus conflicts. */
function mergeBackupData(local: BackupData, remote: BackupData): { mergedData: BackupData; conflicts: Conflict[] } {
    const conflicts: Conflict[] = [];
    const merged: BackupData = {
        ...local,
        syncedAt: new Date().toISOString(),
        books: { ...local.books },
    };

    const remoteBooks = remote.books || {};
    const localBooks = local.books || {};
    const allBookIds = new Set([...Object.keys(localBooks), ...Object.keys(remoteBooks)]);

    for (const bookId of allBookIds) {
        const localBook = localBooks[bookId] || { partitions: [], interpretations: {} };
        const remoteBook = remoteBooks[bookId] || { partitions: [], interpretations: {} };

        const mergedPartitions = [...(localBook.partitions || [])];
        for (const r of (remoteBook.partitions || [])) {
            const exists = mergedPartitions.find((l: any) => l.id === r.id);
            if (!exists) {
                mergedPartitions.push(r);
            } else if (JSON.stringify(exists) !== JSON.stringify(r)) {
                conflicts.push({
                    type: 'partition',
                    bookId,
                    key: r.id,
                    local: '本地分卷配置',
                    remote: '远端分卷配置',
                });
                mergedPartitions.push({
                    ...r,
                    id: `${r.id}_remote_${Math.floor(Math.random() * 1000)}`,
                });
            }
        }

        const mergedInterpretations: Record<number, string> = { ...(localBook.interpretations || {}) };
        const remoteInterp = remoteBook.interpretations || {};
        const remoteTime = remote.syncedAt || '未知时间';
        const localTime = local.syncedAt || new Date().toISOString();

        for (const [key, rVal] of Object.entries(remoteInterp)) {
            const numKey = Number(key);
            const lVal = mergedInterpretations[numKey];
            if (lVal === undefined) {
                mergedInterpretations[numKey] = rVal as string;
            } else if (lVal !== rVal) {
                if (!String(lVal).includes(String(rVal)) && !String(rVal).includes(String(lVal))) {
                    conflicts.push({
                        type: 'interpretation',
                        bookId,
                        key,
                        local: String(lVal),
                        remote: String(rVal),
                    });
                    const rTimeStr = new Date(remoteTime).toLocaleString('zh-CN');
                    const lTimeStr = new Date(localTime).toLocaleString('zh-CN');
                    mergedInterpretations[numKey] = `[远端 ${rTimeStr}]:\n${rVal}\n\n[本地 ${lTimeStr}]:\n${lVal}`;
                }
            }
        }

        merged.books[bookId] = {
            partitions: mergedPartitions,
            interpretations: mergedInterpretations,
        };
    }

    if (remote.aiSettings && !local.aiSettings) {
        merged.aiSettings = remote.aiSettings;
    }

    return { mergedData: merged, conflicts };
}

/** Trigger a browser file download for the given backup object. */
function downloadBackupFile(data: BackupData, filename: string = 'daoism_data.json'): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Store ───────────────────────────────────────────────────────────

export interface SyncResult {
    needsConfirm: boolean;
    conflicts?: Conflict[];
    mergedData?: BackupData;
}

interface AppState {
    // ── Persisted state ─────────────────────────────────────────────
    partitions: Record<string, MainSection[]>;
    interpretations: Record<string, Record<number, string>>;
    aiSettings: AISettings;
    webdavConfig: WebDAVConfig | null;
    /** Enable automatic two-way sync on startup / dirty change / tab focus. */
    autoSync: boolean;
    /** ISO timestamp of the earliest unsaved change; null when clean. */
    dirtySince: string | null;
    /** ISO timestamp of the last local write (conflict-detection helper). */
    localLastWrite: string | null;
    /** The `syncedAt` of the remote file when we last successfully synced. */
    remoteLastSync: string | null;

    // ── Ephemeral runtime state (NOT persisted) ─────────────────────
    syncState: SyncState;

    // ── Actions: book data ──────────────────────────────────────────
    setPartitions: (bookId: string, partitions: MainSection[]) => void;
    setInterpretation: (bookId: string, chapterId: number, value: string) => void;

    // ── Actions: dirty flag ─────────────────────────────────────────
    markDirty: () => void;
    clearDirty: () => void;

    // ── Actions: WebDAV config ──────────────────────────────────────
    setWebdavConfig: (cfg: WebDAVConfig) => void;
    setAutoSync: (enabled: boolean) => void;

    // ── Actions: AI settings ────────────────────────────────────────
    setAISettings: (s: AISettings) => void;

    // ── Actions: sync orchestration ─────────────────────────────────
    setSyncStatus: (status: GlobalSyncStatus, message?: string, time?: string) => void;
    triggerUpload: () => Promise<void>;
    triggerDownload: () => Promise<{ needsReload: boolean }>;
    triggerSync: () => Promise<SyncResult & { needsReload?: boolean }>;
    /** Non-interactive wrapper for auto-sync: swallows conflicts into `conflict` state. */
    triggerAutoSync: () => Promise<void>;
    finalizeSync: (mergedData: BackupData) => Promise<void>;

    // ── Backup helpers ──────────────────────────────────────────────
    applyBackupData: (data: unknown) => void;
    currentBackup: (includeAI?: boolean) => BackupData;
    exportToFile: (includeAI?: boolean) => void;
}

/** Derive the normalized slice used to build backup objects. */
function pickNormalized(state: AppState): NormalizedState {
    return {
        partitions: state.partitions,
        interpretations: state.interpretations,
        aiSettings: state.aiSettings,
    };
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // ── Initial state ───────────────────────────────────────
            partitions: {},
            interpretations: {},
            aiSettings: { ...DEFAULT_AI_SETTINGS },
            webdavConfig: null,
            autoSync: false,
            dirtySince: null,
            localLastWrite: null,
            remoteLastSync: null,
            syncState: { status: 'idle', message: '', lastSyncTime: null },

            // ── Book actions ────────────────────────────────────────
            setPartitions: (bookId, parts) => {
                const now = new Date().toISOString();
                set(state => ({
                    partitions: { ...state.partitions, [bookId]: parts },
                    dirtySince: now,
                    localLastWrite: now,
                }));
            },

            setInterpretation: (bookId, chapterId, value) => {
                const now = new Date().toISOString();
                set(state => ({
                    interpretations: {
                        ...state.interpretations,
                        [bookId]: { ...(state.interpretations[bookId] || {}), [chapterId]: value },
                    },
                    dirtySince: now,
                    localLastWrite: now,
                }));
            },

            // ── Dirty flag ──────────────────────────────────────────
            markDirty: () => set({ dirtySince: new Date().toISOString() }),
            clearDirty: () => set({ dirtySince: null }),

            // ── WebDAV config ───────────────────────────────────────
            setWebdavConfig: (cfg) => set({ webdavConfig: cfg }),
            setAutoSync: (enabled) => set({ autoSync: enabled }),

            // ── AI settings ─────────────────────────────────────────
            setAISettings: (s) => {
                const now = new Date().toISOString();
                set({ aiSettings: s, dirtySince: now, localLastWrite: now });
            },

            // ── Sync status helper ──────────────────────────────────
            setSyncStatus: (status, message = '', time) => {
                set({ syncState: { status, message, lastSyncTime: time ?? null } });
            },

            // ── Upload ──────────────────────────────────────────────
            triggerUpload: async () => {
                const cfg = get().webdavConfig;
                if (!cfg?.url) return;
                get().setSyncStatus('syncing', '正在上传数据…');
                try {
                    const payload = buildBackupData(pickNormalized(get()), true);
                    const syncedAt = await pushBackupToRemote(cfg, payload);
                    set({
                        remoteLastSync: syncedAt,
                        localLastWrite: new Date().toISOString(),
                        dirtySince: null,
                    });
                    get().setSyncStatus('success', '上传成功', formatTime(syncedAt));
                } catch (e: any) {
                    get().setSyncStatus('error', e.message || '上传失败');
                }
            },

            // ── Download ────────────────────────────────────────────
            triggerDownload: async () => {
                const cfg = get().webdavConfig;
                if (!cfg?.url) return { needsReload: false };
                get().setSyncStatus('syncing', '正在下载数据…');
                try {
                    const data = await fetchRemoteData(cfg);
                    if (!data) {
                        get().setSyncStatus('error', '远程尚无备份文件，请先上传');
                        return { needsReload: false };
                    }
                    get().applyBackupData(data);
                    set({
                        remoteLastSync: data.syncedAt,
                        localLastWrite: new Date().toISOString(),
                        dirtySince: null,
                    });
                    const t = data.syncedAt ? formatTime(data.syncedAt) : '';
                    get().setSyncStatus('success', '下载并恢复成功', t);
                    return { needsReload: false };
                } catch (e: any) {
                    get().setSyncStatus('error', e.message || '下载失败');
                    return { needsReload: false };
                }
            },

            // ── Sync (two-way) ──────────────────────────────────────
            triggerSync: async () => {
                const cfg = get().webdavConfig;
                if (!cfg?.url) return { needsConfirm: false };

                if (get().dirtySince === null) {
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

                    const lastRemoteTime = get().remoteLastSync;
                    const currentRemoteTime = remoteData.syncedAt;
                    if (lastRemoteTime && currentRemoteTime && currentRemoteTime <= lastRemoteTime) {
                        await get().triggerUpload();
                        return { needsConfirm: false };
                    }

                    const localData = buildBackupData(pickNormalized(get()), true);
                    const { mergedData, conflicts } = mergeBackupData(localData, remoteData);

                    if (conflicts.length > 0) {
                        get().setSyncStatus('idle', '发现合并冲突，请确认');
                        return { needsConfirm: true, conflicts, mergedData };
                    }

                    get().setSyncStatus('syncing', '正在同步合并后的数据…');
                    await pushBackupToRemote(cfg, mergedData);
                    get().applyBackupData(mergedData);
                    set({
                        remoteLastSync: mergedData.syncedAt,
                        localLastWrite: new Date().toISOString(),
                        dirtySince: null,
                    });
                    get().setSyncStatus('success', '同步成功', formatTime(mergedData.syncedAt));
                    return { needsConfirm: false, needsReload: false };
                } catch (e: any) {
                    get().setSyncStatus('error', e.message || '同步失败');
                    return { needsConfirm: false };
                }
            },

            // ── Finalize (after user resolves conflicts) ────────────
            finalizeSync: async (mergedData) => {
                const cfg = get().webdavConfig;
                if (!cfg?.url || !mergedData) return;

                get().setSyncStatus('syncing', '正在应用合并结果…');
                try {
                    await pushBackupToRemote(cfg, mergedData);
                    get().applyBackupData(mergedData);
                    set({
                        remoteLastSync: mergedData.syncedAt,
                        localLastWrite: new Date().toISOString(),
                        dirtySince: null,
                    });
                    get().setSyncStatus('success', '同步成功', formatTime(mergedData.syncedAt));
                } catch (e: any) {
                    get().setSyncStatus('error', e.message || '同步失败');
                    throw e;
                }
            },

            // ── Auto-sync (non-interactive) ─────────────────────────
            //
            // Wraps `triggerSync` so that background callers (hooks,
            // visibility listeners, debounced dirty watchers) never block
            // the user with confirm() dialogs.  When a conflict is
            // detected the result is surfaced via syncState.status =
            // 'conflict'; it is up to the Header indicator to invite the
            // user to open the WebDAV modal and resolve it manually.
            triggerAutoSync: async () => {
                const { webdavConfig, autoSync } = get();
                if (!autoSync || !webdavConfig?.url) return;
                // Avoid piling up requests when one is already in flight.
                if (get().syncState.status === 'syncing') return;
                try {
                    const res = await get().triggerSync();
                    if (res.needsConfirm) {
                        get().setSyncStatus(
                            'conflict',
                            '检测到冲突，请打开备份面板手动处理',
                            new Date().toISOString(),
                        );
                    }
                } catch {
                    /* triggerSync already records error state */
                }
            },

            // ── Apply backup (file import or remote download) ───────
            applyBackupData: (data) => {
                const parsed = parseBackupData(data);
                set(state => ({
                    partitions: parsed.partitions,
                    interpretations: parsed.interpretations,
                    aiSettings: parsed.aiSettings ?? state.aiSettings,
                }));
            },

            // ── Backup helpers ──────────────────────────────────────
            currentBackup: (includeAI = true) => buildBackupData(pickNormalized(get()), includeAI),
            exportToFile: (includeAI = false) => {
                const data = buildBackupData(pickNormalized(get()), includeAI);
                downloadBackupFile(data);
            },
        }),
        {
            name: PERSIST_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 2,
            migrate: (persisted: any, version: number) => {
                // v1 → v2: introduce the `autoSync` flag (default off to
                // preserve the existing manual-only behaviour).
                if (!persisted) return persisted;
                if (version < 2 && typeof persisted === 'object') {
                    return { ...persisted, autoSync: persisted.autoSync ?? false };
                }
                return persisted;
            },
            // Persist everything except the ephemeral sync runtime state.
            partialize: (state) => ({
                partitions: state.partitions,
                interpretations: state.interpretations,
                aiSettings: state.aiSettings,
                webdavConfig: state.webdavConfig,
                autoSync: state.autoSync,
                dirtySince: state.dirtySince,
                localLastWrite: state.localLastWrite,
                remoteLastSync: state.remoteLastSync,
            }),
        }
    )
);

// ── Selector helpers ────────────────────────────────────────────────

// Stable references for empty fallbacks — critical to avoid returning a new
// array/object from the selector on every render (which would cause
// `useSyncExternalStore` to report "getSnapshot should be cached" and loop).
const EMPTY_PARTITIONS: MainSection[] = [];
const EMPTY_INTERPRETATIONS: Record<number, string> = {};

/** Get partitions for a book, falling back to defaults if not yet hydrated. */
export function usePartitions(bookId: string): MainSection[] {
    return useAppStore(state => {
        const p = state.partitions[bookId];
        if (p && p.length > 0) return p;
        const def = BOOKS.find(b => b.id === bookId)?.defaultPartitions;
        return def ?? EMPTY_PARTITIONS;
    });
}

/** Get interpretations map for a book. */
export function useInterpretations(bookId: string): Record<number, string> {
    return useAppStore(state => state.interpretations[bookId] ?? EMPTY_INTERPRETATIONS);
}
