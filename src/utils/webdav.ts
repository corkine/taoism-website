import {
  buildBackupData,
} from './storage';
import { WebDAVConfig } from '../types';

export const WEBDAV_REMOTE_PATH = '/daoism_backup.json';

export async function fetchRemoteData(cfg: WebDAVConfig): Promise<any> {
  const res = await fetch(cfg.url + WEBDAV_REMOTE_PATH, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(cfg.username, cfg.password),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
  if (res.status === 404) return null;
  if (res.status === 401) throw new Error('认证失败，请检查用户名和密码');
  if (!res.ok) throw new Error(`服务器返回 ${res.status}`);
  return res.json();
}

export async function pushBackupToRemote(cfg: WebDAVConfig, data?: any): Promise<string> {
  const finalData = data || buildBackupData(true);
  const body = JSON.stringify(finalData, null, 2);
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
  return finalData.syncedAt;
}

function getAuthHeader(username: string, password: string) {
  return 'Basic ' + btoa(`${username}:${password}`);
}