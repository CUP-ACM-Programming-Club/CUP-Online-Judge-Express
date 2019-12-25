import WebSocket from "ws";

const config = global.config;

export interface IWebsocketServerAdapter {
    onMessage(server: WebSocket, message: any): any;

    onJudgerMessage(server: WebSocket, message: any): any;

    onError(server: WebSocket, message: any): any;
}

export class WebsocketServer {
    PORT = process.env.PORT || config.ws.judger_port || 0;
    websocketServer?: WebSocket.Server;
    adapter?: IWebsocketServerAdapter;

    setPort(port: number) {
        console.log(`Websocket Server set port:${port}`);
        this.PORT = port;
        return this;
    }

    startServer() {
        this.websocketServer = new WebSocket.Server({port: <number>this.PORT});
        this.initAdapter();
        return this;
    }

    getServer() {
        return this.websocketServer;
    }

    initAdapter() {
        const adapter = this.adapter;
        if (!this.adapter) {
            throw new Error("Websocket Server Adapter has not set.");
        }
        if (!this.websocketServer) {
            throw new Error("Websocket Server not start!");
        }
        this.websocketServer.on("connection", (ws) => {
            ws.on("message", message => {
                adapter!.onMessage(ws, message);
            });
            ws.on("judger", message => {
                adapter!.onJudgerMessage(ws, message);
            });
            ws.on("error", message => {
                adapter!.onError(ws, message);
            });
        });
    }

    setAdapter(adapter: IWebsocketServerAdapter) {
        this.adapter = adapter;
        return this;
    }
}

export default new WebsocketServer();
