import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import ContestInfoManager from "../../../application/contest/ContestInfoManager";

class ContestConfigController {
	@ErrorHandlerFactory(ok.okMaker)
	async getConfigByRequest(req: Request) {
		return await ContestInfoManager.getConfig(parseInt(req.params.contestId));
	}
}

export default new ContestConfigController();
