/**
 * 真实 MySQL 上的排行榜等价性校验：重构前算法（原样搬运，下称 legacy）vs 当前 RanklistService。
 * 不在 mocha 中运行（文件名不是 *.test.ts），需要手动执行：
 *
 *   # 只读比对（可直接对隔离的服务器副本库运行；不写任何数据）
 *   EQUIV_MYSQL='{"host":"127.0.0.1","port":3306,"user":"...","password":"...","database":"jol"}' \
 *     TS_NODE_TRANSPILE_ONLY=1 npx ts-node src/test/equivalence/ranklist.equiv.ts
 *
 *   # 在一个名字以 _equiv 结尾的空库里先灌入随机数据再比对（库里需已导入 script/structure.sql）
 *   ... ranklist.equiv.ts --seed
 *
 * 比对范围：time_stamp ∈ {D,W,M,Y,(全部)} × {本地, vjudge} × 页码 0..末页+1 以及若干非常规页码；
 * 比较的是 JSON.stringify(getRanklist(...))（抛错记为 "THROWS"），并打印两种实现的耗时。
 */
import dayjs from "dayjs";

const mysqlConfig = JSON.parse(process.env.EQUIV_MYSQL || "{}");
(global as any).config = Object.assign((global as any).config || {}, { mysql: Object.assign({ supportBigNumbers: true }, mysqlConfig) });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mysql = require("mysql2");
import { redactRows } from "../../utils/privacy";
import const_variable from "../../module/const_name";

const pool = mysql.createPool((global as any).config.mysql);
function raw(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => pool.query(sql, params, (err: any, rows: any) => err ? reject(err) : resolve(rows)));
}

const PAGE_CNT = 50;

/** 重构前 RanklistService.getRanklist 的时间段分支，逐行保留（数据访问换成无缓存直查） */
async function legacyGetRanklist(opt: any, viewer: any = { privileged: false }) {
    const cache_query = raw;
    let page = opt.page * PAGE_CNT;
    let result;
    let time_start;
    if (opt.time_stamp === "Y") {
        time_start = dayjs().subtract(1, "year").format("YYYY-MM-DD");
    } else if (opt.time_stamp === "M") {
        time_start = dayjs().subtract(1, "month").format("YYYY-MM-DD");
    } else if (opt.time_stamp === "W") {
        time_start = dayjs().subtract(1, "week").format("YYYY-MM-DD");
    } else if (opt.time_stamp === "D") {
        time_start = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    } else {
        time_start = "1970-01-01";
    }
    if (!opt.vjudge) {
        const solutions = await cache_query(`
                    SELECT user_id, problem_id
                    FROM solution
                    WHERE in_date >= ? AND result = 4`, [time_start]);

        if (solutions && solutions.length > 0) {
            const stats: any = {};
            for (const sol of solutions) {
                if (!stats[sol.user_id]) {
                    stats[sol.user_id] = new Set();
                }
                stats[sol.user_id].add(sol.problem_id);
            }

            const sortedUsers = Object.keys(stats).map(uid => ({
                user_id: uid,
                solved: stats[uid].size
            })).sort((a, b) => b.solved - a.solved).slice(page, page + PAGE_CNT);

            const userIds = sortedUsers.map(u => u.user_id);
            const users = await cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl
                        FROM users WHERE user_id IN (?)`, [userIds]);

            const userMap = new Map();
            users.forEach((u: any) => userMap.set(u.user_id, u));

            result = sortedUsers.map((s) => {
                const user = userMap.get(s.user_id);
                return {
                    ...user,
                    solved: s.solved,
                };
            });
        } else {
            result = [];
        }
    } else {
        const solutions = await cache_query(`
                    SELECT user_id, CONCAT(oj_name,problem_id) as problem_hash
                    FROM vjudge_solution
                    WHERE in_date >= ? AND result = 4`, [time_start]);

        if (solutions && solutions.length > 0) {
            const stats: any = {};
            for (const sol of solutions) {
                if (!stats[sol.user_id]) {
                    stats[sol.user_id] = new Set();
                }
                stats[sol.user_id].add(sol.problem_hash);
            }

            const sortedUsers = Object.keys(stats).map(uid => ({
                user_id: uid,
                solved: stats[uid].size
            })).sort((a, b) => b.solved - a.solved).slice(page, page + PAGE_CNT);

            const userIds = sortedUsers.map(u => u.user_id);
            const users = await cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl
                        FROM users WHERE user_id IN (?)`, [userIds]);

            const userMap = new Map();
            users.forEach((u: any) => userMap.set(u.user_id, u));

            const submits = await cache_query(`
                        SELECT user_id
                        FROM vjudge_solution
                        WHERE in_date >= ? AND user_id IN (?)`, [time_start, userIds]);

            const submitStats: any = {};
            for (const sub of submits) {
                if (!submitStats[sub.user_id]) submitStats[sub.user_id] = 0;
                submitStats[sub.user_id]++;
            }

            result = sortedUsers.map((s) => {
                const user = userMap.get(s.user_id);
                return {
                    ...user,
                    vjudge_accept: s.solved,
                    vjudge_submit: submitStats[s.user_id] || 0
                };
            });
        } else {
            result = [];
        }
    }
    return {
        ranklist: redactRows(result, { privileged: !!viewer.privileged, viewerId: viewer.viewerId, fields: [], hashEmail: true }),
        _name: const_variable.language.cn.ranklist
    };
}

function lcg(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

async function seed() {
    const [{ db }] = await raw("SELECT DATABASE() AS db");
    if (!/_equiv$/.test(db)) {
        throw new Error(`--seed 只允许在名字以 _equiv 结尾的库上执行（当前 ${db}）`);
    }
    const rand = lcg(42);
    await raw("DELETE FROM users");
    await raw("DELETE FROM solution");
    await raw("DELETE FROM vjudge_solution");
    const special = ["2019010101", "123", "0", "007", "4294967294", "4294967295", "99999999999", "Alice", "alice", "ALICE",
        "zed", "-5", "1e3", "1.5", "a b", "ümlaut", "umlaut", "Bob", "bob", "valueOf", "__proto__", "x\\y", "张三"];
    const ids = special.concat(Array.from({ length: 3000 }, (_, i) => (i % 3 === 0 ? String(2018000000 + i * 37) : "user" + i)));
    const missing = new Set(["alice", "ALICE", "bob", "umlaut", "1.5"]);
    const userRows = ids.filter(id => !missing.has(id)).map((id, i) => [id, "nick " + id, i % 4 ? "bio" : null, i % 3 ? id + "@x.com" : null, i % 2, i % 5 ? "http://a/" + i : null, "cup", "2020-01-01 00:00:00"]);
    for (let i = 0; i < userRows.length; i += 1000) {
        await raw("INSERT INTO users (user_id, nick, biography, email, avatar, avatarUrl, school, reg_time) VALUES ?", [userRows.slice(i, i + 1000)]);
    }
    const now = dayjs();
    const total = 200000;
    const reserved = new Set(["valueOf", "__proto__"]);
    for (const table of ["solution", "vjudge_solution"]) {
        let batch: any[] = [];
        for (let k = 0; k < total; k++) {
            // in_date 随 solution_id 单调不减：从 4 年前均匀推进到现在
            const inDate = now.subtract(Math.round((total - k) / total * 4 * 365 * 24 * 60), "minute").format("YYYY-MM-DD HH:mm:ss");
            let uid = ids[Math.floor(Math.pow(rand(), 2.2) * ids.length)];
            const r = rand();
            let result = r < 0.45 ? 4 : r < 0.7 ? 6 : r < 0.85 ? 13 : 11;
            if (reserved.has(uid)) result = 6; // 同名键只给非 AC 提交（有 AC 时两种实现都报错，另有用例覆盖）
            if (table === "solution") {
                batch.push([uid, [1000, 1001, 1002, 1003, 1004, 1005, 1006, 0, -1][Math.floor(rand() * 9)] + Math.floor(rand() * 40) * 10,
                    result, rand() < 0.3 ? 1000 + Math.floor(rand() * 5) : null, inDate, "127.0.0.1"]);
            } else {
                batch.push([uid, 1000 + Math.floor(rand() * 60), ["HDU", "hdu", "POJ", "CF", "CF "][Math.floor(rand() * 5)], result, inDate, "127.0.0.1", "x"]);
            }
            if (batch.length === 5000 || k === total - 1) {
                if (table === "solution") {
                    await raw("INSERT INTO solution (user_id, problem_id, result, contest_id, in_date, ip) VALUES ?", [batch]);
                } else {
                    await raw("INSERT INTO vjudge_solution (user_id, problem_id, oj_name, result, in_date, ip, judger) VALUES ?", [batch]);
                }
                batch = [];
            }
        }
    }
    await raw("ANALYZE TABLE solution, vjudge_solution, users");
    console.log(`seeded ${userRows.length} users, ${total} solution rows, ${total} vjudge_solution rows`);
}

async function settle(fn: () => Promise<any>) {
    const t0 = process.hrtime.bigint();
    const c0 = process.cpuUsage();
    let out: string;
    try {
        out = JSON.stringify(await fn());
    } catch (e) {
        out = "THROWS";
    }
    const cpu = process.cpuUsage(c0);
    return { out, ms: Number(process.hrtime.bigint() - t0) / 1e6, cpuMs: (cpu.user + cpu.system) / 1000 };
}

async function main() {
    if (process.argv.includes("--seed")) {
        await seed();
    }
    const service = require("../../service/RanklistService").default;
    const monotone = await raw(`SELECT COUNT(*) AS n FROM (SELECT in_date, LAG(in_date) OVER (ORDER BY solution_id) AS prev FROM solution) t WHERE in_date < prev`);
    console.log(`solution 中 in_date 随 solution_id 递减的行数: ${monotone[0].n}（为 0 时并列次序与旧实现在任何执行计划下都一致）`);
    let diffs = 0, cases = 0;
    const timing: Record<string, { legacy: number, current: number, legacyCpu: number, currentCpu: number, n: number }> = {};
    for (const vjudge of [false, true]) {
        for (const ts of ["D", "W", "M", "Y", "ALL"]) {
            const time_stamp = ts === "ALL" ? "ALL" : ts;
            const plan = await raw(`EXPLAIN SELECT user_id, problem_id FROM ${vjudge ? "vjudge_solution" : "solution"} WHERE in_date >= ? AND result = 4`,
                [ts === "ALL" ? "1970-01-01" : dayjs().subtract(1, ({ D: "day", W: "week", M: "month", Y: "year" } as any)[ts]).format("YYYY-MM-DD")]);
            const pages: any[] = [];
            for (let p = 0; ; p++) {
                pages.push(p);
                const r = await settle(() => legacyGetRanklist({ page: p, search: "", time_stamp, vjudge }));
                if (r.out === "THROWS" || p > 400) break;
                if (JSON.parse(r.out).ranklist.length < PAGE_CNT) { pages.push(p + 1); break; }
            }
            pages.push("abc", -1, "-0.5", "0.5", "Infinity", "1");
            const key = `${vjudge ? "vjudge" : "local"}/${ts}`;
            timing[key] = { legacy: 0, current: 0, legacyCpu: 0, currentCpu: 0, n: 0 };
            for (const page of pages) {
                const opt = { page, search: "", time_stamp, vjudge };
                for (const viewer of [{ privileged: false }, { privileged: true }]) {
                    const a = await settle(() => legacyGetRanklist(opt, viewer));
                    const b = await settle(() => service.getRanklist(Object.assign({}, opt), viewer));
                    cases++;
                    if (!viewer.privileged && typeof page === "number") {
                        // 只统计常规页码的首次调用（第二个 viewer 会命中新实现的 2s 缓存，不计入）
                        timing[key].n++;
                        timing[key].legacy += a.ms;
                        timing[key].current += b.ms;
                        timing[key].legacyCpu += a.cpuMs;
                        timing[key].currentCpu += b.cpuMs;
                    }
                    if (a.out !== b.out) {
                        diffs++;
                        if (diffs <= 5) {
                            console.log(`DIFF ${key} page=${page} privileged=${viewer.privileged}\n  legacy : ${a.out.slice(0, 400)}\n  current: ${b.out.slice(0, 400)}`);
                        }
                    }
                }
            }
            const t = timing[key];
            const acRows = (await raw(`SELECT COUNT(*) AS n FROM ${vjudge ? "vjudge_solution" : "solution"} WHERE in_date >= ? AND result = 4`,
                [ts === "ALL" ? "1970-01-01" : dayjs().subtract(1, ({ D: "day", W: "week", M: "month", Y: "year" } as any)[ts]).format("YYYY-MM-DD")]))[0].n;
            console.log(`${key.padEnd(12)} AC行=${String(acRows).padStart(6)} 页数=${t.n} 计划=${plan[0].type}/${plan[0].key}  每页平均：` +
                `耗时 legacy ${(t.legacy / t.n).toFixed(1)}ms → 新 ${(t.current / t.n).toFixed(1)}ms；Node CPU legacy ${(t.legacyCpu / t.n).toFixed(1)}ms → 新 ${(t.currentCpu / t.n).toFixed(1)}ms`);
        }
    }
    console.log(`\n${cases} 个比对，${diffs} 个不一致`);
    process.exit(diffs === 0 ? 0 : 1);
}

main().catch(e => {
    console.error(e);
    process.exit(2);
});
