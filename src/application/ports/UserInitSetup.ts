import { definePort } from "./registry";

/** 首次安装：写 config.json、置 init 标记。绑定见 main/compose/user.ts */
export interface UserInitSetup {
	setInitFlag(init: boolean): void;
	writeConfigFile(content: any): any;
}

export const userInitSetup = definePort<UserInitSetup>("UserInitSetup");
