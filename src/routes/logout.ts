import express from "express";
import TokenManager from "../module/account/token/TokenManager";
const router = express.Router();
const auth = require("../middleware/auth");
router.get("/", async function (req, res) {
	const userId = req.session!.user_id;
	req.session!.destroy((err: any) => {
		console.log("Destroy session failed.", err);
	});
	await TokenManager.removeToken(userId);
	res.json({
		status: "OK"
	});
});

module.exports = ["/logout", auth, router];
