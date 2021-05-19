import {Express} from "express";
// @ts-ignore
const log4js = require("../../module/logger");
// @ts-ignore
const log = log4js.logger("cheese", "info");
function loader(app: Express, io: any = undefined) {
    if (io !== undefined) {
        app.use(require("express-status-monitor")({
            websocket: io,
            path: "/monitor"
        }));
    }
    require("../router_loader")(app);
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
        console.error(err);
        if (!isNaN(err.statusCode)) {
            statusCode = err.statusCode;
        }
        res.status(statusCode).json({
            status: "error",
            statement: "internal error."
        });
    });
}

export = loader;
