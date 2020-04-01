import fs from "fs";
import path from "path";

class InitManager {
    updateConfigInitFlag() {
        global.config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "config.json"), "utf-8"));
    }

    setInitFlag(init: boolean) {
        this.updateConfigInitFlag();
        global.config.init = init;
        fs.writeFileSync(path.resolve(process.cwd(), "config.json"), JSON.stringify(global.config), "utf-8");
    }
}

export default new InitManager();
