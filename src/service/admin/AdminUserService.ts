import query from "../../module/mysql_query";
import { generateNewEncryptPassword } from "../../module/util";

class AdminUserService {

    // Adapted from module/admin/list.ts
    async getUserList(page: number, limit: number = 50, opts: any = {}) {
        let where = "where school = 'your_own_school'", orderBy = "order by reg_time desc";
        // Default values from src/routes/admin/account/list.ts

        if (opts.where && typeof opts.where === "string") {
            where = opts.where;
        }
        if (opts.order && typeof opts.order === "string") {
            orderBy = opts.order;
        }
        const offset = page * limit;
        const [data, count] = await Promise.all([
            query(`select * from users ${[where, orderBy].join(" ")} limit ?,?`, [offset, limit]),
            query(`select count(1) as cnt from users ${[where, orderBy].join(" ")}`)
        ]);

        return {
            data,
            count: count[0].cnt
        };
    }

    // Adapted from module/admin/defunct.ts
    async toggleUserDefunct(userId: string) {
        const res = await query("select defunct from users where user_id = ?", [userId]);
        if (res.length > 0) {
            const current = res[0].defunct;
            const next = current === "Y" ? "N" : "Y";
            await query("update users set defunct = ? where user_id = ?", [next, userId]);
            return next;
        }
    }

    // Adapted from src/routes/admin/account/password.ts
    async updateUserPassword(userId: string, password: string, salt: string) {
        await generateNewEncryptPassword(userId, password, salt);
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

export default new AdminUserService();
