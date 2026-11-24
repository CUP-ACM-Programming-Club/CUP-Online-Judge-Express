import { definePort } from "./registry";

/** 读写 config.json。实现：infrastructure/config/file/ConfigFileManager */
export interface ConfigFile {
	updateConfig(): void;
	getConfigFile(): any;
	writeConfigToFile(content: any): void;
}

export const configFile = definePort<ConfigFile>("ConfigFile");
