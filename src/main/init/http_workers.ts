import os from "os";

export const HTTP_WORKERS_DEFAULT = 8;
export const HTTP_WORKERS_CAP = 32;

function parsePositiveInt(value: any): number | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    const str = String(value).trim();
    if (!/^\d+$/.test(str)) {
        return null;
    }
    const num = parseInt(str, 10);
    return num > 0 ? num : null;
}

export interface HttpWorkerDecision {
    count: number;
    source: "env" | "config" | "default";
}

/**
 * 决定 HTTP worker 数量：
 * 环境变量 KC_HTTP_WORKERS（正整数）> config.http_workers（正整数）> 默认 8，
 * 最终不超过 32，也不超过 CPU 核数。
 */
export function resolveHttpWorkers(
    env: NodeJS.ProcessEnv = process.env,
    config: any = global.config,
    cpuCount: number = os.cpus().length
): HttpWorkerDecision {
    let count: number;
    let source: HttpWorkerDecision["source"];
    const fromEnv = parsePositiveInt(env.KC_HTTP_WORKERS);
    const fromConfig = parsePositiveInt(config ? config.http_workers : undefined);
    if (fromEnv !== null) {
        count = fromEnv;
        source = "env";
    } else if (fromConfig !== null) {
        count = fromConfig;
        source = "config";
    } else {
        count = HTTP_WORKERS_DEFAULT;
        source = "default";
    }
    count = Math.min(count, HTTP_WORKERS_CAP, Math.max(cpuCount || 1, 1));
    return { count, source };
}
