import express from "express";
const router = express.Router();
import UserService from "../../service/UserService";
import const_var from "../../module/const_var";
const [error, ok] = const_var;

router.get("/", async (req: any, res: any) => {
	try {
		const data = await UserService.getRegisterTimeline();
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