const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
router.get("/", function (req, res) {
	req.session.destroy();
	res.json({
		status: "OK"
	});
});

module.exports = ["/logout", auth, router];
