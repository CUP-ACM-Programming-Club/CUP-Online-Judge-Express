import dayjs from "dayjs";
import { IInviteInfo, userInviteRepository } from "../ports/UserInviteRepository";

const PAGE_OFFSET = 50;

function timeToString(time: any) {
    return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

class InviteValidator {
    expireDateValidator(expireDate: string) {
        const formattedExpireDate = dayjs(expireDate);
        if (formattedExpireDate.isBefore(dayjs())) {
            throw new Error("Expire date should after now");
        }
    }

    validUserNumberValidator(validUserNumber: string | number) {
        if (typeof validUserNumber === "string") {
            validUserNumber = parseInt(validUserNumber);
        }
        if (validUserNumber <= 0) {
            throw new Error("Valid user number should larger than 0");
        }
    }
}

/** 后台邀请码管理（/admin/account/invite）。 */
export class InviteUseCases {
    private inviteValidator = new InviteValidator();

    async addInviteCode(userId: string, rawExpireDate: any, rawValidUserNumber: any) {
        const expireDate = timeToString(rawExpireDate);
        const validUserNumber = parseInt(rawValidUserNumber as string);
        this.inviteValidator.expireDateValidator(expireDate);
        this.inviteValidator.validUserNumberValidator(validUserNumber);
        return await userInviteRepository.addInviteCode(userId, expireDate, validUserNumber);
    }

    async getAllInviteCode(): Promise<IInviteInfo[]> {
        return await userInviteRepository.getAllInviteCode();
    }

    async getInviteCodePage(page: string) {
        let formattedPage: number;
        if (isNaN(parseInt(page))) {
            formattedPage = 0;
        }
        else {
            formattedPage = parseInt(page);
        }
        return userInviteRepository.getInviteCodeByConditional(formattedPage * PAGE_OFFSET, PAGE_OFFSET);
    }

    async expireInviteCode(inviteCode: string) {
        await userInviteRepository.expireInviteCode(inviteCode);
        return;
    }
}

export default new InviteUseCases();
