/**
 * aiPrompt.ts
 *
 * Single source of truth for AI-related constants and prompt builders.
 *
 * Contents:
 *   - DEFAULT_AI_SETTINGS         — empty defaults used on first launch
 *   - AI_PRESETS                  — provider presets (endpoint / models)
 *   - buildChapterPrompt(...)     — "chapter context" prompt (ChapterContent)
 *   - buildSectionPrompt(...)     — "section context" prompt (Sidebar "@")
 *
 * Kept as pure helpers & constants so any component can import without
 * incurring extra runtime overhead.
 */

import type { AISettings, Chapter, MainSection } from '../types';

// ── AI settings defaults & provider presets ──────────────────────────────

/** Default (empty) AI settings used on first launch. */
export const DEFAULT_AI_SETTINGS: AISettings = {
    endpoint: '',
    apiKey: '',
    model: '',
};

/** Presets for popular Chinese AI service providers. */
export const AI_PRESETS = {
    aliyun: {
        label: '通义千问',
        endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        suggest_model: ['qwen3-max', 'qwen3.6-plus', 'qwen3.6-flash'],
        website: 'https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc',
    },
    deepseek: {
        label: 'DeepSeek',
        endpoint: 'https://api.deepseek.com/v1',
        suggest_model: ['deepseek-v4-pro', 'deepseek-v4-flash'],
        website: 'https://platform.deepseek.com/',
    },
    kimi: {
        label: '月之暗面 Kimi',
        endpoint: 'https://api.moonshot.cn/v1',
        suggest_model: ['kimi-k2.6', 'kimi-k2.5'],
        website: 'https://platform.kimi.com/',
    },
    glm: {
        label: '智谱 GLM',
        endpoint: 'https://open.bigmodel.cn/api/paas/v4',
        suggest_model: ['glm-5.1', 'glm-5'],
        website: 'https://bigmodel.cn/console/overview',
    },
    minimax: {
        label: 'MiniMax',
        endpoint: 'https://api.minimaxi.com/v1',
        suggest_model: ['MiniMax-M2.7', 'MiniMax-M2.5'],
        website: 'https://platform.minimaxi.com/',
    },
    xiaomi_mimo_token: {
        label: '小米 Mimo Token Plan',
        endpoint: 'https://token-plan-cn.xiaomimimo.com/v1',
        suggest_model: ['mimo-v2.5', 'mimo-v2-pro', 'mimo-v2-flash'],
        website: 'https://platform.xiaomimimo.com/docs/zh-CN/welcome',
    },
    xiaomi_mimo_api: {
        label: '小米 Mimo API',
        endpoint: 'https://api.xiaomimimo.com/v1',
        suggest_model: ['mimo-v2.5', 'mimo-v2-pro', 'mimo-v2-flash'],
        website: 'https://platform.xiaomimimo.com/docs/zh-CN/welcome',
    },
    custom: {
        label: '自定义',
        endpoint: '',
        suggest_model: [],
    },
} as const;

// ── Prompt builders ──────────────────────────────────────────────────────

/**
 * Build the "chapter context" system prompt.
 *
 * Inputs are primitive values only — the caller is responsible for looking
 * up the current chapter and interpretation from the store.
 */
export function buildChapterPrompt(
    chapter: Chapter,
    interpretation?: string,
): string {
    const interp = interpretation?.trim() ?? '';
    return `你是一位精通中国古典哲学的学者，尤其擅长道家经典。以下是用户正在阅读的章节内容，请根据此内容回答用户的问题，可以结合原文分析其哲学思想、历史背景及现代意义。请用纯文本回答，不要使用 Markdown 格式（不使用 **加粗**、# 标题、- 列表符号等），段落之间用换行分隔即可。

【当前章节】
${chapter.title}

【原文】
${chapter.content}

${interp ? `【用户注记】\n${interp}` : ''}`;
}

/**
 * Build the "section context" system prompt used by the Sidebar "@" buttons.
 *
 * The caller provides the book-wide partition structure, the specific range
 * the user cares about, plus all chapters in the book so we can slice out
 * the relevant subset.
 */
export interface SectionPromptParams {
    bookTitle: string;
    rangeTitle: string;
    startChapter: number;
    endChapter: number;
    mainSections: MainSection[];
    chapters: Chapter[];
    interpretations: Record<number, string>;
}

export function buildSectionPrompt({
    bookTitle,
    rangeTitle,
    startChapter,
    endChapter,
    mainSections,
    chapters,
    interpretations,
}: SectionPromptParams): string {
    const relevantChapters = chapters.filter(
        c => c.id >= startChapter && c.id <= endChapter
    );

    const structureText = mainSections
        .map((ms, i) => {
            const msEnd = Math.min(ms.endChapter, endChapter);
            const subs = ms.subSections
                .map(
                    (ss, j) => {
                        const ssEnd = Math.min(ss.endChapter, endChapter);
                        return `    - ${i + 1}.${j + 1} ${ss.title} (CH ${ss.startChapter}-${ssEnd})`;
                    }
                )
                .join('\n');
            return `- ${i + 1}. ${ms.title} (CH ${ms.startChapter}-${msEnd})${subs ? '\n' + subs : ''}`;
        })
        .join('\n');

    const chaptersText = relevantChapters
        .map(c => {
            const annotation = interpretations[c.id];
            return `--- 第 ${c.id} 章：${c.title} ---
【原文】
${c.content}
${annotation ? `【用户批注】\n${annotation}` : ''}`;
        })
        .join('\n\n');

    return `你是一位精通中国古典哲学的学者，尤其擅长道家经典。
用户正在阅读《${bookTitle}》，当前关注的划分范围是：【${rangeTitle}】（第 ${startChapter} 至 ${endChapter} 章）。

为了提供准确的讨论，以下是本书当前的整体划分结构：
${structureText}

以下是当前关注范围（${rangeTitle}）内的详细章节内容及用户的批注：

${chaptersText}

请根据以上整体结构和详细内容，为用户提供深度的讨论与见解。请用纯文本回答，不要使用 Markdown 格式（不使用 **加粗**、# 标题、- 列表符号等），段落之间用换行分隔即可。`;
}
