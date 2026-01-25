import express from "express";
const router = express.Router();
import query = require("../../module/mysql_query");
import const_var from "../../module/const_var";
const [error, ok] = const_var;

router.get("/", async (req: any, res: any) => {
	try {
		res.json(ok.okMaker(await query("select user_id, nick, biography, solved,reg_time from users where email != 'your_own_email@internet' order by reg_time desc limit 50")));
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

export default router;