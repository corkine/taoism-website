import { BOOKS, PARTITIONS_KEY, INTERPRETATION_KEY, buildBackupData, restoreBackupData } from '../data/book';

export const WEBDAV_CONFIG_KEY = 'webdav_config';
export const WEBDAV_REMOTE_PATH = '/daoism_backup.json';
/** Tracks the last time local data was written, for conflict detection */
export const LOCAL_LAST_WRITE_KEY = 'daoism_local_last_write';

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

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
  const data = buildBackupData(true);
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
