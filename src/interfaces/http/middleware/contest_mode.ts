import {Request, Response, NextFunction} from "express";
import { isAdmin } from "../../../domain/policy/predicates";
import ContestModeUseCases from "../../../application/contest/ContestModeUseCases";
export = async (req: Request, res: Response, next: NextFunction) => {
	if (isAdmin(req)) {
		return next;
	}
	await ContestModeUseCases.refreshContestMode();
	return next;
};
