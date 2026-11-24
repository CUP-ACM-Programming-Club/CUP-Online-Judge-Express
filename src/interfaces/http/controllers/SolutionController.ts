import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import SolutionUseCases from "../../../application/submission/SolutionUseCases";

/** HTTP 适配：提交判题信息、比赛提交导出（原 SolutionManager 的 *ByRequest 方法）。 */
class SolutionController {
	@ErrorHandlerFactory(ok.okMaker)
	async getSolutionInfoByRequest(req: Request) {
		const solutionId = parseInt(req.params.solutionId);
		return await SolutionUseCases.getSolutionInfo(req, solutionId);
	}

	async getSolutionExportInfoByContestId(req: Request) {
		const contestId = parseInt(req.params.contestId);
		return await SolutionUseCases.getSolutionExportInfoByContestId(contestId);
	}

	async getLastSolutionExportInfoByContestId(req: Request) {
		const contestId = parseInt(req.params.contestId);
		return await SolutionUseCases.getLastSolutionExportInfoByContestId(contestId);
	}
}

export default new SolutionController();
