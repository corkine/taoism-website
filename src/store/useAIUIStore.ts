/**
 * useAIUIStore.ts
 *
 * Lightweight, non-persisted store that owns the AI panel's UI state
 * (open/visible/mode) and the "prompt source" descriptor.
 *
 * Why a separate store (vs. merging into useAppStore)?
 *   - This state is ephemeral UI state — it must not be persisted.
 *   - Keeping it isolated avoids bloating the main persisted slice and
 *     prevents unrelated components from re-rendering when AI UI toggles.
 *
 * Prompt design (B + C hybrid):
 *   - mode = { kind: 'chapter', bookId, chapterId }
 *       The AI panel derives the system prompt at consumption time from the
 *       latest interpretations/book data. The prompt automatically follows
 *       chapter switches and interpretation edits — no manual sync needed.
 *   - mode = { kind: 'snapshot', prompt }
 *       The prompt is frozen at open-time (used by Sidebar "@" section
 *       questions, which carry a custom range-based prompt).
 */

import { create } from 'zustand';

export type PromptMode =
    | { kind: 'chapter'; bookId: string; chapterId: number }
    | { kind: 'snapshot'; prompt: string };

interface AIUIState {
    /** Session exists (messages may be present). */
    isOpen: boolean;
    /** Modal is visible on screen. When false but isOpen, session is kept. */
    isVisible: boolean;
    /** How to build system prompt when sending a message. */
    mode: PromptMode | null;
    /** Optional user message auto-sent on open (reserved for future use). */
    initialMessage: string | null;
    /**
     * Monotonic counter bumped whenever the current conversation should be
     * cleared.  AIModal subscribes to this and calls `clearMessages` on
     * every change.  Use cases:
     *   - `close()` bumps it so the next re-open starts fresh.
     *   - `resetConversation()` bumps it without touching visibility
     *     (used by Ctrl+Shift+K to wipe history in-place).
     *
     * Opening on a new chapter does NOT bump — users may intentionally want
     * to continue the same conversation across chapters.
     */
    sessionId: number;

    /** Open panel for a specific chapter (prompt is derived live). */
    openChapter: (bookId: string, chapterId: number) => void;
    /** Open panel with a frozen snapshot prompt (Sidebar "@" use case). */
    openSnapshot: (prompt: string, initialMessage?: string) => void;
    /** Hide the modal but keep the session. */
    hide: () => void;
    /** Close the session and clear all AI UI state (also clears messages). */
    close: () => void;
    /** Clear messages only; leave open/visible/mode untouched. */
    resetConversation: () => void;
    /** Flip visibility (used by Ctrl+K keyboard toggle). */
    toggleVisibility: () => void;
}

export const useAIUIStore = create<AIUIState>()((set) => ({
    isOpen: false,
    isVisible: false,
    mode: null,
    initialMessage: null,
    sessionId: 0,

    openChapter: (bookId, chapterId) =>
        set({
            isOpen: true,
            isVisible: true,
            mode: { kind: 'chapter', bookId, chapterId },
            initialMessage: null,
        }),

    openSnapshot: (prompt, initialMessage) =>
        set({
            isOpen: true,
            isVisible: true,
            mode: { kind: 'snapshot', prompt },
            initialMessage: initialMessage ?? null,
        }),

    hide: () => set({ isVisible: false }),

    close: () =>
        set((s) => ({
            isOpen: false,
            isVisible: false,
            mode: null,
            initialMessage: null,
            sessionId: s.sessionId + 1,
        })),

    resetConversation: () =>
        set((s) => ({ sessionId: s.sessionId + 1 })),

    toggleVisibility: () => set((s) => ({ isVisible: !s.isVisible })),
}));
