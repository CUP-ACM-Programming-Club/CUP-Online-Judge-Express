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

module.exports = {
	reverse,
	checkJSON,
	generateNewEncryptPassword,
	encryptPassword,
	decryptPassword,
	trimProperty,
	assertInt,
	assertString
};