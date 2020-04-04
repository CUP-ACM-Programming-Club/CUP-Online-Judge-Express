import {Request} from "express";
import ConfigFileManager from "../config/ConfigFileManager";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";

class InitManager {
    setInitFlag(init: boolean) {
        ConfigFileManager.updateConfig();
        global.config.init = init;
        ConfigFileManager.writeConfigToFile(global.config);
    }

    @ErrorHandlerFactory(ok.okMaker)
    getConfigFile () {
        return ConfigFileManager.getConfigFile();
    }

    @ErrorHandlerFactory(ok.okMaker)
    initConfigFile (req: Request) {
        const content = req.body.content;
        return ConfigFileManager.writeConfigToFile(content);
    }
}

export default new InitManager();
