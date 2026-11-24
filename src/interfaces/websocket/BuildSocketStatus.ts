import {UserSocket} from "./Socket";
import ContestPagePushSet from "./set/ContestPagePushSet";
import StatusSet from "./singleton/StatusSet";
import querystring from "querystring";
import SocketSet from "./set/SocketSet";

export function buildSocket(socket: UserSocket) {
    if (socket.url && (~socket.url.indexOf("status") || ~socket.url.indexOf("rank"))) {
        if (~socket.url.indexOf("cid")) {
            const parseObj: any = querystring.parse(socket.url.substring(socket.url.indexOf("?") + 1, socket.url.length));
            const contest_id = parseInt(parseObj.cid) || 0;
            if (contest_id >= 1000) {
                socket.contest_id = contest_id;
                if (!ContestPagePushSet.has(contest_id)) {
                    ContestPagePushSet.set(contest_id, []);
                }
                ContestPagePushSet.get(contest_id).push(socket);
            }
        } else {
            const url_split = socket.url.split("/");
            if (url_split.includes("contest")) {
                const idx = url_split.indexOf("contest");
                if (idx < url_split.length - 1) {
                    let contest_id: number = 0;
                    if (!isNaN(Number(url_split[idx + 1]))) {
                        contest_id = parseInt(url_split[idx + 1]);
                    } else if (["status", "rank"].includes(url_split[idx + 1]) && !isNaN(Number(url_split[idx + 2]))) {
                        contest_id = parseInt(url_split[idx + 2]);
                    }
                    socket.contest_id = contest_id;
                    if (!ContestPagePushSet.has(contest_id)) {
                        ContestPagePushSet.set(contest_id, []);
                    }
                    ContestPagePushSet.get(contest_id).push(socket);
                }
            } else {
                StatusSet.push(socket);
                socket.status = true;
            }
        }
    }
}

export default function (socket: UserSocket, next: (err?: any) => void) {
    buildSocket(socket);
    socket.currentTimeStamp = Date.now();
    SocketSet.setSocket(socket.currentTimeStamp.toString(), socket);
    next();
}
