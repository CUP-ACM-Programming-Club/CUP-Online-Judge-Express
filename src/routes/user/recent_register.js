const express = require("express");
const router = express.Router();
const query = require("../../module/mysql_cache");
const [error, ok] = require("../../module/const_var");

router.get("/", async (req, res) => {
	try {
		res.json(ok.okMaker(await query("select user_id, nick, biography, solved,reg_time from users where email != 'your_own_email@internet' order by reg_time desc limit 50")));
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

module.exports = ["/recent_register", router];