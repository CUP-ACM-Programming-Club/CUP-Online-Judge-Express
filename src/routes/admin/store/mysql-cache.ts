import express from "express";
const router = express.Router();
import MySQLCacheManager from "../../../manager/MySQLCacheManager";

router.get("/remove/:key", async (req, res) => {
	res.json(await MySQLCacheManager.removeCacheByRequest(req));
});

router.get("/removeAll", async (req, res) => {
	res.json(await MySQLCacheManager.removeAllCacheByRequest(req));
});

router.get("/", async (req, res) => {
	res.json(await MySQLCacheManager.getCacheKeyByRequest(req));
});

export =  ["/mysql_cache", router];
