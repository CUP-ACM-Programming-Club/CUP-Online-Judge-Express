import { definePort } from "./registry";

export interface UserInfoDAO {
	user_id: string,
	password: string,
	newpassword: string,
	nick: string,
	school: string,
	email: string,
	reg_time: string,
	ip: string,
	confirmquestion: string,
	confirmanswer: string
}

/** 新用户写库所需的字段（密码与密保答案已加密）。 */
export interface NewUserRow {
	userId: string,
	encryptedPassword: string,
	confirmQuestion: string,
	encryptedConfirmAnswer: string,
	nick: string,
	ip: string
}

export interface NewContestUserRow extends NewUserRow {
	school: string
}

/** users 表（及登录时读取的 privilege）的持久化。实现：infrastructure/persistence/user/MySqlUserRepository */
export interface UserRepository {
	getUser(userId: string): Promise<UserInfoDAO | null>;
	addUser(row: NewUserRow): Promise<any>;
	addContestUser(row: NewContestUserRow): Promise<any>;
	/** 找回密码：写入新的 newpassword（已加密） */
	changePassword(userId: string, encryptedPassword: string): Promise<any>;
	/** 登录/改密：写入新的 newpassword（已加密） */
	updateNewPassword(userId: string, encryptedPassword: string): Promise<any>;
	/** 只更新 payload 中允许修改的列 */
	updateUser(userId: string, payload: any): Promise<void>;
	/** password / newpassword 两列 */
	getPasswordRows(userId: string): Promise<any[]>;
	/** 登录时写入 session 的权限串 */
	getPrivilegeRows(userId: string): Promise<any[]>;
	/** 登录时写入 session 的昵称、头像、邮箱 */
	getSessionProfileRows(userId: string): Promise<any[]>;
}

export const userRepository = definePort<UserRepository>("UserRepository");
