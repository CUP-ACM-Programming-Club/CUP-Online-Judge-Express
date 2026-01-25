import express from "express";
const router = express.Router();
import query = require("../../module/mysql_cache");
import const_var from "../../module/const_var";
const [error, ok] = const_var;

router.get("/", async (req: any, res: any) => {
	try {
		const data = await query("select reg_time from users where school != 'your_own_school' order by reg_time asc");
		let sum = 0;
		let sendArray = data.map((el: any) => { return { value: ++sum, date: el.reg_time }; });
		res.json(ok.okMaker(sendArray));
	} catch (e) {
		res.json(error.database);
		if (process.env.NODE_ENV === "test") {
			console.log(e);
		}
	}
});

export default router;