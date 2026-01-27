import express from "express";
const router = express.Router();
import const_var from "../../../module/const_var";
const [error, ok] = const_var;

const LENGTH_LIMIT = 100;
import checkPassword = require("../../../module/check_password");
import loginAction from "../../../module/login_action";
import { encryptPassword } from "../../../module/util";
import UserManager from "../../../manager/user/UserManager";
const salt = global.config.salt || "thisissalt";

function checkLength(str: any, size = LENGTH_LIMIT) {
	str += "";
	return str.length <= size;
}



function checkExists(str: any) {
	return !!(str && typeof str === "string" && str.trim().length && str.trim().length > 0);
}

function checkRequestBodyProperties(body: any) {
	for (let index in body) {
		if (Object.hasOwnProperty.call(body, index)) {
			if (index !== "biography" && !checkLength(body[index])) {
				return false;
			}
			else if (index === "biography" && !checkLength(body[index], 5 * LENGTH_LIMIT)) {
				return false;
			}
			if (body[index] && body[index].trim) {
				body[index] = body[index].trim();
			}
		}
	}
	return true;
}

async function checkPasswordAdapter(user_id: any, password: any) {
	const user = await UserManager.getUser(user_id);
	if (!user) return false;
	const result = checkPassword(user.password, password, user.newpassword);
	return result;
}

router.post("/", async (req: any, res: any) => {
	const user_id = req.session.user_id;
	if (!checkRequestBodyProperties(req.body)) {
		res.json(error.invalidParams);
		return;
	}
	let { blog, github, biography, confirmquestion, confirmanswer, password, newpassword, repeatpassword, email, school, nick, avatarUrl } = req.body;
	console.log("DEBUG: checkPasswordAdapter start", user_id, password);
	if (!await checkPasswordAdapter(user_id, password)) {
		console.log("DEBUG: password check failed");
		res.json(error.errorMaker("Password wrong"));
		return;
	}
	console.log("DEBUG: password check passed");
	if (newpassword !== repeatpassword) {
		console.log("DEBUG: password mismatch");
		res.json(error.errorMaker("Two password not same"));
		return;
	}
	newpassword = checkExists(newpassword) ? encryptPassword(newpassword, salt) : undefined;
	confirmanswer = checkExists(confirmanswer) ? encryptPassword(confirmanswer, salt) : undefined;
	try {
		const payload = {
			newpassword,
			nick,
			school,
			email,
			blog,
			github,
			biography,
			confirmquestion,
			confirmanswer,
			avatarUrl
		};

		// Filter undefined values
		Object.keys(payload).forEach((key) => {
			if (!checkExists((payload as any)[key])) {
				(payload as any)[key] = undefined;
			}
		});

		await UserManager.updateUser(user_id, payload);
		await loginAction(req, req.session.user_id);
		res.json(ok.ok);
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

export default router;
