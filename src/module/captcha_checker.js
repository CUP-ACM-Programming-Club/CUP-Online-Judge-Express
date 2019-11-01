const checkCaptcha = (req, from) => {
	return req.session.captcha.from === from && req.session.captcha.captcha.toLowerCase() === req.body.captcha.toLowerCase();
};

module.exports = {
	checkCaptcha
};
