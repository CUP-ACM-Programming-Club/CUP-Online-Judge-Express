const express = require("express");
const router = express.Router();
const [error, ok] = require("../../../module/const_var");
const query = require("../../../module/mysql_query");

async function teamlistHandler() {
	return await query("select user_id, reg_time, accesstime,defunct from users where school = 'your_own_school' order by reg_time desc");
}

router.get("/", async (req, res) => {
	try {
		res.json(ok.okMaker(await teamlistHandler()));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/teamlist", router];