import {Request} from "express";
import {MySQLManager} from "../mysql/MySQLManager";
const privilegeList = ["administrator", "source_browser", "contest_creator", "http_judge", "problem_editor", "contest_manager", "editor"];


class PrivilegeManager {
    async addPrivilege(userId: string, privilegeName: string) {
        privilegeName = privilegeName.trim();
        if (privilegeList.includes(privilegeName)) {
            await MySQLManager.execQuery("delete from privilege where user_id = ? and rightstr = ?", [userId, privilegeName]);
            await MySQLManager.execQuery("insert into privilege(user_id, rightstr, defunct) values(?,?,'N')", [userId, privilegeName]);
            return true;
        }
        else {
            return false;
        }
    }

    async removePrivilege(userId: string, privilegeName: string) {
        privilegeName = privilegeName.trim();
        await MySQLManager.execQuery("delete from privilege where user_id = ? and rightstr = ?", [userId, privilegeName]);
        return true;
    }

    async isAdmin(userId: number | string) {
        return await this.isSomePrivilege(userId, "administrator");
    }

    async isContester(userId: number | string, contestId: number | string) {
        return await this.isSomePrivilege(userId, `c${contestId}`);
    }

    async isContestMaker(userId: number | string, contestId: number | string) {
        return await this.isSomePrivilege(userId, `m${contestId}`);
    }

    async isContestManager(userId: number | string, contestId: number | string) {
        return await this.isSomePrivilege(userId, "contest_manager");
    }

    async isSomePrivilege(userId: number | string, privilegeCode: string) {
        const result = await MySQLManager.execQuery(`select * from privilege where user_id = ? and rightstr = ?`, [userId, privilegeCode]);
        return result && result.length && result.length > 0;
    }
}

export default new PrivilegeManager();
