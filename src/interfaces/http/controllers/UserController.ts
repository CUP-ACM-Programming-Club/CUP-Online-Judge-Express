import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import UserUseCases from "../../../application/user/UserUseCases";

/** /user/email 等用户基本信息。 */
class UserController {
	@ErrorHandlerFactory(ok.okMaker)
	async getUserEmail(req: Request) {
		return UserUseCases.getUserEmail(req.params.user_id);
	}
}

export default new UserController();
