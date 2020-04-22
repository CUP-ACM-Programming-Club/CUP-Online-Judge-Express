import {error} from "../module/constants/state";
import {Request, Response, NextFunction} from "express";

export = (req: Request, res: Response, next: NextFunction) => {
	if (req.session!.isadmin) {
		next();
	}
	else {
		res.json(error.noprivilege);
	}
};
