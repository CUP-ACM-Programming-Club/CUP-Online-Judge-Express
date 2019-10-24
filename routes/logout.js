const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const TokenManager = require("../module/account/token/TokenManager");
router.get("/", async function (req, res) {
	const userId = req.session.user_id;
	req.session.destroy();
	await TokenManager.removeToken(userId);
	res.json({
		status: "OK"
	});
});

module.exports = ["/logout", auth, router];
