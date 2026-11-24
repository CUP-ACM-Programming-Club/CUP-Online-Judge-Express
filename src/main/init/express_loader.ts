import { Express } from "express";
// @ts-ignore
const log4js = require("../../infrastructure/logging/logger");
// @ts-ignore
const log = log4js.logger("cheese", "info");
const MONITOR_ROOM = "esm-monitor";

/**
 * express-status-monitor broadcasts esm_stats to every connected socket once per second and
 * sends the full metric history (esm_start) to every new connection, although only the admin
 * monitor page uses it. Hand it a channel that only reaches admins who opened that page:
 * they ask with "esm_change" and are put into a room; metrics are emitted to that room only.
 */
function monitorChannel(io: any) {
    return {
        on(event: string, handler: (socket: any) => void) {
            if (event !== "connection") {
                return io.on(event, handler);
            }
            return io.on("connection", (socket: any) => {
                let joined = false;
                const tryJoin = (retry: number) => {
                    if (joined) {
                        return;
                    }
                    if (socket.privilege) {
                        joined = true;
                        socket.join(MONITOR_ROOM);
                        handler(socket);
                    } else if (retry > 0 && socket.connected) {
                        // privilege is set by the "auth" event, which may arrive just after
                        setTimeout(() => tryJoin(retry - 1), 500);
                    }
                };
                socket.on("esm_change", () => tryJoin(10));
            });
        },
        emit(event: string, data: any) {
            io.to(MONITOR_ROOM).emit(event, data);
        }
    };
}

function loader(app: Express, io: any = undefined) {
    if (io !== undefined) {
        app.use(require("express-status-monitor")({
            websocket: monitorChannel(io),
            path: "/monitor"
        }));
    }
    require("../../interfaces/http/router_loader")(app);
    app.use((req, res) => {
        console.error(`Error URL: ${req.originalUrl}`);
        log.fatal(`Error URL: ${req.originalUrl}`);
        let obj = {
            status: "error",
            statement: "resource not found"
        };
        res.json(obj);
    });
    app.use((err: any, req: any, res: any, next: any) => {
        let statusCode = 500;
        let statement = "internal error.";

        console.error(err);

        if (err.statusCode && !isNaN(err.statusCode)) {
            statusCode = err.statusCode;
        }

        if (err.statement) {
            statement = err.statement;
        } else if (err.message) {
            statement = err.message;
        }

        res.status(statusCode).json({
            status: "error",
            statement: statement
        });
    });
}

export = loader;
