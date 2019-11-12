import {UserSocket} from "./Socket";
import UserSocketSet from "./set/UserSocketSet";
import AdminUserSet from "./set/AdminUserSet";
import NormalUserSet from "./set/NormalUserSet";
import OnlineUserSet from "./set/OnlineUserSet";
import onlineUserBroadcast from "./OnlineUserBroadcast";
interface IUser {
    user_id: string,
    url: string[],
    ip?: string,
    intranet_ip?: string,
    nick: string,
    useragent: string
}
export default function (socket: UserSocket, next: (err?: any) => void) {
    const pos = OnlineUserSet.get(socket.user_id!);
    const referer = socket.handshake.headers.referer || "";
    const origin = socket.handshake.headers.origin || "";
    const _url = referer.substring(origin.length || referer.indexOf("/", 9));
    const userId = socket.user_id!;

    if (_url.length && _url.length > 0) {
        socket.url = _url;
    }
    if (pos !== null && pos !== undefined && pos && pos.url) {
        if (_url.length > 0) {
            pos.url.push(_url);
        }
        UserSocketSet.get(userId).push(socket);
        if (socket.privilege) {
            AdminUserSet.get(userId).push(socket);
        } else {
            NormalUserSet.get(userId).push(socket);
        }
    } else {
        let user:IUser = {
            user_id: socket.user_id!,
            url: [],
            nick: socket.user_nick!,
            useragent: socket.handshake.headers["user-agent"]
        };
        if (socket.handshake.headers["x-forwarded-for"]) {
            const iplist = socket.handshake.headers["x-forwarded-for"].split(",");
            user.ip = iplist[0];
            user.intranet_ip = iplist[1];
        } else {
            user.intranet_ip = socket.handshake.address;
            user.ip = "";
        }
        if (_url.length && _url.length > 0) {
            user.url.push(_url);
        }
        UserSocketSet.set(userId, [socket]);
        OnlineUserSet.set(userId, user);
        if (socket.privilege) {
            AdminUserSet.set(userId, [socket]);
        } else {
            NormalUserSet.set(userId, [socket]);
        }
    }
    onlineUserBroadcast();
    next();
}
