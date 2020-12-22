import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import {Request} from "express";
import UserManager, {ContestUserInfoPayload} from "./UserManager";
import PasswordManager from "./PasswordManager";

interface GenerateAccountRequestPayload {
    num?: any,
    prefix?: any,
    nickList?: any
}

class ContestAccountGenerateManager {

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
        const user = await UserManager.getUser(userId);
        if (user !== null) {
            throw new Error("存在已注册的用户名，请更换");
        }
    }

    private static buildAccount(prefix: string, index: string | number, len: number) {
        return `${prefix}${`${index}`.padStart(len, "0")}`;
    }

    async batchGenerateAccount(req: Request) {
        const num = req.body.num;
        const prefix =  req.body.prefix;
        const len = `${num}`.length;
        const nickList = req.body.nickList;
        ContestAccountGenerateManager.validateNickLengthEqualToGenerateCount(nickList, len);
        for (let i = 0; i < num; ++i) {
            const userId = ContestAccountGenerateManager.buildAccount(prefix, i, len);
            await ContestAccountGenerateManager.checkAccountRegistrable(userId);
        }
        const accountList = [];
        for(let i = 0; i < num; ++i) {
            const userId = ContestAccountGenerateManager.buildAccount(prefix, i, len);
            const account = await this.generateAccount(userId, nickList[i], req);
            accountList.push(account);
        }
        return accountList;
    }

    async generateAccount(userId: string, nick: string, req: Request) {
        const payload: ContestUserInfoPayload = {
            userId,
            password: PasswordManager.generateRandomPassword(16),
            nick,
            confirmAnswer: PasswordManager.generateRandomPassword(8),
            confirmQuestion: PasswordManager.generateRandomPassword(8),
            school: "your_own_school"
        };
        await UserManager.addContestUser(payload, req);
        return {userId, password: payload.password, nick};
    }

    @ErrorHandlerFactory(ok.okMaker)
    async batchGenerateAccountByRequest(req: Request) {
        ContestAccountGenerateManager.validatePayload(req.body);
        return { accountList: await this.batchGenerateAccount(req) };
    }
}

export default new ContestAccountGenerateManager();
