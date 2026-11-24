import express from "express";
const router = express.Router();
import svgCaptcha from "svg-captcha";
router.get("/", (req, res) => {
	const captcha = svgCaptcha.create({
		noise: 3
	});
	const from = req.query.from || "global";
	req.session!.captcha = {
		from,
		captcha: captcha.text
	};
	res.type("svg").status(200).send(captcha.data);
});

export = ["/captcha", router];
