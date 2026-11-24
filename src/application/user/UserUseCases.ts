import { encryptPassword } from "../util";
import { UserInfoDAO, userRepository } from "../ports/UserRepository";

/** 与重构前 UserManager 默认实例一致：盐在模块加载时取一次 */
const legacySalt = global.config.salt || "thisissalt";

export interface UserInfoPayload {
	userId: string,
	password: string,
	confirmQuestion: string,
	nick: string,
	confirmAnswer: string
}

export interface ContestUserInfoPayload extends UserInfoPayload {
	school: string
}

/** 用户的基本读写（原 UserManager 的业务部分；SQL 在 MySqlUserRepository）。 */
export class UserUseCases {
	async getUser(userId: string): Promise<UserInfoDAO | null> {
		return await userRepository.getUser(userId);
	}

	async hasUser(userId: string) {
		return (await this.getUser(userId)) !== null;
	}

	async getUserEmail(userId: string): Promise<string> {
		const user = await this.getUser(userId);
		if (user !== null) {
			return user.email;
		}
		else {
			return "";
		}
	}

	async getUserNick(userId: string) {
		const user = await this.getUser(userId);
		return null !== user && user.nick || "";
	}

	/** 默认实例用的盐（模块加载时的 global.config.salt） */
	get legacySalt() {
		return legacySalt;
	}

	/** salt 由调用方给出：注册接口用运行期配置，其余沿用 legacySalt（与重构前各自的取值方式一致） */
	async addUser(userInfoPayload: UserInfoPayload, ip: string, salt: string) {
		return await userRepository.addUser({
			userId: userInfoPayload.userId,
			encryptedPassword: encryptPassword(userInfoPayload.password, salt),
			confirmQuestion: userInfoPayload.confirmQuestion,
			encryptedConfirmAnswer: encryptPassword(userInfoPayload.confirmAnswer, salt),
			nick: userInfoPayload.nick,
			ip
		});
	}

	async addContestUser(userInfoPayload: ContestUserInfoPayload, ip: string) {
		return await userRepository.addContestUser({
			userId: userInfoPayload.userId,
			encryptedPassword: encryptPassword(userInfoPayload.password, legacySalt),
			confirmQuestion: userInfoPayload.confirmQuestion,
			encryptedConfirmAnswer: encryptPassword(userInfoPayload.confirmAnswer, legacySalt),
			nick: userInfoPayload.nick,
			ip,
			school: userInfoPayload.school
		});
	}

	async changePassword(userId: string, password: string) {
		return await userRepository.changePassword(userId, encryptPassword(password, legacySalt));
	}

	async updateUser(userId: string, payload: any) {
		return await userRepository.updateUser(userId, payload);
	}
}

export default new UserUseCases();
