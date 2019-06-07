const [error] = require("../module/const_var");
module.exports = (req, res, next) => {
	if (req.session.isadmin
        || req.session.contest_manager
        || req.session.contest[`c${req.params.contest_id}m`]
        || req.session.contest_maker[`c${req.params.contest_id}`]) {
		next();
	} else {
		res.json(error.noprivilege);
	}
};