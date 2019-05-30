const crypto = require("../module/encrypt");
const query = require("./mysql_query");
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
			[this.encryptPassword(rawPassword, salt), user_id])
			.then(resolve)
			.catch(reject);
	});
}

function checkJSON(text) {
	return /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""));
}

module.exports = {
	reverse,
	checkJSON,
	generateNewEncryptPassword,
	encryptPassword,
	decryptPassword
};