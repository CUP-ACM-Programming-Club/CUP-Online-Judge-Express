const express = require("express");
const BanModel = require("../../module/user/ban");
const router = express.Router();
const {error, ok} = require("../../module/constants/state");


router.get("/", async (req, res) => {
	const data = await BanModel.getAll();
	res.json(ok.okMaker(data));
});

router.get("/:user_id", async (req, res) => {
	try {
		const user_id = req.params.user_id;
		const data = await BanModel.get(user_id);
		res.json(ok.okMaker(data));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});


router.post("/", async (req, res) => {
	try {
		let {user_id, datetime} = req.body;
		await BanModel.set(user_id, datetime);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
