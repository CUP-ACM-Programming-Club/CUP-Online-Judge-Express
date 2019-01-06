const express = require("express");
const router = express.Router();
const cache_query = require("../module/mysql_cache");

const [error] = require("../module/const_var");
const auth = require("../middleware/auth");

router.get("/", async (req, res) => {
	try {
		const sql = "SELECT * FROM `special_subject` WHERE defunct='N' ORDER BY `topic_id` ASC limit 1000";
		const data = await cache_query(sql);
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

router.get("/:cid", async (req, res) => {
	try {
		// TODO:complete cid API
	}
	catch(e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/specialsubject", auth, router];
