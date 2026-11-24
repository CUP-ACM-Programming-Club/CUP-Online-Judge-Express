import express from "express";
const router = express.Router();
const captchaChecker = require("../../captcha_checker");
const Account = require("../../../../application/account/index");
const { error, ok } = require("../../../../domain/constants/state");
const ErrorCollector = require("../../../../shared/ErrorCollector");
const getIP = require("../../getIP");
router.post("/", async (req: any, res: any) => {
	try {
		captchaChecker(req, "register");
		const { user_id, password, confirmquestion, confirmanswer, nick } = req.body;
		const ip = getIP(req);
		const resp = await Account.create({
			user_id,
			password,
			confirmAnswer: confirmanswer,
			confirmQuestion: confirmquestion,
			nick,
			ip
		});
		res.json(resp === true ? ok.ok : error.errorMaker(resp));
	}
	catch (e) {
		ErrorCollector.push(__filename, e);
		res.json(error.internalError);
	}
});

module.exports = ["/register", router];
