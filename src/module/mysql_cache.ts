import CacheScheduler from "../manager/cache/scheduler/CacheScheduler";

const query = require("./mysql_query");
const dayjs = require("dayjs");
const MySQLCachePool = require("./mysql/cache");

function deepCopy(obj: any) {
	return JSON.parse(JSON.stringify(obj));
}

function modifySql(sql: string) {
	return sql.includes("update") || sql.includes("insert") || sql.includes("delete");
}

CacheScheduler.addCacheContainer({
	cacheContainer: MySQLCachePool,
	timeDelta: 2,
	timeUnit: "second"
});

// Single-flight: collapse concurrent identical DB reads so a cache-miss or
// cache-expiry stampede results in exactly one query to the backing store.
// TTL/staleness semantics are unchanged (still 2s).
const inflight: Map<string, Promise<any>> = new Map();
function runOnce(identified: string, sql: string, sqlArr: any[]) {
	const existing = inflight.get(identified);
	if (existing) {
		return existing;
	}
	const p = (async () => {
		try {
			return await query(sql, sqlArr);
		} finally {
			inflight.delete(identified);
		}
	})();
	inflight.set(identified, p);
	return p;
}

const cache_query = async function (sql: string, sqlArr: any[] = [], opt: any = {copy: 0}) {
	let identified = sql.toString() + JSON.stringify(sqlArr.toString());
	let now = dayjs();
	let cache = await MySQLCachePool.get(identified);
	if (cache) {
		let data = cache.data;
		if (cache.time.add(2, "second").isBefore(now)) {
			const value = await runOnce(identified, sql, sqlArr);
			MySQLCachePool.set(identified, value);
			data = value;
		}
		if (opt.copy) {
			return deepCopy(data);
		}
		else {
			return data;
		}
	}
	else {
		const lowerCaseSql = sql.toLowerCase();
		if (modifySql(lowerCaseSql)) {
			return await query(sql, sqlArr);
		}
		const resp = await runOnce(identified, sql, sqlArr);
		await MySQLCachePool.set(identified, resp);
		return resp;
	}
};

cache_query.pool = query.pool;

const _end = query.pool.end;
query.pool.end = function() {
	if(!this._closed) {
		_end.apply(this, arguments);
	}
};

export = cache_query;
