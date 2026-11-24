import RuleChecker from "../../shared/decorators/RuleChecker";
import isString from "../../shared/decorators/rule-checker/rule/isString";
import TrimArg from "../../shared/decorators/TrimArg";
import UserUseCases from "../user/UserUseCases";
const checkPassword = require("./check_password");

interface ILostPasswordPayload {
    userId: string,
    password: string,
    confirmAnswer: string,
    captcha: string
}

class LostPasswordValidator {
    @TrimArg
    @RuleChecker(isString)
    async userIdValidator(userId: string) {

    }
}

/** 匿名找回密码（/lost/password）：密保问题 + 密保答案重置密码。 */
export class LostPasswordUseCases {
    lostPasswordValiator = new LostPasswordValidator();

    async getConfirmQuestion(userId: string) {
        const userInfo = await UserUseCases.getUser(userId);
        if (userInfo !== null) {
            return userInfo.confirmquestion;
        }
        return null;
    }

    async checkConfirmAnswer(userId: string, confirmAnswer: string) {
        const userInfo = await UserUseCases.getUser(userId);
        const rawConfirmAnswer = userInfo && userInfo.confirmanswer ? userInfo.confirmanswer : "";
        if (!checkPassword("", confirmAnswer, rawConfirmAnswer)) {
            throw new Error("Confirm answer is wrong");
        }
    }

    async validator (payload: any) {
        await this.lostPasswordValiator.userIdValidator(payload.userId);
        return payload as ILostPasswordPayload;
    }

    async resetPassword(body: any) {
        const payload = await this.validator(body);
        await this.checkConfirmAnswer(payload.userId, payload.confirmAnswer);
        await UserUseCases.changePassword(payload.userId, payload.password);
    }
}

export default new LostPasswordUseCases();
