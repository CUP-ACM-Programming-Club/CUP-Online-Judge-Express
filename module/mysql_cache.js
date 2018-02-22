const query = require("./mysql_query");
let cache_pool = [];
module.exports = async function cache_query(sql, sqlArr = []) {
	let identified = sql.toString() + sqlArr.toString();
	if (cache_pool[identified]) {
		query(sql, sqlArr)
			.then(resolve => {
				cache_pool[identified] = resolve;
			})
			.catch(err => {
			});
		return cache_pool[identified];
	}
	else {
		return (cache_pool[identified] = await query(sql, sqlArr));
	}
};