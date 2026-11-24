import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import CaptchaChecker from "../decorators/CaptchaChecker";
import LostPasswordUseCases from "../../../application/auth/LostPasswordUseCases";

/** /lost/password：匿名找回密码。 */
class LostPasswordController {
	@ErrorHandlerFactory(ok.okMaker)
	async getConfirmQuestion(req: Request) {
		return await LostPasswordUseCases.getConfirmQuestion(req.params.user_id);
	}

	@ErrorHandlerFactory(ok.okMaker)
	@CaptchaChecker(0, "lost")
	async resetPassword(req: Request) {
		await LostPasswordUseCases.resetPassword(req.body);
	}
}

export default new LostPasswordController();
