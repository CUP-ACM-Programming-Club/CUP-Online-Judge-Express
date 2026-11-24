import {Socket} from "socket.io"
import {UserSocket} from "./Socket";
import { isAdmin } from "../../policy/predicates";

export default function (socket: UserSocket, next: (err?: any) => void) {
    if (socket.privilege === undefined) {
        socket.privilege = isAdmin(socket.request);
    }
    if (socket.user_nick === undefined) {
        socket.user_nick = socket.request.session.nick;
    }
    next();
}
