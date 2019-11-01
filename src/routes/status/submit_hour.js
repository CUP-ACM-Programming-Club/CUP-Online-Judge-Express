/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const [error] = require("../../module/const_var");
const cache_query = require("../../module/mysql_cache");

router.get("/", async (req, res) => {
	try {
		const [submit, login] = await Promise.all([cache_query("select hour(in_date) as hour,count(hour(in_date)) as cnt from solution group by hour"),
			cache_query("select hour(time) as hour,count(hour(time)) as cnt from loginlog group by hour(time)")]);
		res.json({
			status: "OK",
			data: {
				submit,
				login
			}
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});


module.exports = router;
