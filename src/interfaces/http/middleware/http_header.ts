const cluster = require("cluster");
import {Request, Response, NextFunction} from "express";

module.exports = function (req: Request, res: Response, next: NextFunction) {
    const exec_start_at = Date.now();
    const _send = res.send;
    res.send = function (...args: any) {
        res.set("X-Execution-Time", String(Date.now() - exec_start_at));
        if (cluster.isWorker) {
            res.set("Cluster-Id", cluster.worker.id);
        }
        return _send.apply(res, args);
    };
    next();
};
