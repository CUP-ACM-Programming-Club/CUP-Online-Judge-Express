import { ILoginLogDTO, userLoginLogRepository } from "../ports/UserLoginLogRepository";

/** 登录日志：客户端上报环境信息、后台查询。 */
export class LoginLogUseCases {
    async record(userId: string, loginLogDTO: ILoginLogDTO, ip: string) {
        await userLoginLogRepository.setUserIdLoginLog(userId, loginLogDTO, ip);
    }

    async getLatest() {
        return await userLoginLogRepository.getLatestLoginLog();
    }

    async getByUser(userId: string, rawPage: any) {
        const page = isNaN(parseInt(rawPage as string)) ? 0 : parseInt(rawPage as string);
        return await userLoginLogRepository.getUserIdLoginLog(userId, page);
    }
}

export default new LoginLogUseCases();
