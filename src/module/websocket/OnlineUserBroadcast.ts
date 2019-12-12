import OnlineUserSet from "./set/OnlineUserSet";
import BroadcastManager from "./BroadcastManager";
import NormalUserSet from "./set/NormalUserSet";
import AdminUserSet from "./set/AdminUserSet";
import localJudge from "../judger"
import {BaseUserSet} from "./set/BaseUserSet";

/**
 * 向不同权限的用户广播用户信息
 */

export class OnlineUserBroadcast {
    userSet = OnlineUserSet;

    private buildPayload () {
        const online = this.userSet.getAllValuesForNormalUser();
        return {
            user_cnt: online.length,
            user: online
        };
    }

    private sendMessage(userSet: BaseUserSet, userList: any) {
        BroadcastManager.sendMessage(userSet.getInnerStorage(), "user", {
            user: userList, judger: localJudge.getStatus().free_judger
        });
    }

    broadcast () {
        const userArr = this.buildPayload();
        this.sendMessage(NormalUserSet, userArr);
        userArr.user = this.userSet.getAllValues();
        this.sendMessage(AdminUserSet, userArr);
    }
}

export default new OnlineUserBroadcast();
