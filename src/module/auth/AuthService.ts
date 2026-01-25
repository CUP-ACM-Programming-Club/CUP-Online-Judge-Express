import { injectable, inject } from "inversify";
import { TYPES } from "../../di/types";
import { ConfigService } from "../../service/ConfigService";
import { UserManager } from "../../manager/user/UserManager";
const checkPassword = require("../check_password");

@injectable()
export class AuthService {
    private _configService: ConfigService;
    private _userManager: UserManager;

    constructor(
        @inject(TYPES.ConfigService) configService: ConfigService,
        @inject(TYPES.UserManager) userManager: UserManager
    ) {
        this._configService = configService;
        this._userManager = userManager;
    }

    async validateUser(userId: string, password: string): Promise<{ password: string, newpassword: string } | null> {
        const user = await this._userManager.getUser(userId);
        if (user) {
            const ans = user.password;
            const newpass = user.newpassword;
            if (checkPassword(ans, password, newpass)) {
                return { password: ans, newpassword: newpass };
            }
        }
        return null;
    }
}
