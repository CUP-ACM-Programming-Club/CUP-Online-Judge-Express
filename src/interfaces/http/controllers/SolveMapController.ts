import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import SolveMapUseCases from "../../../application/submission/SolveMapUseCases";

/** HTTP 适配：做题关系图，结果包成 {status, data}（原 SolveMapManager 上的 ErrorHandlerFactory）。 */
class SolveMapController {
	@ErrorHandlerFactory(ok.okMaker)
	async getUserList() {
		return await SolveMapUseCases.getUserList();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getTotalACList() {
		return await SolveMapUseCases.getTotalACList();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getUserACList(userId: string) {
		return await SolveMapUseCases.getUserACList(userId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getSolveMap(problemId?: number | string) {
		return await SolveMapUseCases.getSolveMap(problemId);
	}
}

export default new SolveMapController();
