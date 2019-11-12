import OnlineUserSet from "./set/OnlineUserSet";
import BroadcastManager from "./BroadcastManager";
import NormalUserSet from "./set/NormalUserSet";
import AdminUserSet from "./set/AdminUserSet";
import localJudge from "../judger"

/**
 * 向不同权限的用户广播用户信息
 */

export default function onlineUserBroadcast() {
    let online = OnlineUserSet.getAllValues();
    let userArr = {
        user_cnt: online.length,
        user: online.map(e => {
            return {
                user_id: (e && e.user_id) ? e.user_id : ""
            };
        })
    };
    BroadcastManager.sendMessage(NormalUserSet.getInnerStorage(), "user", {
        user: userArr, judger: localJudge.getStatus().free_judger
    });
    userArr.user = online;
    BroadcastManager.sendMessage(AdminUserSet.getInnerStorage(), "user", {
        user: userArr, judger: localJudge.getStatus().free_judger
    });
}
