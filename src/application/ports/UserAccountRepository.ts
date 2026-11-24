import { definePort } from "./registry";

/** 旧注册接口（/account/register）使用的 ORM 用户模型。实现：infrastructure/persistence/user/SequelizeUserAccountRepository */
export interface UserAccountRepository {
	/** 返回 ORM 实例（没有时为 null），调用方用 .get() 取值 */
	findByUserId(userId: string): Promise<any>;
	create(row: any): Promise<any>;
}

export const userAccountRepository = definePort<UserAccountRepository>("UserAccountRepository");
