import { Request, Response } from "express";
import { ok } from "../../../domain/constants/state";
import { canBrowseSource, isEditor } from "../../../domain/policy/predicates";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import ContestModeChecker from "../decorators/ContestModeChecker";
import ProblemSetUseCases from "../../../application/problemset/ProblemSetUseCases";

/** 题库列表：比赛模式检查、从请求取参数，结果平铺成 {status, ...}。 */
class ProblemSetController {
	@ErrorHandlerFactory(ok.okFlatMaker)
	@ContestModeChecker(0)
	async getProblem(req: Request, res?: Response) {
		return await ProblemSetUseCases.getProblemList({
			source: req.query.source,
			start: req.params.start,
			search: req.params.search,
			label: req.query.label,
			from: req.query.from,
			order: req.params.order,
			orderRule: req.params.order_rule,
			browsePrivilege: canBrowseSource(req) || isEditor(req),
			userId: req.session!.user_id
		});
	}
}

export default new ProblemSetController();
