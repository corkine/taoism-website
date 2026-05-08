import React from 'react';
import type { SyncState } from '../types';
import { formatRelativeTime, formatTime } from '../utils/time';

interface SyncStatusDotProps {
  syncState: SyncState;
  isDirty: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * 同步状态圆点指示器：
 * - 橘黄色：有本地暂存更改（未同步）
 * - 绿色：已同步成功
 * - 红色：需要手动处理（冲突或同步失败）
 * 同步中会呈现脉冲动画，点击触发同步（同步中禁用）。
 */
export const SyncStatusDot = React.memo(({
  syncState,
  isDirty,
  onClick,
  className = '',
}: SyncStatusDotProps) => {
  const isConflict = syncState.status === 'conflict';
  const isError = syncState.status === 'error';
  const isSyncing = syncState.status === 'syncing';
  const isSuccess = syncState.status === 'success';

  let color: 'orange' | 'green' | 'red' | null = null;
  let label = '';
  if (isConflict) {
    color = 'red';
    label = (syncState.message || '检测到冲突') + '\n点击打开备份面板手动处理';
  } else if (isError) {
    color = 'red';
    label = (syncState.message || '同步失败') + '\n点击重试';
  } else if (isDirty) {
    color = 'orange';
    label = isSyncing ? '正在同步数据...' : '有本地未同步的变更，点击同步';
  } else if (isSuccess && syncState.lastSyncTime) {
    color = 'green';
    label = '同步成功' +
      (syncState.message ? ` · ${syncState.message}` : '') +
      `\n时间：${formatTime(syncState.lastSyncTime)}（${formatRelativeTime(syncState.lastSyncTime)}）` +
      '\n点击再次同步';
  }

  if (!color) return null;

  const dotClass =
    color === 'orange'
      ? 'bg-[#F59E0B]'
      : color === 'green'
      ? 'bg-[#2D7A5B]'
      : 'bg-[#A63A2B]';

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={isSyncing ? undefined : onClick}
      className={`flex items-center justify-center rounded-full ${isSyncing ? 'cursor-wait opacity-70' : 'cursor-pointer hover:opacity-80'} ${className}`}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${dotClass} ${isSyncing ? 'animate-pulse' : ''}`} />
    </button>
  );
});
