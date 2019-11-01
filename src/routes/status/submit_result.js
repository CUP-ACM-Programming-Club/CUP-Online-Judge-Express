/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const [error] = require("../../module/const_var");
const cache_query = require("../../module/mysql_cache");
router.get("/", async (req, res) => {
	try {
		const data = await cache_query("select count(1) as cnt,result from solution group by result order by result");
		res.json({
			status: "OK",
			data
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
