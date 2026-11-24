import { injectable, inject } from "inversify";
import { TYPES } from "../ports/types";
import { UserManager } from "../../infrastructure/persistence/user/UserManager";
import { UserRegisterValidator } from "../../infrastructure/persistence/user/UserRegisterManager";
import InviteManager from "../../infrastructure/persistence/user/InviteManager";
import PrivilegeManager from "../../infrastructure/persistence/user/PrivilegeManager";
import InitManager from "../../main/init/manager/InitManager";
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
