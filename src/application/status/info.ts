import { isAdmin } from "../../domain/policy/predicates";
import { submissionQueryRepository } from "../ports/SubmissionQueryRepository";
import { submissionSourcePrivilege } from "../ports/SubmissionSourcePrivilege";

const { error, ok } = require("../../domain/constants/state");

/**
 * 能否看某个提交的编译 / 运行错误详情：admin | 该提交的代码查看权限（source_browser、比赛助教等）| 本人（仅编译错误）。
 * 与 /status/compile_info、/status/runtime_info 的规则一致。
 */
async function canViewJudgeInfo(req: any, solutionId: any, ownerId: string, isCompileInfo: boolean): Promise<boolean> {
	if (isAdmin(req) || await submissionSourcePrivilege.checkPrivilege(req.session, solutionId)) {
		return true;
	}
	return isCompileInfo && !!req.session && req.session.user_id === ownerId;
}

const infoHandler = async function (req: any, database: string, solution_id: any, own_watch: boolean = false) {
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

module.exports = infoHandler;
module.exports.canViewJudgeInfo = canViewJudgeInfo;
module.exports.default = infoHandler;
