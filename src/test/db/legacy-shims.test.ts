/**
 * module/mysql_cache、module/mysql_query 兼容外壳：确认重构后行为与旧实现一致。
 */
import { expect } from "chai";
import dayjs from "dayjs";
import { createDb } from "../../infrastructure/db/core";

const Module = require("module");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

/**
 * 绕过 require.cache 与 mock-external 的按路径覆盖，直接编译加载源文件；
 * 其内部的 require 仍经过 Module._load，因此可以被本测试拦截。
 */
function loadSource(relPath: string) {
    const filename = path.resolve(__dirname, relPath);
    const source = fs.readFileSync(filename, "utf8");
    const out = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true }
    });
    const m = new Module(filename, module);
    m.filename = filename;
    m.paths = Module._nodeModulePaths(path.dirname(filename));
    m._compile(out.outputText, filename);
    return m.exports;
}

function setup() {
    const calls: Array<{ sql: string, params: any }> = [];
    const store = new Map<string, any>();
    const cache = {
        async get(key: string) { return store.get(key) || null; },
        getAllKey() { return [...store.keys()]; },
        async setWithTimestamp() { },
        async set(key: string, value: any) { store.set(key, { data: value, time: dayjs() }); },
        remove(key: string) { store.delete(key); },
        removeAll() { store.clear(); }
    };
    let n = 0;
    const db = createDb({
        execQuery: async (sql, params) => {
            calls.push({ sql, params });
            n++;
            return [{ n, at: new Date("2026-01-01T00:00:00.000Z") }];
        },
        transaction: async () => { throw new Error("unused"); },
        cache
    });
    const execCallbacks: any[] = [];
    const fakeManager = {
        MySQLManager: {
            mysqlPool: { _closed: false, end() { } },
            execQuery(sql: string, arr: any, cb: any) { execCallbacks.push({ sql, arr }); cb(["cb-result"], []); }
        }
    };
    const dbModule = Object.assign({ default: db, LEGACY_CACHE_TTL_MS: 2000 }, db);
    let mysqlQuery: any;
    const previousLoad = Module._load;
    Module._load = function (request: string) {
        if (request === ".." || /(^|\/)db$/.test(request)) return dbModule;
        if (request.includes("MySQLManager")) return fakeManager;
        if (request === "./mysql_query") return mysqlQuery;
        return previousLoad.apply(this, arguments as any);
    };
    let cacheQuery: any;
    try {
        mysqlQuery = loadSource("../../infrastructure/db/legacy/mysql_query.ts");
        cacheQuery = loadSource("../../infrastructure/db/legacy/mysql_cache.ts");
    } finally {
        Module._load = previousLoad;
    }
    return {
        calls, store, cacheQuery, mysqlQuery, execCallbacks,
        age(key: string, ms: number) { store.get(key).time = store.get(key).time.subtract(ms, "millisecond"); }
    };
}

describe("legacy shims over src/db", function () {
    it("mysql_cache：2s 内命中，超过 2s 回源刷新", async function () {
        const s = setup();
        await s.cacheQuery("select * from users where user_id = ?", ["a"]);
        await s.cacheQuery("select * from users where user_id = ?", ["a"]);
        expect(s.calls.length).to.equal(1);
        s.age("select * from users where user_id = ?" + JSON.stringify("a"), 1900);
        await s.cacheQuery("select * from users where user_id = ?", ["a"]);
        expect(s.calls.length).to.equal(1);
        s.age("select * from users where user_id = ?" + JSON.stringify("a"), 200);
        const r = await s.cacheQuery("select * from users where user_id = ?", ["a"]);
        expect(s.calls.length).to.equal(2);
        expect(r[0].n).to.equal(2);
    });

    it("mysql_cache：缓存键沿用旧格式 sql + JSON.stringify(sqlArr.toString())（后台按键清缓存依赖它）", async function () {
        const s = setup();
        await s.cacheQuery("select ?", [1, "x"]);
        expect([...s.store.keys()]).to.deep.equal(["select ?" + JSON.stringify("1,x")]);
    });

    it("mysql_cache：旧的写语句启发式只保留在外壳里（含 update 字样的 SELECT 不缓存）", async function () {
        const s = setup();
        await s.cacheQuery("SELECT last_update FROM contest", []);
        await s.cacheQuery("SELECT last_update FROM contest", []);
        await s.cacheQuery("INSERT INTO t VALUES (1)", []);
        await s.cacheQuery("INSERT INTO t VALUES (1)", []);
        expect(s.calls.length).to.equal(4);
        expect(s.store.size).to.equal(0);
    });

    it("mysql_cache：opt.copy 只对命中缓存的结果做 JSON 深拷贝", async function () {
        const s = setup();
        const miss = await s.cacheQuery("select 1", [], { copy: 1 });
        expect(miss[0].at).to.be.instanceOf(Date);
        const hit = await s.cacheQuery("select 1", [], { copy: 1 });
        expect(hit[0].at).to.equal("2026-01-01T00:00:00.000Z");
        const hitNoCopy = await s.cacheQuery("select 1", []);
        expect(hitNoCopy[0].at).to.be.instanceOf(Date);
    });

    it("mysql_cache：保留 .pool", function () {
        const s = setup();
        expect(s.cacheQuery.pool).to.equal(s.mysqlQuery.pool);
    });

    it("mysql_query：Promise 用法走 db.query，回调用法沿用 MySQLManager.execQuery", async function () {
        const s = setup();
        const r = await s.mysqlQuery("select 2", [5]);
        expect(r[0].n).to.equal(1);
        expect(s.calls).to.deep.equal([{ sql: "select 2", params: [5] }]);
        let got: any;
        s.mysqlQuery("select 3", [6], (res: any) => { got = res; });
        expect(got).to.deep.equal(["cb-result"]);
        expect(s.execCallbacks).to.deep.equal([{ sql: "select 3", arr: [6] }]);
    });
});
