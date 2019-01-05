const express = require("express");

const router = express.Router();
const cache_query = require("../../module/mysql_cache");

const [error, ok] = require("../../module/const_var");


router.get("/", async (req, res) => {
	const data = await cache_query("select * from ban_user");
	res.json({
		status: "OK",
		data
	});
});

router.get("/:user_id", async (req, res) => {
	try {
		const user_id = req.params.user_id;
		const data = await cache_query("select * from ban_user where user_id = ?", [user_id]);
		res.json({
			status: "OK",
			data
		});
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});


router.post("/", async (req, res) => {
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
