const express = require("express");
const router = express.Router();
const query = require("../../module/mysql_cache");
const [error, ok] = require("../../module/const_var");

router.get("/", async (req, res) => {
	try {
		const data = await query("select reg_time from users where school != 'your_own_school' order by reg_time asc");
		let sum = 0;
		let sendArray = data.map((el) => {return {value: ++sum, date: el.reg_time};});
		res.json(ok.okMaker(sendArray));
	} catch (e) {
		res.json(error.database);
		if (process.env.NODE_ENV === "test") {
			console.log(e);
		}
	}
});

module.exports = ["/register_timeline", router];