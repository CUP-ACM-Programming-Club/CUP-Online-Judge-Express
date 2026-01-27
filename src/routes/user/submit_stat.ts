import express from "express";
import cache_query = require("../../module/mysql_cache");
const router = express.Router();
import UserService from "../../service/UserService";
import const_var from "../../module/const_var";
const [error, ok] = const_var;

router.get("/:user_id/:start_time/:end_time", async (req: any, res: any) => {
	try {
		const { user_id, start_time, end_time } = req.params;
		res.json(ok.okMaker({
			map: await UserService.getSubmitStat(user_id, start_time, end_time),
			user: []
		}));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/:user_id", async (req: any, res: any) => {
	try {
		const { user_id } = req.params;
		res.json(ok.okMaker({
			map: await UserService.getSubmitStat(user_id),
			user: []
		}));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

export default router;