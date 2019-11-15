import packageConfig from "../../../package.json";

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

