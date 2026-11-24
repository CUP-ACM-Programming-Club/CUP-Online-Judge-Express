/**
 * 状态 / 榜单 / 排行榜 的敏感字段去敏：特权 vs 非特权
 */
const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");
const crypto = require("crypto");

import { rebindFresh } from "../setup/rebind-port";
import { submissionStatusRepository } from "../../application/ports/SubmissionStatusRepository";
import { ranklistRepository } from "../../application/ports/RanklistRepository";

// 状态页 / 排行榜的 SQL 在仓储实现里（经 ../../db 访问数据库）：拦截生效期间重新加载仓储并绑定到端口
const STATUS_REPO = require.resolve("../../infrastructure/persistence/submission/MySqlSubmissionStatusRepository");
const RANKLIST_REPO = require.resolve("../../infrastructure/persistence/submission/MySqlRanklistRepository");

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");
const SENSITIVE = ["ip", "fingerprint", "fingerprintRaw"];

describe("StatusService privacy", function () {
    let restoreRepository: () => void;
    let service: any;
    let queryStub: any;
    let assistantStub: any;
    let previousLoad: any;

    const solutions = () => [
        { user_id: "alice", solution_id: 1, ip: "10.0.0.1", fingerprint: "fa", fingerprintRaw: "ra", sim_s_id: null, code_length: 10, contest_id: null },
        { user_id: "bob", solution_id: 2, ip: "10.0.0.2", fingerprint: "fb", fingerprintRaw: "rb", sim_s_id: null, code_length: 20, contest_id: null }
    ];

    beforeEach(function () {
        queryStub = sinon.stub();
        queryStub.callsFake(async (sql: string, params: any[]) => {
            if (/FROM users WHERE user_id/.test(sql)) {
                return [{ nick: params[0], avatar: 0, avatarUrl: "", email: `${params[0]}@example.com` }];
            }
            if (/end_time<NOW\(\)/.test(sql)) {
                return [{ cnt: 0 }];
            }
            return solutions();
        });
        assistantStub = { userIsContestAssistant: sinon.stub().resolves(false) };
        previousLoad = Module._load;
        Module._load = function (request: string) {
            if (request.includes("mysql_cache")) return queryStub;
            if (/(^|\/)db$/.test(request)) return { cachedQuery: (sql: string, params: any[]) => queryStub(sql, params), LEGACY_CACHE_TTL_MS: 2000 };
            if (request.includes("ContestAssistantManager")) return assistantStub;
            if (request.includes("const_name")) return {};
            if (request.includes("graph_data_optimizer")) return { getGraphDataWithCache: sinon.stub(), getGraphLabel: sinon.stub(), TIME_GRANULARITY: {} };
            return previousLoad.apply(this, arguments);
        };
        restoreRepository = rebindFresh(submissionStatusRepository, STATUS_REPO, m => new m.MySqlSubmissionStatusRepository());
        delete require.cache[require.resolve("../../application/services/StatusService")];
        service = new (require("../../application/services/StatusService").StatusService)();
    });

    afterEach(function () {
        restoreRepository();
        Module._load = previousLoad;
        delete require.cache[require.resolve("../../application/services/StatusService")];
        sinon.restore();
    });

    const byUser = (res: any, uid: string) => res.result.find((r: any) => r.user_id === uid);

    it("non-privileged user: others' ip/fingerprint/email removed, own row kept, email_hash everywhere", async function () {
        const res = await service.getStatusList({ session: { user_id: "alice", isadmin: false } }, { limit: 0 });
        const bob = byUser(res, "bob");
        for (const f of [...SENSITIVE, "email"]) {
            expect(bob, f).to.not.have.property(f);
        }
        expect(bob.email_hash).to.equal(md5("bob@example.com"));
        const alice = byUser(res, "alice");
        expect(alice.ip).to.equal("10.0.0.1");
        expect(alice.fingerprint).to.equal("fa");
        expect(alice.email).to.equal("alice@example.com");
        expect(alice.email_hash).to.equal(md5("alice@example.com"));
    });

    it("anonymous user sees no sensitive fields at all", async function () {
        const res = await service.getStatusList({ session: {} }, { limit: 0 });
        for (const row of res.result) {
            for (const f of [...SENSITIVE, "email"]) {
                expect(row, f).to.not.have.property(f);
            }
        }
    });

    it("admin sees everything", async function () {
        const res = await service.getStatusList({ session: { user_id: "alice", isadmin: true } }, { limit: 0 });
        const bob = byUser(res, "bob");
        expect(bob.ip).to.equal("10.0.0.2");
        expect(bob.fingerprintRaw).to.equal("rb");
        expect(bob.email).to.equal("bob@example.com");
    });

    it("source_browser sees everything (existing browse privilege)", async function () {
        const res = await service.getStatusList({ session: { user_id: "alice", source_browser: true } }, { limit: 0 });
        expect(byUser(res, "bob").ip).to.equal("10.0.0.2");
    });

    it("contest status: contest maker of that contest and contest_manager see everything", async function () {
        const maker = await service.getStatusList({ session: { user_id: "t", contest_maker: { m1000: true } } }, { limit: 0, contest_id: 1000 });
        expect(byUser(maker, "bob").ip).to.equal("10.0.0.2");
        const manager = await service.getStatusList({ session: { user_id: "t", contest_manager: true } }, { limit: 0, contest_id: 1000 });
        expect(byUser(manager, "bob").fingerprint).to.equal("fb");
    });

    it("contest status: contest assistant sees everything", async function () {
        assistantStub.userIsContestAssistant.resolves(true);
        const res = await service.getStatusList({ session: { user_id: "t" } }, { limit: 0, contest_id: 1000 });
        expect(byUser(res, "bob").ip).to.equal("10.0.0.2");
    });

    it("contest status: maker of another contest / plain participant are stripped", async function () {
        const other = await service.getStatusList({ session: { user_id: "t", contest_maker: { m999: true } } }, { limit: 0, contest_id: 1000 });
        expect(byUser(other, "bob")).to.not.have.property("ip");
        const participant = await service.getStatusList({ session: { user_id: "t", contest: { c1000: true } } }, { limit: 0, contest_id: 1000 });
        expect(byUser(participant, "bob")).to.not.have.property("fingerprint");
    });

    it("contest_manager has no extra visibility on the global (non-contest) status list", async function () {
        const res = await service.getStatusList({ session: { user_id: "t", contest_manager: true } }, { limit: 0 });
        expect(byUser(res, "bob")).to.not.have.property("ip");
    });
});

describe("ScoreboardService.redactScoreboard", function () {
    const ScoreboardService = require("../../application/services/ScoreboardService").default;
    const board = () => ({
        status: "OK",
        total: 2,
        data: [
            { user_id: "alice", solution_id: 1, ip: "10.0.0.1", fingerprint: "fa", fingerprintRaw: "ra", num: 0 },
            { user_id: "bob", solution_id: 2, ip: "10.0.0.2", fingerprint: "fb", fingerprintRaw: "rb", num: 1 }
        ],
        users: []
    });

    it("non-privileged: strips others' ip/fingerprints, keeps own row and the rest of the payload", function () {
        const input = board();
        const snapshot = JSON.stringify(input);
        const out = ScoreboardService.redactScoreboard(input, false, "alice");
        expect(JSON.stringify(input)).to.equal(snapshot);
        expect(out.status).to.equal("OK");
        expect(out.total).to.equal(2);
        const bob = out.data.find((r: any) => r.user_id === "bob");
        for (const f of SENSITIVE) {
            expect(bob, f).to.not.have.property(f);
        }
        expect(bob.num).to.equal(1);
        expect(out.data.find((r: any) => r.user_id === "alice").ip).to.equal("10.0.0.1");
    });

    it("privileged: unchanged data", function () {
        const out = ScoreboardService.redactScoreboard(board(), true, "x");
        expect(out.data).to.deep.equal(board().data);
    });
});

describe("scoreboard route privacy", function () {
    let previousLoad: any;
    let router: any;
    let getScoreboard: any;
    let assistant: any;

    beforeEach(function () {
        getScoreboard = sinon.stub().callsFake(async () => ({
            status: "OK",
            data: [{ user_id: "bob", solution_id: 2, ip: "10.0.0.2", fingerprint: "fb", fingerprintRaw: "rb" }],
            users: []
        }));
        assistant = sinon.stub().resolves(false);
        const realScoreboard = require("../../application/services/ScoreboardService").default;
        previousLoad = Module._load;
        Module._load = function (request: string) {
            if (request.endsWith("services/ScoreboardService")) {
                return { __esModule: true, default: { getScoreboard, redactScoreboard: realScoreboard.redactScoreboard.bind(realScoreboard), clearScoreboardCache: sinon.stub() } };
            }
            if (request.endsWith("services/ContestService")) return { __esModule: true, default: { checkContestAccess: sinon.stub().resolves() } };
            if (request.endsWith("contest/ContestAssistantManager")) return { __esModule: true, default: { userIsContestAssistant: assistant } };
            return previousLoad.apply(this, arguments);
        };
        delete require.cache[require.resolve("../../interfaces/http/routes/scoreboard")];
        router = require("../../interfaces/http/routes/scoreboard")[2];
    });

    afterEach(function () {
        Module._load = previousLoad;
        delete require.cache[require.resolve("../../interfaces/http/routes/scoreboard")];
        sinon.restore();
    });

    function call(session: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const req: any = { method: "GET", url: "/1000", params: {}, session, query: {}, headers: {} };
            const res: any = { json: resolve, status() { return res; } };
            router.handle(req, res, (err: any) => (err ? reject(err) : reject(new Error("not handled"))));
        });
    }

    it("participant gets ip/fingerprints stripped", async function () {
        const out = await call({ user_id: "alice", contest: { c1000: true } });
        expect(out.data[0]).to.not.have.any.keys(...SENSITIVE);
        expect(getScoreboard.firstCall.args[1]).to.not.be.ok;
    });

    it("contest maker of that contest sees ip/fingerprints (scoreboard cache variant unchanged)", async function () {
        const out = await call({ user_id: "teacher", contest_maker: { m1000: true } });
        expect(out.data[0].ip).to.equal("10.0.0.2");
        // maker previously used the non-privileged cache variant; keep that unchanged
        expect(getScoreboard.firstCall.args[1]).to.not.be.ok;
    });

    it("admin / contest_manager / assistant see ip/fingerprints", async function () {
        expect((await call({ user_id: "a", isadmin: true })).data[0].fingerprint).to.equal("fb");
        expect((await call({ user_id: "m", contest_manager: true })).data[0].fingerprintRaw).to.equal("rb");
        assistant.resolves(true);
        expect((await call({ user_id: "as" })).data[0].ip).to.equal("10.0.0.2");
    });
});

describe("RanklistService privacy", function () {
    let restoreRepository: () => void;
    let previousLoad: any;
    let service: any;
    let queryStub: any;

    beforeEach(function () {
        queryStub = sinon.stub().resolves([
            { user_id: "alice", nick: "a", solved: 3, email: "Alice@Example.com" },
            { user_id: "bob", nick: "b", solved: 2, email: "bob@example.com" },
            { user_id: "carol", nick: "c", solved: 1, email: null }
        ]);
        previousLoad = Module._load;
        Module._load = function (request: string) {
            if (request.includes("mysql_cache")) return { __esModule: true, default: queryStub };
            if (/(^|\/)db$/.test(request)) return { cachedQuery: (sql: string, params: any[]) => queryStub(sql, params), LEGACY_CACHE_TTL_MS: 2000 };
            return previousLoad.apply(this, arguments);
        };
        restoreRepository = rebindFresh(ranklistRepository, RANKLIST_REPO, m => new m.MySqlRanklistRepository());
        delete require.cache[require.resolve("../../application/services/RanklistService")];
        service = require("../../application/services/RanklistService").default;
    });

    afterEach(function () {
        restoreRepository();
        Module._load = previousLoad;
        delete require.cache[require.resolve("../../application/services/RanklistService")];
        sinon.restore();
    });

    it("non-admin: email removed for others, email_hash provided for gravatar", async function () {
        const out = await service.getRanklist({ page: 0, search: "", vjudge: false }, { privileged: false, viewerId: "alice" });
        const bob = out.ranklist.find((r: any) => r.user_id === "bob");
        expect(bob).to.not.have.property("email");
        expect(bob.email_hash).to.equal(md5("bob@example.com"));
        const carol = out.ranklist.find((r: any) => r.user_id === "carol");
        expect(carol).to.not.have.property("email");
        expect(carol.email_hash).to.equal("");
        const alice = out.ranklist.find((r: any) => r.user_id === "alice");
        expect(alice.email).to.equal("Alice@Example.com");
        expect(alice.email_hash).to.equal(md5("alice@example.com"));
    });

    it("default viewer (no session) is non-privileged", async function () {
        const out = await service.getRanklist({ page: 0, search: "", vjudge: false });
        for (const row of out.ranklist) {
            expect(row).to.not.have.property("email");
            expect(row).to.have.property("email_hash");
        }
    });

    it("admin keeps raw email", async function () {
        const out = await service.getRanklist({ page: 0, search: "x", vjudge: false }, { privileged: true, viewerId: "root" });
        expect(out.ranklist.find((r: any) => r.user_id === "bob").email).to.equal("bob@example.com");
    });

    it("does not mutate cached query rows", async function () {
        await service.getRanklist({ page: 0, search: "", vjudge: false }, { privileged: false });
        const rows = await queryStub();
        expect(rows[1].email).to.equal("bob@example.com");
        expect(rows[1]).to.not.have.property("email_hash");
    });
});
