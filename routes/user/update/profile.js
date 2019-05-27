const express = require("express");
const router = express.Router();
const [error, ok] = require("../../../module/const_var");
const cache_query = require("../../../module/mysql_cache");
const LENGTH_LIMIT = 100;
const salt = require("../../../config.json").salt || "thisissalt";
const checkPassword = require("../../../module/check_password");

function checkLength(str) {
	str += "";
	return str.length <= LENGTH_LIMIT;
}

function checkRequestBodyProperties(body) {
	for (let index in body) {
		if (!checkLength(body[index])) {
			return false;
		}
		body[index] = body[index].trim();
	}
	return true;
}

async function checkPasswordAdapter(user_id, password) {
	const res = await cache_query("select password,newpassword from users where user_id = ?", [user_id]);
	return checkPassword(res[0].password, password, res[0].newpassword);
}

router.post("/", async (req, res) => {
	const user_id = req.session.user_id;
	if (!checkRequestBodyProperties(req.body)) {
		res.json(error.invalidParams);
	}
	let {blog, github, biography, confirmquestion, confirmanswer, password, newpassword, repeatpassword, email, school, nick, avatar} = req.body;
	if (!await checkPasswordAdapter(user_id, password)) {
		res.json(error.errorMaker("Password wrong"));
		return;
	}
	if (newpassword !== repeatpassword) {
		res.json(error.errorMaker("Two password not same"));
		return;
	}
	try {
		cache_query(`update users set newpassword = ?, nick = ?, school = ?, email = ?, blog = ?, github = ?, biography = ?, confirmquestion = ? ${confirmanswer && confirmanswer.length > 0 ? ", confirmanswer = ? " : ""} where user_id = ?`,
			[newpassword, nick, school, email, blog, github, biography, confirmquestion, confirmanswer, user_id]);
		res.json(ok.ok);
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

module.exports = ["/profile", router];