const express = require("express");
const router = express.Router();
const query = require("../../../module/mysql_query");
const checkPassword = require("../../../module/check_password");
const [error, ok] = require("../../../module/const_var");

async function getPassword(user_id) {
	const data = await query("select password, newpassword from users where user_id = ?", [user_id]);
	if (data.length === 0) {
		return false;
	}
	return data[0];
}

async function passwordChecker(user_id, inputPassword) {
	const passwordData = await getPassword(user_id);
	const originalPassword = passwordData.password;
	const newPassword = passwordData.newpassword;
	return checkPassword(originalPassword, inputPassword, newPassword);
}

async function passwordCheckerHandler(data) {
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
	return ok.okMaker({failUserList, failPasswordList, fail: failUserList.length > 0});
}

router.post("/", async (req, res) => {
	try {
		res.json(await passwordCheckerHandler(req.body.pairList));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});
module.exports = ["/check", router];