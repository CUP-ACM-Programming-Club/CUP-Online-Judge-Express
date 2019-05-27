const crypto = require("../module/encrypt");
const query = require("./mysql_query");
module.exports = {
	reverse: function (val) {
		if (typeof val !== "string")
			return (val + "").split("").reverse().join("");
		else
			return val.split("").reverse().join("");
	},
	checkJSON: function (text) {
		return /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""));
	},
	generateNewEncryptPassword: function (user_id, rawPassword, salt) {
		return new Promise((resolve, reject) => {
			query("update users set newpassword=? where user_id=?",
				[this.encryptPassword(rawPassword, salt), user_id])
				.then(resolve)
				.catch(reject);
		});
	},
	encryptPassword: function (rawPassword, salt) {
		return crypto.encryptAES(rawPassword + salt, this.reverse(salt));
	},
	decryptPassword: function (encryptedPassword, salt) {
		return this.reverse(this.reverse(crypto.decryptAES(encryptedPassword, this.reverse(salt))).substring(salt.length));
	}
};