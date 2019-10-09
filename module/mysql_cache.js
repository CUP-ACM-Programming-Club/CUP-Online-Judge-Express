const query = require("./mysql_query");
const dayjs = require("dayjs");
const MySQLCachePool = require("../module/mysql/cache");

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function modifySql(sql) {
	return sql.includes("update") || sql.includes("insert") || sql.includes("delete");
}

const cache_query = async function (sql, sqlArr = [], opt = {copy: 0}) {
	let identified = sql.toString() + JSON.stringify(sqlArr.toString());
	let now = dayjs();
	const cache = MySQLCachePool.get(identified);
	if (cache) {
		if (cache.time.add(2, "second").isBefore(now)) {
			query(sql, sqlArr).then(value => MySQLCachePool.set(identified, value))
				.catch(console.log);
		}
		if (opt.copy) {
			return deepCopy(cache.data);
		}
		else {
			return cache.data;
		}
	}
	else {
		const lowerCaseSql = sql.toLowerCase();
		if (modifySql(lowerCaseSql)) {
			return await query(sql, sqlArr);
		}
		const resp = await query(sql, sqlArr);
		MySQLCachePool.set(identified, resp);
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
