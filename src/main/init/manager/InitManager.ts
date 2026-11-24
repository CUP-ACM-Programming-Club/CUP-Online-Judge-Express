import {Request} from "express";
import ConfigFileManager from "../../../infrastructure/config/file/ConfigFileManager";
import {ErrorHandlerFactory} from "../../../shared/decorators/ErrorHandler";
import {ok} from "../../../domain/constants/state";

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
