const express = require("express");
const router = express.Router();
const problemset = require("./problemset");
const vjudge = require("./vjudge");
router.use("/[\\s\\S]*?", function (req, res, next) {
	const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
	if (req.ip === "::1" || (ip && ip.length > 0 && ip[0] === "127.0.0.1"))
		next("route");
	else {
		res.header("Content-Type", "application/json");
		const obj = {
			status: "ERROR",
			statement: "Permission Denied"
		};
		res.json(obj);
	}
});


router.use("/problemset", problemset);

router.use("/vjudge", vjudge);

module.exports = router;