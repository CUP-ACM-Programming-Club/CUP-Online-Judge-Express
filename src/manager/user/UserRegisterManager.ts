import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";

const query = require("../../module/mysql_cache");

export class UserRegisterManager {
    private validator(payload: any) {

    }
    @ErrorHandlerFactory()
    registerUser(payload: any) {

    }
}

export default new UserRegisterManager();
