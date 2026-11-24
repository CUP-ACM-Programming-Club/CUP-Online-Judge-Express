import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import AwardUseCases from "../../../application/award/AwardUseCases";

/** HTTP 适配：从请求里取参数，调用用例，把结果/异常包成 {status, data|statement}。 */
class AwardController {
	@ErrorHandlerFactory(ok.okMaker)
	async add(req: Request) {
		await AwardUseCases.add(req.body);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async update(req: Request) {
		await AwardUseCases.update(req.params.award_id, req.body);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async remove(req: Request) {
		await AwardUseCases.remove(req.params.award_id);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async get(req: Request) {
		return await AwardUseCases.get(req.params.award_id);
	}
}

export default new AwardController();
