import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import ContestAccountGenerateUseCases from "../../../application/account/ContestAccountGenerateUseCases";
const getIP = require("../getIP");

/** POST /admin/account/generate/batch：批量生成比赛账号。 */
class ContestAccountGenerateController {
	@ErrorHandlerFactory(ok.okMaker)
	async batchGenerateAccount(req: Request) {
		return await ContestAccountGenerateUseCases.batchGenerate(req.body, getIP(req));
	}
}

export default new ContestAccountGenerateController();
