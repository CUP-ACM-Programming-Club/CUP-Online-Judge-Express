const query = require("./mysql_query");
const dayjs = require("dayjs");
let cache_pool = [];

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
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
		if (lowerCaseSql.indexOf("update") !== -1 || lowerCaseSql.indexOf("insert") !== -1) {
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

module.exports = cache_query;
