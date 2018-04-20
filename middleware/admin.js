const [error] = require("../module/const_var");

module.exports = (req, res, next) => {
	if (req.session.isadmin) {
		next();
	}
	else {
		res.json(error.noprivilege);
	}
};