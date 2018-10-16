const [error] = require("../module/const_var");

module.exports = async (req, res, next) => {
	if (global.contest_mode) {
		res.json(error.contestMode);
	}
	else {
		return next();
	}
};
