/**
 * data/reference.ts
 *
 * Built-in backup management for the Taoism website.
 *
 * Responsibilities:
 *   - Registry of built-in backup JSON files stored in public/
 *   - Lazy-load a specific backup by id via AJAX (fetch)
 *   - Strip non-book fields (aiSettings, quickPhrases) before import so
 *     only partitions and interpretations are restored.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface BuiltInBackup {
  /** Unique identifier used as the lookup key. */
  id: string;
  /** Human-readable label shown in the import modal. */
  name: string;
  /** Short description displayed below the name. */
  description: string;
  /** File name relative to public/ directory (e.g. "default.json"). */
  fileName: string;
}

// ── Registry ─────────────────────────────────────────────────────────

/**
 * Ordered list of built-in backups.
 * To add a new built-in backup:
 *   1. Drop the .json file into `public/`
 *   2. Add an entry to this array
 */
export const BUILT_IN_BACKUPS: BuiltInBackup[] = [
  {
    id: 'default',
    name: '默认分章注释',
    description: '提供完整分章注释，以现代社会科学视角切入',
    fileName: 'default.json',
  },
  {
    id: 'nanhuaijin',
    name: '南怀瑾分章注释',
    description: '提供完整分章注释，以南怀瑾先生的视角切入',
    fileName: 'nanhuaijin.json',
  }
];

// ── Lazy loader ──────────────────────────────────────────────────────

/**
 * Load a built-in backup by its id via AJAX from the public/ directory.
 * JSON files in public/ are served as static assets and can be updated
 * independently without re-bundling the application.
 * Throws if the id is unknown or the file cannot be loaded.
 */
export async function loadBuiltInBackup(id: string): Promise<unknown> {
  const meta = BUILT_IN_BACKUPS.find((b) => b.id === id);
  if (!meta) {
    throw new Error(`未找到 id 为 "${id}" 的内置备份`);
  }

  const url = `${import.meta.env.BASE_URL}${meta.fileName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`内置备份文件 "${meta.fileName}" 加载失败 (HTTP ${response.status})`);
  }

  return response.json();
}

// ── Data stripping ───────────────────────────────────────────────────

/**
 * Return a shallow copy of `data` with `aiSettings` and `quickPhrases`
 * removed so that only book data (partitions + interpretations) is
 * imported.
 */
export function stripNonBookData(data: Record<string, unknown>): Record<string, unknown> {
  const { aiSettings: _ai, quickPhrases: _qp, ...rest } = data;
  return rest;
}
