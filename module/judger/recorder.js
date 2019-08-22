const query = require("../mysql_query");
const isNumber = require("../util/isNumber");

async function maintainUserInfo(user_id) {
	await query("UPDATE `users` SET `solved`=(SELECT count(DISTINCT `problem_id`) FROM `solution` WHERE `user_id`= ? AND `result`='4') WHERE `user_id`= ?", [user_id, user_id]);
	await query("UPDATE `users` SET `submit`=(SELECT count(*) FROM `solution` WHERE `user_id`= ? and problem_id>0) WHERE `user_id`= ?", [user_id, user_id]);
}

async function maintainProblem(problem_id) {
	await query("UPDATE `problem` SET `accepted`=(SELECT count(*) FROM `solution` WHERE `problem_id`= ? AND `result`='4') WHERE `problem_id`= ?", [problem_id, problem_id]);
	await query("UPDATE `problem` SET `submit`=(SELECT count(*) FROM `solution` WHERE `problem_id`= ?) WHERE `problem_id`= ?", [problem_id, problem_id]);
}


async function baseSubmissionStore(payload) {
	payload.result = payload.state;
	let {time, memory, result, pass_point, pass_rate, judger, solution_id, sim, sim_s_id} = payload;
	await query("update solution set time = ?, memory = ?, result = ?, pass_point = ?, pass_rate = ?, judger = ? where solution_id = ?",
		[time, memory, result, pass_point, pass_rate, judger, solution_id]);
	if (isNumber(sim) && parseInt(sim) > 0) {
		await query("insert into sim(s_id,sim_s_id,sim) values(?,?,?) on duplicate key update  sim_s_id=?,sim=?", [solution_id, sim_s_id, sim, sim_s_id, sim]);
	}
}

async function storeNormalSubmission(payload) {
	await baseSubmissionStore(payload);
}

async function storeCompileErrorSubmission(payload) {
	await baseSubmissionStore(payload);
}

async function storeRuntimeErrorSubmission(payload) {
	await baseSubmissionStore(payload);
}

async function storeSubmission(payload) {
	if (payload.state === 11) {
		await storeCompileErrorSubmission(payload);
	} else if (payload.state === 10) {
		await storeRuntimeErrorSubmission(payload);
	} else {
		await storeNormalSubmission(payload);
	}
}

module.exports = {
	storeRuntimeErrorSubmission,
	storeCompileErrorSubmission,
	storeNormalSubmission,
	storeSubmission,
	baseSubmissionStore,
	maintainUserInfo,
	maintainProblem
};