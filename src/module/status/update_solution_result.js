const [error, ok] = require("../const_var");
const query = require("../../module/mysql_query");

async function rejudgeHandler(idName, id, result) {
	return await query(`update solution set result = ? where ${idName} = ?`, [result, id]);
}

function rejudgeFactory(idName) {
	return async function (id, result) {
		return await rejudgeHandler(idName, id, result);
	};
}

const rejudgeByContest = rejudgeFactory("contest_id");
const rejudgeBySolution = rejudgeFactory("solution_id");
const rejudgeByProblem = rejudgeFactory("problem_id");
async function router(req, res, result) {
	if(isNaN(result)) {
		res.json(error.invalidParams);
		return;
	}
	try {
		const solution_id = req.body.solution_id;
		if (typeof solution_id === "undefined" || isNaN(solution_id)) {
			res.json(error.solutionIdNotValid);
		}
		else {
			await rejudgeBySolution(solution_id, 1);
			res.json(ok.ok);
		}
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
}

module.exports = {
	rejudgeFactory,
	rejudgeHandler,
	rejudgeBySolution,
	rejudgeByContest,
	rejudgeByProblem,
	router
};
