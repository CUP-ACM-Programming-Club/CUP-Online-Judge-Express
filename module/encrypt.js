const crypto = require('crypto-js');

exports.encryptAES = function (val, key) {
    return crypto.AES.encrypt(val, key).toString();
};

exports.decryptAES = function (val, key) {
    return crypto.AES.decrypt(val, key).toString(crypto.enc.Utf8);
};