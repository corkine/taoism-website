import React, { useState, useEffect } from 'react';
import { X, Settings, ExternalLink } from 'lucide-react';
import { AI_PRESETS } from '../utils/prompt';
import type { AISettings } from '../types';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

type PresetKey = keyof typeof AI_PRESETS;

/** Find which preset matches the current endpoint, if any */
function matchPreset(endpoint: string): PresetKey | null {
  for (const key of Object.keys(AI_PRESETS) as PresetKey[]) {
    if (AI_PRESETS[key].endpoint === endpoint.trim()) return key;
  }
  return null;
}

export function AISettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: AISettingsModalProps) {
  const [draft, setDraft] = useState<AISettings>(settings);

  useEffect(() => {
    if (isOpen) setDraft(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const applyPreset = (key: PresetKey) => {
    setDraft(prev => ({
      ...prev,
      endpoint: AI_PRESETS[key].endpoint,
      // clear model so user picks from suggestions
      model: '',
    }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  // Show model suggestions for whichever preset matches the current endpoint
  const matchedPreset = matchPreset(draft.endpoint);
  const suggestedModels: readonly string[] = matchedPreset
    ? AI_PRESETS[matchedPreset].suggest_model
    : [];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md shadow-2xl"
        style={{
          background: '#FDFBF7',
          borderTop: '4px solid #A63A2B',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <Settings size={16} className="text-[#A63A2B]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[#1A1A1A] font-sans">
              AI 设置
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C8471] hover:text-[#1A1A1A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="px-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest text-[#8C8471] font-sans font-bold">
              快速预设
            </p>
            {/* Website link for the active preset */}
            {matchedPreset && 'website' in AI_PRESETS[matchedPreset] && (
              <a
                href={(AI_PRESETS[matchedPreset] as any).website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-[#A63A2B] hover:underline font-sans font-bold transition-colors"
              >
                {AI_PRESETS[matchedPreset].label} 官方网站
                <ExternalLink size={10} />
              </a>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(AI_PRESETS) as PresetKey[]).map(key => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`text-[11px] px-3 py-1.5 border transition-colors font-sans font-bold tracking-wide ${matchedPreset === key
                  ? 'border-[#A63A2B] text-[#A63A2B] bg-[#A63A2B]/5'
                  : 'border-[#E2DED0] text-[#8C8471] hover:border-[#A63A2B] hover:text-[#A63A2B]'
                  }`}
              >
                {AI_PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="px-8 pb-8 space-y-5">
          {/* Endpoint */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1.5">
              API 端点
            </label>
            <input
              type="text"
              value={draft.endpoint}
              onChange={e => setDraft(prev => ({ ...prev, endpoint: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1.5">
              API Key
            </label>
            <input
              type="password"
              value={draft.apiKey}
              onChange={e => setDraft(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
            />
          </div>

          {/* Model */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#A63A2B] font-sans font-bold block mb-1.5">
              模型名称
            </label>
            <input
              type="text"
              value={draft.model}
              onChange={e => setDraft(prev => ({ ...prev, model: e.target.value }))}
              placeholder="自行填入模型名称"
              className="w-full bg-transparent border-b-2 border-[#E2DED0] py-2 focus:border-[#A63A2B] outline-none text-sm font-sans text-[#1A1A1A] placeholder:text-[#C8C4B7]"
            />

            {/* Suggested models for matched preset */}
            {suggestedModels.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-[#8C8471] font-sans self-center">
                  建议：
                </span>
                {suggestedModels.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, model: m }))}
                    className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors font-sans ${draft.model === m
                      ? 'border-[#A63A2B] text-[#A63A2B] bg-[#A63A2B]/5 font-bold'
                      : 'border-[#E2DED0] text-[#8C8471] hover:border-[#A63A2B] hover:text-[#A63A2B]'
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-2 font-sans">
            <button
              onClick={onClose}
              className="text-[10px] uppercase tracking-widest font-bold text-[#8C8471] hover:text-[#1A1A1A] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="text-[10px] uppercase tracking-widest font-bold px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#A63A2B] transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
