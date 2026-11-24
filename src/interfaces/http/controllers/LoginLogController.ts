import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import LoginLogUseCases from "../../../application/user/LoginLogUseCases";

/** 登录日志：/env/client 上报，/system/log/login 查询。 */
class LoginLogController {
	@ErrorHandlerFactory(ok.okMaker)
	async setUserIdLoginLog(req: Request) {
		const userId = req.session!.user_id;
		// @ts-ignore
		const ip = req.clientIp;
		await LoginLogUseCases.record(userId, req.body, ip);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getLatestLoginLog(req: Request) {
		return await LoginLogUseCases.getLatest();
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getUserLoginLog(req: Request) {
		const userId = req.params.userId;
		return await LoginLogUseCases.getByUser(userId, req.query.page);
	}
}

export default new LoginLogController();
