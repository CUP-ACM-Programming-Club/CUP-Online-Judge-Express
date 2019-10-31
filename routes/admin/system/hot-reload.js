const express = require("express");
const router = express.Router();
const {error, ok} = require("../../../module/constants/state");
const HotReloadManager = require("../../../module/config/cluster/hot-reload");

router.get("/", (req, res) => {
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
