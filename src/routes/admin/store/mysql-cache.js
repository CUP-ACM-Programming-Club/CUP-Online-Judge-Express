const express = require("express");
const router = express.Router();
const {error, ok} = require("../../../module/constants/state");
const MySQLCacheManager = require("../../../manager/MySQLCacheManager/index");

router.get("/remove/:key", async (req, res) => {
	try {
		MySQLCacheManager.removeCache(req.params.key);
		res.json(ok.ok);
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});

router.get("/removeAll", async (req, res) => {
	try {
		MySQLCacheManager.removeAllCache();
		res.json(ok.ok);
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});

router.get("/", async (req, res) => {
	try {
		const keys = MySQLCacheManager.getCacheKey();
		res.json(ok.okMaker(keys));
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});

module.exports = ["/mysql_cache", router];
