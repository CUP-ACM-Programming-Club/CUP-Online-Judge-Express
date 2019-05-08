const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const checkPassword = require("../module/check_password");
const log4js = require("../module/logger");
const log = log4js.logger("cheese", "info");
const crypto = require("../module/encrypt");
const memcache = require("../module/memcached");
const [error, ok] = require("../module/const_var");
const salt = "thisissalt";
const login_action = require("../module/login_action");
const {checkCaptcha} = require("../module/captcha_checker");

const check_json = (text) => {
	return /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""));
};

const reverse = (val) => {
	if (typeof val !== "string" && val.toString)
		return val.toString().split("").reverse().join("");
	else
		return val.split("").reverse().join("");
};

router.get("/", function (req, res) {
	res.json({
		status: "OK",
		logined: Boolean(req.session && req.session.auth)
	});
});

router.post("/token", function (req, res, next) {
	if (typeof req.body.token !== "string") {
		res.json(error.invalidToken);
	} else {
		next("route");
	}
});
router.post("/token", async function (req, res) {
	if (req.session.auth) {
		res.json(ok.logined);
	} else {
		// console.log(req.body.token);
		let receive = "";
		try {
			receive = Buffer.from(req.body.token, "base64").toString();
		} catch (e) {
			log.fatal(e);
			return;
		}
		log.info(receive);
		const token = JSON.parse(receive);
		const token_str = token["token"] || "";
		const data = await memcache.get(token["user_id"]);
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

/*
router.post("/", function (req, res, next) {
	if (req.session.auth) {
		req.session.destroy();
	}
	next("route");
});
*/

async function storeNewTypePassword(res, password, user_id, newpass) {
	if(newpass) {
		return;
	}
	try {
		await query("update users set newpassword=? where user_id=?",
			[crypto.encryptAES(reverse(password) + salt, reverse(salt)), user_id]);
	} catch (e) {
		res.json(error.database);
		log.fatal(e);
	}
}

router.post("/newlogin", async function(req, res) {
	let {user_id, password} = req.body;
	if(!checkCaptcha(req, "login")) {
		res.json(error.invalidCaptcha);
		return;
	}
	if (user_id !== "" && password !== "") {
		const val = await query("select password,newpassword from users where user_id=?", [user_id]);
		let ans;
		let newpass;
		if (val.length && val.length > 0) {
			ans = val[0].password;
			newpass = val[0].newpassword;
			if (checkPassword(ans, password, null /*reverse(crypto.decryptAES(newpass, reverse(salt))).substring(salt.length)*/)) {
				await storeNewTypePassword(res, password, user_id, newpass);
				await login_action(req, user_id);
				res.json(ok.ok);
			} else {
				res.json(error.invalidUser);
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

router.post("/", async function (req, res) {
	let receive = req.body.msg;
	if (typeof receive === "undefined") {
		res.json(error.invalidParams);
		return;
	}
	try {
		receive = Buffer.from(receive, "base64").toString();
		receive = Buffer.from(receive, "base64").toString();
	} catch (e) {
		console.log(e);
		log.fatal(e);
		return;
	}
	log.info(receive);
	if (!check_json(receive)) {
		res.json(error.invalidJSON);
		return;
	}
	try {
		receive = JSON.parse(receive);
	} catch (e) {
		log.fatal(`Error:${e.name}\n
		Error message:${e.message}`);
	}
	const json = receive;
	const user_id = json["user_id"] || "", password = json["password"] || "";
	if (user_id !== "" && password !== "") {
		const val = await query("select password,newpassword from users where user_id=?", [user_id]);
		let ans;
		let newpass;
		if (val.length && val.length > 0) {
			ans = val[0].password;
			newpass = val[0].newpassword;
			if (checkPassword(ans, password, null /*reverse(crypto.decryptAES(newpass, reverse(salt))).substring(salt.length)*/)) {
				await storeNewTypePassword(res, password, user_id, newpass);
				await login_action(req, user_id);
				res.json(ok.ok);
			} else {
				res.json(error.invalidUser);
			}
		}
	}
	else {
		res.json(error.errorMaker("You should enter your user_id and password"));
	}
});

router.post("/newpassword", function (req, res) {
	let user_id = req.body.user_id;
	let password = req.body.password;
	query("update users set newpassword=? where user_id=?",
		[crypto.encryptAES(password + salt, reverse(salt)), user_id])
		.then(() => {
			res.json(ok.ok);
		})
		.catch((e) => {
			res.json(error.database);
			log.fatal(e);
		});
});

module.exports = ["/login", router];
