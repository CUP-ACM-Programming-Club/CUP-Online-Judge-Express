import { userRepository } from "../ports/UserRepository";
const checkPassword = require("../auth/check_password");

/** 后台批量核对账号密码（/admin/account/check）。 */
export class PasswordCheckUseCases {
	private async getPassword(user_id: any) {
		const data = await userRepository.getPasswordRows(user_id);
		if (data.length === 0) {
			return false;
		}
		return data[0];
	}

	async passwordMatches(user_id: any, inputPassword: any) {
		const passwordData: any = await this.getPassword(user_id);
		const originalPassword = passwordData.password;
		const newPassword = passwordData.newpassword;
		return checkPassword(originalPassword, inputPassword, newPassword);
	}
}

export default new PasswordCheckUseCases();
