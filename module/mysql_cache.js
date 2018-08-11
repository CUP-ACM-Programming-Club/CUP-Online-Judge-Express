const query = require("./mysql_query");
const dayjs = require("dayjs");
let cache_pool = [];
module.exports = async function cache_query(sql, sqlArr = []) {
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
		return cache_pool[identified].data;
	}
	else {
		const lowerCaseSql = sql.toLowerCase();
		if(lowerCaseSql.indexOf("update") !== -1 || lowerCaseSql.indexOf("insert") !== -1) {
			return await query(sql,sqlArr);
		}
		cache_pool[identified] = {
			data: await query(sql, sqlArr),
			time: dayjs()
		};
		return cache_pool[identified].data;
	}
};
