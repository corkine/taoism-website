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

// ─── Backup / restore data contracts ───────────────────────────────────────

/** Normalized in-memory state used to build backup objects. */
export interface NormalizedState {
  partitions: Record<string, MainSection[]>;
  interpretations: Record<string, Record<number, string>>;
  aiSettings?: AISettings | null;
}

/** Shape of the backup object persisted to WebDAV / exported file. */
export interface BackupData {
  version: number;
  type: 'daoism_backup';
  syncedAt: string;
  books: Record<string, {
    partitions?: MainSection[];
    interpretations?: Record<number, string>;
  }>;
  aiSettings?: AISettings | null;
}

/** Single conflict entry produced by merging two backup objects. */
export interface Conflict {
  type: 'partition' | 'interpretation';
  bookId: string;
  key: string | number;
  local: string;
  remote: string;
}