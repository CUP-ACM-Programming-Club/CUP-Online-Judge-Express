const cache_query = require("../mysql_cache");

export async function getUserInfoByUserId(user_id: string) {
	return await cache_query("select * from users where user_id = ?", [user_id]);
}

export async function getUserIdBySolutionId(solution_id: string | number) {
	return (await cache_query("select user_id from solution where solution_id = ?", [solution_id]))[0].user_id;
}
