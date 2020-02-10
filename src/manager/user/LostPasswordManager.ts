import {Request} from "express";
import UserManager from "./UserManager";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import RuleChecker from "../../decorator/RuleChecker";
import isString from "../../decorator/rule-checker/rule/isString";
import TrimArg from "../../decorator/TrimArg";
import CaptchaChecker from "../../decorator/CaptchaChecker";
const checkPassword = require("../../module/check_password");

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

export class LostPasswordManager {
    lostPasswordValiator = new LostPasswordValidator();
    @ErrorHandlerFactory(ok.okMaker)
    async getConfirmQuestion(req: Request) {
        const userInfo = await UserManager.getUser(req.params.user_id);
        if (userInfo !== null) {
            return userInfo.confirmquestion;
        }
        return null;
    }

    async checkConfirmAnswer(userId: string, confirmAnswer: string) {
        const userInfo = await UserManager.getUser(userId);
        const rawConfirmAnswer = userInfo?.confirmanswer || "";
        if (!checkPassword("", confirmAnswer, rawConfirmAnswer)) {
            throw new Error("Confirm answer is wrong");
        }
    }

    async validator (payload: any) {
        await this.lostPasswordValiator.userIdValidator(payload.userId);
        return payload as ILostPasswordPayload;
    }

    @ErrorHandlerFactory(ok.okMaker)
    @CaptchaChecker(0, "lost")
    async resetPassword(req: Request) {
        const payload = await this.validator(req.body);
        await this.checkConfirmAnswer(payload.userId, payload.confirmAnswer);
        await UserManager.changePassword(payload.userId, payload.password);
    }
}

export default new LostPasswordManager();
