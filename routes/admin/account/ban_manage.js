const express = require("express"), router = express.Router();
const BanModel = require("../../../module/user/ban");
const banModel = new BanModel();
const [error, ok] = require("../../../module/const_var");
const {trimProperty} = require("../../../module/util");
router.get("/", async (req, res) => {
	try {
		res.json(ok.okMaker(await banModel.getAll()));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/", async (req, res) => {
	try {
		let {user_id, datetime} = trimProperty(req.body);
		await banModel.set(user_id, datetime);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/delete", async (req, res) => {
	try {
		let {user_id} = trimProperty(req.body);
		await banModel.remove(user_id);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/ban", router];