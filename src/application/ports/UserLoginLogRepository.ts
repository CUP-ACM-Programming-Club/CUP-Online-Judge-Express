import { definePort } from "./registry";

export interface ILoginLogDAO {
	user_id: string,
	password: string,
	ip: string,
	time: string,
	browser_name?: string,
	browser_version?: string,
	os_name?: string,
	os_version?: string
}

export interface ILoginLogDTO {
	os_name: string,
	os_version: string,
	browser_name: string,
	browser_version: string
}

/** 登录日志。实现：infrastructure/persistence/user/record/LoginLogManager */
export interface UserLoginLogRepository {
	getLatestLoginLog(): Promise<ILoginLogDAO[]>;
	getUserIdLoginLog(userId: string, page: number): Promise<ILoginLogDAO[]>;
	setUserIdLoginLog(userId: string, loginLogDTO: ILoginLogDTO, ip: string): Promise<void>;
}

export const userLoginLogRepository = definePort<UserLoginLogRepository>("UserLoginLogRepository");
