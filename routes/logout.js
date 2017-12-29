const express = require("express");
const router = express.Router();
router.get("/", function (req, res) {
	req.session.destroy();
	res.json({
		status: "OK"
	});
});

module.exports = router;