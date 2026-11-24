import {Request, Response, NextFunction} from "express";
import { isAdmin } from "../policy/predicates";
const cache_query = require("../module/mysql_cache");
export = async (req: Request, res: Response, next: NextFunction) => {
	if (isAdmin(req)) {
		return next;
	}
	const result = await cache_query("select value from global_setting where label = 'contest'");
	global.contest_mode = !!(result && result[0] && result[0].value && parseInt(result[0].value));
	return next;
};
