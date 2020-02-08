import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {Request} from "express";
import CaptchaChecker from "../../decorator/CaptchaChecker";
import {error, ok} from "../../module/constants/state";
import RuleChecker from "../../decorator/RuleChecker";
import isString from "../../decorator/rule-checker/rule/isString";
import TrimArg from "../../decorator/TrimArg";
import UserManager, {UserInfoPayload} from "./UserManager";
import InviteManager from "./InviteManager";
const query = require("../../module/mysql_cache");

function errorHandler(err: any) {
    console.log("log error:", err);
    return error.errorMaker(err && err.message ? err.message : err);
}
interface IUserRegisterPayload extends UserInfoPayload {
    inviteCode: string
}

class UserRegisterValidator {
    @TrimArg
    @RuleChecker(isString)
    private async userIdValidator(userId: string) {
        if (userId.length > 20) {
            throw new Error("UserId could not longer than 20");
        }
        if (userId.length < 3) {
            throw new Error("UserId could not shorter than 3");
        }
        if (await UserManager.hasUser(userId)) {
            throw new Error("UserId has been registered");
        }
    }

    @TrimArg
    @RuleChecker(isString)
    private nickValidator(nick: string) {
        if (nick.length > 64) {
            throw new Error("Nick could not longer than 64");
        }
    }

    @TrimArg
    @RuleChecker(isString)
    private passwordValidator(password: string) {
        if (password.length < 6) {
            throw new Error("Password could not shorter than 6");
        }
    }

    @TrimArg
    @RuleChecker(isString)
    private confirmQuestionValidator(confirmQuestion: string) {
        if (confirmQuestion.length === 0) {
            throw new Error("Confirm question should not be empty");
        }
    }

    @TrimArg
    @RuleChecker(isString)
    private confirmAnswerValidator(confirmAnswer: string) {
        if (confirmAnswer.length === 0) {
            throw new Error("Confirm answer should not be empty");
        }
    }

    @TrimArg
    @RuleChecker(isString)
    private async inviteCodeValidator(inviteCode: string) {
        if (!(await InviteManager.hasInviteCode(inviteCode))) {
            throw new Error("Invite code does not exist");
        }
    }

    async validate(payload: any) {
        const {userId, nick, password, confirmQuestion, confirmAnswer, inviteCode} = payload;
        await this.userIdValidator(userId);
        this.nickValidator(nick);
        this.passwordValidator(password);
        this.confirmQuestionValidator(confirmQuestion);
        this.confirmAnswerValidator(confirmAnswer);
        await this.inviteCodeValidator(inviteCode);
    }
}

export class UserRegisterManager {
    userRegisterValidator = new UserRegisterValidator();

    private async validator(payload: any) {
        await this.userRegisterValidator.validate(payload);
        return payload as IUserRegisterPayload;
    }

    @ErrorHandlerFactory(ok.okMaker, errorHandler)
    async registerUser(payload: any, req: Request) {
        const registerPayload = await this.validator(payload);
        await InviteManager.consumeInviteCode(registerPayload.inviteCode);
        const inviteInfo = await InviteManager.getInviteInfoByInviteCode(registerPayload.inviteCode);
        await InviteManager.addInviteRecord(registerPayload.inviteCode, inviteInfo!.user_id, registerPayload.userId);
        await UserManager.addUser(registerPayload, req);
    }

    @CaptchaChecker(0, "register")
    async registerUserRequest(req: Request) {
        await this.registerUser(req.body, req)
    }
}

export default new UserRegisterManager();
