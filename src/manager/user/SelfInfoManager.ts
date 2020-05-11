import {Request, Response} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import _ from "lodash";
declare global {
    namespace NodeJS {
        interface Global {
            contest_mode: boolean
        }
    }
}
class SelfInfoManager {
    @ErrorHandlerFactory(ok.okMaker)
    getSelfInfo(req: Request) {
        const sessionCopy = _.cloneDeep(req.session);
        if (Object.prototype.hasOwnProperty.call(sessionCopy, "captcha")) {
            delete sessionCopy!.captcha;
        }
        return {
            user_id: req.session!.user_id,
            nick: req.session!.nick,
            admin: req.session!.isadmin,
            avatar: req.session!.avatar,
            avatarUrl: req.session!.avatarUrl,
            privilege: sessionCopy,
            contest_mode: global.contest_mode,
            email: req.session!.email
        };
    }
}

export default new SelfInfoManager();
