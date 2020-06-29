const cryptojs = require("../src/module/encrypt");

function reverse(val: any) {
    if (typeof val !== "string")
        return (val + "").split("").reverse().join("");
    else
        return val.split("").reverse().join("");
}

function encryptPassword(rawPassword: string, salt: string) {
    return cryptojs.encryptAES(rawPassword + salt, reverse(salt));
}

function decryptPassword(encryptedPassword: string, salt: string) {
    return reverse(reverse(cryptojs.decryptAES(encryptedPassword, reverse(salt))).substring(salt.length));
}

const newPassword = "U2FsdGVkX18yAcOfa8PyYKKzuYtkq5fn2NQDHZ6qYdNxwwKuM1ps2OdKpSTnLkyg";
const res = decryptPassword(newPassword, "thisissalt");
const enc = encryptPassword("2016011253", "thisissalt");
console.log("res", res);
console.log("env", enc, enc.length);
console.log("decrypt test", decryptPassword(enc, "thisissalt"));
