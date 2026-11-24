import { ConfigService } from "../services/ConfigService";
import { userLegacyTokenCache } from "../ports/UserTokenStore";
import UserUseCases from "../user/UserUseCases";
const checkPassword = require("./check_password");

export class AuthService {
    private _configService: ConfigService;

    constructor(configService: ConfigService = new ConfigService()) {
        this._configService = configService;
    }

    async validateUser(userId: string, password: string): Promise<{ password: string, newpassword: string } | null> {
        const user = await UserUseCases.getUser(userId);
        if (user) {
            const ans = user.password;
            const newpass = user.newpassword;
            if (checkPassword(ans, password, newpass)) {
                return { password: ans, newpassword: newpass };
            }
        }
        return null;
    }

    /** 旧版（memcached）登录 token */
    async getLegacyToken(userId: string) {
        return await userLegacyTokenCache.get(userId);
    }
}

export default new AuthService();
