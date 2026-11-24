import express from "express";
const router = express.Router();
import UserService from "../../../../application/services/UserService";
const [error, ok] = require("../../../../domain/constants/const_var");

async function getUserConfirmQuestion(user_id: any) {
	const data = await UserService.getUserConfirmInfo(user_id);
	if (Array.isArray(data) && data.length > 0 && data[0].confirmquestion) {
		return data[0].confirmquestion;
	}
	return "";
}

router.get("/", async (req: any, res: any) => {
	try {
		const user_id = req.session.user_id;
		res.json(ok.okMaker(await getUserConfirmQuestion(user_id)));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/password", router];