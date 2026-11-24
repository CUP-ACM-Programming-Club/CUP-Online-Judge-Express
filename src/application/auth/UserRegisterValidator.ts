import RuleChecker from "../../shared/decorators/RuleChecker";
import isString from "../../shared/decorators/rule-checker/rule/isString";
import TrimArg from "../../shared/decorators/TrimArg";
import UserUseCases from "../user/UserUseCases";
import { userInviteRepository } from "../ports/UserInviteRepository";

export class UserRegisterValidator {
    @TrimArg
    @RuleChecker(isString)
    private async userIdValidator(userId: string) {
        if (userId.length > 20) {
            throw new Error("UserId could not longer than 20");
        }
        if (userId.length < 3) {
            throw new Error("UserId could not shorter than 3");
        }
        if (await UserUseCases.hasUser(userId)) {
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
        if (!(await userInviteRepository.hasInviteCode(inviteCode))) {
            throw new Error("Invite code does not exist");
        }
    }

    async validate(payload: any) {
        const {inviteCode} = payload;
        await this.validateWithoutInviteCode(payload);
        await this.inviteCodeValidator(inviteCode);
    }

    async validateWithoutInviteCode(payload: any) {
        const {userId, nick, password, confirmQuestion, confirmAnswer} = payload;
        await this.userIdValidator(userId);
        this.nickValidator(nick);
        this.passwordValidator(password);
        this.confirmQuestionValidator(confirmQuestion);
        this.confirmAnswerValidator(confirmAnswer);
    }
}
