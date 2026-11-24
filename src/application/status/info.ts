import SourcePrivilegeCache from "../../infrastructure/persistence/submission/SourcePrivilegeCache";
import { isAdmin } from "../../domain/policy/predicates";

const query = require("../../infrastructure/db/legacy/mysql_cache");
const { error, ok } = require("../../domain/constants/state");
export = async function (req: any, database: string, solution_id: any, own_watch: boolean = false) {
	const user_id = req.session.user_id;
	const infoPromise = query(`select error from ${database} where solution_id = ?`, [solution_id]);
	const solutionPromise = query("select user_id from solution where solution_id = ?", [solution_id]);
	const [infoRes, solutionRes] = await Promise.all([infoPromise, solutionPromise]);
	if (solutionRes.length > 0) {
		if (!(isAdmin(req) || await SourcePrivilegeCache.checkPrivilege(req.session, solution_id)) && (!own_watch || user_id !== solutionRes[0].user_id)) {
			return error.noprivilege;
		} else {
			return ok.okMaker({
				// accepted submissions have no compile/runtime info row
				info: infoRes.length > 0 ? infoRes[0].error : ""
			});
		}
	} else {
		return error.solutionIdNotValid;
	}
};
