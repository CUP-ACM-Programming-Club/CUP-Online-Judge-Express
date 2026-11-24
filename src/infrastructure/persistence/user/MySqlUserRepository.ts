import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";
import { NewContestUserRow, NewUserRow, UserInfoDAO, UserRepository } from "../../../application/ports/UserRepository";

const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };

export class MySqlUserRepository implements UserRepository {
	async addUser(row: NewUserRow) {
		return await query(`insert into users(user_id, newpassword, confirmquestion, confirmanswer, nick, ip, reg_time, password, email)values(?,?,?,?,?,?,NOW(),'','')`,
			[row.userId, row.encryptedPassword, row.confirmQuestion,
			row.encryptedConfirmAnswer, row.nick, row.ip]);
	}

	async addContestUser(row: NewContestUserRow) {
		return await query(`insert into users(user_id, newpassword, confirmquestion, confirmanswer, nick, ip, reg_time, password, email, school)values(?,?,?,?,?,?,NOW(),'','', ?)`,
			[row.userId, row.encryptedPassword, row.confirmQuestion,
			row.encryptedConfirmAnswer, row.nick, row.ip, row.school]);
	}

	async changePassword(userId: string, encryptedPassword: string) {
		return await query(`update users set newpassword = ? where user_id = ?`, [encryptedPassword, userId]);
	}

	updateNewPassword(userId: string, encryptedPassword: string) {
		return query("update users set newpassword=? where user_id=?", [encryptedPassword, userId]);
	}

	async getUser(userId: string): Promise<UserInfoDAO | null> {
		const result: any = await cachedQuery(`select * from users where user_id = ?`, [userId], CACHE);
		if (result && result.length && result.length > 0) {
			return result[0];
		}
		else {
			return null;
		}
	}

	async updateUser(userId: string, payload: any) {
		const allowProps = [
			"newpassword", "nick", "school", "email", "blog", "github",
			"biography", "confirmquestion", "confirmanswer", "avatarUrl"
		];
		const updateContent: any[] = [];
		const updateValues: any[] = [];

		allowProps.forEach(prop => {
			if (Object.prototype.hasOwnProperty.call(payload, prop) && payload[prop] !== undefined) {
				updateContent.push(`${prop} = ?`);
				updateValues.push(payload[prop]);
			}
		});

		if (updateContent.length === 0) {
			return;
		}

		updateValues.push(userId);
		await query(`UPDATE users SET ${updateContent.join(",")} WHERE user_id = ?`, updateValues);
		return;
	}

	getPasswordRows(userId: string): Promise<any[]> {
		return query("select password, newpassword from users where user_id = ?", [userId]);
	}

	getPrivilegeRows(userId: string): Promise<any[]> {
		return query("select rightstr from privilege where user_id = ?", [userId]);
	}

	getSessionProfileRows(userId: string): Promise<any[]> {
		return query("select nick,avatar,avatarUrl,email from users where user_id = ?", [userId]);
	}
}
