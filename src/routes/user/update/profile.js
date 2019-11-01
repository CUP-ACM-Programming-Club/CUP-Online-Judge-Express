const express = require("express");
const router = express.Router();
const [error, ok] = require("../../../module/const_var");
const query = require("../../../module/mysql_query");
const LENGTH_LIMIT = 100;
const checkPassword = require("../../../module/check_password");
const loginAction = require("../../../module/login_action");
const {encryptPassword} = require("../../../module/util");
const salt = global.config.salt || "thisissalt";

function checkLength(str) {
	str += "";
	return str.length <= LENGTH_LIMIT;
}

function buildUpdateQuery(name, val, user_id) {
	return query(`update users set ${name} = ? where user_id = ?`, [val, user_id]);
}

function checkExists(str) {
	return !!(str && str.length && str.length > 0);
}

function checkRequestBodyProperties(body) {
	for (let index in body) {
		if (Object.hasOwnProperty.call(body, index)) {
			if (!checkLength(body[index])) {
				return false;
			}
			if (body[index] && body[index].trim) {
				body[index] = body[index].trim();
			}
		}
	}
	return true;
}

async function checkPasswordAdapter(user_id, password) {
	const res = await query("select password,newpassword from users where user_id = ?", [user_id]);
	return checkPassword(res[0].password, password, res[0].newpassword);
}

router.post("/", async (req, res) => {
	const user_id = req.session.user_id;
	if (!checkRequestBodyProperties(req.body)) {
		res.json(error.invalidParams);
		return;
	}
	let {blog, github, biography, confirmquestion, confirmanswer, password, newpassword, repeatpassword, email, school, nick, avatarUrl} = req.body;
	if (!await checkPasswordAdapter(user_id, password)) {
		res.json(error.errorMaker("Password wrong"));
		return;
	}
	if (newpassword !== repeatpassword) {
		res.json(error.errorMaker("Two password not same"));
		return;
	}
	newpassword = encryptPassword(newpassword, salt);
	try {
		let Queue = [];
		let Property = {
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
			if (checkExists(Property[el])) {
				Queue.push(buildUpdateQuery(el, Property[el], user_id));
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

module.exports = ["/profile", router];
