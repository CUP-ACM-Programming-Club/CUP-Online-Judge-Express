import {Request, Response, NextFunction} from "express";
import {ok} from "../../../domain/constants/state";
import { configFile } from "../../../application/ports/ConfigFile";

const intializer = async (req: Request, res: Response, next: NextFunction) => {
    if (global.config.init || req.path.includes("captcha") || req.path.includes("firstrun")) {
        next();
    } else {
        configFile.updateConfig();
        if (global.config.init) {
            next();
        }
        else {
            res.json(ok.okMaker({need_init: true}));
        }
    }
};

export = intializer;
