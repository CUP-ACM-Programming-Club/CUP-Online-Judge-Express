const cache_query = require("../mysql_cache");

async function solutionContainContestId(solution_id) {
	const data = await cache_query("select contest_id from solution where solution_id = ?", [solution_id]);
	return data && data.length > 0 && data[0].contest_id && !isNaN(parseInt(data[0].contest_id));
}

async function getSolutionInfo(solution_id) {
	const data = await cache_query("select * from solution where solution_id = ?", [solution_id]);
	return data && data.length > 0 ? data[0] : {};
}

module.exports = {
	solutionContainContestId,
	getSolutionInfo
};