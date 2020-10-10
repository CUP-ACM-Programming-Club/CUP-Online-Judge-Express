import {Request, Response} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import _ from "lodash";
import {ConfigManager} from "../../module/config/config-manager";
declare global {
    namespace NodeJS {
        interface Global {
            contest_mode: boolean
        }
    }
}

interface SelfInfo {
    user_id: string
    nick: string
    admin: boolean
    avatar: string
    avatarUrl: string
    privilege: any
    contest_mode: boolean
    email: string
}

interface SelfInfoResponse extends SelfInfo {
    userInfo: SelfInfo,
    gravatar: string
}

class SelfInfoManager {
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

    @ErrorHandlerFactory(ok.okMaker)
    getSelfInfoByRequest(req: Request) {
        const selfInfo = this.getSelfInfo(req);
        const baseSystemInfo = {
            userInfo: selfInfo,
            gravatar: ConfigManager.getConfig("gravatarCDN", "https://cn.gravatar.com/avatar/")
        };
        const response: SelfInfoResponse = Object.assign(_.cloneDeep(selfInfo), baseSystemInfo);
        return response;
    }
}

export default new SelfInfoManager();
