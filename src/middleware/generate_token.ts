import {Request, Response, NextFunction} from "express";
import TokenManager from "../module/account/token/TokenManager";
const HashLength = 16;
const createHash = require("hash-generator");

export = function (req: Request, res: Response, next: NextFunction) {
	const hash = createHash(HashLength);
	res.cookie("newToken", hash, Object.assign({maxAge: 3600 * 1000 * 24, httpOnly: true}, global.config.cookie));
	res.cookie("user_id", req.session!.user_id, Object.assign({maxAge: 3600 * 1000 * 24, httpOnly: true}, global.config.cookie));
	TokenManager.storeToken(req.session!.user_id, hash);
	if (typeof next === "function") {
		return next();
	}
};
