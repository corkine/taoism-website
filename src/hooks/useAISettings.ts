import { useState, useCallback } from 'react';

export interface AISettings {
  endpoint: string;
  apiKey: string;
  model: string;
}

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
  }
} as const;

const STORAGE_KEY = 'daoism_ai_settings';

const DEFAULT_SETTINGS: AISettings = {
  endpoint: '',
  apiKey: '',
  model: '',
};

export function useAISettings() {
  const [settings, setSettingsState] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch { }
    return DEFAULT_SETTINGS;
  });

  const saveSettings = useCallback((next: AISettings) => {
    setSettingsState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { }
  }, []);

  return { settings, saveSettings };
}
