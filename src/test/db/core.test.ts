import { expect } from "chai";
import dayjs from "dayjs";
import { createDb, cacheKeyOf } from "../../db/core";
import { openTransaction } from "../../manager/mysql/transaction";

function fakeCache() {
    const store = new Map<string, { data: any, time: dayjs.Dayjs }>();
    return {
        store,
        async get(key: string) { return store.get(key) || null; },
        getAllKey() { return [...store.keys()]; },
        async setWithTimestamp() { },
        async set(key: string, value: any) { store.set(key, { data: value, time: dayjs() }); },
        remove(key: string) { store.delete(key); },
        removeAll() { store.clear(); },
        age(key: string, ms: number) {
            const e = store.get(key)!;
            e.time = e.time.subtract(ms, "millisecond");
        }
    };
}

function setup(rows: (sql: string, params: any[]) => any = () => [{ n: 1 }]) {
    const calls: Array<{ sql: string, params: any }> = [];
    const cache = fakeCache();
    const txLog: string[] = [];
    let commitFails = false;
    let rollbackFails = false;
    const db = createDb({
        execQuery: async (sql, params) => {
            calls.push({ sql, params });
            return rows(sql, params || []);
        },
        transaction: async () => ({
            query: async (sql: string) => {
                txLog.push(sql);
                if (sql === "COMMIT" && commitFails) throw new Error("commit failed");
                if (sql === "ROLLBACK" && rollbackFails) throw new Error("rollback failed");
                return [{ sql }];
            },
            release: async () => { txLog.push("release"); }
        }),
        cache
    });
    return {
        db, calls, cache, txLog,
        failCommit() { commitFails = true; },
        failRollback() { rollbackFails = true; }
    };
}

describe("src/db core", function () {
    describe("query", function () {
        it("直接委托给连接池查询，不缓存", async function () {
            const { db, calls } = setup();
            await db.query("select 1", [1]);
            await db.query("select 1", [1]);
            expect(calls.length).to.equal(2);
            expect(calls[0]).to.deep.equal({ sql: "select 1", params: [1] });
        });

        it("透传底层错误", async function () {
            const db = createDb({
                execQuery: () => Promise.reject({ error: "boom", sql: "x", args: [] }),
                transaction: async () => { throw new Error("unused"); },
                cache: fakeCache()
            });
            try {
                await db.query("x");
                expect.fail("should throw");
            } catch (e: any) {
                expect(e).to.deep.equal({ error: "boom", sql: "x", args: [] });
            }
        });
    });

    describe("cachedQuery", function () {
        it("必须显式给出 ttlMs", function () {
            const { db } = setup();
            expect(() => (db.cachedQuery as any)("select 1", [])).to.throw(TypeError);
            expect(() => (db.cachedQuery as any)("select 1", [], {})).to.throw(TypeError);
        });

        it("TTL 内命中缓存，超过 TTL 回源刷新", async function () {
            let n = 0;
            const { db, calls, cache } = setup(() => [{ n: ++n }]);
            const a = await db.cachedQuery("select n", [1], { ttlMs: 1000 });
            const b = await db.cachedQuery("select n", [1], { ttlMs: 1000 });
            expect(calls.length).to.equal(1);
            expect(b).to.deep.equal(a);

            cache.age(cacheKeyOf("select n", [1]), 1500);
            const c = await db.cachedQuery("select n", [1], { ttlMs: 1000 });
            expect(calls.length).to.equal(2);
            expect(c).to.deep.equal([{ n: 2 }]);

            // 同一条目用更长的 TTL 读取时仍算新鲜
            cache.age(cacheKeyOf("select n", [1]), 1500);
            await db.cachedQuery("select n", [1], { ttlMs: 5000 });
            expect(calls.length).to.equal(2);
        });

        it("不靠字符串猜测读写：含 update 字样的 SELECT 也会缓存", async function () {
            const { db, calls } = setup();
            const sql = "select last_update from contest where contest_id = ?";
            await db.cachedQuery(sql, [1], { ttlMs: 2000 });
            await db.cachedQuery(sql, [1], { ttlMs: 2000 });
            expect(calls.length).to.equal(1);
        });

        it("参数不同不串键（旧键格式下 ['a,b'] 与 [['a','b']] 会撞键）", async function () {
            const { db, calls } = setup((sql, params) => [{ p: JSON.stringify(params) }]);
            const a = await db.cachedQuery("select ?", ["a,b"], { ttlMs: 2000 });
            const b = await db.cachedQuery("select ?", [["a", "b"]], { ttlMs: 2000 });
            expect(calls.length).to.equal(2);
            expect(a).to.not.deep.equal(b);
        });

        it("并发未命中只回源一次（single-flight）", async function () {
            let release: (v: any) => void = () => { };
            const calls: any[] = [];
            const db = createDb({
                execQuery: (sql) => { calls.push(sql); return new Promise(r => { release = r; }); },
                transaction: async () => { throw new Error("unused"); },
                cache: fakeCache()
            });
            const p = Promise.all([1, 2, 3].map(() => db.cachedQuery("select slow", [], { ttlMs: 2000 })));
            await new Promise(r => setImmediate(r));
            release([{ ok: 1 }]);
            const results = await p;
            expect(calls.length).to.equal(1);
            expect(results).to.deep.equal([[{ ok: 1 }], [{ ok: 1 }], [{ ok: 1 }]]);
        });

        it("查询失败不写缓存", async function () {
            let fail = true;
            const { db, calls } = setup(() => {
                if (fail) throw new Error("db down");
                return [{ ok: 1 }];
            });
            try {
                await db.cachedQuery("select x", [], { ttlMs: 2000 });
                expect.fail("should throw");
            } catch (e: any) {
                expect(e.message).to.equal("db down");
            }
            fail = false;
            expect(await db.cachedQuery("select x", [], { ttlMs: 2000 })).to.deep.equal([{ ok: 1 }]);
            expect(calls.length).to.equal(2);
        });

        it("cachedQueryByKey：shouldCacheOnMiss=false 时直接查询且不写缓存", async function () {
            const { db, calls, cache } = setup();
            await db.cachedQueryByKey("k", "delete from x", [], 2000, { cacheOnMiss: () => false });
            await db.cachedQueryByKey("k", "delete from x", [], 2000, { cacheOnMiss: () => false });
            expect(calls.length).to.equal(2);
            expect(cache.store.size).to.equal(0);
        });

        it("cachedQueryByKey：mapHit 只作用于命中（含过期刷新）路径，首次未命中返回原始结果", async function () {
            const { db, cache } = setup(() => [{ n: 1 }]);
            const tag = (d: any) => ({ hit: d });
            expect(await db.cachedQueryByKey("k", "select n", [], 2000, { mapHit: tag })).to.deep.equal([{ n: 1 }]);
            expect(await db.cachedQueryByKey("k", "select n", [], 2000, { mapHit: tag })).to.deep.equal({ hit: [{ n: 1 }] });
            cache.age("k", 3000);
            expect(await db.cachedQueryByKey("k", "select n", [], 2000, { mapHit: tag })).to.deep.equal({ hit: [{ n: 1 }] });
        });
    });

    describe("tx", function () {
        it("fn 正常返回：COMMIT 后归还连接，返回 fn 的结果", async function () {
            const { db, txLog } = setup();
            const result = await db.tx(async t => {
                await t.query("insert into a values (1)");
                await t.query("update b set c = 1");
                return "done";
            });
            expect(result).to.equal("done");
            expect(txLog).to.deep.equal(["insert into a values (1)", "update b set c = 1", "COMMIT", "release"]);
        });

        it("fn 抛错：ROLLBACK 后归还连接，并原样抛出", async function () {
            const { db, txLog } = setup();
            const err = new Error("biz");
            try {
                await db.tx(async t => {
                    await t.query("insert into a values (1)");
                    throw err;
                });
                expect.fail("should throw");
            } catch (e) {
                expect(e).to.equal(err);
            }
            expect(txLog).to.deep.equal(["insert into a values (1)", "ROLLBACK", "release"]);
        });

        it("COMMIT 失败：尝试 ROLLBACK，抛出 COMMIT 的错误，仍归还连接", async function () {
            const s = setup();
            s.failCommit();
            try {
                await s.db.tx(async () => 1);
                expect.fail("should throw");
            } catch (e: any) {
                expect(e.message).to.equal("commit failed");
            }
            expect(s.txLog).to.deep.equal(["COMMIT", "ROLLBACK", "release"]);
        });

        it("ROLLBACK 也失败：仍抛出业务错误并归还连接", async function () {
            const s = setup();
            s.failRollback();
            try {
                await s.db.tx(async () => { throw new Error("biz"); });
                expect.fail("should throw");
            } catch (e: any) {
                expect(e.message).to.equal("biz");
            }
            expect(s.txLog).to.deep.equal(["ROLLBACK", "release"]);
        });

        describe("基于 openTransaction 的真实连接包装", function () {
            function fakePool() {
                const log: string[] = [];
                const connection = {
                    threadId: 7,
                    query(sql: string, binding: any, cb?: any) {
                        if (typeof binding === "function") { cb = binding; }
                        log.push(sql);
                        cb(null, []);
                    },
                    release() { log.push("<release>"); },
                    destroy() { log.push("<destroy>"); }
                };
                return { log, pool: { getConnection(cb: any) { cb(null, connection); } } };
            }

            it("提交路径：START → 业务 SQL → COMMIT → 归还（不会多回滚）", async function () {
                const { log, pool } = fakePool();
                const db = createDb({ execQuery: async () => [], transaction: () => openTransaction(pool), cache: fakeCache() });
                await db.tx(async t => { await t.query("insert into a values (?)", [1]); });
                expect(log).to.deep.equal(["START TRANSACTION", "insert into a values (?)", "COMMIT", "<release>"]);
            });

            it("回滚路径：START → 业务 SQL → ROLLBACK → 归还（不会重复回滚）", async function () {
                const { log, pool } = fakePool();
                const db = createDb({ execQuery: async () => [], transaction: () => openTransaction(pool), cache: fakeCache() });
                try {
                    await db.tx(async t => { await t.query("insert into a values (?)", [1]); throw new Error("x"); });
                } catch (e) { /* expected */ }
                expect(log).to.deep.equal(["START TRANSACTION", "insert into a values (?)", "ROLLBACK", "<release>"]);
            });
        });
    });
});
