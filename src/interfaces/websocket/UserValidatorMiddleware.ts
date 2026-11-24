import cookie from "cookie";
import SocketIO, {Socket} from "socket.io"
import {UserSocket} from "./Socket";
import TokenManager from "../../application/account/token/TokenManager";

async function doValidate(socket: UserSocket, next: (err?: any) => void) {
    if (typeof socket.handshake.headers.cookie !== "string") {
        next(new Error("cookie invalid"));
        console.log("Cookie invalid: socket.request.session:", socket.request.session);
        return;
    }
    const parse_cookie = cookie.parse(socket.handshake.headers.cookie);
    // 已登录的 session 是身份的唯一来源：不再让 user_id cookie 覆盖它（phase5 fix c）
    if (socket.request.session && socket.request.session.user_id) {
        socket.user_id = socket.request.session.user_id;
        socket.auth = true;
        next();
        return;
    }
    // 没有登录 session 时，才按 user_id cookie + token / newToken 校验
    const user_id = socket.user_id = parse_cookie["user_id"];
    const newToken = parse_cookie["newToken"];
    const token = parse_cookie["token"];
    if (!socket.user_id) {
        next(new Error("Auth failed"));
        return;
    }
    if (await TokenManager.hasValidToken(user_id, token, newToken)) {
        Object.assign(socket, {auth: true});
        next();
    } else {
        next(new Error("Token Expired."));
    }
}

export default function userValidator(socket: SocketIO.Socket, next: (err?: any) => void) {
    doValidate(socket as UserSocket, next);
}
