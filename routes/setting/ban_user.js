const express = require("express");

const router = express.Router();
const cache_query = require("../../module/mysql_cache");

const [error, ok] = require("../../module/const_var");


router.get("/", async (req, res) => {
	if (req.session.isadmin) {
		const data = await cache_query("select * from ban_user");
		res.json({
			status: "OK",
			data
		});
	} else {
		res.json(error.noprivilege);
	}
});

router.post("/", async (req, res) => {
	if (!req.session.isadmin) {
		res.json(error.noprivilege);
		return;
	}
	try {
		let user_id = req.body.user_id;
		let datetime = req.body.date;
		await cache_query("INSERT INTO ban_user (user_id, datetime) VALUES(?,?) ON DUPLICATE KEY UPDATE user_id = ?, datetime = ?",
			[user_id, datetime, user_id, datetime]);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
