const [error] = require("../module/const_var");
const client = require("../module/redis");
module.exports = async (req, res, next) => {
	if (!req.session.auth) {
		const original_cookie = req.cookies;
		//req.cookies is an object
		const token = original_cookie["token"];
		const user_id = original_cookie["user_id"];
		//get token and user_id from cookie
		if (typeof user_id === "string") {//whether user_id is string or not,maybe it is an undefined variable
			//const original_token = await memcache.get(user_id + "token");
			const original_token = await client.lrangeAsync(`${user_id}token`, 0, -1);
			if (original_token.indexOf(token) !== -1) {
				// if (token === original_token) {//check token
				const login_action = require("../module/login_action");
				await login_action(req,user_id);
				return next();
			}
			else {
				return res.json(error.nologin);
			}
		}
		else {
			return res.json(error.nologin);
		}

	}
	else {
		return next();
	}
};
