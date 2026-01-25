import { injectable, inject } from "inversify";
import { TYPES } from "../../di/types";
import { UserManager } from "../../manager/user/UserManager";
import { UserRegisterValidator } from "../../manager/user/UserRegisterManager";
import InviteManager from "../../manager/user/InviteManager";
import PrivilegeManager from "../../manager/user/PrivilegeManager";
import InitManager from "../../manager/init/InitManager";
import { Request } from "express";

@injectable()
export class RegisterService {
    private _userManager: UserManager;
    private _validator: UserRegisterValidator;

    constructor(@inject(TYPES.UserManager) userManager: UserManager) {
        this._userManager = userManager;
        this._validator = new UserRegisterValidator();
    }

    async registerUser(req: Request) {
        const payload = req.body;
        // Validate with Invite Code
        await this._validator.validate(payload);

        const { inviteCode, userId } = payload;
        await InviteManager.consumeInviteCode(inviteCode);
        const inviteInfo = await InviteManager.getInviteInfoByInviteCode(inviteCode);
        if (inviteInfo) {
            await InviteManager.deleteInviteRecord(inviteCode, inviteInfo.user_id, userId);
            await InviteManager.addInviteRecord(inviteCode, inviteInfo.user_id, userId);
        }

        return await this._userManager.addUser(payload, req);
    }
}
