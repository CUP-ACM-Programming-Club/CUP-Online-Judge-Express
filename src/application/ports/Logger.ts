/** 日志端口。实现：infrastructure/logging/log4jsLogger（main/compose 绑定）。 */
export interface AppLogger {
	trace(...args: any[]): void;
	debug(...args: any[]): void;
	info(...args: any[]): void;
	warn(...args: any[]): void;
	error(...args: any[]): void;
	fatal(...args: any[]): void;
}

export interface LoggerFactory {
	logger(category: string, level: string): AppLogger;
}

import { definePort } from "./registry";
export const loggerFactory = definePort<LoggerFactory>("LoggerFactory");

/** 惰性取 logger：模块加载时还没绑定也没关系，第一次写日志时才解析。 */
export function getLogger(category: string, level = "info"): AppLogger {
	let cached: AppLogger | undefined;
	const resolve = () => (cached = cached || loggerFactory.logger(category, level));
	return {
		trace: (...a) => resolve().trace(...a),
		debug: (...a) => resolve().debug(...a),
		info: (...a) => resolve().info(...a),
		warn: (...a) => resolve().warn(...a),
		error: (...a) => resolve().error(...a),
		fatal: (...a) => resolve().fatal(...a)
	};
}
