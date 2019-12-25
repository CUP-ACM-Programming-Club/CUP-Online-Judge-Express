import {IWebsocketServerAdapter} from "../../WebsocketServer";
import WebSocket from "ws";
import JudgeResultManager from "../../../../manager/websocket/JudgeResultManager";

export class WebsocketServerAdapter implements IWebsocketServerAdapter {
    onError(server: WebSocket, message: any): any {
        console.log(message);
    }

    async onJudgerMessage(server: WebSocket, message: any) {
        await JudgeResultManager.messageHandle(message);
    }

    onMessage(server: WebSocket, message: any): any {
        let request;
        try {
            request = JSON.parse(message);
        } catch (e) {
            console.log("Parse json caused error: ", e);
            return;
        }
        if (request.type && typeof request.type === "string") {
            server.emit(request.type, request.value, request);
        } else {
            console.error(`Error:Parsing message failed.Receive data:${message}`);
        }
    }
}

export default new WebsocketServerAdapter();
