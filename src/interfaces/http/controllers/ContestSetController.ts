import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import { isAdmin } from "../../../domain/policy/predicates";
import ContestSetUseCases from "../../../application/contestset/ContestSetUseCases";

/** HTTP 适配：比赛集（专题）。结果与异常包成 {status, data|statement}。 */
class ContestSetController {
	@ErrorHandlerFactory(ok.okMaker)
	async listContestSets(req: Request) {
		return await ContestSetUseCases.listContestSets(req.query.page, isAdmin(req));
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getContestSet(req: Request) {
		return await ContestSetUseCases.getContestSet(req.params.contestSetId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getContestSetForAdministrator(req: Request) {
		return await ContestSetUseCases.getContestSetForAdministrator(req.params.contestSetId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getContestSetList(req: Request) {
		return await ContestSetUseCases.getContestSetList(req.params.contestSetId, isAdmin(req));
	}

	@ErrorHandlerFactory(ok.okMaker)
	async addContestSet(req: Request) {
		await ContestSetUseCases.addContestSet(req.body, req.session!.user_id);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async updateContestSet(req: Request) {
		await ContestSetUseCases.updateContestSet(req.body);
	}
}

export default new ContestSetController();
