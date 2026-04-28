export interface Chapter {
  id: number;
  title: string;
  content: string;
  interpretation?: string;
}

export interface SubSection {
  id: string;
  title: string;
  startChapter: number;
  endChapter: number;
  description: string;
}

export interface MainSection {
  id: string;
  title: string;
  startChapter: number;
  endChapter: number;
  description: string;
  subSections: SubSection[];
}

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

export interface SyncState {
  status: GlobalSyncStatus;
  message: string;
  lastSyncTime: string | null;
}

export interface AISettings {
  endpoint: string;
  apiKey: string;
  model: string;
}