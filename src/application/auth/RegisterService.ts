import { ConfigService } from "../services/ConfigService";
import { UserRegisterValidator } from "./UserRegisterValidator";
import { userInviteRepository } from "../ports/UserInviteRepository";
import UserUseCases from "../user/UserUseCases";

/** 邀请码注册（POST /register）。 */
export class RegisterService {
    private _configService: ConfigService;
    private _validator: UserRegisterValidator;

    constructor(configService: ConfigService = new ConfigService()) {
        this._configService = configService;
        this._validator = new UserRegisterValidator();
    }

    async registerUser(payload: any, ip: string) {
        // Validate with Invite Code
        await this._validator.validate(payload);

        const { inviteCode, userId } = payload;
        await userInviteRepository.consumeInviteCode(inviteCode);
        const inviteInfo = await userInviteRepository.getInviteInfoByInviteCode(inviteCode);
        if (inviteInfo) {
            await userInviteRepository.deleteInviteRecord(inviteCode, inviteInfo.user_id, userId);
            await userInviteRepository.addInviteRecord(inviteCode, inviteInfo.user_id, userId);
        }

        return await UserUseCases.addUser(payload, ip, this._configService.config.salt);
    }
}

export default new RegisterService();
