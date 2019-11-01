const crypto = require("../module/encrypt");
const query = require("./mysql_query");
const isNumber = require("./util/isNumber");
function reverse(val) {
	if (typeof val !== "string")
		return (val + "").split("").reverse().join("");
	else
		return val.split("").reverse().join("");
}

function encryptPassword(rawPassword, salt) {
	return crypto.encryptAES(rawPassword + salt, reverse(salt));
}

function decryptPassword(encryptedPassword, salt) {
	return reverse(reverse(crypto.decryptAES(encryptedPassword, reverse(salt))).substring(salt.length));
}

function generateNewEncryptPassword(user_id, rawPassword, salt) {
	return new Promise((resolve, reject) => {
		query("update users set newpassword=? where user_id=?",
			[encryptPassword(rawPassword, salt), user_id])
			.then(resolve)
			.catch(reject);
	});
}

function checkJSON(text) {
	return /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""));
}

function trimProperty(target) {
	for (let property in target) {
		if (target.hasOwnProperty(property) && typeof target[property] === "string") {
			target[property] = target[property].trim();
		}
	}
	return target;
}

function assertString(str) {
	if (typeof str !== "string") {
		throw new Error("variable should be a string");
	}
	return true;
}

function assertInt(num) {
	if (!isNumber(num)) {
		throw new Error("variable should be a number");
	}
	return parseInt(num);
}

async function removeAllContestProblem(contest_id) {
	await query("delete from contest_problem where contest_id = ?", [contest_id]);
}

async function removeAllCompetitorPrivilege(contest_id) {
	await query("delete from privilege where rightstr = ?", [`c${contest_id}`]);
}


async function addContestProblem(contest_id, problemList) {
	let baseSql = "insert into contest_problem(contest_id, problem_id, num) values";
	let sqlArray = [];
	let valueArray = [];
	for (let num = 0, len = problemList.length; num < len; ++num) {
		sqlArray.push("(?,?,?)");
		valueArray.push(contest_id, problemList[num], num);
	}
	await query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
}

async function addContestCompetitor(contest_id, userList) {
	if (userList.length === 0) {
		return;
	}
	let baseSql = "insert into privilege (user_id, rightstr) values";
	let sqlArray = [], valueArray = [];
	userList.forEach(el => {
		sqlArray.push("(?,?)");
		valueArray.push(el, `c${contest_id}`);
	});
	await query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
}

function startupInit() {
	return query("UPDATE solution SET result = 1 WHERE result > 0 and result < 4");
}

module.exports = {
	reverse,
	startupInit,
	checkJSON,
	generateNewEncryptPassword,
	encryptPassword,
	decryptPassword,
	trimProperty,
	assertInt,
	assertString,
	addContestCompetitor,
	addContestProblem,
	removeAllCompetitorPrivilege,
	removeAllContestProblem
};
