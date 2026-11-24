import { UserRegisterValidator } from "./UserRegisterValidator";
import UserUseCases, { UserInfoPayload } from "../user/UserUseCases";
import { userInitSetup } from "../ports/UserInitSetup";
import { userPrivilegeRepository } from "../ports/UserPrivilegeRepository";

/** 首次安装：创建系统管理员、写入配置文件。 */
export class InitUseCases {
    private validator = new UserRegisterValidator();

    async initSystemAdminUser(payload: any, ip: string) {
        await this.validator.validateWithoutInviteCode(payload);
        const registerPayload = payload as UserInfoPayload;
        await UserUseCases.addUser(registerPayload, ip, UserUseCases.legacySalt);
        userInitSetup.setInitFlag(true);
        return await userPrivilegeRepository.addPrivilege(registerPayload.userId, "administrator");
    }

    initConfigFile(content: any) {
        return userInitSetup.writeConfigFile(content);
    }
}

export default new InitUseCases();
