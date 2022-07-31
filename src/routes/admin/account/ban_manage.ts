import express from "express";
const router = express.Router();
import BanModel from "../../../module/user/ban";
import dayjs from "dayjs";
const {error, ok} = require("../../../module/constants/state");
const {trimProperty} = require("../../../module/util");
router.get("/", async (req, res) => {
	try {
		res.json(await BanModel.getAllByRequest(req));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/", async (req, res) => {
	try {
		let {user_id, datetime} = trimProperty(req.body);
		datetime = dayjs(datetime).format("YYYY-MM-DD HH:mm:ss");
		await BanModel.set(user_id, datetime);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/delete", async (req, res) => {
	try {
		let {user_id} = trimProperty(req.body);
		await BanModel.remove(user_id);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

export = ["/ban", router];
