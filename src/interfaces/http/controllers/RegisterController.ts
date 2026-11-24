import { Request } from "express";
import RegisterService from "../../../application/auth/RegisterService";
const getIP = require("../getIP");

/** POST /register：邀请码注册。与重构前一致，不包 ErrorHandler（异常直接抛给路由）。 */
class RegisterController {
	async register(req: Request) {
		return await RegisterService.registerUser(req.body, getIP(req));
	}
}

export default new RegisterController();
