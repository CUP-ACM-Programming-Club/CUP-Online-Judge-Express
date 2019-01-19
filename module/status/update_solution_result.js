const [error, ok] = require("../const_var");
const query = require("../../module/mysql_cache");
module.exports = async (req, res, result) => {
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
			await query("update solution set result = ? where solution_id = ?", [result, solution_id]);
			res.json(ok.ok);
		}
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
};
