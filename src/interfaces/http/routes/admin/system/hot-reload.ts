import express from "express";
const router = express.Router();
const { error, ok } = require("../../../../../domain/constants/state");
const HotReloadManager = require("../../../../../infrastructure/config/cluster/hot-reload");

router.get("/", (req: any, res: any) => {
	try {
		HotReloadManager.restartNotify();
		res.json(ok.ok);
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});

module.exports = ["/hot-reload", router];
