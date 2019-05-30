const express = require("express");
const router = express.Router();
const cache_query = require("../../module/mysql_cache");
const [error, ok] = require("../../module/const_var");

async function getUserConfirmQuestion(user_id) {
	const data = await cache_query("select confirmquestion from users where user_id = ?", [user_id]);
	if (Array.isArray(data) && data.length > 0 && data[0].confirmquestion) {
		return data[0].confirmquestion;
	}
	return "";
}

router.get("/", async (req, res) => {
	try {
		const user_id = req.session.user_id;
		res.json(ok.okMaker(await getUserConfirmQuestion(user_id)));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/password", router];