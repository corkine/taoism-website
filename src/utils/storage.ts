/**
 * storage.ts
 *
 * Central data-access layer for the application.
 */

import { WebDAVConfig, MainSection } from "../types";
import { BOOKS } from "../data/book";

// ─── Per book data ──────────────────────────────────────────────────────────

/** Get the storage key for a book's partitions. */
export function getPartitionsKey(bookId: string): string {
    return `taoism_partitions_${bookId}`;
}

/** Get the storage key for a book's interpretations. */
export function getInterpretationsKey(bookId: string): string {
    return `taoism_interpretations_${bookId}`;
}

/** Load partitions for a specific book. */
export function loadPartitions(bookId: string, defaultPartitions: MainSection[]): MainSection[] {
    const saved = localStorage.getItem(getPartitionsKey(bookId));
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return defaultPartitions;
        }
    }
    return defaultPartitions;
}

/** Save partitions for a specific book. */
export function savePartitions(bookId: string, partitions: MainSection[]): void {
    localStorage.setItem(getPartitionsKey(bookId), JSON.stringify(partitions));
}

/** Load interpretations for a specific book. */
export function loadInterpretations(bookId: string): Record<number, string> {
    const saved = localStorage.getItem(getInterpretationsKey(bookId));
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return {};
        }
    }
    return {};
}

/** Save interpretations for a specific book and mark as dirty. */
export function saveInterpretations(bookId: string, interpretations: Record<number, string>, markDirtyFlag: boolean = true): void {
    localStorage.setItem(getInterpretationsKey(bookId), JSON.stringify(interpretations));
    if (markDirtyFlag) {
        markDirty();
    }
}

// ─── AI assistant configuration ───────────────────────────────────────────────

/** AI assistant configuration. */
const AI_SETTINGS_KEY = 'taoism_ai_settings';

/** Load AI assistant settings from localStorage. */
export function loadAISettings(defaultSettings: any): any {
    try {
        const saved = localStorage.getItem(AI_SETTINGS_KEY);
        if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch { }
    return defaultSettings;
}

/** Save AI assistant settings to localStorage and mark as dirty. */
export function saveAISettings(settings: any, markDirtyFlag: boolean = true): void {
    try {
        localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
        if (markDirtyFlag) {
            markDirty();
        }
    } catch { }
}

// ─── Dirty-flag ───────────────────────────────────────────────────────
/**
 * "Dirty flag" key.
 *
 * Value is the ISO timestamp of the latest unsaved change, or absent when
 * everything is in sync.  We store a timestamp (not just "true") so the UI
 * can optionally surface how long ago the last change happened.
 */
const DIRTY_FLAG_KEY = 'taoism_dirty_since';

/**
 * Mark local data as dirty (unsaved).
 *
 * Call this whenever the user modifies any data that should eventually be
 * synced/exported (partitions, interpretations, AI settings).
 *
 * The stored value is an ISO timestamp so the UI can show "modified N minutes
 * ago" if desired.
 */
export function markDirty(): void {
    localStorage.setItem(DIRTY_FLAG_KEY, new Date().toISOString());
    // Notify listeners (e.g. the header indicator)
    window.dispatchEvent(new CustomEvent('daoism-dirty-changed'));
}

/**
 * Clear the dirty flag.
 *
 * Call this after a successful export or WebDAV upload.
 */
export function clearDirty(): void {
    localStorage.removeItem(DIRTY_FLAG_KEY);
    window.dispatchEvent(new CustomEvent('daoism-dirty-changed'));
}

/**
 * Returns the ISO timestamp of the earliest unsaved change, or null when
 * everything is in sync.
 */
export function getDirtySince(): string | null {
    return localStorage.getItem(DIRTY_FLAG_KEY);
}

/** Returns true if there are unsaved local changes. */
export function isDirty(): boolean {
    return localStorage.getItem(DIRTY_FLAG_KEY) !== null;
}

// ─── WebDAV sync ─────────────────────────────────────────────────────────

/** WebDAV connection settings. */
const WEBDAV_CONFIG_KEY = 'taoism_webdav_config';

/** Tracks the last time local data was written, for conflict detection. */
const LOCAL_LAST_WRITE_KEY = 'taoism_local_last_write';

/** The syncedAt timestamp of the remote file when we last successfully synced. */
const REMOTE_LAST_SYNC_KEY = 'taoism_remote_last_sync';

/**
 * Load WebDAV configuration from localStorage.
 * @returns The WebDAVConfig object or null if not found or invalid.
 */
export function loadWebDAVConfig(): WebDAVConfig | null {
    try {
        return JSON.parse(localStorage.getItem(WEBDAV_CONFIG_KEY) || 'null');
    } catch {
        return null;
    }
}

/**
 * Save WebDAV configuration to localStorage.
 */
export function saveWebDAVConfig(config: WebDAVConfig) {
    localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(config));
}

/** Record that local data was written right now (used by WebDAV sync). */
export function touchLocalWriteTime(): void {
    localStorage.setItem(LOCAL_LAST_WRITE_KEY, new Date().toISOString());
}

/** Returns the ISO timestamp of the last local write, or null. */
export function getLocalWriteTime(): string | null {
    return localStorage.getItem(LOCAL_LAST_WRITE_KEY);
}

/** Save the syncedAt timestamp of the remote data we just pulled or pushed. */
export function saveRemoteSyncTime(time: string | null): void {
    if (time) {
        localStorage.setItem(REMOTE_LAST_SYNC_KEY, time);
    } else {
        localStorage.removeItem(REMOTE_LAST_SYNC_KEY);
    }
}

/** Returns the last known remote sync timestamp. */
export function getRemoteSyncTime(): string | null {
    return localStorage.getItem(REMOTE_LAST_SYNC_KEY);
}

// ─── Backup / Restore ─────────────────────────────────────────────────────────

/**
 * Build a JSON object containing all local user data.
 * @param includeAI If true, includes AI configuration in the backup.
 */
export function buildBackupData(includeAI: boolean = true) {
    const booksData: Record<string, any> = {};
    for (const book of BOOKS) {
        booksData[book.id] = {
            partitions: loadPartitions(book.id, book.defaultPartitions),
            interpretations: loadInterpretations(book.id),
        };
    }
    const data: any = {
        version: 2,
        type: 'daoism_backup',
        syncedAt: new Date().toISOString(),
        books: booksData,
    };
    if (includeAI) {
        data.aiSettings = loadAISettings(null);
    }
    return data;
}

/**
 * Restore user data from a backup object to LocalStorage.
 * Does NOT call markDirty — restoring from an export is considered a clean
 * state (the data came from somewhere that was already saved).
 */
export function restoreBackupData(data: any) {
    if (data.type !== 'daoism_backup' || !data.books) {
        throw new Error('无法识别的备份文件格式');
    }
    for (const bookId of Object.keys(data.books)) {
        if (data.books[bookId].partitions) {
            savePartitions(bookId, data.books[bookId].partitions);
        }
        if (data.books[bookId].interpretations) {
            saveInterpretations(bookId, data.books[bookId].interpretations);
        }
    }
    if (data.aiSettings) {
        saveAISettings(data.aiSettings, false);
    }
}

export interface Conflict {
    type: 'partition' | 'interpretation';
    bookId: string;
    key: string | number;
    local: string;
    remote: string;
}

/**
 * Merge two backup data objects and return conflicts.
 */
export function mergeBackupData(local: any, remote: any): { mergedData: any, conflicts: Conflict[] } {
    const conflicts: Conflict[] = [];
    const merged: any = {
        ...local,
        syncedAt: new Date().toISOString(),
        books: { ...local.books }
    };

    const remoteBooks = remote.books || {};
    const localBooks = local.books || {};

    const allBookIds = new Set([...Object.keys(localBooks), ...Object.keys(remoteBooks)]);

    for (const bookId of allBookIds) {
        const localBook = localBooks[bookId] || { partitions: [], interpretations: {} };
        const remoteBook = remoteBooks[bookId] || { partitions: [], interpretations: {} };

        // Merge partitions
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
                    remote: '远端分卷配置'
                });
                // Still merge by giving remote one a unique ID for the preview or if user accepts
                mergedPartitions.push({
                    ...r,
                    id: `${r.id}_remote_${Math.floor(Math.random() * 1000)}`
                });
            }
        }

        // Merge interpretations
        const mergedInterpretations = { ...(localBook.interpretations || {}) };
        const remoteInterp = remoteBook.interpretations || {};

        const remoteTime = remote.syncedAt || '未知时间';
        const localTime = local.syncedAt || new Date().toISOString();

        for (const [key, rVal] of Object.entries(remoteInterp)) {
            const lVal = mergedInterpretations[key];
            if (lVal === undefined) {
                mergedInterpretations[key] = rVal;
            } else if (lVal !== rVal) {
                // Check if it's already a merged string to avoid duplicate markers
                if (!String(lVal).includes(String(rVal)) && !String(rVal).includes(String(lVal))) {
                    conflicts.push({
                        type: 'interpretation',
                        bookId,
                        key: key,
                        local: String(lVal),
                        remote: String(rVal)
                    });
                    const rTimeStr = new Date(remoteTime).toLocaleString('zh-CN');
                    const lTimeStr = new Date(localTime).toLocaleString('zh-CN');
                    mergedInterpretations[key] = `[远端 ${rTimeStr}]:\n${rVal}\n\n[本地 ${lTimeStr}]:\n${lVal}`;
                }
            }
        }

        merged.books[bookId] = {
            partitions: mergedPartitions,
            interpretations: mergedInterpretations
        };
    }

    if (remote.aiSettings && !local.aiSettings) {
        merged.aiSettings = remote.aiSettings;
    }

    return { mergedData: merged, conflicts };
}

/**
 * Trigger a browser file download of the full user data backup.
 * Clears the dirty flag on success.
 */
export function exportDataToFile(includeAI: boolean = false): void {
    const data = buildBackupData(includeAI);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daoism_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    clearDirty();
}
