import {Socket} from "socket.io";

export interface UserSocket extends Socket {
    user_id: string | undefined,
    auth: boolean | undefined,
    privilege: boolean | undefined,
    user_nick: string | undefined,
    contest_id?: number,
    status?: boolean,
    currentTimeStamp?: number
    request: any,
    url?: string,
    send_auth?: boolean,
    hasClosed?: boolean
}
