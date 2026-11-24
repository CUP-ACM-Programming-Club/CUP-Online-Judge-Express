import {Server} from "socket.io";
import {server} from "../../../main/init/http-server";

// socket.io v4 server. allowEIO3 keeps existing socket.io-client 2.x browsers
// (Engine.IO v3 protocol) working, so the frontend can migrate independently.
// maxHttpBufferSize restores the v2 default (1e8); v4 lowered it to 1e6, which
// would drop large source-code submissions sent over long-polling.
const io: any = new Server(server, {
    cookie: false,
    transports: [
        "websocket",
        "polling"
    ],
    allowEIO3: true,
    maxHttpBufferSize: 1e8
});

export default io;
