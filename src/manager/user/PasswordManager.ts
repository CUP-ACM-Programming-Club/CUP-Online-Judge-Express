import crypto from "crypto";
import {decryptPassword} from "../../module/util";

const AESSalt = global.config.salt || "thisissalt";

class PasswordManager {
    checkPassword(originalPassword: string, inputPassword: string, newpassword: string) {
        originalPassword += "";
        inputPassword += "";
        newpassword += "";
        const convertedOriginalPasswordAscii = Buffer.from(originalPassword, "base64").toString("ascii");
        const convertedOriginalPassword = Buffer.from(originalPassword, "base64").toString();
        const salt = convertedOriginalPasswordAscii.substring(20);
        const SHA1Password = crypto.createHash("sha1")
            .update(crypto.createHash("md5")
                .update(inputPassword)
                .digest("hex") + salt)
            .digest() + salt;
        const decryptedPassword = decryptPassword(newpassword, AESSalt);
        return SHA1Password === convertedOriginalPassword || decryptedPassword === inputPassword;
    }

    generateRandomPassword(length: number) {
        if (length <= 0) {
            return '';
        }
        let rs = '';
        try {
            rs = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
        } catch (ex) {
            console.error('Exception generating random string: ' + ex);
            rs = '';
            let r = length % 8, q = (length - r) / 8, i;
            for (i = 0; i < q; i++) {
                rs += Math.random().toString(16).slice(2);
            }
            if (r > 0) {
                rs += Math.random().toString(16).slice(2, i);
            }
        }
        return rs;
    }
}

export default new PasswordManager();
