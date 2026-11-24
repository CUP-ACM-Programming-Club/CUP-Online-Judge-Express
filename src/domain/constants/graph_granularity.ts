/**
 * 提交统计图表的时间粒度（纯常量 / 纯函数）。
 * 原在 interfaces/http/routes/status/graph_data_optimizer.ts。
 */

// 时间粒度常量
export const TIME_GRANULARITY = {
    MONTH: 'month',
    DAY: 'day',
    HOUR: 'hour',
    MINUTE: 'minute',
    SECOND: 'second'
};

/**
 * 将粒度映射到索引 (用于与现有代码兼容)
 */
export function indexToGranularity(idx: number): string {
    const map = [
        TIME_GRANULARITY.MONTH,  // 0
        TIME_GRANULARITY.DAY,    // 1
        TIME_GRANULARITY.HOUR,   // 2
        TIME_GRANULARITY.MINUTE, // 3
        TIME_GRANULARITY.SECOND  // 4
    ];
    return map[idx] || TIME_GRANULARITY.MONTH;
}

/**
 * 获取图表标签
 */
export function getGraphLabel(granularity: string): string[] {
    switch (granularity) {
        case TIME_GRANULARITY.MONTH: return ["year", "month"];
        case TIME_GRANULARITY.DAY: return ["month", "day"];
        case TIME_GRANULARITY.HOUR: return ["day", "hour"];
        case TIME_GRANULARITY.MINUTE: return ["hour", "minute"];
        case TIME_GRANULARITY.SECOND: return ["minute", "second"];
        default: return ["year", "month"];
    }
}
