const cryptoJs = require("crypto-js");

export function encryptAES(val: any, key: string) {
	return cryptoJs.AES.encrypt(val, key).toString();
}

export function decryptAES(val: any, key: string) {
	return cryptoJs.AES.decrypt(val, key).toString(cryptoJs.enc.Utf8);
}
