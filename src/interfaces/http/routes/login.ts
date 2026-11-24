import express from "express";

const router = express.Router();
const checkPassword = require("../../../application/auth/check_password");
import { getLogger } from "../../../application/ports/Logger";
const log = getLogger("cheese", "info");
const [error, ok] = require("../../../domain/constants/const_var");
const salt = global.config.salt || "thisissalt";
import login_action = require("../../../application/auth/login_action");
const { checkCaptcha } = require("../captcha_checker");
import { checkJSON, generateNewEncryptPassword } from "../../../application/util";
import authService from "../../../application/auth/AuthService";

const banChecker = require("../middleware/ban_check");

router.get("/", function (req: any, res: any) {
	res.json({
		status: "OK",
		logined: Boolean(req.session && req.session.auth),
		session: req.session
	});
});

router.post("/token", function (req: any, res: any, next: any) {
	if (typeof req.body.token !== "string") {
		res.json(error.invalidToken);
	} else {
		next("route");
	}
});
router.post("/token", async function (req: any, res: any) {
	if (req.session.auth) {
		res.json(ok.logined);
	} else {
		let receive = "";
		try {
			receive = Buffer.from(req.body.token, "base64").toString();
		} catch (e: any) {
			log.fatal(e);
			return;
		}
		log.info(receive);
		const token = JSON.parse(receive);
		const token_str = token["token"] || "";
		const data = await authService.getLegacyToken(token["user_id"]);
		if (token_str === data) {
			req.session.user_id = token["user_id"];
			req.session.auth = true;
			res.json(ok.ok);
			await login_action(req, req.session.user_id);
		} else {
			res.json(error.invalidToken);
		}
	}
});


async function storeNewTypePassword(res: any, password: any, user_id: any, newpass: any) {
	try {
		await generateNewEncryptPassword(user_id, password, salt);
	} catch (e: any) {
		res.json(error.database);
		console.log(e);
		log.fatal(e);
	}
}

router.post("/newlogin", async function (req: any, res: any) {
	let { user_id, password } = req.body;
	if (!checkCaptcha(req, "login")) {
		res.json(error.invalidCaptcha);
		return;
	}
	if (user_id !== "" && password !== "") {
		const user = await authService.validateUser(user_id, password);
		if (user) {
			const { password: ans, newpassword: newpass } = user;
			await storeNewTypePassword(res, password, user_id, newpass);
			await login_action(req, user_id);
			if (await banChecker(req, res)) {
				res.json(ok.ok);
			}
		}
		else {
			res.json(error.errorMaker("No such user!"));
		}
	}
	else {
		res.json(error.errorMaker("You should enter your user_id and password"));
	}
});

router.post("/", async function (req: any, res: any) {
	let receive = req.body.msg;
	if (typeof receive === "undefined") {
		res.json(error.invalidParams);
		return;
	}
	try {
		receive = Buffer.from(receive, "base64").toString();
		receive = Buffer.from(receive, "base64").toString();
	} catch (e: any) {
		console.log(e);
		log.fatal(e);
		return;
	}
	log.info(receive);
	if (!checkJSON(receive)) {
		res.json(error.invalidJSON);
		return;
	}
	try {
		receive = JSON.parse(receive);
	} catch (e: any) {
		log.fatal(`Error:${e.name}\n
		Error message:${e.message}`);
	}
	const json = receive;
	const user_id = json["user_id"] || "", password = json["password"] || "";
	if (user_id !== "" && password !== "") {
		const user = await authService.validateUser(user_id, password);
		if (user) {
			const { password: ans, newpassword: newpass } = user;
			await storeNewTypePassword(res, password, user_id, newpass);
			await login_action(req, user_id);
			if (await banChecker(req, res)) {
				res.json(ok.ok);
			}
		} else {
			res.json(error.invalidUser);
		}
	}
	else {
		res.json(error.errorMaker("You should enter your user_id and password"));
	}
});


module.exports = ["/login", router];
