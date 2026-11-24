import { definePort } from "./registry";

/** global_setting 表。实现：infrastructure/persistence/system/MySqlGlobalSettingRepository */
export interface GlobalSettingRepository {
	findAll(): Promise<any[]>;
	findByLabels(labels: string[]): Promise<any[]>;
	setValue(label: string, value: string): Promise<unknown>;
}

export const globalSettingRepository = definePort<GlobalSettingRepository>("GlobalSettingRepository");
