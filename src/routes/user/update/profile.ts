import express from "express";
const router = express.Router();
import const_var from "../../../module/const_var";
const [error, ok] = const_var;
import query = require("../../../module/mysql_query");
const LENGTH_LIMIT = 100;
import checkPassword = require("../../../module/check_password");
import loginAction from "../../../module/login_action";
import { encryptPassword } from "../../../module/util";
const salt = global.config.salt || "thisissalt";

function checkLength(str: any, size = LENGTH_LIMIT) {
	str += "";
	return str.length <= size;
}

function buildUpdateQuery(name: any, val: any, user_id: any) {
	return query(`update users set ${name} = ? where user_id = ?`, [val, user_id]);
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
	const res = await query("select password,newpassword from users where user_id = ?", [user_id]);
	console.log("DEBUG: query res", res);
	console.log("DEBUG: checkPassword fn", checkPassword.toString());
	const result = checkPassword(res[0].password, password, res[0].newpassword);
	console.log("DEBUG: checkPassword returned", result);
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
	newpassword = checkExists(newpassword) ? encryptPassword(newpassword, salt) : "";
	confirmanswer = checkExists(confirmanswer) ? encryptPassword(confirmanswer, salt) : "";
	try {
		let Queue: any[] = [];
		let Property: any = {
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
		Object.keys(Property).forEach(el => {
			console.log("DEBUG: Checking prop", el, "Value:", Property[el]);
			if (checkExists(Property[el])) {
				console.log("DEBUG: Adding query for", el);
				Queue.push(buildUpdateQuery(el, Property[el], user_id));
			} else {
				console.log("DEBUG: checkExists failed for", el);
			}
		});
		await Promise.all(Queue);
		await loginAction(req, req.session.user_id);
		res.json(ok.ok);
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

export default router;
