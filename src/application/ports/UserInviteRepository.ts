import { definePort } from "./registry";

export interface IInviteInfo {
	invite_id: number,
	user_id: string,
	invite_code: string,
	valid_date: number | string,
	valid_time: number
}

/** 邀请码。实现：infrastructure/persistence/user/InviteManager */
export interface UserInviteRepository {
	getInviteInfoByInviteCode(inviteCode: string): Promise<IInviteInfo | null>;
	hasInviteCode(inviteCode: string): Promise<boolean>;
	expireInviteCode(inviteCode: string): Promise<any>;
	/** 事务内扣减一次可用次数；失败时返回 {status: "error"}（不抛出，与旧行为一致） */
	consumeInviteCode(inviteCode: string): Promise<any>;
	addInviteRecord(inviteCode: string, inviter: string, userId: string): Promise<any>;
	deleteInviteRecord(inviteCode: string, inviter: string, userId: string): Promise<any>;
	addInviteCode(userId: string, expireDate: string, validUserNumber: number): Promise<string>;
	getAllInviteCode(): Promise<IInviteInfo[]>;
	getInviteCodeByConditional(page: number, offset: number): Promise<IInviteInfo[]>;
}

export const userInviteRepository = definePort<UserInviteRepository>("UserInviteRepository");
