const express = require("express");
const router = express.Router();
const query = require("../../module/mysql_query");
const [error, ok] = require("../../module/const_var");
const {trimProperty, generateNewEncryptPassword} = require("../../module/util");
const checkPassword = require("../../module/check_password");
const salt = global.config.salt || "thisissalt";

async function getQuestionHandler(user_id) {
	const res = await query("select confirmquestion from users where user_id = ?", [user_id]);
	return res[0].confirmquestion;
}

async function getAnswer(user_id) {
	const res = await query("select confirmanswer from users where user_id = ?", [user_id]);
	return res[0].confirmanswer;
}

async function checkAnswer(user_id, answer) {
	const originalAnswer = await getAnswer(user_id);
	return checkPassword(originalAnswer, answer, originalAnswer);
}

router.get("/question/:user_id", async (req, res) => {
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

router.post("/answer", async (req, res) => {
	try {
		const {user_id, answer, password} = trimProperty(req.body);
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

module.exports = ["/lost", router];
