const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");
const {checkCaptcha} = require("../module/captcha_checker");
const checkSourceId = (req) => {
	const source = req.params.source;
	let id = req.params.id;
	if (isNaN(id)) {
		return false;
	}
	return {
		source,
		id
	};
};

router.get("/:source/:id", async (req, res) => {
	const _sourceId = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	let sqlQuery = [];
	sqlQuery.push(cache_query(`select tutorial.*,users.user_id,users.nick,users.avatar,users.solved,users.biography 
	from tutorial
left join users on users.user_id = tutorial.user_id
where source = ? and problem_id = ?`, [source, id]));
	const data = await Promise.all(sqlQuery);
	res.json({
		status: "OK",
		data: data[0],
		self: req.session.user_id
	});
});

router.post("/new/:source/:id", (req, res) => {
	checkCaptcha(req, "tutorial");
	const _sourceId = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	/// TODO:Complete insert function
});

module.exports = ["/tutorial", auth, router];
