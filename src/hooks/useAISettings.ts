import { useAppStore } from '../store/useAppStore';
import { AISettings } from '../types';

export const AI_PRESETS = {
  aliyun: {
    label: '通义千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    suggest_model: ['qwen3-max', 'qwen3.6-plus', 'qwen3.6-flash'],
    website: 'https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc'
  },
  deepseek: {
    label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    suggest_model: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    website: 'https://platform.deepseek.com/'
  },
  kimi: {
    label: '月之暗面 Kimi',
    endpoint: 'https://api.moonshot.cn/v1',
    suggest_model: ['kimi-k2.6', 'kimi-k2.5'],
    website: 'https://platform.kimi.com/'
  },
  glm: {
    label: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
    suggest_model: ['glm-5.1', 'glm-5'],
    website: 'https://bigmodel.cn/console/overview'
  },
  minimax: {
    label: 'MiniMax',
    endpoint: 'https://api.minimaxi.com/v1',
    suggest_model: ['MiniMax-M2.7', 'MiniMax-M2.5'],
    website: 'https://platform.minimaxi.com/'
  },
  xiaomi_mimo_token: {
    label: '小米 Mimo Token Plan',
    endpoint: 'https://token-plan-cn.xiaomimimo.com/v1',
    suggest_model: ['mimo-v2.5', 'mimo-v2-pro', 'mimo-v2-flash'],
    website: 'https://platform.xiaomimimo.com/docs/zh-CN/welcome'
  },
  xiaomi_mimo_api: {
    label: '小米 Mimo API',
    endpoint: 'https://api.xiaomimimo.com/v1',
    suggest_model: ['mimo-v2.5', 'mimo-v2-pro', 'mimo-v2-flash'],
    website: 'https://platform.xiaomimimo.com/docs/zh-CN/welcome'
  },
  custom: {
    label: '自定义',
    endpoint: '',
    suggest_model: []
  }
} as const;

const DEFAULT_SETTINGS: AISettings = {
  endpoint: '',
  apiKey: '',
  model: '',
};

/**
 * Backwards-compatible hook.  State now lives in the centralized zustand
 * store so that restores from WebDAV / file import immediately reflect in
 * the UI without a reload.
 *
 * `DEFAULT_SETTINGS` is kept for documentation purposes — the store
 * initializes with the same defaults.
 */
export function useAISettings() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _defaults = DEFAULT_SETTINGS;
  const settings = useAppStore(s => s.aiSettings);
  const saveSettings = useAppStore(s => s.setAISettings);
  return { settings, saveSettings };
}
