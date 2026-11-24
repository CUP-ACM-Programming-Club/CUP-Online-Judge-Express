import { isAdmin } from "../../domain/policy/predicates";
import { submissionQueryRepository } from "../ports/SubmissionQueryRepository";
import { submissionSourcePrivilege } from "../ports/SubmissionSourcePrivilege";

const { error, ok } = require("../../domain/constants/state");
export = async function (req: any, database: string, solution_id: any, own_watch: boolean = false) {
	const user_id = req.session.user_id;
	const infoPromise = submissionQueryRepository.findInfoError(database, solution_id);
	const solutionPromise = submissionQueryRepository.findSolutionUser(solution_id);
	const [infoRes, solutionRes] = await Promise.all([infoPromise, solutionPromise]);
	if (solutionRes.length > 0) {
		if (!(isAdmin(req) || await submissionSourcePrivilege.checkPrivilege(req.session, solution_id)) && (!own_watch || user_id !== solutionRes[0].user_id)) {
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
