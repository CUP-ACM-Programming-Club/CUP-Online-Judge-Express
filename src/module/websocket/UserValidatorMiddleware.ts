import cookie from "cookie";
import {Socket} from "socket.io"
import {UserSocket} from "./Socket";
const client = require("../redis").default;

export default async function userValidator(socket: UserSocket, next: (err?: any) => void) {

    if (typeof socket.handshake.headers.cookie !== "string") {
        next(new Error("cookie invalid"));
        console.log("Cookie invalid: socket.request.session:", socket.request.session);
        return;
    }
    const parse_cookie = cookie.parse(socket.handshake.headers.cookie);
    const user_id = socket.user_id = parse_cookie["user_id"] || socket.request.session.user_id;
    const newToken = parse_cookie["newToken"];
    const token = parse_cookie["token"];
    if (!socket.user_id) {
        next(new Error("Auth failed"));
        return;
    }
    if (socket.request.session && socket.request.session.user_id) {
        socket.auth = true;
        next();
        return;
    }
    const new_token_list = await client.lrangeAsync(`${user_id}newToken`, 0, -1);
    const original_token = await client.lrangeAsync(`${user_id}token`, 0, -1);
    if (new_token_list.indexOf(newToken) !== -1 || original_token.indexOf(token) !== -1) {
        Object.assign(socket, {auth: true});
        next();
    } else {
        next(new Error("Token Expired."));
    }
}
