const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const client = require("../module/redis");
router.get("/", async function (req, res) {
	const userId = req.session.user_id;
	req.session.destroy();
	let size = await client.llenAsync(`${userId}newToken`);
	while(size-- > 0) {
		await client.lpopAsync(`${userId}newToken`);
	}
	size = await client.llenAsync(`${userId}token`);
	while(size-- > 0) {
		await client.lpopAsync(`${userId}token`);
	}
	res.json({
		status: "OK"
	});
});

module.exports = ["/logout", auth, router];
