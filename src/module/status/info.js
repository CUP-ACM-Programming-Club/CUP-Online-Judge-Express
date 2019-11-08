const query = require("../mysql_cache");
const {error, ok} = require("../constants/state");
module.exports = async function (req, database, solution_id, own_watch = false) {
	const user_id = req.session.user_id;
	const infoPromise = query(`select error from ${database} where solution_id = ?`, [solution_id]);
	const solutionPromise = query("select user_id from solution where solution_id = ?", [solution_id]);
	const [infoRes, solutionRes] = await Promise.all([infoPromise, solutionPromise]);
	if (solutionRes.length > 0) {
		if (!req.session.isadmin && (!own_watch || user_id !== solutionRes[0].user_id)) {
			return error.noprivilege;
		} else {
			return ok.okMaker({
				info: infoRes[0].error
			});
		}
	} else {
		return error.solutionIdNotValid;
	}
};
