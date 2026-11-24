import express from "express";
const router = express.Router();
import UserService from "../../../../application/services/UserService";
import const_var from "../../../../domain/constants/const_var";
const [error, ok] = const_var;

router.get("/", async (req: any, res: any) => {
	try {
		const data = await UserService.getRecentRegisteredUsers();
		res.json(ok.okMaker(data));
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

export default router;