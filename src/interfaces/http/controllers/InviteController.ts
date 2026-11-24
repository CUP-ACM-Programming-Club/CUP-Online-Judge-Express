import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import InviteUseCases from "../../../application/user/InviteUseCases";

/** /admin/account/invite：邀请码管理。 */
class InviteController {
	@ErrorHandlerFactory(ok.okMaker)
	async addInviteCode(req: Request) {
		const userId = req.session!.user_id;
		return await InviteUseCases.addInviteCode(userId, req.body.expireDate, req.body.validUserNumber);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getAllInviteCode() {
		return await InviteUseCases.getAllInviteCode();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getInviteCodePage(req: Request) {
		return InviteUseCases.getInviteCodePage(req.params.page);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async expireInviteCode(req: Request) {
		const inviteCode = req.body.inviteCode;
		await InviteUseCases.expireInviteCode(inviteCode);
		return;
	}
}

export default new InviteController();
