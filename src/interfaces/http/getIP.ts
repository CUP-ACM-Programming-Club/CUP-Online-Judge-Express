import {Request} from "express";

module.exports = function(req: Request) {
	return (<string>(req.headers["x-forwarded-for"] || req.connection.remoteAddress)).split(",")[0];
};
