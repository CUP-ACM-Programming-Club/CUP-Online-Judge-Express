const query = require("../../module/mysql_cache");

export interface UserInfoPayload {
    userId: string,
    password: string,
    confirmQuestion: string,
    confirmAnswer: string
}

export class UserManager {
    addUser(userInfoPayload: UserInfoPayload) {

    }
}

export default new UserManager();
