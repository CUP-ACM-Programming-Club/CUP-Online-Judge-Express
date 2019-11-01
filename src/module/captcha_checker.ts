import {Request} from "express";
const checkCaptcha = (req: Request, from: string | undefined) => {
	return (<any>req.session).captcha.from === from && (<any>req.session).captcha.captcha.toLowerCase() === req.body.captcha.toLowerCase();
};

module.exports = {
	checkCaptcha
};
