import { Request, Response, NextFunction } from "express";

const config = global.config as any;
export = {
	port: process.env.DASH_PORT || config.monitor.port,
	url: "/monitor",
	middleware: (req: Request, res: Response, next: NextFunction) => {
		if (req.originalUrl === "/") {
			res.redirect("/monitor");
		} else {
			return next();
		}
	}
};
