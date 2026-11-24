import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import SubmissionViewUseCases from "../../../application/submission/SubmissionViewUseCases";

/** HTTP 适配：提交时段统计（原 SubmissionManager.getSubmissionHourInfo）。 */
class SubmissionStatsController {
	@ErrorHandlerFactory(ok.okMaker)
	async getSubmissionHourInfo(req: Request) {
		return await SubmissionViewUseCases.getSubmissionHourInfo();
	}
}

export default new SubmissionStatsController();
