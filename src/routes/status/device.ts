/* eslint-disable no-console */
import express from "express";
const router = express.Router();
const [error] = require("../../module/const_var");
import UserService from "../../service/UserService";

async function dataHandler(req: any, res: any, targetSet: any = []) {
	if (!targetSet.length) {
		targetSet = [];
	}
	// "time" is included by default or should be explicitly requested? Original logic added "time" to any query.
	if (!targetSet.includes("time")) {
		targetSet.unshift("time");
	}
	const _loginlog = await UserService.getLoginLogStats(targetSet);
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
