import fs from "fs";
import path from "path";

const packageConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));

export default class VersionManager {
    static get version () {
        return packageConfig.version;
    }

    static get git () {
        return packageConfig.repository.url;
    }

    static get license() {
        return packageConfig.license
    }

    static get dependencies() {
        return packageConfig.dependencies
    }

    static get devDependencies() {
        return packageConfig.devDependencies;
    }
}

