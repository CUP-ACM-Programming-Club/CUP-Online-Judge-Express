const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const [error] = require("../module/const_var");

router.use("/ban_user", require("./setting/ban_user"));
router.use("/devconfig", require("./setting/devconfig"));

module.exports = ["/setting", auth, (req, res, next) => {
	if (!req.session.isadmin) {
		res.json(error.noprivilege);
	} else {
		next();
	}
}, router];
