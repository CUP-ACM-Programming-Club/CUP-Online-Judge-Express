const crypto = require("crypto");
const checkPassword = (originalPassword, inputPassword, newpassword) => {
	const convertedOriginalPasswordAscii = Buffer.from(originalPassword, "base64").toString("ascii");
	const convertedOriginalPassword = Buffer.from(originalPassword, "base64").toString();
	const salt = convertedOriginalPasswordAscii.substring(20);
	const SHA1Password = crypto.createHash("sha1")
		.update(crypto.createHash("md5")
			.update(inputPassword)
			.digest("hex") + salt)
		.digest() + salt;
	return SHA1Password === convertedOriginalPassword || newpassword === inputPassword;
};

module.exports = checkPassword;
