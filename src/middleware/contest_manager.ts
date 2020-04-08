import {error} from "../module/constants/state";
import {Request, Response, NextFunction} from "express";
export = (req: Request, res:Response, next:NextFunction) => {
	if (req.session!.isadmin
        || req.session!.contest_manager
        || req.session!.contest[`c${req.params.contest_id}m`]
        || req.session!.contest_maker[`c${req.params.contest_id}`]) {
		next();
	} else {
		res.json(error.noprivilege);
	}
};
