export function formatTime(iso: string) {
    try {
        return new Date(iso).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return iso;
    }
}

/** Format an ISO timestamp as a Chinese relative phrase (e.g. "3 分钟前"). */
export function formatRelativeTime(iso: string): string {
    try {
        const then = new Date(iso).getTime();
        if (Number.isNaN(then)) return iso;
        const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
        if (diffSec < 10) return '刚刚';
        if (diffSec < 60) return `${diffSec} 秒前`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} 分钟前`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour} 小时前`;
        const diffDay = Math.floor(diffHour / 24);
        if (diffDay < 7) return `${diffDay} 天前`;
        return formatTime(iso);
    } catch {
        return iso;
    }
}