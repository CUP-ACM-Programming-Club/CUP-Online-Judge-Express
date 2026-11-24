import express from "express";
const router = express.Router();
import PasswordCheckUseCases from "../../../../../application/account/PasswordCheckUseCases";
const [error, ok] = require("../../../../../domain/constants/const_var");

async function passwordChecker(user_id: any, inputPassword: any) {
	return await PasswordCheckUseCases.passwordMatches(user_id, inputPassword);
}

async function passwordCheckerHandler(data: any) {
	let failUserList = [], failPasswordList = [];
	if (typeof data !== "object" || !data.length) {
		return error.invalidParams;
	}
	for (let i of data) {
		if (!await passwordChecker(i.user_id, i.password)) {
			failUserList.push(i.user_id);
			failPasswordList.push(i.password);
		}
	}
	return ok.okMaker({ failUserList, failPasswordList, fail: failUserList.length > 0 });
}

router.post("/", async (req: any, res: any) => {
	try {
		res.json(await passwordCheckerHandler(req.body.pairList));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});
module.exports = ["/check", router];