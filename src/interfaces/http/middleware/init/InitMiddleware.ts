import {Request, Response, NextFunction} from "express";
import {error} from "../../../../domain/constants/state";

export default function (req: Request, res: Response, next: NextFunction) {
    if (!global.config.init) {
        next();
    }
    else {
        res.json(error.noprivilege);
    }
}
