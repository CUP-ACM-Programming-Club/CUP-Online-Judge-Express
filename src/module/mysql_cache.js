const query = require("./mysql_query");
const dayjs = require("dayjs");
const MySQLCachePool = require("./mysql/cache");

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function modifySql(sql) {
	return sql.includes("update") || sql.includes("insert") || sql.includes("delete");
}

const cache_query = async function (sql, sqlArr = [], opt = {copy: 0}) {
	let identified = sql.toString() + JSON.stringify(sqlArr.toString());
	let now = dayjs();
	let cache = await MySQLCachePool.get(identified);
	if (cache) {
		let data = cache.data;
		if (cache.time.add(2, "second").isBefore(now)) {
			const value = await query(sql, sqlArr);
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
		const resp = await query(sql, sqlArr);
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

module.exports = cache_query;
