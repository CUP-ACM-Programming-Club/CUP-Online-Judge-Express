const express = require("express");
const router = express.Router();
const svgCaptcha = require("svg-captcha");
const auth = require("../middleware/auth");
router.get("/", (req, res) => {
	const captcha = svgCaptcha.create({
		noise: 3
	});
	const from = req.query.from || "global";
	req.session.captcha = {
		from,
		captcha: captcha.text
	};
	res.type("svg");
	res.status(200).send(captcha.data);
});

module.exports = ["/captcha", auth, router];
