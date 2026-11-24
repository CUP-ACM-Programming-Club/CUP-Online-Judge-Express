import { definePort } from "./registry";

/** 授予系统权限（首次安装创建管理员时用）。实现：infrastructure/persistence/user/PrivilegeManager */
export interface UserPrivilegeRepository {
	addPrivilege(userId: string, privilegeName: string): Promise<boolean>;
}

export const userPrivilegeRepository = definePort<UserPrivilegeRepository>("UserPrivilegeRepository");
