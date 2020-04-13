import {Request, Response, NextFunction} from "express";
const opentracing = require("@alicloud/opentracing");
const tracer = new opentracing.Tracer("主链路");

export interface TraceRequest extends Request{
    parentSpan: any,
    tracer: any
}

let counter = 0;

export default function (req: TraceRequest, res: Response, next: NextFunction) {
    const currentCounter = ++counter;
    console.log(`tarcer in ${currentCounter}`);
    req.parentSpan = tracer.startSpan("根模块");
    req.tracer = tracer;
    req.parentSpan.setTag(opentracing.Tags.PEER_HOSTNAME, req.hostname);
    req.parentSpan.setTag(opentracing.Tags.HTTP_METHOD, req.method.toUpperCase());
    req.parentSpan.setTag(opentracing.Tags.HTTP_URL, req.url);
    next();
    res.once("finish", () => {
        console.log(`tracer out ${currentCounter}`);
        req.parentSpan.setTag(opentracing.Tags.HTTP_STATUS_CODE, res.statusCode);
        req.parentSpan.finish(req);
    });
}
