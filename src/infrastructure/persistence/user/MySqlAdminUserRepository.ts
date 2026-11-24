import { query } from "../../db";
import { AdminUserRepository } from "../../../application/ports/AdminUserRepository";

export class MySqlAdminUserRepository implements AdminUserRepository {
	async getUserList(offset: number, limit: number, whereOpt?: string, orderOpt?: string): Promise<[any, any]> {
		let where = "where school = 'your_own_school'", orderBy = "order by reg_time desc";
		if (whereOpt && typeof whereOpt === "string") {
			where = whereOpt;
		}
		if (orderOpt && typeof orderOpt === "string") {
			orderBy = orderOpt;
		}
		return await Promise.all([
			query(`select * from users ${[where, orderBy].join(" ")} limit ?,?`, [offset, limit]),
			query(`select count(1) as cnt from users ${[where, orderBy].join(" ")}`)
		]);
	}

	getDefunctRows(userId: string): Promise<any[]> {
		return query("select defunct from users where user_id = ?", [userId]);
	}

	setDefunct(userId: string, defunct: string) {
		return query("update users set defunct = ? where user_id = ?", [defunct, userId]);
	}

	async getTeamList() {
		return await query("select user_id, reg_time, accesstime,defunct from users where school = 'your_own_school' order by reg_time desc");
	}

	async getPrivilegeList(privilegeList: string[]) {
		return await query(`select superuser.*, users.nick
            from (select user_id, rightstr, defunct
            from privilege
            where rightstr in
            ('${privilegeList.join("','")}')) superuser
            inner join users on users.user_id = superuser.user_id`);
	}

	async addPrivilege(userId: string, rightstr: string) {
		await query("insert into privilege values(?,?,'N')", [userId, rightstr]);
	}

	async removePrivilege(userId: string, rightstr: string) {
		await query("delete from privilege where user_id = ? and rightstr = ?", [userId, rightstr]);
	}
}
