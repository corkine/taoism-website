/**
 * useAutoSync
 *
 * Drives background two-way sync when the user opts in via `autoSync`.
 *
 * Triggers (all routed through `triggerAutoSync`, which is a non-interactive
 * wrapper around `triggerSync`):
 *   1. Mount / hydration  — an initial sync shortly after the app loads.
 *   2. Tab becomes visible — catches remote changes made on other devices.
 *   3. Local `dirtySince` updates — debounced so rapid typing doesn't spam
 *      the server.
 *
 * Conflicts surface through the store as `syncState.status = 'conflict'`,
 * which the Header indicator renders so the user can manually open the
 * WebDAV modal and resolve it.
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

const DIRTY_DEBOUNCE_MS = 5_000;
const INITIAL_DELAY_MS = 800;

export function useAutoSync(): void {
    const autoSync = useAppStore(s => s.autoSync);
    const hasConfig = useAppStore(s => !!s.webdavConfig?.url);
    const dirtySince = useAppStore(s => s.dirtySince);
    const triggerAutoSync = useAppStore(s => s.triggerAutoSync);

    const debounceRef = useRef<number | null>(null);

    // Startup + visibilitychange triggers.
    useEffect(() => {
        if (!autoSync || !hasConfig) return;

        const run = () => { void triggerAutoSync(); };
        const onVisible = () => {
            if (document.visibilityState === 'visible') run();
        };

        const initial = window.setTimeout(run, INITIAL_DELAY_MS);
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            window.clearTimeout(initial);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [autoSync, hasConfig, triggerAutoSync]);

    // Debounced dirty watcher.
    useEffect(() => {
        if (!autoSync || !hasConfig || !dirtySince) return;
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            void triggerAutoSync();
        }, DIRTY_DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
        };
    }, [autoSync, hasConfig, dirtySince, triggerAutoSync]);
}
