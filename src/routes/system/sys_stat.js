const express = require("express");
const os = require("os");
const router = express.Router();
router.get("/loadavg", function (req, res) {
	const loadAvg = os.loadavg();
	res.json({
		status: "OK",
		data: loadAvg
	});
});

module.exports = router;
