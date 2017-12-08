const crypto = require('crypto');

const checkPassword = (originalPassword, inputPassword) => {
    const convertedOriginalPassword = new Buffer(originalPassword, 'base64').toString('utf-8');
    const salt = convertedOriginalPassword.substring(20);
    const SHA1Password = crypto.createHash('sha1').update(crypto.createHash('md5').update(inputPassword).digest('hex') + salt).digest() + salt;
    return SHA1Password.substr(0, 35) === convertedOriginalPassword.substr(0, 35);
};

module.exports = checkPassword;