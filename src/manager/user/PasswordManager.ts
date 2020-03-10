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
}

export default new PasswordManager();
