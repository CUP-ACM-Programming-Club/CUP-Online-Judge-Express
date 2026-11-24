import "../setup/mock-external";
import { expect } from "chai";
import dayjs from "dayjs";
import * as policy from "../../policy";
import HttpError from "../../module/util/HttpError";

const sinon = require("sinon");
const ContestAssistantManager = require("../../manager/contest/ContestAssistantManager").default;

function req(session: any) {
	return { session } as any;
}

const base = { auth: true, isadmin: false, editor: false, source_browser: false, contest_manager: false, contest: {}, contest_maker: {}, problem_maker: {}, user_id: "u" };

describe("policy 谓词", function () {
	let assistantStub: any;
	beforeEach(function () {
		assistantStub = sinon.stub(ContestAssistantManager, "userIsContestAssistant").callsFake(async (cid: any, uid: string) => String(cid) === "1002" && uid === "helper");
	});
	afterEach(function () {
		assistantStub.restore();
	});

	it("全局权限位", function () {
		expect(policy.isAdmin(req({ ...base, isadmin: true }))).to.equal(true);
		expect(policy.isAdmin(req(base))).to.equal(false);
		expect(policy.isAdmin(req(undefined))).to.equal(false);
		expect(policy.isAdmin(undefined)).to.equal(false);
		expect(policy.isEditor(req({ ...base, editor: true }))).to.equal(true);
		expect(policy.isSourceBrowser(req({ ...base, source_browser: true }))).to.equal(true);
		expect(policy.isContestManager(req({ ...base, contest_manager: true }))).to.equal(true);
	});

	it("组合：canBrowseSource / canEditProblem / canSeeHiddenContests", function () {
		expect(policy.canBrowseSource(req({ ...base, source_browser: true }))).to.equal(true);
		expect(policy.canBrowseSource(req({ ...base, isadmin: true }))).to.equal(true);
		expect(policy.canBrowseSource(req({ ...base, editor: true }))).to.equal(false);
		expect(policy.canEditProblem(req({ ...base, editor: true }))).to.equal(true);
		expect(policy.canEditProblem(req({ ...base, source_browser: true }))).to.equal(false);
		expect(policy.canSeeHiddenContests(req({ ...base, contest_manager: true }))).to.equal(true);
		expect(policy.canSeeHiddenContests(req({ ...base, editor: true }))).to.equal(false);
	});

	it("按 id 的权限位", function () {
		const r = req({ ...base, contest: { c1002: true }, contest_maker: { m1003: true }, problem_maker: { p1000: true } });
		expect(policy.isContestant(r, 1002)).to.equal(true);
		expect(policy.isContestant(r, 1003)).to.equal(false);
		expect(policy.isContestMaker(r, 1003)).to.equal(true);
		expect(policy.isContestMaker(r, "1003")).to.equal(true);
		expect(policy.isContestMaker(r, 1002)).to.equal(false);
		expect(policy.isContestMakerStrict(r, 1003)).to.equal(true);
		expect(policy.isProblemMakerStrict(r, 1000)).to.equal(true);
		// 宽松版本在缺 map 时为 false，Strict 版本保留原来的抛错
		expect(policy.isContestMaker(req({ auth: true }), 1003)).to.equal(false);
		expect(policy.isContestant(req({ auth: true }), 1002)).to.equal(false);
		expect(() => policy.isContestMakerStrict(req({ auth: true }), 1003)).to.throw(TypeError);
		expect(() => policy.isProblemMakerStrict(req({ auth: true }), 1000)).to.throw(TypeError);
	});

	it("canAccessHiddenProblem：admin | editor | 题目创建者", function () {
		expect(policy.canAccessHiddenProblem(req({ ...base, isadmin: true }), 1)).to.equal(true);
		expect(policy.canAccessHiddenProblem(req({ ...base, editor: true }), 1)).to.equal(true);
		expect(policy.canAccessHiddenProblem(req({ ...base, problem_maker: { p1: true } }), 1)).to.equal(true);
		expect(policy.canAccessHiddenProblem(req(base), 1)).to.equal(false);
		// admin 时短路，不碰 problem_maker
		expect(policy.canAccessHiddenProblem(req({ auth: true, isadmin: true }), 1)).to.equal(true);
	});

	it("canManageContest：admin | contest_manager | 助教，前两项为真时不查助教", async function () {
		expect(await policy.canManageContest(req({ ...base, isadmin: true }), 1002)).to.equal(true);
		expect(await policy.canManageContest(req({ ...base, contest_manager: true }), 1)).to.equal(true);
		expect(assistantStub.called).to.equal(false);
		expect(await policy.canManageContest(req({ ...base, user_id: "helper" }), 1002)).to.equal(true);
		expect(await policy.canManageContest(req({ ...base, user_id: "helper" }), 1001)).to.equal(false);
		expect(await policy.canManageContest(req({ ...base, contest_maker: { m1002: true } }), 1002)).to.equal(false);
	});

	it("canSeeContestSensitive：admin | contest_manager | 出题人", function () {
		expect(policy.canSeeContestSensitive(req({ ...base, contest_maker: { m1002: true } }), "1002")).to.equal(true);
		expect(policy.canSeeContestSensitive(req({ ...base, contest_maker: { m1002: true } }), "x")).to.equal(false);
		expect(policy.canSeeContestSensitive(req({ ...base, contest_manager: true }), "x")).to.equal(true);
		expect(policy.canSeeContestSensitive(req(undefined), 1002)).to.equal(false);
	});

	describe("assertCanViewContest / canViewContest", function () {
		const now = dayjs();
		const contest = (over: any = {}) => Object.assign({
			start_time: now.subtract(1, "hour").format(), end_time: now.add(1, "hour").format(),
			cmod_visible: 0, defunct: "N", private: 0
		}, over);
		afterEach(function () {
			(global as any).contest_mode = false;
		});

		async function reason(r: any, c: any, cid = 1002) {
			try {
				await policy.assertCanViewContest(r, c, cid);
				return "ok";
			} catch (e: any) {
				expect(e).to.be.instanceOf(HttpError);
				return `${e.statusCode}:${e.statement}`;
			}
		}

		it("公开进行中：任何登录用户", async function () {
			expect(await reason(req(base), contest())).to.equal("ok");
			expect(await policy.canViewContest(req(base), contest(), 1002)).to.equal(true);
		});

		it("cmod_visible 与 contest_mode 不一致：admin / maker 豁免", async function () {
			expect(await reason(req(base), contest({ cmod_visible: 1 }))).to.equal("403:Contest Mode Active");
			(global as any).contest_mode = true;
			expect(await reason(req(base), contest())).to.equal("403:Contest Mode Active");
			expect(await reason(req({ ...base, contest_manager: true }), contest())).to.equal("403:Contest Mode Active");
			expect(await reason(req({ ...base, isadmin: true }), contest())).to.equal("ok");
			expect(await reason(req({ ...base, contest_maker: { m1002: true } }), contest())).to.equal("ok");
			expect(await reason(req(base), contest({ cmod_visible: 1 }))).to.equal("ok");
		});

		it("隐藏比赛：contest_manager | 名单内 | 助教", async function () {
			const hidden = contest({ defunct: "Y" });
			expect(await reason(req(base), hidden)).to.equal("403:Permission denied");
			expect(await reason(req({ ...base, contest_manager: true }), hidden)).to.equal("ok");
			expect(await reason(req({ ...base, contest: { c1002: true } }), hidden)).to.equal("ok");
			expect(await reason(req({ ...base, user_id: "helper" }), hidden)).to.equal("ok");
		});

		it("未开始：只有 admin / maker", async function () {
			const future = contest({ start_time: now.add(1, "day").format() });
			expect(await reason(req({ ...base, contest_manager: true }), future)).to.equal("403:Contest not start!");
			expect(await reason(req({ ...base, contest_maker: { m1002: true } }), future)).to.equal("ok");
			expect(await policy.canViewContest(req(base), future, 1002)).to.equal(false);
		});

		it("私有：contest_manager | 名单内 | 助教", async function () {
			const priv = contest({ private: 1 });
			expect(await reason(req(base), priv)).to.equal("403:Permission denied");
			expect(await reason(req({ ...base, contest_manager: true }), priv)).to.equal("ok");
			expect(await reason(req({ ...base, contest: { c1002: true } }), priv)).to.equal("ok");
			expect(await reason(req({ ...base, user_id: "helper" }), priv)).to.equal("ok");
			expect(await reason(req({ ...base, editor: true, source_browser: true }), priv)).to.equal("403:Permission denied");
		});
	});

	describe("中间件", function () {
		function run(mw: any, r: any) {
			return new Promise<any>(resolve => {
				const res = { json: (body: any) => resolve({ body }) };
				const out = mw(r, res, () => resolve("next"));
				if (out && typeof out.then === "function") {
					out.catch((e: any) => resolve({ error: e }));
				}
			});
		}

		it("requireAdmin", async function () {
			expect(await run(policy.requireAdmin, req({ ...base, isadmin: true }))).to.equal("next");
			expect(await run(policy.requireAdmin, req(base))).to.deep.equal({ body: { status: "error", statement: "Permission denied" } });
		});

		it("requireAny / requireAnyOr", async function () {
			const mw = policy.requireAny(policy.isEditor, async (r: any) => r.session.user_id === "helper");
			expect(await run(mw, req({ ...base, editor: true }))).to.equal("next");
			expect(await run(mw, req({ ...base, user_id: "helper" }))).to.equal("next");
			expect(await run(mw, req(base))).to.deep.equal({ body: { status: "error", statement: "Permission denied" } });
			const custom = policy.requireAnyOr((r: any, res: any) => res.json({ custom: true }), policy.isAdmin);
			expect(await run(custom, req(base))).to.deep.equal({ body: { custom: true } });
		});

		it("requireLogin 就是 auth 中间件", function () {
			expect(policy.requireLogin).to.equal(require("../../middleware/auth").default);
		});
	});
});
