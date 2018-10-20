/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const [error] = require("../../module/const_var");
const cache_query = require("../../module/mysql_cache");

router.get("/", async (req, res) => {
	try {
		const _loginlog = await cache_query(`select os_name,os_version,browser_name,
        browser_version from loginlog where browser_name is not null`);
		res.json({
			status: "OK",
			data: _loginlog
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
