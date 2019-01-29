const query = require("./mysql_query");
const dayjs = require("dayjs");
let cache_pool = [];

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function modifySql(sql) {
	return sql.includes("update") || sql.includes("insert") || sql.includes("delete");
}

const cache_query = async function (sql, sqlArr = [], opt = {copy: 0}) {
	let identified = sql.toString() + JSON.stringify(sqlArr.toString());
	let now = dayjs();
	if (cache_pool[identified]) {
		let before = cache_pool[identified].time;
		if (before.add(2, "second").isBefore(now)) {
			query(sql, sqlArr)
				.then(resolve => {
					cache_pool[identified].data = resolve;
					cache_pool[identified].time = dayjs();
				})
				.catch(err => err);
		}
		if (opt.copy) {
			return deepCopy(cache_pool[identified].data);
		}
		else {
			return cache_pool[identified].data;
		}
	}
	else {
		const lowerCaseSql = sql.toLowerCase();
		if (modifySql(lowerCaseSql)) {
			return await query(sql, sqlArr);
		}
		cache_pool[identified] = {
			data: await query(sql, sqlArr),
			time: dayjs()
		};
		return cache_pool[identified].data;
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
