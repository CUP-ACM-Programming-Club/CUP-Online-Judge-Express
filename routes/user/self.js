const express = require("express");
const router = express.Router();
const [error, ok] = require("../../module/const_var");
router.get("/", (req, res) => {
	try {
		res.json(ok.okMaker({
			user_id: req.session.user_id,
			nick: req.session.nick,
			admin: req.session.isadmin,
			avatar: req.session.avatar,
			privilege: req.session
		}));
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});

module.exports = ["/self", router];