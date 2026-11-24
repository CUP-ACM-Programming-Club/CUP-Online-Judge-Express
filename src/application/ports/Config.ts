/**
 * 运行期配置与功能开关端口。实现：infrastructure/config/config-manager 的 SystemConfigManager
 * （main/compose 绑定）。application / interfaces 只通过它读写配置。
 */
import { definePort } from "./registry";

export interface ConfigPort {
	readonly SWITCH_ON: number;
	readonly SWITCH_OFF: number;
	getConfig(configKey: string, defaultValue: any): any;
	getJSONConfig(configKey: string, defaultValue?: string): any;
	getArrayConfig(configKey: string, defaultValue?: string): any;
	getObjectConfig(configKey: string, defaultValue?: string): any;
	setConfig(configKey: string, configValue: any, comment?: string): any;
	removeConfig(configKey: string): any;
	getSwitch(configKey: string, defaultValue?: boolean): any;
	isSwitchedOn(configKey: string, defaultValue?: number): boolean;
	setSwitch(configKey: string, switchValue: number | string, comment?: string): any;
	removeSwitch(configKey: string): any;
}

export const ConfigManager = definePort<ConfigPort>("ConfigManager");
