import WebSocket from "ws";
const config = global.config;

export interface IWebsocketServerAdapter {
    onMessage(server: WebSocket.Server, message: any): any;
    onJudgerMessage(server: WebSocket.Server, message: any): any;
    onError(server: WebSocket.Server, message: any): any;
}

export class WebsocketServer {
    PORT = process.env.PORT || config.ws.judger_port || 0;
    websocketServer?: WebSocket.Server;
    setPort(port: number) {
        this.PORT = port;
        return this;
    }

    startServer() {
        this.websocketServer = new WebSocket.Server({port: <number>this.PORT});
        return this;
    }

    getServer() {
        return this.websocketServer;
    }

    setAdapter(adapter: IWebsocketServerAdapter) {
        if (!this.websocketServer) {
            throw new Error("Websocket Server not start!");
        }
        this.websocketServer.on("message", message => {
            adapter.onMessage(this.websocketServer!, message);
        });
        this.websocketServer.on("judger", message => {
            adapter.onJudgerMessage(this.websocketServer!, message);
        });
        this.websocketServer.on("error", message => {
            adapter.onError(this.websocketServer!, message);
        });
        return this;
    }
}

export default new WebsocketServer();
