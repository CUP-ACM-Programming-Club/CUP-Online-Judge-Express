import {Request, Response, NextFunction} from "express";
import {ok} from "../module/constants/state";
import InitManager from "../manager/init/InitManager";

const intializer = async (req: Request, res: Response, next: NextFunction) => {
    if (global.config.init || req.path.includes("captcha")) {
        next();
    } else {
        InitManager.updateConfigInitFlag();
        if (global.config.init) {
            next();
        }
        else {
            res.json(ok.okMaker({need_init: true}));
        }
    }
};

export = intializer;
