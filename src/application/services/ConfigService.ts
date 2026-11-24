import { injectable } from "inversify";
import "reflect-metadata";

@injectable()
export class ConfigService {
    get config() {
        // @ts-ignore
        return global.config;
    }

    get(key: string, defaultValue?: any): any {
        // @ts-ignore
        const val = global.config[key];
        return val === undefined ? defaultValue : val;
    }

    getSwitch(key: string): any {
        // Just a wrapper for now, logic can be moved here later
        // @ts-ignore
        return global.config.switch ? global.config.switch[key] : undefined;
    }
}
