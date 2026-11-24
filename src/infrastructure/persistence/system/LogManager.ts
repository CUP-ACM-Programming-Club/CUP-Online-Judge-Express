import fs from "fs";
import path from "path";
import { SystemLog } from "../../../application/ports/SystemInfo";
const readLastLines = require("read-last-lines");
const pm2 = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "pm2.json"), "utf-8"));
const MAX_LINE = 1000;

class LogManager implements SystemLog {
    async getStdoutLog(line: number = 10) {
        return await readLastLines.read(pm2.out_file, Math.min(+line, MAX_LINE))
    }

    async getStderrLog(line: number = 10) {
        return await readLastLines.read(pm2.error_file, Math.min(+line, MAX_LINE));
    }
}

export default new LogManager();
