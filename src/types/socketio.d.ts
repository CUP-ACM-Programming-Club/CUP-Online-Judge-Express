import {Namespace, Socket} from "socket.io";
import {UserSocket} from "../module/websocket/Socket";

declare module "socket.io" {
    interface Server {
        use(fn: (socket: UserSocket, fn: (err?: any) => void) => void): Namespace;
        on(event: 'connection', listener: (socket: Socket) => void): Namespace;
    }
}
