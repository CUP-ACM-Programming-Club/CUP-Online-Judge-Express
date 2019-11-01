const query = require("../mysql_query");
module.exports = async function (contest_id) {
	let sql = `select s_id, sim_s_id, sim, s_user_id, s_s_user_id,num from (select * from sim where s_id in (select solution_id from solution where contest_id = ?))a
left join solution on solution.solution_id = a.s_id`;
	return await query(sql, [contest_id]);
};