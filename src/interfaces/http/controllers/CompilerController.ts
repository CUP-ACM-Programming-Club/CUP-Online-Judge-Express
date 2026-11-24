import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import CompileArgumentsUseCases from "../../../application/submission/CompileArgumentsUseCases";

/** HTTP 适配：判题机编译参数（原 CompilerManager 的 *ByRequest 方法）。 */
class CompilerController {
	@ErrorHandlerFactory(ok.okMaker)
	async getCompileArgumentsByRequest(req: Request) {
		return await CompileArgumentsUseCases.getCompileArguments();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async updateCompileArgumentsByRequest(req: Request) {
		const payload = req.body.payload;
		return await CompileArgumentsUseCases.updateCompileArguments(payload);
	}
}

export default new CompilerController();
