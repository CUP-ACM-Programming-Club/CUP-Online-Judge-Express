import {Socket} from "socket.io"
import {UserSocket} from "./Socket";

export default function (socket: UserSocket, next: (err?: any) => void) {
    if (socket.privilege === undefined) {
        socket.privilege = !!socket.request.session.isadmin;
    }
    if (socket.user_nick === undefined) {
        socket.user_nick = socket.request.session.nick;
    }
    next();
}
