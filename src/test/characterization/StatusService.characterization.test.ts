/**
 * StatusService.getStatusList 特征测试：对同一份假数据，输出必须与重构前生成的快照逐字节一致。
 * 覆盖：缺失用户、user_id 大小写变体（MySQL ci 比较能匹配但精确键不同）、重复用户、
 * 测试运行 result=13、比赛进行中/已结束的字段遮蔽、本人可见、管理员/助教特权、空页、sim、未登录、nick 为 NULL。
 */
import { expect } from "chai";
import { ciEqual, Engine, freshRequire, interceptQueryLayer, loadOrWriteSnapshot, normalizeSql, project, QueryLog, settle } from "./harness";
import { rebindFresh } from "../setup/rebind-port";
import { submissionStatusRepository } from "../../application/ports/SubmissionStatusRepository";

const BASE_DATE = new Date("2026-03-01T08:00:00.000Z");

function d(offsetMinutes: number) {
    return new Date(BASE_DATE.getTime() + offsetMinutes * 60000);
}

const USERS = [
    { user_id: "alice", nick: "  Alice  ", avatar: 1, avatarUrl: "http://a/x.png", email: "Alice@Example.com" },
    { user_id: "bob", nick: "bob", avatar: 0, avatarUrl: null, email: null },
    { user_id: "2019010101", nick: "num", avatar: null, avatarUrl: "", email: "n@x.com" },
    // 提交记录里写的是 "carol"：MySQL ci 比较能查到，但返回的 user_id 是 "Carol"
    { user_id: "Carol", nick: "carol", avatar: 1, avatarUrl: null, email: "c@x.com" },
    { user_id: "test_user", nick: "me", avatar: 0, avatarUrl: null, email: "me@x.com" }
];

function row(solution_id: number, user_id: string, result: number, extra: Record<string, any> = {}) {
    return Object.assign({
        fingerprint: "fp" + solution_id,
        fingerprintRaw: "fpr" + solution_id,
        solution_id,
        pass_rate: "1.00",
        share: solution_id % 2,
        ip: "10.0.0." + (solution_id % 7),
        contest_id: null,
        num: -1,
        problem_id: 1000 + (solution_id % 5),
        user_id,
        time: solution_id * 3,
        memory: solution_id * 100,
        in_date: d(solution_id),
        result,
        language: solution_id % 3,
        code_length: 100 + solution_id,
        judger: "LOCAL",
        oj_name: "local",
        s_id: null,
        sim_s_id: null,
        sim: null,
        s_user_id: null,
        s_s_user_id: null
    }, extra);
}

const GLOBAL_ROWS = [
    row(20, "alice", 4),
    row(19, "ghost", 6),                       // users 表里没有
    row(18, "carol", 11),                      // 大小写变体
    row(17, "test_user", 4),                   // 本人
    row(16, "bob", 13),                        // 测试运行
    row(15, "alice", 5),                       // 重复用户
    row(14, "2019010101", 4, { s_id: 14, sim_s_id: 3, sim: 88, s_user_id: "2019010101", s_s_user_id: "bob" }),
    row(13, "ghost", 4)
];

const CONTEST_ROWS = GLOBAL_ROWS.map(r => Object.assign({}, r, { contest_id: 1001, num: r.solution_id % 3 }));

interface State {
    users: any[];
    rows: any[];
    contestEnded: boolean;
}

function makeEngine(state: State, log: QueryLog[]): Engine {
    return async (sql: string, params: any[] = []) => {
        log.push({ sql: normalizeSql(sql), params });
        const s = normalizeSql(sql);
        if (/from contest where end_time<NOW\(\) and contest_id = \?/i.test(s)) {
            return [{ "count(1)": state.contestEnded ? 1 : 0, cnt: state.contestEnded ? new Date("2026-02-01T00:00:00.000Z") : null }];
        }
        if (/ from users where user_id = \?$/i.test(s)) {
            return state.users.filter(u => ciEqual(u.user_id, params[0])).map(u => project(s, u));
        }
        if (/ from users where user_id in \(\?\)$/i.test(s)) {
            const ids: any[] = params[0];
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new Error("ER_PARSE_ERROR: IN ()");
            }
            return state.users.filter(u => ids.some(id => ciEqual(u.user_id, id))).map(u => project(s, u));
        }
        if (/ from solution /i.test(s)) {
            return state.rows.map(r => Object.assign({}, r));
        }
        throw new Error("unexpected sql: " + s);
    };
}

interface Scenario {
    name: string;
    session: any;
    query: any;
    state?: Partial<State>;
    assistant?: boolean;
}

const SCENARIOS: Scenario[] = [
    { name: "global/anonymous", session: {}, query: { limit: 0 } },
    { name: "global/user", session: { user_id: "test_user" }, query: { limit: 0 } },
    { name: "global/admin", session: { user_id: "root", isadmin: true }, query: { limit: 20 } },
    { name: "global/source_browser", session: { user_id: "sb", source_browser: true }, query: { limit: 0, problem_id: 1001 } },
    { name: "global/filter-user-result13", session: { user_id: "bob" }, query: { limit: 0, user_id: "bob", result: 13 } },
    { name: "global/empty-page", session: { user_id: "test_user" }, query: { limit: 400 }, state: { rows: [] } },
    { name: "global/sim-user", session: { user_id: "test_user" }, query: { limit: 0, sim: true, user_id: "2019010101" } },
    { name: "global/sim-all", session: { user_id: "test_user" }, query: { limit: 0, sim: true } },
    { name: "global/all-missing-users", session: { user_id: "test_user" }, query: { limit: 0 }, state: { users: [] } },
    { name: "contest/running/user", session: { user_id: "test_user" }, query: { limit: 0, contest_id: 1001 }, state: { rows: CONTEST_ROWS } },
    { name: "contest/running/anonymous", session: {}, query: { limit: 0, contest_id: 1001 }, state: { rows: CONTEST_ROWS } },
    { name: "contest/ended/user", session: { user_id: "test_user" }, query: { limit: 0, contest_id: 1001 }, state: { rows: CONTEST_ROWS, contestEnded: true } },
    { name: "contest/running/assistant", session: { user_id: "helper" }, query: { limit: 0, contest_id: 1001 }, state: { rows: CONTEST_ROWS }, assistant: true },
    { name: "contest/running/contest_manager", session: { user_id: "cm", contest_manager: true }, query: { limit: 0, contest_id: 1001 }, state: { rows: CONTEST_ROWS } },
    { name: "contest/admin", session: { user_id: "root", isadmin: true }, query: { limit: 0, contest_id: 1001 }, state: { rows: CONTEST_ROWS } },
    {
        name: "global/null-nick-throws",
        session: { user_id: "test_user" },
        query: { limit: 0 },
        state: { users: USERS.map(u => u.user_id === "alice" ? Object.assign({}, u, { nick: null }) : u) }
    }
];

async function runScenario(sc: Scenario, log: QueryLog[]) {
    const state: State = Object.assign({ users: USERS, rows: GLOBAL_ROWS, contestEnded: false }, sc.state || {});
    const restore = interceptQueryLayer(makeEngine(state, log), {
        ContestAssistantManager: { userIsContestAssistant: async () => !!sc.assistant },
        graph_data_optimizer: { getGraphDataWithCache: async () => [], getGraphLabel: () => [], TIME_GRANULARITY: {} }
    });
    // SQL 在仓储实现里：拦截生效期间重新加载仓储并绑定到端口，让它的数据库访问同样落到 engine
    const restorePort = rebindFresh(submissionStatusRepository, require.resolve("../../infrastructure/persistence/submission/MySqlSubmissionStatusRepository"), m => new m.MySqlSubmissionStatusRepository());
    try {
        const { StatusService } = freshRequire("../../application/services/StatusService");
        const service = new StatusService();
        return await settle(() => service.getStatusList({ session: Object.assign({}, sc.session) }, Object.assign({}, sc.query)));
    } finally {
        restorePort();
        restore();
    }
}

describe("characterization: StatusService.getStatusList", function () {
    const actual: Record<string, string> = {};
    const logs: Record<string, QueryLog[]> = {};

    before(async function () {
        for (const sc of SCENARIOS) {
            logs[sc.name] = [];
            actual[sc.name] = await runScenario(sc, logs[sc.name]);
        }
    });

    it("每个场景的输出与重构前快照逐字节一致", function () {
        const expected = loadOrWriteSnapshot("status-list.json", actual);
        expect(Object.keys(actual)).to.deep.equal(Object.keys(expected));
        for (const name of Object.keys(expected)) {
            expect(actual[name], name).to.equal(expected[name]);
        }
    });

    it("快照覆盖了缺失用户与大小写变体两种边界", function () {
        const parsed = JSON.parse(actual["global/user"]);
        const ghost = parsed.result.find((r: any) => r.user_id === "ghost");
        // 缺失用户：原样返回数据库行（不改名、无 nick）
        expect(ghost).to.have.property("code_length");
        expect(ghost).to.not.have.property("nick");
        const carol = parsed.result.find((r: any) => r.user_id === "carol");
        expect(carol.nick).to.equal("carol");
    });

    it("用户信息每页只批量查一次，仅精确匹配不上的 user_id 才逐个兜底", function () {
        const log = logs["global/user"];
        const batch = log.filter(q => / from users where user_id in \(\?\)$/i.test(q.sql));
        const single = log.filter(q => / from users where user_id = \?$/i.test(q.sql));
        expect(batch.length).to.equal(1);
        expect(batch[0].params[0]).to.deep.equal(["alice", "ghost", "carol", "test_user", "bob", "2019010101"]);
        expect(single.map(q => q.params[0])).to.deep.equal(["ghost", "carol"]);
        // 重构前：1 条主查询 + 每行 1 条用户查询 = 9 条；重构后：1 + 1 + 2 = 4 条
        expect(log.length).to.equal(4);
        expect(logs["global/empty-page"].length).to.equal(1);
    });
});

export { SCENARIOS, runScenario };
