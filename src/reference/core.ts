/**
 * reference/core.ts
 *
 * Built-in backup management for the Taoism website.
 *
 * Responsibilities:
 *   - Registry of built-in backup JSON files stored in this directory
 *   - Lazy-load a specific backup by id
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
  /** File name relative to this directory (e.g. "corkine.json"). */
  fileName: string;
}

// ── Registry ─────────────────────────────────────────────────────────

/**
 * Ordered list of built-in backups.
 * To add a new built-in backup:
 *   1. Drop the .json file into `src/reference/`
 *   2. Add an entry to this array
 */
export const BUILT_IN_BACKUPS: BuiltInBackup[] = [
  {
    id: 'corkine',
    name: 'Corkine 的分章释义',
    description: '完整分卷与注释，以现代社会科学视角切入',
    fileName: 'corkine.json',
  },
];

// ── Lazy loader ──────────────────────────────────────────────────────

/**
 * Glob of all JSON files in this directory.
 * Vite resolves this at build time — new .json files added to the
 * directory are automatically included.
 */
const backupModules = import.meta.glob<{ default: unknown }>('./*.json', {
  eager: true,
});

/**
 * Load a built-in backup by its id.
 * Throws if the id is unknown or the file cannot be found.
 */
export function loadBuiltInBackup(id: string): unknown {
  const meta = BUILT_IN_BACKUPS.find((b) => b.id === id);
  if (!meta) {
    throw new Error(`未找到 id 为 "${id}" 的内置备份`);
  }

  const key = `./${meta.fileName}`;
  const mod = backupModules[key];
  if (!mod) {
    throw new Error(`内置备份文件 "${meta.fileName}" 未找到`);
  }

  return (mod as any).default ?? mod;
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
