import express from "express";
import UserService from "../service/UserService";
import const_variable from "../module/const_name";
import const_var from "../module/const_var";
const [error] = const_var;
import auth from "../middleware/auth";
import recent_register from "./user/recent_register";
import register_timeline from "./user/register_timeline";
import submit_stat from "./user/submit_stat";
import self from "./user/self";
import update from "./user/update";
import lost from "./user/lost";
import tutorial from "./user/tutorial";
import email from "./user/email";

const router = express.Router();

router.use("/recent_register", recent_register);
router.use("/register_timeline", register_timeline);
router.use("/submit_stat", submit_stat);
router.use("/self", self);
router.use("/update", update);
router.use("/lost", lost);
router.use("/tutorial", tutorial);
router.use("/email", email);

router.get("/:user_id", async (req: any, res: any) => {
	const user_id = req.params.user_id;
	try {
		const data = await UserService.getUserProfile(user_id);
		res.json({
			status: "OK",
			data: {
				...data,
				const_variable: const_variable
			},
			isadmin: req.session.isadmin
		});
	} catch (e) {
		console.error(e);
		res.json(error.errorMaker("Error fetching user profile"));
	}
});

router.get("/nick/:nick", async (req: any, res: any) => {
	const nick = req.params.nick;
	const data = await UserService.getUserByNick(nick);
	if (data && data.length > 0) {
		res.json({
			status: "OK",
			nick,
			data
		});
	} else {
		res.json(error.errorMaker("No such user!"));
	}
});

export = ["/user", auth, router];
