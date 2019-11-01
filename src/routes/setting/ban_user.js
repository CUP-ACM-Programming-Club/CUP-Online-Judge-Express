const express = require("express");
const BanModel = require("../../module/user/ban");
const banModel = new BanModel();
const router = express.Router();
const [error, ok] = require("../../module/const_var");


router.get("/", async (req, res) => {
	const data = await banModel.getAll();
	res.json(ok.okMaker(data));
});

router.get("/:user_id", async (req, res) => {
	try {
		const user_id = req.params.user_id;
		const data = await banModel.get(user_id);
		res.json(ok.okMaker(data));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});


router.post("/", async (req, res) => {
	try {
		let {user_id, datetime} = req.body;
		await banModel.set(user_id, datetime);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
