const query = require("../mysql_query");

let administrator = {};
let source_browser = {};
let contest_member = {};
let problem_creator = {};
let editor = {};
let contest_manager = {};

let privilegeSet = {
	administrator,
	source_browser,
	contest_member,
	problem_creator,
	editor,
	contest_manager
};

async function init_privilege() {
	const data = await query("select * from privilege");
	for (let dataObject of data) {
		const {rightstr, user_id} = dataObject;
		if (rightstr === "administrator") {
			administrator[user_id] = true;
		} else if (rightstr === "source_browser") {
			source_browser[user_id] = true;
		} else if (rightstr === "contest_manager") {
			contest_manager[user_id] = true;
		} else if (rightstr === "editor") {
			editor[user_id] = true;
		} else if (rightstr.indexOf("c") === 0 && !isNaN(rightstr.substring(1))) {
			contest_member[user_id] = true;
		} else if (rightstr.indexOf("p") === 0 && !isNaN(rightstr.substring(1))) {
			problem_creator[user_id] = true;
		}
	}
}

function checkPrivilegeSetExist(privilegeName) {
	return Boolean(privilegeSet[privilegeName]);
}

function addPrivilege(user_id, privilegeName) {
	if (!checkPrivilegeSetExist(privilegeName)) {
		return false;
	} else {
		return privilegeSet[privilegeName][user_id] = true;
	}
}

function removePrivilege(user_id, privilegeName) {
	if (!checkPrivilegeSetExist(privilegeName)) {
		return false;
	} else if (!privilegeSet[privilegeName][user_id]) {
		return false;
	} else {
		delete privilegeSet[privilegeName][user_id];
		return true;
	}
}

async function refreshPrivilege() {
	administrator = {};
	source_browser = {};
	contest_member = {};
	contest_manager = {};
	editor = {};
	problem_creator = {};
	await init_privilege();
}

module.exports = {init_privilege, addPrivilege, removePrivilege, refreshPrivilege};
