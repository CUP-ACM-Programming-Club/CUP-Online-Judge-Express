import { adminUserRepository } from "../../ports/AdminUserRepository";
import { generateNewEncryptPassword } from "../../util";

class AdminUserService {

    // Adapted from module/admin/list.ts
    async getUserList(page: number, limit: number = 50, opts: any = {}) {
        // 默认条件（只列比赛账号、按注册时间倒序）在仓储实现里
        const offset = page * limit;
        const [data, count] = await adminUserRepository.getUserList(offset, limit, opts.where, opts.order);

        return {
            data,
            count: count[0].cnt
        };
    }

    // Adapted from module/admin/defunct.ts
    async toggleUserDefunct(userId: string) {
        const res = await adminUserRepository.getDefunctRows(userId);
        if (res.length > 0) {
            const current = res[0].defunct;
            const next = current === "Y" ? "N" : "Y";
            await adminUserRepository.setDefunct(userId, next);
            return next;
        }
    }

    // Adapted from src/routes/admin/account/password.ts
    async updateUserPassword(userId: string, password: string, salt: string) {
        await generateNewEncryptPassword(userId, password, salt);
    }

    async getTeamList() {
        return await adminUserRepository.getTeamList();
    }

    async getPrivilegeList(privilegeList: string[]) {
        return await adminUserRepository.getPrivilegeList(privilegeList);
    }

    async addPrivilege(userId: string, rightstr: string) {
        await adminUserRepository.addPrivilege(userId, rightstr);
    }

    async removePrivilege(userId: string, rightstr: string) {
        await adminUserRepository.removePrivilege(userId, rightstr);
    }
}

export default new AdminUserService();
