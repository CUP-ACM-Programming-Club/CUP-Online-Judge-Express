import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import ProblemPrefileUseCases, { PrefilePayload } from "../../../application/problem/ProblemPrefileUseCases";

/** 前置/后置代码：结果包成 {status, data|statement}。 */
class ProblemPrefileController {
	@ErrorHandlerFactory(ok.okMaker)
	async getPrependCode(problemId: number | string) {
		return await ProblemPrefileUseCases.getPrependCode(problemId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getAppendCode(problemId: number | string) {
		return await ProblemPrefileUseCases.getAppendCode(problemId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async setPrependCode(payload: PrefilePayload) {
		return await ProblemPrefileUseCases.setPrependCode(payload);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async setAppendCode(payload: PrefilePayload) {
		return await ProblemPrefileUseCases.setAppendCode(payload);
	}
}

export default new ProblemPrefileController();
