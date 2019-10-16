const query = require("../module/mysql_query");

function isAdmin(str) {
	return str === "administrator";
}

function isEditor(str) {
	return str.indexOf("editor") === 0;
}

function isContestManager(str) {
	return str.indexOf("contest_manager") === 0;
}

function isSourceBrowser(str) {
	return str.indexOf("source_browser") === 0;
}

function isContestUser(str) {
	return str.indexOf("c") === 0;
}

function isContestMaker(str) {
	return str.indexOf("m") === 0;
}

function isProblemMaker(str) {
	return str.indexOf("p") === 0;
}

const defaultPrivilege = {
	auth: true,
	contest_manager: false,
	editor: false,
	isadmin: false,
	source_browser: false
};

module.exports = async (req, user_id) => {
	Object.assign(req.session, defaultPrivilege);
	req.session.user_id = user_id;
	req.session.contest = {};
	req.session.contest_maker = {};
	req.session.problem_maker = {};
	let [val, nick] = await Promise.all(
		[query("select rightstr from privilege where user_id = ?", [user_id]),
			query("select nick,avatar,avatarUrl from users where user_id = ?", [user_id])]);
	//for session admin privilege
	if (nick && nick.length && nick.length > 0) {
		req.session.nick = nick[0].nick;
		req.session.avatar = nick[0].avatar;
		req.session.avatarUrl = nick[0].avatarUrl;
	}
	for (let i of val) {
		if (isAdmin(i.rightstr)) {
			req.session.isadmin = true;
		} else if (isEditor(i.rightstr)) {
			req.session.editor = true;
		} else if (isContestManager(i.rightstr)) {
			req.session.contest_manager = true;
		} else if (isSourceBrowser(i.rightstr)) {
			req.session.source_browser = true;
		} else if (isContestUser(i.rightstr)) {
			req.session.contest[i.rightstr] = true;
		} else if (isContestMaker(i.rightstr)) {
			req.session.contest_maker[i.rightstr] = true;
		} else if (isProblemMaker(i.rightstr)) {
			req.session.problem_maker[i.rightstr] = true;
		}
	}
};
