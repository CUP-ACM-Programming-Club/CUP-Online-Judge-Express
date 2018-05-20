const query = require("../module/mysql_query");

module.exports = async (req, user_id) => {
	req.session.user_id = user_id;
	req.session.auth = true;
	req.session.contest = {};
	req.session.contest_maker = {};
	req.session.problem_maker = {};
	let val;
	//for session admin privilege
	val = await query("select rightstr from privilege where user_id = ?", [user_id]);
	for (let i of val) {
		if (i.rightstr === "administrator") {
			req.session.isadmin = true;
		}
		else if (i.rightstr.indexOf("c") !== -1) {
			req.session.contest[i.rightstr] = true;
		}
		else if (i.rightstr.indexOf("m") === 0) {
			req.session.contest_maker[i.rightstr] = true;
		}
		else if (i.rightstr.indexOf("p") === 0) {
			req.session.problem_maker[i.rightstr] = true;
		}
		else if (i.rightstr.indexOf("editor") === 0) {
			req.session.editor = true;
		}
	}
};
