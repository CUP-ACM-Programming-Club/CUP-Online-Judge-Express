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
    adapter?: IWebsocketServerAdapter;
    setPort(port: number) {
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
        this.websocketServer.on("message", message => {
            adapter!.onMessage(this.websocketServer!, message);
        });
        this.websocketServer.on("judger", message => {
            adapter!.onJudgerMessage(this.websocketServer!, message);
        });
        this.websocketServer.on("error", message => {
            adapter!.onError(this.websocketServer!, message);
        });
    }

    setAdapter(adapter: IWebsocketServerAdapter) {
        this.adapter = adapter;
        return this;
    }
}

export default new WebsocketServer();
