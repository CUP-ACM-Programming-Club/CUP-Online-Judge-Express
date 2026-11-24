/**
 * 组装根：contest 领域的端口绑定。由 main/compose.ts 引入。
 */
import { bindPort } from "../../application/ports/registry";
import { lazy } from "./lazy";
import { contestRepository } from "../../application/ports/ContestRepository";
import { contestCache } from "../../application/ports/ContestCache";
import { adminContestRepository } from "../../application/ports/AdminContestRepository";
import { scoreboardRepository } from "../../application/ports/ScoreboardRepository";
import { scoreboardCache } from "../../application/ports/ScoreboardCache";
import { contestCheatRepository } from "../../application/ports/ContestCheatRepository";
import { contestCheatingRecorder } from "../../application/ports/ContestCheatingRecorder";
import { contestAssistantRepository } from "../../application/ports/ContestAssistantRepository";
import { contestSetRepository } from "../../application/ports/ContestSetRepository";
import { contestProblemInfoLookup } from "../../application/ports/ContestProblemInfoLookup";
import { provideContestAssistantLookup } from "../../domain/policy/predicates";

/** CommonJS / ES 模块的默认导出（与 TS esModuleInterop 的 `import X from` 相同）。 */
function defaultExport(mod: any) {
	return mod && mod.__esModule ? mod.default : mod;
}

/**
 * 每次访问都重新 require 的实现代理（不缓存模块对象）。
 * 助教查询沿用原 domain/policy/predicates 的做法：调用时才取 ContestAssistantManager，
 * 这样按模块路径（Module._load）替换它的单元测试照常生效。
 */
function resolvedOnEachCall<T extends object>(load: () => T): T {
	return new Proxy({} as T, {
		get: (_t, prop) => {
			const impl: any = load();
			const value = impl[prop];
			return typeof value === "function" ? value.bind(impl) : value;
		},
		has: (_t, prop) => prop in load()
	});
}

bindPort(contestRepository, lazy(() => defaultExport(require("../../infrastructure/persistence/contest/MySqlContestRepository"))));
bindPort(contestCache, lazy(() => require("../../infrastructure/cache/pools/ContestCachePool")));
bindPort(adminContestRepository, lazy(() => defaultExport(require("../../infrastructure/persistence/contest/MySqlAdminContestRepository"))));
bindPort(scoreboardRepository, lazy(() => defaultExport(require("../../infrastructure/persistence/contest/MySqlScoreboardRepository"))));
bindPort(scoreboardCache, lazy(() => require("../../infrastructure/cache/cache-helper")));
bindPort(contestCheatRepository, lazy(() => defaultExport(require("../../infrastructure/persistence/contest/MySqlContestCheatRepository"))));
bindPort(contestCheatingRecorder, lazy(() => defaultExport(require("../../application/contest/cheating_ban"))));
bindPort(contestAssistantRepository, resolvedOnEachCall(() => defaultExport(require("../../infrastructure/persistence/contest/ContestAssistantManager"))));
bindPort(contestSetRepository, lazy(() => defaultExport(require("../../infrastructure/persistence/contestset/MySqlContestSetRepository"))));
bindPort(contestProblemInfoLookup, lazy(() => defaultExport(require("../../infrastructure/persistence/contest/ContestProblemInfoLookupAdapter"))));

// domain 的助教谓词经 application 端口查询
provideContestAssistantLookup((cid, userId) => contestAssistantRepository.userIsContestAssistant(cid, userId));
