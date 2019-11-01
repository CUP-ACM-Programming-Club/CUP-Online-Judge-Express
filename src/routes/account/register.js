const express = require("express");
const router = express.Router();
const captchaChecker = require("../../module/captcha_checker");
const Account = require("../../module/account/index");
const {error, ok} = require("../../module/constants/state");
const ErrorCollector = require("../../module/error/collector");
const getIP = require("../../module/getIP");
router.post("/", async (req, res) => {
	try {
		captchaChecker(req, "register");
		const {user_id, password, confirmquestion, confirmanswer, nick} = req.body;
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
