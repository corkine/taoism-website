import { useState, useRef, useCallback } from 'react';
import type { AISettings } from './useAISettings';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat(settings: AISettings) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (userText: string, systemPrompt?: string) => {
      if (!settings.endpoint || !settings.apiKey || !settings.model) {
        setError('请先在设置中配置 API 端点、密钥和模型名称');
        return;
      }

      const userMsg: Message = { role: 'user', content: userText };
      const newMessages: Message[] = [...messages, userMsg];
      setMessages(newMessages);
      setError(null);
      setIsStreaming(true);

      // placeholder for assistant
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const body: any = {
          model: settings.model,
          stream: true,
          messages: [
            ...(systemPrompt
              ? [{ role: 'system', content: systemPrompt }]
              : []),
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        };

        const res = await fetch(
          settings.endpoint.replace(/\/$/, '') + '/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${settings.apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let partial = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          partial += decoder.decode(value, { stream: true });
          const lines = partial.split('\n');
          partial = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const delta = json.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  setMessages(prev => {
                    const copy = [...prev];
                    copy[copy.length - 1] = {
                      role: 'assistant',
                      content: copy[copy.length - 1].content + delta,
                    };
                    return copy;
                  });
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? '请求失败');
          // Remove the empty assistant placeholder on error
          setMessages(prev => {
            const copy = [...prev];
            if (
              copy.length > 0 &&
              copy[copy.length - 1].role === 'assistant' &&
              copy[copy.length - 1].content === ''
            ) {
              copy.pop();
            }
            return copy;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, settings]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages };
}
