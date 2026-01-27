import express from "express";
const router = express.Router();
import UserService from "../../service/UserService";
import const_var from "../../module/const_var";
const [error, ok] = const_var;
import { trimProperty, generateNewEncryptPassword } from "../../module/util";
import checkPassword from "../../module/check_password";
const salt = global.config.salt || "thisissalt";


async function getQuestionHandler(user_id: any) {
	const res = await UserService.getUserConfirmInfo(user_id);
	return res[0].confirmquestion;
}

async function getAnswer(user_id: any) {
	const res = await UserService.getUserConfirmInfo(user_id);
	return res[0].confirmanswer;
}

async function checkAnswer(user_id: any, answer: any) {
	const originalAnswer = await getAnswer(user_id);
	return checkPassword(originalAnswer, answer, originalAnswer);
}

router.get("/question/:user_id", async (req: any, res: any) => {
	try {
		const user_id = (req.params.user_id + "").trim();
		await res.json(ok.okMaker({
			question: await getQuestionHandler(user_id)
		}));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/answer", async (req: any, res: any) => {
	try {
		const { user_id, answer, password } = trimProperty(req.body);
		if (await checkAnswer(user_id, answer)) {
			await generateNewEncryptPassword(user_id, password, salt);
			res.json(ok.ok);
		} else {
			res.json(error.errorMaker("Answer incorrect"));
		}
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

export default router;
