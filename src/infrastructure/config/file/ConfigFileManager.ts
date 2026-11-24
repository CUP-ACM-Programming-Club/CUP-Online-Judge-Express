import fs from "fs";
import path from "path";

class ConfigFileManager {
    updateConfig () {
        global.config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "config.json"), "utf-8"));
    }

    getConfigFile () {
        return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "config.json"), "utf-8"));
    }

    writeConfigToFile (content: any) {
        fs.writeFileSync(path.resolve(process.cwd(), "config.json"), JSON.stringify(content), "utf-8");
    }
}

export default new ConfigFileManager();
