import {Request, Response, NextFunction} from "express";
import {ok} from "../../../domain/constants/state";
import ConfigFileManager from "../../../infrastructure/config/file/ConfigFileManager";

const intializer = async (req: Request, res: Response, next: NextFunction) => {
    if (global.config.init || req.path.includes("captcha") || req.path.includes("firstrun")) {
        next();
    } else {
        ConfigFileManager.updateConfig();
        if (global.config.init) {
            next();
        }
        else {
            res.json(ok.okMaker({need_init: true}));
        }
    }
};

export = intializer;
