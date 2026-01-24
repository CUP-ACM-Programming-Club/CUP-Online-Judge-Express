/* eslint-disable no-console */
import express from "express";
const router = express.Router();
const [error] = require("../../module/const_var");
const cache_query = require("../../module/mysql_cache");

async function dataHandler(req: any, res: any, targetSet: any = []) {
	let queryArray = ["time"];
	if (!targetSet.length) {
		targetSet = [];
	}
	queryArray.push(...targetSet);
	console.log(`select ${queryArray.join(",")} from loginlog where browser_name is not null`);
	const _loginlog = await cache_query(`select ${queryArray.join(",")} from loginlog where browser_name is not null`);
	res.json({
		status: "OK",
		data: _loginlog
	});
}


router.get("/os", async (req: any, res: any) => {
	try {
		await dataHandler(req, res, ["os_name", "os_version"]);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/browser", async (req: any, res: any) => {
	try {
		await dataHandler(req, res, ["browser_name", "browser_version"]);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});


router.get("/all", async (req: any, res: any) => {
	try {
		await dataHandler(req, res, ["os_name", "os_version", "browser_name",
			"browser_version"]);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
