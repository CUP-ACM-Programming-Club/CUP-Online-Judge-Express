/**
 * 特征（characterization）测试公共设施。
 *
 * 目的：在重构数据访问层前后，对同一份「假数据库状态」得到逐字节一致的服务输出。
 * - 查询层被整体替换：无论服务通过 module/mysql_cache、module/mysql_query 还是新的 src/db 访问数据库，
 *   都落到同一个 engine(sql, params) 上，engine 按 SQL 形状模拟 MySQL 的返回。
 * - 快照保存在 src/test/fixtures/characterization/*.json，由「重构前」的代码生成
 *   （UPDATE_CHARACTERIZATION=1 时重写），之后只做比对。
 * - 比对的是 JSON.stringify 的结果（与 res.json 的序列化一致），因此字段顺序变化也会被发现。
 */
import fs from "fs";
import path from "path";

const Module = require("module");

export type Engine = (sql: string, params?: any[]) => Promise<any>;

export interface QueryLog {
    sql: string;
    params: any[];
}

/** 让被测服务的所有数据库访问都走 engine；返回卸载函数 */
export function interceptQueryLayer(engine: Engine, extra: Record<string, any> = {}) {
    const previousLoad = Module._load;
    const cacheFn: any = (sql: string, params?: any[]) => engine(sql, params);
    cacheFn.pool = { end() { } };
    const queryFn: any = (sql: string, params?: any[]) => engine(sql, params);
    queryFn.pool = cacheFn.pool;
    const dbObj = {
        query: (sql: string, params?: any[]) => engine(sql, params),
        cachedQuery: (sql: string, params?: any[]) => engine(sql, params),
        tx: async (fn: any) => fn({ query: (sql: string, params?: any[]) => engine(sql, params) })
    };
    Module._load = function (request: string, parent: any, isMain: any) {
        if (request.includes("mysql_cache")) return cacheFn;
        if (request.includes("mysql_query")) return queryFn;
        if (/(^|\/)db(\/index)?$/.test(request)) return dbObj;
        for (const key of Object.keys(extra)) {
            if (request.includes(key)) return extra[key];
        }
        return previousLoad.apply(this, arguments as any);
    };
    return () => {
        Module._load = previousLoad;
    };
}

export function freshRequire(modulePath: string) {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
}

const SNAPSHOT_DIR = path.resolve(__dirname, "..", "fixtures", "characterization");

/**
 * 读取（或在 UPDATE_CHARACTERIZATION=1 时写入）快照。返回 name -> 序列化输出。
 */
export function loadOrWriteSnapshot(file: string, actual: Record<string, string>): Record<string, string> {
    const target = path.join(SNAPSHOT_DIR, file);
    if (process.env.UPDATE_CHARACTERIZATION === "1") {
        fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
        fs.writeFileSync(target, JSON.stringify(actual, null, 2) + "\n");
        return actual;
    }
    if (!fs.existsSync(target)) {
        throw new Error(`快照 ${target} 不存在；请在重构前的代码上以 UPDATE_CHARACTERIZATION=1 运行生成`);
    }
    return JSON.parse(fs.readFileSync(target, "utf8"));
}

/** 确定性伪随机（LCG），保证每次生成同样的假数据 */
export function lcg(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

export function normalizeSql(sql: string) {
    return sql.replace(/\s+/g, " ").trim();
}

/** utf8_general_ci 的近似：大小写不敏感（足够模拟 user_id 大小写变体） */
export function ciEqual(a: any, b: any) {
    return String(a).toLowerCase() === String(b).toLowerCase();
}

/** 解析 "SELECT a, b,c FROM" 的列清单并对行做投影（保持列顺序） */
export function project(sql: string, row: Record<string, any>) {
    const m = normalizeSql(sql).match(/^select (.+?) from /i);
    if (!m) {
        throw new Error("cannot parse select list: " + sql);
    }
    const out: Record<string, any> = {};
    for (const col of m[1].split(",").map(c => c.trim())) {
        out[col] = row[col] === undefined ? null : row[col];
    }
    return out;
}

/** 捕获异常并转为可快照的结果（真实 MySQL 错误文本与假库不同，只记录「抛错」本身） */
export async function settle(fn: () => Promise<any>) {
    try {
        return JSON.stringify(await fn());
    } catch (e: any) {
        return JSON.stringify({ __threw__: e instanceof TypeError ? `TypeError: ${e.message}` : "error" });
    }
}
