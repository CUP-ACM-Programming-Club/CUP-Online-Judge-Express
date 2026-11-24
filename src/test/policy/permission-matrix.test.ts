/**
 * 权限矩阵测试：角色 × 代表性接口，锁定“允许 / 拒绝（以及拒绝形态）”与权限相关的响应字段。
 *
 * - 走真实路由树（router_loader + 全部中间件），数据库落在 fake-db，session 存在内存。
 * - 期望值先针对重构前的代码写出并通过，之后的权限集中化重构必须保持全绿。
 * - outcome 取值：
 *     ok              HTTP 200 且 body.status === "OK"（或非 JSON 的 200 下载）
 *     nologin         {statement: "not login"}
 *     deny            {statement: "Permission denied"}（HTTP 200）
 *     contest_mode    {contest_mode: true}
 *     err:<statement> 其他 HTTP 200 的 error
 *     <code>:<stmt>   非 200（如 403:Permission denied）
 *   期望里写 "pass" 表示“过了权限门”（不是 nologin / deny / contest_mode / 403），用于后续数据处理在 fake-db 下不稳定的接口。
 */
import "../setup/mock-external";
import { expect } from "chai";
import dayjs from "dayjs";

const sinon = require("sinon");
const express = require("express");
const supertest = require("supertest");
const fakeDb = require("../mocks/fake-db");

type Role = "anon" | "student" | "contestant" | "assistant" | "maker" | "cmanager" | "editor" | "sbrowser" | "admin";
const ROLES: Role[] = ["anon", "student", "contestant", "assistant", "maker", "cmanager", "editor", "sbrowser", "admin"];
const LOGGED_IN: Role[] = ROLES.filter(r => r !== "anon");
const USER: Record<Role, string> = {
	anon: "",
	student: "pm_student",
	contestant: "pm_contestant",
	assistant: "pm_assistant",
	maker: "pm_maker",
	cmanager: "pm_cmanager",
	editor: "pm_editor",
	sbrowser: "pm_sbrowser",
	admin: "pm_admin"
};
// 密码 123456
const PASSWORD_HASH = "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1";

// 比赛 / 题目 / 提交 编号
const C_PUBLIC = 7001, C_PRIVATE = 7002, C_FUTURE = 7003, C_HIDDEN = 7004, C_ENDED = 7005;
const P_FREE = 7100, P_DEFUNCT = 7101, P_IN_PRIVATE = 7102, P_IN_FUTURE = 7103, P_IN_PUBLIC = 7104;
const S_STUDENT = 7201, S_CONTESTANT = 7202, S_EDITOR_SHARED = 7203, S_OTHER_IN_CONTEST = 7205;
const ARTICLE = 7301, ARTICLE_DEFUNCT = 7302;

function fmt(d: dayjs.Dayjs) {
	return d.format("YYYY-MM-DD HH:mm:ss");
}

function table(name: string): any[] {
	if (!fakeDb.tables[name]) {
		fakeDb.tables[name] = [];
	}
	return fakeDb.tables[name];
}

function seed() {
	const now = dayjs();
	const users = table("users");
	for (const role of LOGGED_IN) {
		users.push({ user_id: USER[role], password: PASSWORD_HASH, newpassword: null, nick: role, email: `${role}@example.com`, avatar: 0, avatarUrl: null, solved: 1, submit: 1, defunct: "N" });
	}
	users.push({ user_id: "pm_other", password: PASSWORD_HASH, nick: "other", email: "other@example.com", solved: 0, submit: 0, defunct: "N" });

	const privilege = table("privilege");
	privilege.push(
		{ user_id: USER.admin, rightstr: "administrator", defunct: "N" },
		{ user_id: USER.editor, rightstr: "editor", defunct: "N" },
		{ user_id: USER.sbrowser, rightstr: "source_browser", defunct: "N" },
		{ user_id: USER.cmanager, rightstr: "contest_manager", defunct: "N" },
		{ user_id: USER.contestant, rightstr: `c${C_PRIVATE}`, defunct: "N" },
		{ user_id: USER.maker, rightstr: `m${C_PRIVATE}`, defunct: "N" },
		{ user_id: "pm_other", rightstr: `c${C_PRIVATE}`, defunct: "N" }
	);
	table("contest_assistant").push({ contest_id: C_PRIVATE, user_id: USER.assistant });

	const running = { start_time: fmt(now.subtract(1, "hour")), end_time: fmt(now.add(1, "hour")) };
	const base = { title: "pm", description: "", password: "", langmask: 0, cmod_visible: 0, vjudge: 0, limit_hostname: null, ip_policy: null, maker: "pm_admin", showSim: 0 };
	table("contest").push(
		{ ...base, ...running, contest_id: C_PUBLIC, private: 0, defunct: "N" },
		{ ...base, ...running, contest_id: C_PRIVATE, private: 1, defunct: "N" },
		{ ...base, contest_id: C_FUTURE, start_time: fmt(now.add(1, "day")), end_time: fmt(now.add(2, "day")), private: 0, defunct: "N" },
		{ ...base, ...running, contest_id: C_HIDDEN, private: 0, defunct: "Y" },
		{ ...base, contest_id: C_ENDED, start_time: fmt(now.subtract(2, "day")), end_time: fmt(now.subtract(1, "day")), private: 0, defunct: "N" }
	);
	const problem = { title: "pm", description: "d", input: "", output: "", sample_input: "", sample_output: "", spj: 0, hint: "", source: "src", label: "", time_limit: 1, memory_limit: 128, accepted: 0, submit: 0, solved: 0, in_date: fmt(now) };
	table("problem").push(
		{ ...problem, problem_id: P_FREE, defunct: "N" },
		{ ...problem, problem_id: P_DEFUNCT, defunct: "Y" },
		{ ...problem, problem_id: P_IN_PRIVATE, defunct: "N" },
		{ ...problem, problem_id: P_IN_FUTURE, defunct: "N" },
		{ ...problem, problem_id: P_IN_PUBLIC, defunct: "N" }
	);
	table("contest_problem").push(
		{ contest_id: C_PRIVATE, problem_id: P_IN_PRIVATE, num: 0, oj_name: null, title: "" },
		{ contest_id: C_FUTURE, problem_id: P_IN_FUTURE, num: 0, oj_name: null, title: "" },
		{ contest_id: C_PUBLIC, problem_id: P_IN_PUBLIC, num: 0, oj_name: null, title: "" }
	);
	const sol = { time: 1, memory: 1, in_date: fmt(now.subtract(30, "minute")), result: 4, language: 1, valid: 1, pass_point: 1, code_length: 10, judgetime: fmt(now), pass_rate: 1, judger: "j", fingerprint: "fp", fingerprintRaw: "fpr", topic_id: null };
	table("solution").push(
		{ ...sol, solution_id: S_STUDENT, problem_id: P_FREE, user_id: USER.student, contest_id: null, num: -1, share: 0, ip: "10.0.0.1" },
		{ ...sol, solution_id: S_CONTESTANT, problem_id: P_IN_PRIVATE, user_id: USER.contestant, contest_id: C_PRIVATE, num: 0, share: 0, ip: "10.0.0.2" },
		{ ...sol, solution_id: S_EDITOR_SHARED, problem_id: P_FREE, user_id: USER.editor, contest_id: null, num: -1, share: 1, ip: "10.0.0.3" },
		{ ...sol, solution_id: S_OTHER_IN_CONTEST, problem_id: P_IN_PRIVATE, user_id: "pm_other", contest_id: C_PRIVATE, num: 0, share: 0, ip: "10.0.0.5" }
	);
	for (const id of [S_STUDENT, S_CONTESTANT, S_EDITOR_SHARED, S_OTHER_IN_CONTEST]) {
		table("source_code").push({ solution_id: id, source: `code-${id}` });
		table("source_code_user").push({ solution_id: id, source: `code-${id}`, hash: "h" });
		table("compileinfo").push({ solution_id: id, error: `ce-${id}` });
		table("runtimeinfo").push({ solution_id: id, error: `re-${id}` });
	}
	table("article").push(
		{ article_id: ARTICLE, user_id: USER.student, title: "origin", content: "origin", defunct: "N", create_time: fmt(now), edit_time: fmt(now), last_post: fmt(now) },
		{ article_id: ARTICLE_DEFUNCT, user_id: USER.student, title: "hidden", content: "hidden", defunct: "Y", create_time: fmt(now), edit_time: fmt(now), last_post: fmt(now) }
	);
	table("article_content").push({ comment_id: 1, article_id: ARTICLE, user_id: USER.contestant, content: "reply", in_date: fmt(now) });
	setContestMode(false);
}

/** 用 fake-db 自定义处理器模拟几条 fake-db 解析不了的查询（只模拟数据语义，不含权限判断） */
function registerSqlEmulation() {
	const inRunningContest = (problemId: any) => table("contest_problem").some((cp: any) => String(cp.problem_id) === String(problemId)
		&& table("contest").some((c: any) => c.contest_id === cp.contest_id && dayjs(c.end_time).isAfter(dayjs())));
	const inTutorial = (sid: any) => table("tutorial").some((t: any) => String(t.solution_id) === String(sid));
	// ProblemService.checkProblemInContest / checkProblemContestStatus
	fakeDb.registerHandler((sql: string) => sql.includes("from contest_problem where contest_id in (select contest_id from contest where end_time > NOW())"), (sql: string, params: any[]) =>
		inRunningContest(params[0]) ? [{ problem_id: params[0] }] : []);
	fakeDb.registerHandler((sql: string) => sql.includes("UNIX_TIMESTAMP(end_time) as t from contest"), (sql: string, params: any[]) =>
		table("contest_problem").filter((cp: any) => String(cp.problem_id) === String(params[0]))
			.map((cp: any) => table("contest").find((c: any) => c.contest_id === cp.contest_id))
			.filter(Boolean).map((c: any) => ({ t: dayjs(c.end_time).unix() })));
	// ProblemService.getProblem（admin 分支）
	fakeDb.registerHandler((sql: string) => sql.includes("privilege.user_id as creator"), (sql: string, params: any[]) =>
		table("problem").filter((p: any) => String(p.problem_id) === String(params[0])).map((p: any) => Object.assign({}, p, { creator: null })));
	// GET /source/:source/:id
	fakeDb.registerHandler((sql: string) => /from source_code_user left join\s+solution/.test(sql), (sql: string, params: any[]) =>
		table("solution").filter((s: any) => String(s.solution_id) === String(params[0]))
			.filter((s: any) => params.length < 2 || s.user_id === params[1] || s.share == 1 || inTutorial(s.solution_id))
			.map((s: any) => Object.assign({}, s, { source: (table("source_code_user").find((c: any) => c.solution_id === s.solution_id) || {}).source })));
	// SubmissionService.getSolutionInfo
	fakeDb.registerHandler((sql: string) => sql.includes("as share,time,memory,code_length from solution"), (sql: string, params: any[]) =>
		table("solution").filter((s: any) => String(s.solution_id) === String(params[1])).map((s: any) => ({
			user_id: s.user_id, language: s.language, time: s.time, memory: s.memory, code_length: s.code_length,
			share: (s.share == 1 || inTutorial(s.solution_id)) && !inRunningContest(s.problem_id) ? 1 : 0
		})));
	// StatusService.getStatusList 的主查询
	fakeDb.registerHandler((sql: string) => sql.includes("left join sim on sim.s_id = sol.solution_id"), (sql: string, params: any[]) => {
		let rows = table("solution").slice();
		if (sql.includes("contest_id is null")) {
			rows = rows.filter((s: any) => s.contest_id === null);
		}
		if (/where[^)]*contest_id = \?/.test(sql)) {
			rows = rows.filter((s: any) => String(s.contest_id) === String(params[0]));
		}
		return rows.filter((s: any) => s.problem_id > 0).map((s: any) => Object.assign({}, s, { oj_name: "local" }));
	});
}

function setContestMode(on: boolean) {
	const rows = table("global_setting");
	const row = rows.find((r: any) => r.label === "contest");
	if (row) {
		row.value = on ? "1" : "0";
	} else {
		rows.push({ label: "contest", value: on ? "1" : "0" });
	}
	(global as any).contest_mode = on;
}

function buildApp() {
	const app = express();
	app.use(require("request-ip").mw());
	app.use(require("body-parser").json({ limit: "50mb" }));
	app.use(require("body-parser").urlencoded({ limit: "50mb", extended: true }));
	app.use(require("cookie-parser")());
	app.use(require("../../infrastructure/session/session").sessionMiddleware);
	require("../../main/init/express_loader")(app);
	return app;
}

function outcome(res: any): string {
	const body = res.body || {};
	const statement = body.statement !== undefined ? body.statement : body.statememt;
	if (res.status !== 200) {
		return `${res.status}:${statement}`;
	}
	if (body.status === "error" && body.contest_mode === true) {
		return "contest_mode";
	}
	if (statement === "not login") {
		return "nologin";
	}
	if (body.status === "error" && statement === "Permission denied") {
		return "deny";
	}
	if (body.status === "OK" || body.status === undefined) {
		return "ok";
	}
	return `err:${statement}`;
}

const GATE_FAILURES = /^(nologin|deny|contest_mode|403:.*|401:.*)$/;

interface Case {
	name: string;
	method?: "get" | "post";
	path: string | ((role: Role) => string);
	body?: any | ((role: Role) => any);
	expect: Partial<Record<Role, string>>;
	/** 额外提取权限相关的响应字段，与 extra 比对 */
	extract?: (res: any, role: Role) => any;
	extra?: Partial<Record<Role, any>>;
	roles?: Role[];
	before?: (role: Role) => void | Promise<void>;
}

/** 生成期望：未登录默认 nologin，其余默认 def，再按 overrides 覆盖 */
function e(def: string, overrides: Partial<Record<Role, string>> = {}, anon = "nologin"): Partial<Record<Role, string>> {
	const res: Partial<Record<Role, string>> = { anon };
	for (const role of LOGGED_IN) {
		res[role] = def;
	}
	return Object.assign(res, overrides);
}

/** 只给出值为 true 的角色，其余为 false */
function only(roles: Role[], from: Role[] = LOGGED_IN): Partial<Record<Role, any>> {
	const res: Partial<Record<Role, any>> = {};
	for (const role of from) {
		res[role] = roles.includes(role);
	}
	return res;
}

describe("权限矩阵（角色 × 接口）", function () {
	this.timeout(60000);
	const app = buildApp();
	const agents: Partial<Record<Role, any>> = {};
	const stubs: any[] = [];
	let scoreboardStub: any;

	async function login(role: Role) {
		const agent = supertest.agent(app);
		const msg = Buffer.from(Buffer.from(JSON.stringify({ user_id: USER[role], password: "123456" })).toString("base64")).toString("base64");
		const res = await agent.post("/login").send({ msg });
		expect(res.body.status, `login ${role}: ${JSON.stringify(res.body)}`).to.equal("OK");
		agents[role] = agent;
	}

	function client(role: Role) {
		return role === "anon" ? supertest(app) : agents[role];
	}

	async function call(c: Case, role: Role) {
		const p = typeof c.path === "function" ? c.path(role) : c.path;
		const body = typeof c.body === "function" ? c.body(role) : c.body;
		const req = client(role)[c.method || "get"](p);
		return body !== undefined ? req.send(body) : req;
	}

	async function runCase(c: Case) {
		const roles = c.roles || (Object.keys(c.expect) as Role[]);
		const actual: Partial<Record<Role, string>> = {};
		const expected: Partial<Record<Role, string>> = {};
		const actualExtra: Partial<Record<Role, any>> = {};
		for (const role of ROLES.filter(r => roles.includes(r))) {
			if (c.before) {
				await c.before(role);
			}
			const res = await call(c, role);
			const got = outcome(res);
			const want = c.expect[role]!;
			actual[role] = want === "pass" && !GATE_FAILURES.test(got) ? "pass" : got;
			expected[role] = want;
			if (c.extract && c.extra && Object.prototype.hasOwnProperty.call(c.extra, role)) {
				actualExtra[role] = c.extract(res, role);
			}
		}
		expect(actual, `${c.name} outcome`).to.deep.equal(expected);
		if (c.extra) {
			expect(actualExtra, `${c.name} extra`).to.deep.equal(c.extra);
		}
	}

	before(async function () {
		seed();
		const ContestService = require("../../application/services/ContestService").default;
		stubs.push(sinon.stub(ContestService, "getContestGeneralDetail").resolves({ title: "pm" }));
		const ScoreboardService = require("../../application/services/ScoreboardService").default;
		scoreboardStub = sinon.stub(ScoreboardService, "getScoreboard").callsFake(async () => ({
			status: "OK",
			data: [
				{ user_id: USER.contestant, solution_id: S_CONTESTANT, ip: "10.0.0.2", fingerprint: "a", fingerprintRaw: "a" },
				{ user_id: "pm_other", solution_id: S_OTHER_IN_CONTEST, ip: "10.0.0.5", fingerprint: "b", fingerprintRaw: "b" }
			],
			users: []
		}));
		stubs.push(scoreboardStub);
		stubs.push(sinon.stub(ScoreboardService, "getLineBreakInfo").resolves([]));
		const ProblemManageService = require("../../application/services/ProblemManageService").default;
		stubs.push(sinon.stub(ProblemManageService, "updateProblem").resolves());
		// 以下只替换数据读取（fake-db 无法解析的 SQL / ORM），权限判断仍走真实代码
		const ProblemInfoManager = require("../../infrastructure/persistence/problem/ProblemInfoManager");
		stubs.push(sinon.stub(ProblemInfoManager.prototype, "find").callsFake(async function (this: any) {
			const row = table("problem").find((p: any) => String(p.problem_id) === String(this.problemId));
			return row ? { get: () => Object.assign({}, row) } : null;
		}));
		stubs.push(sinon.stub(require("../../application/services/UserService").default, "getUserProfile").resolves({}));
		stubs.push(sinon.stub(require("../../application/services/TopicService").default, "getTopicDetail").resolves({}));
		registerSqlEmulation();
		for (const role of LOGGED_IN) {
			await login(role);
		}
	});

	after(function () {
		stubs.forEach(s => s.restore());
		fakeDb.clearHandlers();
		setContestMode(false);
	});

	describe("基础", function () {
		it("GET /privilege：只回显 admin 位", async function () {
			await runCase({
				name: "privilege",
				path: "/privilege",
				expect: e("ok"),
				extract: res => res.body.data.admin,
				extra: only(["admin"])
			});
		});

		it("/api 前缀与 /x 镜像（同一门禁）", async function () {
			await runCase({ name: "api mirror", path: "/api/privilege", expect: e("ok") });
		});
	});

	describe("管理员接口（挂载层 admin 门禁）", function () {
		// [method, path, 管理员执行是否安全（只对安全的执行 admin 角色）]
		const ADMIN_ROUTES: [("get" | "post"), string, boolean][] = [
			["get", "/admin/account/ban", true],
			["post", "/admin/account/ban", false],
			["post", "/admin/account/ban/delete", false],
			["post", "/admin/account/check", false],
			["get", "/admin/account/defunct", true],
			["post", "/admin/account/defunct", false],
			["post", "/admin/account/generate/batch", false],
			["get", "/admin/account/invite/all", true],
			["post", "/admin/account/invite/add", false],
			["get", "/admin/account/invite", true],
			["post", "/admin/account/invite/expire", false],
			["get", "/admin/account/list/0", true],
			["post", "/admin/account/password/modify", false],
			["get", "/admin/account/privilege", true],
			["post", "/admin/account/privilege/add", false],
			["post", "/admin/account/privilege/remove", false],
			["get", "/admin/account/teamlist", true],
			["post", "/admin/award/add", false],
			["post", "/admin/award/edit/1", false],
			["get", "/admin/award/get/1", true],
			["get", "/admin/award/list/0", true],
			["post", "/admin/award/remove/1", false],
			["post", "/admin/contest/add", false],
			["post", `/admin/contest/assistant/${C_PRIVATE}`, false],
			["post", "/admin/contest/assistant", false],
			["post", "/admin/contest/assistant/remove", false],
			["get", "/admin/contest/assistant/all", true],
			["get", `/admin/contest/assistant/${C_PRIVATE}`, true],
			["get", "/admin/contest/defunct", true],
			["post", "/admin/contest/defunct", false],
			["get", "/admin/contest/list/0", true],
			["post", "/admin/contestset/add", false],
			["get", "/admin/contestset/defunct", true],
			["post", "/admin/contestset/defunct", false],
			["post", "/admin/contestset/edit", false],
			["get", "/admin/contestset/1", true],
			["get", "/admin/contestset/list/0", true],
			["get", "/admin/problem/data/get/999999/pm-none.in", true],
			["get", "/admin/problem/data/remove/999999/pm-none.in", false],
			["post", "/admin/problem/data/set/999999", false],
			["post", "/admin/problem/data/set/multiple/999999", false],
			["get", "/admin/problem/defunct", true],
			["post", "/admin/problem/defunct", false],
			["get", "/admin/problem/download/data/999999/pm-none.in", true],
			["get", "/admin/problem/list/0", true],
			["post", "/admin/problem/rejudge/contest", false],
			["post", "/admin/problem/rejudge/solution", false],
			["post", "/admin/problem/rejudge/problem", false],
			["get", "/admin/setting", true],
			["get", "/admin/setting/contest", true],
			["post", "/admin/setting", false],
			["get", `/admin/solution/download/contest/${C_PRIVATE}`, true],
			["get", `/admin/solution/download/contest/${C_PRIVATE}/lastAck`, true],
			["get", "/admin/store/mysql_cache", true],
			["get", "/admin/store/mysql_cache/remove/pm", false],
			["get", "/admin/store/mysql_cache/removeAll", false],
			["get", "/admin/system/compile/compile_arguments", true],
			["post", "/admin/system/compile/compile_arguments", false],
			["get", "/admin/system/hot-reload", false],
			["get", "/admin/system/log/out", false],
			["get", "/admin/system/log/err", false],
			["get", "/admin/topic/defunct", true],
			["post", "/admin/topic/defunct", false],
			["get", "/admin/topic/list/0", true],
			["get", "/setting/ban_user", true],
			["get", "/setting/ban_user/pm_student", true],
			["post", "/setting/ban_user", false],
			["get", "/setting/devconfig/config", true],
			["get", "/setting/devconfig/switch", true],
			["post", "/setting/devconfig/config/update", false],
			["post", "/setting/devconfig/switch/update", false],
			["post", "/setting/devconfig/config/delete", false],
			["post", "/setting/devconfig/switch/delete", false],
			["post", "/status/rejudge", false],
			["post", "/status/ban_submission", false],
			["get", `/problem/contest_list/${P_FREE}`, true],
			["post", "/problem/prefile/prepend", false],
			["post", "/problem/prefile/append", false],
			["get", `/export?problem_id=${P_FREE}`, false],
		];

		for (const [method, path, safe] of ADMIN_ROUTES) {
			it(`${method.toUpperCase()} ${path}`, async function () {
				const exp = e("deny", safe ? { admin: "pass" } : {});
				if (!safe) {
					delete exp.admin;
				}
				await runCase({ name: path, method, path, body: {}, expect: exp });
			});
		}

		it("/system/log/login/*：只有 admin 中间件（无 auth），未登录得到 deny 而非 nologin", async function () {
			for (const path of ["/system/log/login/latest", "/system/log/login/user/pm_student"]) {
				await runCase({ name: path, path, expect: e("deny", { admin: "pass" }, "deny") });
			}
		});

		it("POST /admin/contest/assistant/remove：走移除助教（phase5 fix a，之前被 /:topicId 遮蔽）", async function () {
			const ContestAssistantController = require("../../interfaces/http/controllers/ContestAssistantController").default;
			const removeStub = sinon.stub(ContestAssistantController, "removeContestAssistant").resolves({ status: "OK", data: "remove" });
			const topicStub = sinon.stub(ContestAssistantController, "setContestAssistantByTopic").resolves({ status: "OK", data: "topic" });
			try {
				const res = await client("admin").post("/admin/contest/assistant/remove").send({ contestId: C_PRIVATE, userId: USER.assistant });
				expect(res.body).to.deep.equal({ status: "OK", data: "remove" });
				expect(removeStub.calledOnce).to.equal(true);
				expect(removeStub.firstCall.args[0].body).to.deep.equal({ contestId: C_PRIVATE, userId: USER.assistant });
				expect(topicStub.called).to.equal(false);
				// /:topicId 仍然可用
				const topic = await client("admin").post("/admin/contest/assistant/42").send({ userId: USER.assistant });
				expect(topic.body).to.deep.equal({ status: "OK", data: "topic" });
				expect(topicStub.firstCall.args[0].params.topicId).to.equal("42");
			} finally {
				removeStub.restore();
				topicStub.restore();
			}
		});

		it("GET /export/contest_code/:cid：handler 内 admin 检查", async function () {
			await runCase({ name: "export contest_code", path: `/export/contest_code/${C_PRIVATE}`, expect: e("deny", { admin: "ok" }) });
		});
	});

	describe("比赛编辑（admin | contest_manager 全局 | 该比赛助教）", function () {
		it("GET /admin/contest/edit/:id（私有比赛，有助教）", async function () {
			await runCase({
				name: "edit private",
				path: `/admin/contest/edit/${C_PRIVATE}`,
				expect: e("deny", { assistant: "ok", cmanager: "ok", admin: "ok" })
			});
		});

		it("GET /admin/contest/edit/:id（其他比赛：助教不再放行，contest_manager 仍放行）", async function () {
			await runCase({
				name: "edit public",
				path: `/admin/contest/edit/${C_PUBLIC}`,
				expect: e("deny", { cmanager: "ok", admin: "ok" })
			});
		});

		it("GET /admin/contest/edit/user/:id", async function () {
			await runCase({
				name: "edit user",
				path: `/admin/contest/edit/user/${C_PRIVATE}`,
				expect: e("deny", { assistant: "ok", cmanager: "ok", admin: "ok" })
			});
		});

		it("POST /admin/contest/edit 按 body.contest_id 判断", async function () {
			const AdminContestService = require("../../application/services/admin/AdminContestService").default;
			const stub = sinon.stub(AdminContestService, "updateContest").resolves();
			try {
				await runCase({
					name: "edit post",
					method: "post",
					path: "/admin/contest/edit",
					body: { contest_id: C_PRIVATE },
					expect: e("deny", { assistant: "ok", cmanager: "ok", admin: "ok" })
				});
			} finally {
				stub.restore();
			}
		});
	});

	describe("比赛访问（checkContestAccess）", function () {
		const privateAccess = e("403:Permission denied", { contestant: "ok", assistant: "ok", maker: "ok", cmanager: "ok", admin: "ok" });

		it("GET /contest/general：公开进行中", async function () {
			await runCase({ name: "general public", path: `/contest/general/${C_PUBLIC}`, expect: e("ok") });
		});

		it("GET /contest/general：私有进行中", async function () {
			await runCase({ name: "general private", path: `/contest/general/${C_PRIVATE}`, expect: privateAccess });
		});

		it("GET /contest/general：未开始（contest_manager 也不豁免时间）", async function () {
			await runCase({ name: "general future", path: `/contest/general/${C_FUTURE}`, expect: e("403:Contest not start!", { admin: "ok" }) });
		});

		it("GET /contest/general：隐藏比赛只对 admin / contest_manager（及名单内）开放", async function () {
			await runCase({ name: "general hidden", path: `/contest/general/${C_HIDDEN}`, expect: e("403:Permission denied", { cmanager: "ok", admin: "ok" }) });
		});

		it("GET /contest/problem：私有比赛门禁 + 进行中题号打码（admin 字段）", async function () {
			await runCase({
				name: "contest problem",
				path: `/contest/problem/${C_PRIVATE}`,
				expect: privateAccess,
				extract: res => res.body.admin,
				extra: { contestant: false, assistant: true, maker: false, cmanager: true, admin: true }
			});
		});

		it("GET /contest/problem_info：中间件挂在挂载层，取不到 :contestId（NaN），maker/assistant 实际不生效", async function () {
			await runCase({
				name: "problem_info",
				path: `/contest/problem_info/${C_PRIVATE}`,
				expect: e("deny", { cmanager: "pass", admin: "pass" })
			});
		});

		it("GET /contest/list/all：隐藏比赛只对 admin | contest_manager 列出", async function () {
			await runCase({
				name: "contest list all",
				path: "/contest/list/all",
				expect: e("ok"),
				extract: res => (res.body.data || []).some((c: any) => c.contest_id === C_HIDDEN),
				extra: only(["cmanager", "admin"])
			});
		});

		it("GET /contest/statistics：无比赛访问检查（已知不一致，锁定现状）", async function () {
			await runCase({ name: "statistics", path: `/contest/statistics/${C_PRIVATE}`, expect: e("ok") });
		});

		it("GET /scoreboard：门禁 + browserPrivilege + 他人 ip 可见性", async function () {
			const ScoreboardService = require("../../application/services/ScoreboardService").default;
			await runCase({
				name: "scoreboard",
				path: `/scoreboard/${C_PRIVATE}`,
				expect: privateAccess,
				extract: res => {
					const call = scoreboardStub.lastCall;
					const other = (res.body.data || []).find((r: any) => r.user_id === "pm_other");
					return [call.args[1], !!(other && other.ip)];
				},
				extra: {
					contestant: [false, false],
					assistant: [true, true],
					maker: [false, true],
					cmanager: [true, true],
					admin: [true, true]
				}
			});
			expect(ScoreboardService.getScoreboard).to.equal(scoreboardStub);
		});

		it("GET /scoreboard/:cid/line 同一门禁", async function () {
			await runCase({ name: "scoreboard line", path: `/scoreboard/${C_PRIVATE}/line`, expect: privateAccess });
		});
	});

	describe("状态列表（browse_code 与隐私去敏）", function () {
		it("比赛状态列表：任意登录用户可查（锁定现状）；browse_code 与他人 ip", async function () {
			await runCase({
				name: "status contest",
				path: `/status/null/null/null/null/0/${C_PRIVATE}`,
				expect: e("ok"),
				extract: res => {
					const other = (res.body.result || []).find((r: any) => r.solution_id === S_OTHER_IN_CONTEST);
					return [res.body.browse_code, other ? Object.prototype.hasOwnProperty.call(other, "ip") : "missing"];
				},
				extra: {
					student: [false, false],
					contestant: [false, false],
					assistant: [true, true],
					maker: [false, true],
					cmanager: [false, true],
					editor: [false, false],
					sbrowser: [true, true],
					admin: [true, true]
				}
			});
		});

		it("全站状态列表：非特权时 browse_code 键缺失（undefined）", async function () {
			await runCase({
				name: "status",
				path: "/status",
				expect: e("ok"),
				extract: res => {
					const shared = (res.body.result || []).find((r: any) => r.solution_id === S_EDITOR_SHARED);
					return [Object.prototype.hasOwnProperty.call(res.body, "browse_code") ? res.body.browse_code : "absent",
						shared ? Object.prototype.hasOwnProperty.call(shared, "ip") : "missing"];
				},
				extra: {
					student: ["absent", false],
					contestant: ["absent", false],
					assistant: ["absent", false],
					maker: ["absent", false],
					cmanager: ["absent", false],
					editor: ["absent", true],
					sbrowser: [true, true],
					admin: [true, true]
				}
			});
		});
	});

	describe("题目详情", function () {
		it("公开题", async function () {
			await runCase({
				name: "problem free",
				path: `/problem/${P_FREE}`,
				expect: e("ok"),
				extract: res => [res.body.isadmin, res.body.editor],
				extra: {
					student: [false, false], contestant: [false, false], assistant: [false, false], maker: [false, false],
					cmanager: [false, false], editor: [false, true], sbrowser: [false, false], admin: [true, false]
				}
			});
		});

		it("私有（defunct）题：admin | source_browser", async function () {
			await runCase({ name: "problem defunct", path: `/problem/${P_DEFUNCT}`, expect: e("err:problem not available!", { sbrowser: "ok", admin: "ok" }) });
		});

		it("进行中比赛里的题：admin | source_browser（editor 不豁免）", async function () {
			await runCase({ name: "problem in contest", path: `/problem/local?id=${P_IN_PRIVATE}`, expect: e("err:problem is in contest", { sbrowser: "ok", admin: "ok" }) });
		});

		it("比赛题（私有比赛 cid&pid）：contest-access；isadmin 含助教", async function () {
			await runCase({
				name: "contest problem detail",
				path: `/problem/local?cid=${C_PRIVATE}&pid=0`,
				expect: e("deny", { contestant: "ok", assistant: "ok", maker: "ok", cmanager: "ok", admin: "ok" }),
				extract: res => res.body.isadmin,
				extra: { contestant: false, assistant: true, maker: false, cmanager: false, admin: true }
			});
		});

		it("比赛题（未开始的公开比赛）：不检查开始时间（已知漏洞，锁定现状）", async function () {
			await runCase({ name: "future contest problem", path: `/problem/local?cid=${C_FUTURE}&pid=0`, expect: e("ok") });
		});

		it("POST /problem/:source/:id 修改题目：admin | editor", async function () {
			await runCase({
				name: "problem update",
				method: "post",
				path: `/problem/local/${P_FREE}`,
				body: { json: {} },
				expect: e("err:illegal request", { editor: "ok", admin: "ok" })
			});
		});
	});

	describe("源码查看", function () {
		it("GET /source/local/:id 他人非分享代码", async function () {
			await runCase({
				name: "source student",
				path: `/source/local/${S_STUDENT}`,
				expect: e("err:No such code or you don't have privilege", { student: "ok", sbrowser: "ok", admin: "ok" }),
				extract: res => res.body.privilege,
				extra: { student: false, sbrowser: false, admin: true }
			});
		});

		it("GET /source/local/:id 比赛提交：该比赛助教可看", async function () {
			await runCase({
				name: "source contest",
				path: `/source/local/${S_CONTESTANT}`,
				expect: e("err:No such code or you don't have privilege", { contestant: "ok", assistant: "ok", sbrowser: "ok", admin: "ok" })
			});
		});

		it("GET /status/solution?sid：本人 | source-privilege | 分享", async function () {
			await runCase({
				name: "status solution",
				path: `/status/solution?sid=${S_STUDENT}`,
				expect: e("err:error sid / not privilege", { student: "ok", sbrowser: "ok", admin: "ok" })
			});
			await runCase({ name: "status solution shared", path: `/status/solution?sid=${S_EDITOR_SHARED}`, expect: e("ok") });
		});

		it("GET /status/compile_info：本人 | source-privilege", async function () {
			await runCase({ name: "compile_info", path: `/status/compile_info/${S_STUDENT}`, expect: e("deny", { student: "ok", sbrowser: "ok", admin: "ok" }) });
			await runCase({ name: "compile_info contest", path: `/status/compile_info/${S_CONTESTANT}`, expect: e("deny", { contestant: "ok", assistant: "ok", sbrowser: "ok", admin: "ok" }) });
		});

		it("GET /status/runtime_info：只有 source-privilege（本人也不行）", async function () {
			await runCase({ name: "runtime_info", path: `/status/runtime_info/${S_STUDENT}`, expect: e("deny", { sbrowser: "ok", admin: "ok" }) });
		});

		it("GET /status/runtimeerror：admin | source_browser", async function () {
			await runCase({ name: "runtimeerror", path: `/status/runtimeerror?sid=${S_STUDENT}`, expect: e("deny", { sbrowser: "ok", admin: "ok" }) });
		});

		it("GET /status/:sid/:tr：任意登录用户（已知漏洞，锁定现状）", async function () {
			await runCase({ name: "sid tr", path: `/status/${S_STUDENT}/1`, expect: e("ok") });
		});

		it("GET /problem/:source/:id/:sid：实际只有 admin（source_code 无 user_id 列）", async function () {
			await runCase({ name: "problem source sid", path: `/problem/local/${P_FREE}/${S_CONTESTANT}`, expect: e("deny", { admin: "ok" }) });
		});

		it("GET /problem/:source/:id/:sid：admin 看过之后缓存对任意登录用户可见（已知漏洞，锁定现状）", async function () {
			await runCase({ name: "problem source sid cached", path: `/problem/local/${P_FREE}/${S_CONTESTANT}`, expect: e("ok") });
		});

		it("GET /solution/info/:id：admin | 本人", async function () {
			await runCase({ name: "solution info", path: `/solution/info/${S_STUDENT}`, expect: e("err:No privilege to access", { student: "ok", admin: "ok" }) });
		});
	});

	describe("上传 / 排行榜 / 用户 / 讨论", function () {
		it("GET /upload：admin | editor（403 JSON）", async function () {
			await runCase({ name: "upload", path: "/upload", expect: e("403:Permission denied", { editor: "pass", admin: "pass" }) });
		});

		it("GET /ranklist：email 只对 admin 与本人保留", async function () {
			await runCase({
				name: "ranklist",
				path: "/ranklist",
				expect: e("ok"),
				extract: res => {
					const row = (res.body.ranklist || []).find((r: any) => r.user_id === "pm_other");
					return row ? Object.prototype.hasOwnProperty.call(row, "email") : "missing";
				},
				extra: only(["admin"])
			});
		});

		it("GET /user/:id 与 /user/email/:id：任意登录用户（已知隐私问题，锁定现状）", async function () {
			await runCase({ name: "user profile", path: "/user/pm_other", expect: e("ok"), extract: res => res.body.isadmin, extra: only(["admin"]) });
			await runCase({ name: "user email", path: "/user/email/pm_other", expect: e("ok") });
		});

		it("讨论：帖子正文 / 回复读取 / 屏蔽回复对任意登录用户开放（锁定现状）", async function () {
			await runCase({ name: "discuss detail", path: `/discuss/${ARTICLE}`, expect: e("ok") });
			await runCase({ name: "discuss defunct detail", path: `/discuss/${ARTICLE_DEFUNCT}`, expect: e("ok") });
			await runCase({ name: "discuss post content", method: "post", path: `/discuss/update/${ARTICLE}`, expect: e("ok") });
			await runCase({ name: "discuss reply content", path: `/discuss/update/reply/${ARTICLE}/1`, expect: e("ok") });
			await runCase({ name: "discuss block", path: `/discuss/update/reply/block/${ARTICLE}/1`, expect: e("ok") });
		});

		it("讨论编辑：只有作者本人能改（SQL 条件），其他人静默成功", async function () {
			const store = (global as any).__sessionStore;
			await runCase({
				name: "discuss edit",
				method: "post",
				path: `/discuss/update/main/${ARTICLE}`,
				body: (role: Role) => ({ captcha: "pmcap", title: `t-${role}`, content: `c-${role}` }),
				before: (role: Role) => {
					for (const sid of Object.keys(store.sessions)) {
						const sess = JSON.parse(store.sessions[sid]);
						if (sess.user_id === USER[role]) {
							sess.captcha = { from: "edit", captcha: "pmcap" };
							store.sessions[sid] = JSON.stringify(sess);
						}
					}
				},
				expect: e("ok"),
				extract: (res, role) => table("article").find((a: any) => a.article_id === ARTICLE).title === `t-${role}`,
				extra: only(["student"])
			});
		});
	});

	describe("system 接口", function () {
		for (const path of ["/system/config/version_control/version", "/system/judge/compile"]) {
			it(`${path}：前端匿名使用，保持公开`, async function () {
				await runCase({ name: path, path, expect: e("pass", {}, "pass") });
			});
		}

		for (const path of ["/system/config/version_control/git", "/system/config/version_control/dependencies", "/system/config/version_control/devDependencies"]) {
			it(`${path}：只给管理员（phase5 fix b，之前匿名可读）`, async function () {
				await runCase({ name: path, path, expect: e("deny", { admin: "ok" }, "deny") });
			});
		}

		it("/system/stat/loadavg：仍然匿名（前端未用，低敏感，本阶段未改）", async function () {
			await runCase({ name: "loadavg", path: "/system/stat/loadavg", expect: e("ok", {}, "ok") });
		});
	});

	describe("contest_mode 开启", function () {
		before(function () {
			setContestMode(true);
		});
		after(function () {
			setContestMode(false);
		});
		const sync = () => setContestMode(true);

		it("题目详情：非 admin | source_browser 一律 contest_mode", async function () {
			await runCase({ name: "cm problem", path: `/problem/${P_FREE}`, before: sync, expect: e("contest_mode", { sbrowser: "ok", admin: "ok" }) });
		});

		it("比赛（cmod_visible=0）：只有 admin 与该比赛出题人", async function () {
			await runCase({ name: "cm contest public", path: `/contest/general/${C_PUBLIC}`, before: sync, expect: e("403:Contest Mode Active", { admin: "ok" }) });
			await runCase({ name: "cm contest private", path: `/contest/general/${C_PRIVATE}`, before: sync, expect: e("403:Contest Mode Active", { maker: "ok", admin: "ok" }) });
		});

		it("讨论列表：admin | source_browser", async function () {
			await runCase({ name: "cm discuss", path: "/discuss", before: sync, expect: e("contest_mode", { sbrowser: "ok", admin: "ok" }) });
		});

		it("源码：没有 source-privilege 时连本人也被 contest_mode 拦下", async function () {
			await runCase({ name: "cm source", path: `/source/local/${S_STUDENT}`, before: sync, expect: e("contest_mode", { sbrowser: "ok", admin: "ok" }) });
		});
	});
});
