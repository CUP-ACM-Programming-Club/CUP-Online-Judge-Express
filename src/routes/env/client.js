const express = require("express");
const router = express.Router();
const cache_query = require("../../module/mysql_cache");
const [error, ok] = require("../../module/const_var");
const dayjs = require("dayjs");
router.post("/", async (req, res) => {
	try {
		const ip = req.clientIp;
		let {os_name, os_version, browser_name, browser_version} = req.body;
		await cache_query("insert into loginlog (user_id, password, ip, time, browser_name, browser_version, os_name, os_version) values(?,?,?,?,?,?,?,?)",
			[req.session.user_id, "No Saved", ip, dayjs().format("YYYY-MM-DD HH:mm:ss"), browser_name, browser_version, os_name, os_version]);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/client", router];