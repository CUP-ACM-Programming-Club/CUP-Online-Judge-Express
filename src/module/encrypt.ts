const cryptoJs = require("crypto-js");
exports.encryptAES = function (val: any, key: string) {
	return cryptoJs.AES.encrypt(val, key).toString();
};

exports.decryptAES = function (val: any, key: string) {
	return cryptoJs.AES.decrypt(val, key).toString(cryptoJs.enc.Utf8);
};
