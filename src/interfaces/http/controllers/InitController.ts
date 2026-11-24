import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import CaptchaChecker from "../decorators/CaptchaChecker";
import InitUseCases from "../../../application/auth/InitUseCases";
const getIP = require("../getIP");

/** /init/firstrun：首次安装创建管理员、写配置文件。 */
class InitController {
	@ErrorHandlerFactory(ok.okMaker)
	@CaptchaChecker(0, "init")
	async initSystemAdminUser(req: Request) {
		return await InitUseCases.initSystemAdminUser(req.body, getIP(req));
	}

	@ErrorHandlerFactory(ok.okMaker)
	initConfigFile(req: Request) {
		const content = req.body.content;
		return InitUseCases.initConfigFile(content);
	}
}

export default new InitController();
