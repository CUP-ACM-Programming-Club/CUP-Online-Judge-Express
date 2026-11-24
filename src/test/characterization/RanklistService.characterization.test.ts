/**
 * RanklistService.getRanklist 特征测试：对同一份假数据，输出必须与重构前生成的快照逐字节一致。
 *
 * 假库按「solution_id 顺序」返回无 ORDER BY 的结果（等价于主键/(result,solution_id)/(in_date,…) 扫描顺序，
 * 因为假数据的 in_date 随 solution_id 单调不减）。
 * 覆盖：同分并列（含纯数字 user_id——JS 对象的整数键会被排到前面）、重复 AC、比赛内 AC、result=13 测试运行、
 * users 表缺失的用户、大小写变体 user_id、vjudge 的 oj_name 大小写变体、超出末页、非法页码、空时间窗。
 */
import { expect } from "chai";
import dayjs from "dayjs";
import { ciEqual, Engine, freshRequire, interceptQueryLayer, lcg, loadOrWriteSnapshot, normalizeSql, project, QueryLog, settle } from "./harness";

const SPECIAL_IDS = ["2019010101", "123", "0", "007", "4294967294", "4294967295", "99999999999", "Alice", "alice", "zed", "ghost1", "ghost2", "-5", "1e3", "1.5"];
const MISSING = new Set(["ghost1", "ghost2", "alice", "1.5"]);

export interface RankData {
    users: any[];
    solutions: any[];
    vjudge: any[];
}

export function buildRankData(seed = 20260301): RankData {
    const rand = lcg(seed);
    const ids = SPECIAL_IDS.concat(Array.from({ length: 120 }, (_, i) => "u" + String(i).padStart(3, "0")));
    const users = ids.filter(id => !MISSING.has(id)).map((id, i) => ({
        user_id: id,
        nick: "nick_" + id,
        biography: i % 4 === 0 ? null : "bio " + id,
        email: i % 3 === 0 ? null : id + "@x.com",
        avatar: i % 2,
        avatarUrl: i % 5 === 0 ? null : "http://avatar/" + id,
        solved: (i * 7) % 13,
        submit: (i * 11) % 17,
        vjudge_solved: i % 4,
        vjudge_submit: (i * 3) % 9,
        vjudge_accept: i % 6,
        school: i % 9 === 0 ? "your_own_school" : "cup",
        reg_time: new Date(Date.UTC(2020, 0, 1 + i))
    }));
    // 距今的天数，单调递减（越往后越新），保证 in_date 随 solution_id 单调不减
    const ages = [1200, 800, 400, 200, 100, 40, 20, 10, 5, 3, 2, 0.5, 0.1];
    const now = dayjs();
    const solutions: any[] = [];
    const vjudge: any[] = [];
    let sid = 1000;
    let vid = 1000;
    for (const age of ages) {
        const count = 60 + Math.floor(rand() * 60);
        for (let k = 0; k < count; k++) {
            const user_id = ids[Math.floor(Math.pow(rand(), 1.7) * ids.length)];
            const r = rand();
            solutions.push({
                solution_id: sid++,
                user_id,
                problem_id: [1000, 1001, 1002, 1003, 1004, 1005, 0, -1][Math.floor(rand() * 8)],
                result: r < 0.55 ? 4 : r < 0.75 ? 6 : r < 0.9 ? 13 : 11,
                contest_id: rand() < 0.3 ? 1001 : null,
                in_date: now.subtract(Math.round(age * 24 * 60), "minute").format("YYYY-MM-DD HH:mm:ss")
            });
            const r2 = rand();
            vjudge.push({
                solution_id: vid++,
                user_id: ids[Math.floor(Math.pow(rand(), 1.3) * ids.length)],
                problem_id: 1000 + Math.floor(rand() * 4),
                oj_name: ["HDU", "POJ", "hdu", "CF"][Math.floor(rand() * 4)],
                result: r2 < 0.5 ? 4 : 6,
                in_date: now.subtract(Math.round(age * 24 * 60), "minute").format("YYYY-MM-DD HH:mm:ss")
            });
        }
    }
    return { users, solutions, vjudge };
}

/** 重构后新 SQL 的假库实现（由 refactor 提交补充）；返回 undefined 表示不认识该 SQL */
export const extraHandlers: Array<(s: string, params: any[], data: RankData) => any> = [];

export function makeRankEngine(data: RankData, log: QueryLog[]): Engine {
    return async (sql: string, params: any[] = []) => {
        const s = normalizeSql(sql);
        log.push({ sql: s, params });
        for (const h of extraHandlers) {
            const r = h(s, params, data);
            if (r !== undefined) {
                return r;
            }
        }
        if (/^SELECT user_id, problem_id FROM solution WHERE in_date >= \? AND result = 4$/i.test(s)) {
            return data.solutions.filter(x => x.in_date >= params[0] && x.result === 4)
                .map(x => ({ user_id: x.user_id, problem_id: x.problem_id }));
        }
        if (/^SELECT user_id, CONCAT\(oj_name,problem_id\) as problem_hash FROM vjudge_solution WHERE in_date >= \? AND result = 4$/i.test(s)) {
            return data.vjudge.filter(x => x.in_date >= params[0] && x.result === 4)
                .map(x => ({ user_id: x.user_id, problem_hash: x.oj_name + x.problem_id }));
        }
        if (/^SELECT user_id FROM vjudge_solution WHERE in_date >= \? AND user_id IN \(\?\)$/i.test(s)) {
            const ids: any[] = params[1];
            if (!ids.length) throw new Error("ER_PARSE_ERROR: IN ()");
            return data.vjudge.filter(x => x.in_date >= params[0] && ids.some(id => ciEqual(id, x.user_id)))
                .map(x => ({ user_id: x.user_id }));
        }
        if (/ FROM users WHERE user_id IN \(\?\)$/i.test(s)) {
            const ids: any[] = params[0];
            if (!Array.isArray(ids) || !ids.length) throw new Error("ER_PARSE_ERROR: IN ()");
            return data.users.filter(u => ids.some(id => ciEqual(id, u.user_id))).map(u => project(s, u));
        }
        // 无时间筛选 / 搜索分支（本次不改 SQL）：按 SQL 声明的排序在假库中实现
        if (/ FROM users where/i.test(s) && /ORDER BY vjudge_accept DESC/i.test(s)) {
            return data.users.filter(u => u.school !== "your_own_school")
                .sort((a, b) => b.vjudge_accept - a.vjudge_accept || b.vjudge_submit - a.vjudge_submit || a.reg_time - b.reg_time)
                .slice(params[0], params[0] + params[1]).map(u => project(s, u));
        }
        if (/ FROM users where/i.test(s) && /ORDER BY solved DESC,submit,reg_time/i.test(s)) {
            return data.users.filter(u => u.school !== "your_own_school")
                .sort((a, b) => b.solved - a.solved || a.submit - b.submit || a.reg_time - b.reg_time)
                .slice(params[0], params[0] + params[1]).map(u => project(s, u));
        }
        if (/ FROM users WHERE user_id LIKE \? OR nick LIKE \?/i.test(s)) {
            const needle = String(params[0]).replace(/%/g, "").toLowerCase();
            return data.users.filter(u => u.user_id.toLowerCase().includes(needle) || u.nick.toLowerCase().includes(needle))
                .sort((a, b) => b.solved - a.solved || a.submit - b.submit || (a.user_id < b.user_id ? -1 : 1))
                .slice(params[2], params[2] + params[3]).map(u => project(s, u));
        }
        throw new Error("unexpected sql: " + s);
    };
}

interface Scenario {
    name: string;
    opt: any;
    viewer?: any;
    data?: RankData;
}

function buildScenarios(): Scenario[] {
    const list: Scenario[] = [];
    const pages: any[] = [0, 1, 2, "1", 3, 9, "abc", -1, "0.5", "Infinity"];
    for (const vjudge of [false, true]) {
        for (const ts of ["D", "W", "M", "Y", "X"]) {
            for (const page of pages) {
                list.push({ name: `time/${vjudge ? "vjudge" : "local"}/${ts}/page=${page}`, opt: { page, search: "", time_stamp: ts, vjudge } });
            }
        }
        list.push({ name: `time/${vjudge ? "vjudge" : "local"}/M/admin`, opt: { page: 0, search: "", time_stamp: "M", vjudge }, viewer: { privileged: true } });
        list.push({ name: `time/${vjudge ? "vjudge" : "local"}/M/self`, opt: { page: 0, search: "", time_stamp: "M", vjudge }, viewer: { privileged: false, viewerId: "u001" } });
        list.push({ name: `time/${vjudge ? "vjudge" : "local"}/M/acm_member-ignored`, opt: { page: 0, search: "", time_stamp: "M", vjudge, acm_member: true } });
        list.push({ name: `time/${vjudge ? "vjudge" : "local"}/D/no-ac`, opt: { page: 0, search: "", time_stamp: "D", vjudge }, data: { users: [], solutions: [], vjudge: [] } });
        list.push({ name: `default/${vjudge ? "vjudge" : "local"}/page=0`, opt: { page: 0, search: "", vjudge } });
        list.push({ name: `default/${vjudge ? "vjudge" : "local"}/page=1`, opt: { page: 1, search: "", vjudge } });
        list.push({ name: `search/${vjudge ? "vjudge" : "local"}`, opt: { page: 0, search: "u01", vjudge } });
    }
    list.push({ name: "search+time/invalid", opt: { page: 0, search: "x", time_stamp: "M", vjudge: false } });
    return list;
}

export async function runRankScenario(opt: any, viewer: any, data: RankData, log: QueryLog[]) {
    const restore = interceptQueryLayer(makeRankEngine(data, log));
    try {
        const service = freshRequire("../../service/RanklistService").default;
        return await settle(() => service.getRanklist(Object.assign({}, opt), viewer));
    } finally {
        restore();
    }
}

describe("characterization: RanklistService.getRanklist", function () {
    const actual: Record<string, string> = {};
    const logs: Record<string, QueryLog[]> = {};

    before(async function () {
        const data = buildRankData();
        for (const sc of buildScenarios()) {
            logs[sc.name] = [];
            actual[sc.name] = await runRankScenario(sc.opt, sc.viewer || { privileged: false }, sc.data || data, logs[sc.name]);
        }
    });

    it("每个场景的输出与重构前快照逐字节一致", function () {
        const expected = loadOrWriteSnapshot("ranklist.json", actual);
        expect(Object.keys(actual)).to.deep.equal(Object.keys(expected));
        for (const name of Object.keys(expected)) {
            expect(actual[name], name).to.equal(expected[name]);
        }
    });

    it("快照确实包含并列、整数键优先、缺失用户与越界报错这些边界", function () {
        const page0 = JSON.parse(actual["time/local/X/page=0"]).ranklist;
        expect(page0.length).to.equal(50);
        const solvedSeq = page0.map((r: any) => r.solved);
        expect(new Set(solvedSeq).size).to.be.lessThan(solvedSeq.length); // 有并列
        const all = [0, 1, 2, 3].flatMap(p => {
            const parsed = JSON.parse(actual[`time/local/X/page=${p}`]);
            return parsed.ranklist || [];
        });
        expect(all.some((r: any) => r.user_id === undefined)).to.equal(true); // 缺失用户只剩 {solved}
        expect(JSON.parse(actual["time/local/X/page=9"])).to.have.property("__threw__");
        expect(JSON.parse(actual["time/local/D/no-ac"]).ranklist).to.deep.equal([]);
    });
});
