import {Request} from "express";
import {MySQLManager} from "../mysql/MySQLManager";
const privilegeList = ["administrator", "source_browser", "contest_creator", "http_judge", "problem_editor", "contest_manager", "editor"];


class PrivilegeManager {
    async addPrivilege(userId: string, privilegeName: string) {
        privilegeName = privilegeName.trim();
        if (privilegeList.includes(privilegeName)) {
            await MySQLManager.execQuery("insert into privilege(user_id, rightstr, defunct) values(?,?,'N')", [userId, privilegeName]);
            return true;
        }
        else {
            return false;
        }
    }

    async removePrivilege(userId: string, privilegeName: string) {
        privilegeName = privilegeName.trim();
        await MySQLManager.execQuery("delete from privileges where user_id = ? and rightstr = ?", [userId, privilegeName]);
        return true;
    }
}

export default new PrivilegeManager();
