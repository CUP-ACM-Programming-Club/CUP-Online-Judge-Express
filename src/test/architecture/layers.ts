/**
 * Clean Architecture 依赖规则（由 dependency-rule.test.ts 强制）。
 *
 *   interfaces ─┐
 *               ├─▶ application ─▶ domain
 *   infrastructure ┘        (ports)
 *
 * - domain：业务规则与概念（常量、枚举、错误、权限谓词、隐私规则）。不依赖任何外层，也不碰 I/O。
 * - application：用例。只依赖 domain 和自己声明的端口（application/ports）；
 *   数据库、缓存、判题机、推送等具体实现由 infrastructure 提供，在 main 里装配。
 * - infrastructure：端口的实现（MySQL、Redis、ORM、文件、判题机客户端、配置、日志）。
 * - interfaces：HTTP 路由/中间件、WebSocket 处理。只调 application（和 domain），不直接碰 infrastructure。
 * - main（含 bin/ 和 app.ts）：组装根，可以依赖所有层。
 * - shared：无业务含义、无 I/O 的通用小工具，任何层都可用。
 */
import * as path from "path";

export type Layer = "domain" | "application" | "infrastructure" | "interfaces" | "main" | "shared" | "types" | "test";

export const SRC_ROOT = path.resolve(__dirname, "..", "..");

export function layerOf(absFile: string): Layer | null {
	const rel = path.relative(SRC_ROOT, absFile).replace(/\\/g, "/");
	if (rel.startsWith("..")) return null;
	const top = rel.split("/")[0];
	if (top === "bin" || top === "app.ts" || top === "main") return "main";
	if (["domain", "application", "infrastructure", "interfaces", "shared", "types", "test"].includes(top)) return top as Layer;
	return null;
}

/** 每层允许依赖的层（自己总是允许）。 */
export const ALLOWED: Record<Layer, Layer[]> = {
	shared: ["shared", "types"],
	domain: ["domain", "shared", "types"],
	application: ["application", "domain", "shared", "types"],
	infrastructure: ["infrastructure", "application", "domain", "shared", "types"],
	interfaces: ["interfaces", "application", "domain", "shared", "types"],
	main: ["main", "interfaces", "infrastructure", "application", "domain", "shared", "types"],
	types: ["types", "domain", "shared"],
	test: ["test", "main", "interfaces", "infrastructure", "application", "domain", "shared", "types"]
};

/** infrastructure 依赖 application 时，只能依赖端口（接口声明），不能依赖用例实现。 */
export function isAllowedEdge(fromLayer: Layer, toLayer: Layer, toRel: string): boolean {
	if (!ALLOWED[fromLayer].includes(toLayer)) return false;
	if (fromLayer === "infrastructure" && toLayer === "application") return toRel.startsWith("application/ports/");
	return true;
}

/**
 * domain / application 不允许直接使用的框架与 I/O 包：这些只能出现在 infrastructure / interfaces / main。
 * （express 的 req 由 interfaces 以 domain/policy/Viewer 的结构传给用例。）
 */
export const FORBIDDEN_PACKAGES: Partial<Record<Layer, string[]>> = (() => {
	const io = ["express", "express-session", "connect-redis", "socket.io", "socket.io-client", "mysql", "mysql2",
		"redis", "sequelize", "sequelize-typescript", "fs", "fs/promises", "log4js", "axios", "memcached",
		"node-cache", "rimraf", "child_process", "http", "https", "inversify"];
	return { domain: io, application: io, shared: io };
})();
