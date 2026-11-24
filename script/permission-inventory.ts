/**
 * 生成路由权限清单：加载真实路由树（测试 mock 环境），遍历 express 栈，
 * 列出每个 method + path 以及挂载链上的中间件（门禁）。
 *
 * 用法：
 *   TS_NODE_TRANSPILE_ONLY=1 NODE_ENV=autotest node -r ts-node/register \
 *     -r ./src/test/setup/mock-external.ts script/permission-inventory.ts [--json out.json]
 * 默认写 docs/permission-matrix.md。
 */
/* eslint-disable no-console */
import path from "path";

const express = require("express");
const RouterProto = require("express/lib/router");

// 给 router.use 新增的 layer 打上挂载路径，便于还原完整路径
const originalUse = RouterProto.use;
RouterProto.use = function (this: any, ...args: any[]) {
	const before = this.stack.length;
	const mountPath = typeof args[0] === "string" ? args[0] : "/";
	const ret = originalUse.apply(this, args);
	for (let i = before; i < this.stack.length; i++) {
		this.stack[i].__mountPath = mountPath;
	}
	return ret;
};

const src = path.resolve(__dirname, "..", "src");
const auth = require(path.join(src, "middleware/auth")).default;
const admin = require(path.join(src, "middleware/admin"));
const InitMiddleware = require(path.join(src, "middleware/init/InitMiddleware")).default;
const knownGates = new Map<any, string>([
	[auth, "auth"],
	[admin, "admin"],
	[InitMiddleware, "init-only"],
	[require(path.join(src, "module/problemset/interceptor")), "switch:enable_problemset(admin bypass)"],
	[require(path.join(src, "module/tutorial/interceptor")).default, "switch:enable_tutorial(admin bypass)"],
	[require(path.join(src, "module/discuss/interceptor")), "switch:enable_discuss(admin bypass)"],
	[require(path.join(src, "module/status/problem/SolveMapInterceptor")), "switch:enable_solvemap(admin bypass)"],
]);

function gateName(fn: any): string {
	if (knownGates.has(fn)) {
		return knownGates.get(fn)!;
	}
	if (fn && fn.name && fn.name !== "router" && fn.name !== "handle") {
		return fn.name;
	}
	return "inline";
}

const app = express();
require(path.join(src, "module/init/express_loader"))(app);

interface Entry { method: string; path: string; gates: string[] }
const entries: Entry[] = [];

function join(a: string, b: string) {
	const s = (a + "/" + b).replace(/\/+/g, "/");
	return s.length > 1 ? s.replace(/\/$/, "") : s;
}

function applies(mount: string, rest: string) {
	return mount === "/" || rest === mount || rest.startsWith(mount.endsWith("/") ? mount : mount + "/");
}

function walk(stack: any[], prefix: string, inherited: string[]) {
	const local: { mount: string; name: string }[] = [];
	for (const layer of stack) {
		const mount = layer.__mountPath || "/";
		if (layer.route) {
			const routePath = layer.route.path;
			const gates = inherited.concat(local.filter(m => applies(m.mount, routePath)).map(m => m.name));
			const routeStack = layer.route.stack;
			const routeGates = routeStack.slice(0, -1).map((l: any) => gateName(l.handle));
			const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
			for (const method of methods) {
				entries.push({ method, path: join(prefix, routePath), gates: gates.concat(routeGates) });
			}
		} else if (layer.handle && Array.isArray(layer.handle.stack)) {
			const gates = inherited.concat(local.filter(m => applies(m.mount, mount)).map(m => m.name));
			walk(layer.handle.stack, join(prefix, mount), gates);
		} else if (layer.name === "serveStatic") {
			entries.push({ method: "GET", path: join(prefix, mount) + "/*", gates: inherited.concat(["static"]) });
		} else {
			local.push({ mount, name: gateName(layer.handle) });
		}
	}
}

walk(app._router.stack, "/", []);

// 去掉 /api 镜像与 router_loader 子目录双挂载造成的重复：同一 method+path 只保留第一次注册（express 先匹配者生效）
const firstByKey = new Map<string, Entry>();
for (const e of entries) {
	if (e.path === "/api" || e.path.startsWith("/api/")) {
		continue;
	}
	const key = `${e.method} ${e.path}`;
	if (!firstByKey.has(key)) {
		firstByKey.set(key, e);
	}
}
const apiMirrored = entries.some(e => e.path.startsWith("/api/"));
const IGNORED = new Set(["query", "expressInit", "multerMiddleware"]);
const unique = Array.from(firstByKey.values()).map(e => ({
	method: e.method,
	path: e.path,
	gates: e.gates.filter((g, i, arr) => !IGNORED.has(g) && arr.indexOf(g) === i)
}));

// 遮蔽检测：同一 method 下，先注册的带参数路由能匹配后注册的字面路由
const pathToRegexp = require("path-to-regexp");
const shadowed = new Map<string, string>();
unique.forEach((later, j) => {
	if (later.path.includes(":")) {
		return;
	}
	for (let i = 0; i < j; i++) {
		const earlier = unique[i];
		if (earlier.method !== later.method || !earlier.path.includes(":")) {
			continue;
		}
		if (pathToRegexp(earlier.path, [], { end: true, strict: false }).test(later.path)) {
			shadowed.set(`${later.method} ${later.path}`, `${earlier.method} ${earlier.path}`);
			break;
		}
	}
});

const { ANNOTATIONS, CROSS_CUTTING } = require("./permission-annotations");

function autoRequirement(gates: string[]) {
	if (gates.includes("init-only")) {
		return "init-only";
	}
	if (gates.includes("admin")) {
		return "admin";
	}
	if (gates.includes("uploadPrivilege")) {
		return "admin | editor";
	}
	if (gates.includes("privilegeMiddleware")) {
		return "contest-privileged";
	}
	if (gates.includes("auth")) {
		return "login";
	}
	return "anonymous";
}

function category(req: string) {
	if (/^anonymous/.test(req)) return "anonymous";
	if (/^init-only/.test(req)) return "init-only";
	if (/^admin($|（)/.test(req)) return "admin";
	if (/^admin \| editor/.test(req)) return "admin | editor";
	if (/^admin \| source_browser/.test(req)) return "admin | source_browser";
	if (/contest-access|contest_manager|assistant|maker/.test(req)) return "contest-specific";
	if (/owner|source-privilege/.test(req)) return "owner / source-privilege";
	if (/^login/.test(req)) return "login";
	return "other";
}

const rows = unique.map(e => {
	const key = `${e.method} ${e.path}`;
	const ann = ANNOTATIONS[key] || {};
	let req = autoRequirement(e.gates);
	// setting.ts 的 router.use 内联管理员检查
	if (e.path.startsWith("/setting/")) {
		req = "admin";
	}
	if (ann.req) {
		req = ann.req;
	}
	const flags: string[] = [];
	if (shadowed.has(key)) {
		flags.push(`被 ${shadowed.get(key)} 遮蔽`);
	}
	if (ann.flag) {
		flags.push(ann.flag);
	}
	return { ...e, req, category: category(req), note: ann.note || "", flag: flags.join("；"), fixed: ann.fixed || "" };
});

const unusedAnnotations = Object.keys(ANNOTATIONS).filter(k => !firstByKey.has(k));

const fs = require("fs");
const jsonIdx = process.argv.indexOf("--json");
if (jsonIdx !== -1) {
	fs.writeFileSync(process.argv[jsonIdx + 1], JSON.stringify({ apiMirrored, rows, unusedAnnotations }, null, 2));
	process.exit(0);
}

const counts: Record<string, number> = {};
rows.forEach(r => counts[r.category] = (counts[r.category] || 0) + 1);
const esc = (s: string) => s.replace(/\|/g, "\\|");
const out: string[] = [];
out.push("# 权限矩阵（路由清单）");
out.push("");
out.push("> 本文件由 `script/permission-inventory.ts` 从真实路由树生成（门禁列来自挂载链，handler 内判断来自 `script/permission-annotations.ts` 手工标注）。");
out.push("> 修改路由或权限后重新生成：");
out.push("> `TS_NODE_TRANSPILE_ONLY=1 NODE_ENV=autotest node -r ts-node/register -r ./src/test/setup/mock-external.ts script/permission-inventory.ts`");
out.push("");
out.push(`- 路由总数（method + path，去重）：**${rows.length}**；${apiMirrored ? "顶层路由均由 router_loader 同时挂在 `/x` 与 `/api/x`，下表只列 `/x`。" : ""}`);
out.push("- 计数（按有效要求归类）：");
Object.keys(counts).sort().forEach(k => out.push(`  - ${k}: ${counts[k]}`));
out.push(`- 标记的不一致 / 疑似漏洞：**${rows.filter(r => r.flag).length}** 条（其中本阶段已修复 ${rows.filter(r => r.fixed).length} 条，见“已修复”列）`);
if (unusedAnnotations.length) {
	out.push(`- 注意：以下标注没有对应路由：${unusedAnnotations.join(", ")}`);
}
out.push("");
out.push("术语：");
out.push("- `login` = 经 `auth` 中间件（含 ban_check、contest_mode 刷新）；`admin` = `session.isadmin`；`editor` / `source_browser` / `contest_manager` 为全局权限位。");
out.push("- `contest-access(cid)` = `ContestService.checkContestAccess`：admin 或 maker(m<cid>) 直接放行；否则 contest_mode 与 cmod_visible 必须一致；defunct 需 contest_manager | c<cid> | assistant；未开始拒绝；private 需 contest_manager | c<cid> | assistant。");
out.push("- `assistant(cid)` = `ContestAssistantManager.userIsContestAssistant`（比赛助教或所属专题助教，缓存 1 小时）。");
out.push("- `source-privilege(sid)` = `SourcePrivilegeCache.checkPrivilege`：admin | source_browser | 该提交所属比赛的 assistant（缓存 10 秒）。");
out.push("- `switch:*` = 功能开关拦截器，admin 绕过。");
out.push("");
out.push("| Method | Path | 挂载链门禁 | 有效要求 | 说明 | 不一致 / 疑似漏洞 | 已修复 |");
out.push("|---|---|---|---|---|---|---|");
for (const r of rows) {
	out.push(`| ${r.method} | \`${esc(r.path)}\` | ${esc(r.gates.join(" → ") || "-")} | ${esc(r.req)} | ${esc(r.note)} | ${esc(r.flag)} | ${esc(r.fixed)} |`);
}
out.push("");
out.push("## 横切问题（不属于单个路由）");
out.push("");
for (const c of CROSS_CUTTING) {
	out.push(`- **${c.title}**${c.fixed ? `（已修复：${c.fixed}）` : ""}：${c.detail}`);
}
out.push("");
const target = path.resolve(__dirname, "..", "docs", "permission-matrix.md");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out.join("\n"));
process.stderr.write(`written ${target} (${rows.length} routes)\n`);
process.exit(0);
