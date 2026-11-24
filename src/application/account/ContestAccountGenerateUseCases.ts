import UserUseCases, { ContestUserInfoPayload } from "../user/UserUseCases";
import PasswordManager from "../auth/PasswordManager";

interface GenerateAccountRequestPayload {
    num?: any,
    prefix?: any,
    nickList?: any
}

/** 批量生成比赛账号（/admin/account/generate）。 */
class ContestAccountGenerateUseCases {

    private static validatePayload(payload: GenerateAccountRequestPayload) {
        if (!payload.num && !payload.prefix && !payload.nickList) {
            throw new Error("入参非法");
        }
        if (typeof payload.num !== "number") {
            throw new Error("创建账号数应为数字");
        }
        if (typeof payload.prefix !== "string") {
            throw new Error("前缀须填入字符串");
        }
        if (payload.prefix.length < 3) {
            throw new Error("前缀长度应大于等于3");
        }
        if (!Array.isArray(payload.nickList)) {
            throw new Error("昵称列表应为字符串数组");
        }
    }

    private static validateNickLengthEqualToGenerateCount(nickList: any, num: number) {
        if (!(nickList && nickList.length && nickList.length === num)) {
            throw new Error("昵称个数与账号生成个数不匹配");
        }
    }

    private static async checkAccountRegistrable(userId: string) {
        const user = await UserUseCases.getUser(userId);
        if (user !== null) {
            throw new Error("存在已注册的用户名，请更换");
        }
    }

    private static buildAccount(prefix: string, index: string | number, len: number) {
        return `${prefix}${`${index}`.padStart(len, "0")}`;
    }

    async batchGenerateAccount(body: any, ip: string) {
        const num = body.num;
        const prefix =  body.prefix;
        const len = `${num}`.length;
        const nickList = body.nickList;
        ContestAccountGenerateUseCases.validateNickLengthEqualToGenerateCount(nickList, num);
        for (let i = 0; i < num; ++i) {
            const userId = ContestAccountGenerateUseCases.buildAccount(prefix, i, len);
            await ContestAccountGenerateUseCases.checkAccountRegistrable(userId);
        }
        const accountList = [];
        for(let i = 0; i < num; ++i) {
            const userId = ContestAccountGenerateUseCases.buildAccount(prefix, i, len);
            const account = await this.generateAccount(userId, nickList[i], ip);
            accountList.push(account);
        }
        return accountList;
    }

    async generateAccount(userId: string, nick: string, ip: string) {
        const payload: ContestUserInfoPayload = {
            userId,
            password: PasswordManager.generateRandomPassword(16),
            nick,
            confirmAnswer: PasswordManager.generateRandomPassword(8),
            confirmQuestion: PasswordManager.generateRandomPassword(8),
            school: "your_own_school"
        };
        await UserUseCases.addContestUser(payload, ip);
        return {userId, password: payload.password, nick};
    }

    async batchGenerate(body: any, ip: string) {
        ContestAccountGenerateUseCases.validatePayload(body);
        return { accountList: await this.batchGenerateAccount(body, ip) };
    }
}

export default new ContestAccountGenerateUseCases();
