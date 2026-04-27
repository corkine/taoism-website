import { BOOKS, PARTITIONS_KEY, INTERPRETATION_KEY } from '../data/book';

export const WEBDAV_CONFIG_KEY = 'webdav_config';
export const WEBDAV_SYNC_CONFIG_KEY = 'webdav_sync_config';
export const WEBDAV_REMOTE_PATH = '/daoism_sync.json';
/** Tracks the last time local data was written, for conflict detection */
export const LOCAL_LAST_WRITE_KEY = 'daoism_local_last_write';

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

export interface WebDAVSyncConfig {
  autoSyncOnLoad: boolean;
  autoSyncOnChange: boolean;
  debounceMs: number;
}

export const DEFAULT_SYNC_CONFIG: WebDAVSyncConfig = {
  autoSyncOnLoad: true,
  autoSyncOnChange: true,
  debounceMs: 30000,
};

export type GlobalSyncStatus =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'conflict';

export function getAuthHeader(username: string, password: string) {
  return 'Basic ' + btoa(`${username}:${password}`);
}

export function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function buildBackupData() {
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

export function restoreBackupData(data: any) {
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

/** Call this every time local data changes to track write time for conflict detection. */
export function touchLocalWriteTime() {
  localStorage.setItem(LOCAL_LAST_WRITE_KEY, new Date().toISOString());
}

export function getLocalWriteTime(): string | null {
  return localStorage.getItem(LOCAL_LAST_WRITE_KEY);
}

export function loadWebDAVConfig(): WebDAVConfig | null {
  try {
    return JSON.parse(localStorage.getItem(WEBDAV_CONFIG_KEY) || 'null');
  } catch {
    return null;
  }
}

export function loadSyncConfig(): WebDAVSyncConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(WEBDAV_SYNC_CONFIG_KEY) || 'null');
    return saved ? { ...DEFAULT_SYNC_CONFIG, ...saved } : DEFAULT_SYNC_CONFIG;
  } catch {
    return DEFAULT_SYNC_CONFIG;
  }
}

export async function fetchRemoteData(cfg: WebDAVConfig): Promise<any> {
  const res = await fetch(cfg.url + WEBDAV_REMOTE_PATH, {
    method: 'GET',
    headers: { Authorization: getAuthHeader(cfg.username, cfg.password) },
  });
  if (res.status === 404) return null;
  if (res.status === 401) throw new Error('认证失败，请检查用户名和密码');
  if (!res.ok) throw new Error(`服务器返回 ${res.status}`);
  return res.json();
}

export async function pushBackupToRemote(cfg: WebDAVConfig): Promise<string> {
  const data = buildBackupData();
  const body = JSON.stringify(data, null, 2);
  const res = await fetch(cfg.url + WEBDAV_REMOTE_PATH, {
    method: 'PUT',
    headers: {
      Authorization: getAuthHeader(cfg.username, cfg.password),
      'Content-Type': 'application/json',
    },
    body,
  });
  if (res.status === 401) throw new Error('认证失败，请检查用户名和密码');
  if (!res.ok && res.status !== 201 && res.status !== 204)
    throw new Error(`上传失败：服务器返回 ${res.status}`);
  return data.syncedAt;
}
