const express = require("express");
const router = express.Router();
const {trimProperty, generateNewEncryptPassword} = require("../../../module/util");
const salt = global.config.salt || "thisissalt";
const [error, ok] = require("../../../module/const_var");
router.post("/modify", async (req, res) => {
	try {
		const {user_id, password} = trimProperty(req.body);
		await generateNewEncryptPassword(user_id, password, salt);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/password", router];
